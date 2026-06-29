#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
: "${INFRA_STACK:?}"
: "${DEPLOY_ENVIRONMENT:?}"
: "${BACKEND_STACK_NAME:?}"
: "${FRONTEND_STACK_NAME:?}"

if [[ -d "$ROOT/Frontend" ]]; then
  FRONTEND_LAYER_DIR="$ROOT/Frontend"
elif [[ -d "$ROOT/frontend" ]]; then
  FRONTEND_LAYER_DIR="$ROOT/frontend"
else
  echo "No frontend layer directory found (expected Frontend/ or frontend/)" >&2
  exit 1
fi

read_cfn_param() {
  local params_file="$1"
  local key="$2"
  node -e "
    const fs = require('fs');
    const key = process.argv[1];
    const file = process.argv[2];
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    const row = rows.find((r) => r.ParameterKey === key);
    process.stdout.write(row ? String(row.ParameterValue ?? '') : '');
  " "$key" "$params_file"
}

patch_cfn_param() {
  local params_file="$1"
  local key="$2"
  local value="$3"
  node -e "
    const fs = require('fs');
    const [key, value, file] = process.argv.slice(1);
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    const index = rows.findIndex((r) => r.ParameterKey === key);
    if (index >= 0) rows[index].ParameterValue = value;
    else rows.push({ ParameterKey: key, ParameterValue: value });
    fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
  " "$key" "$value" "$params_file"
}

log_stack_failure_events() {
  local stack_name="$1"
  echo "CloudFormation failure events for stack: $stack_name" >&2
  aws cloudformation describe-stack-events --stack-name "$stack_name" \
    --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED` || ResourceStatus==`ROLLBACK_IN_PROGRESS`].[Timestamp,LogicalResourceId,ResourceStatusReason]' \
    --output text 2>/dev/null | tail -n 5 >&2 || true
}

recover_failed_stack() {
  local stack_name="$1"
  local status
  status="$(aws cloudformation describe-stacks --stack-name "$stack_name" \
    --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")"
  case "$status" in
    ROLLBACK_COMPLETE|ROLLBACK_FAILED|DELETE_FAILED)
      echo "Recovering failed stack $stack_name (status: $status)" >&2
      aws cloudformation delete-stack --stack-name "$stack_name"
      aws cloudformation wait stack-delete-complete --stack-name "$stack_name"
      ;;
  esac
}

prepare_backend_lambda_artifact() {
  local params="$ROOT/backend/parameters.json"
  [[ -f "$params" ]] || { echo "Missing backend/parameters.json" >&2; exit 1; }
  local bucket key
  bucket="$(read_cfn_param "$params" "LambdaCodeS3Bucket")"
  key="$(read_cfn_param "$params" "LambdaCodeS3Key")"
  [[ -n "$bucket" && -n "$key" ]] || { echo "LambdaCodeS3Bucket/Key missing in parameters.json" >&2; exit 1; }

  if ! aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
    aws s3 mb "s3://${bucket}"
  fi

  (cd "$ROOT/backend" && npm ci --include=dev && npm run package:lambda)
  local zip_file="$ROOT/backend/dist-lambda.zip"
  [[ -f "$zip_file" ]] || { echo "Lambda zip was not created. Check package:lambda." >&2; exit 1; }
  aws s3 cp "$zip_file" "s3://${bucket}/${key}"
  rm -f "$zip_file"

  local env_name
  env_name="$(read_cfn_param "$params" "EnvironmentName")"
  for fn in "mattar-api-${env_name}" "mattar-stream-${env_name}"; do
    if aws lambda get-function --function-name "$fn" >/dev/null 2>&1; then
      echo "Publishing Lambda code to $fn" >&2
      aws lambda update-function-code \
        --function-name "$fn" \
        --s3-bucket "$bucket" \
        --s3-key "$key" >/dev/null
      aws lambda wait function-updated-v2 --function-name "$fn"
    fi
  done
}

prepare_backend_artifact() {
  local bucket=""
  if [[ -f "$ROOT/backend/parameters.json" ]]; then
    bucket="$(read_cfn_param "$ROOT/backend/parameters.json" "LambdaCodeS3Bucket")"
  fi
  if [[ -n "$bucket" && "$bucket" != "null" ]]; then
    prepare_backend_lambda_artifact
  fi
}

deploy_cloudformation_layer() {
  local layer_dir="$1"
  local stack_name="$2"
  local template="cloudformation-template.yaml"
  local params="parameters.json"

  recover_failed_stack "$stack_name"

  local -a cap_args=()
  if grep -q 'RoleName:' "$layer_dir/$template" 2>/dev/null; then
    cap_args+=(--capabilities CAPABILITY_NAMED_IAM)
  fi

  local -a param_args=()
  if [[ -f "$layer_dir/$params" ]]; then
    param_args+=(--parameters "file://${params}")
  fi

  (
    cd "$layer_dir"
    if aws cloudformation describe-stacks --stack-name "$stack_name" >/dev/null 2>&1; then
      aws cloudformation update-stack \
        --stack-name "$stack_name" \
        --template-body "file://${template}" \
        "${param_args[@]}" "${cap_args[@]}" 2>&1 | tee /tmp/cfn-update-"$stack_name".log || {
          local err=$?
          if grep -q 'No updates are to be performed' /tmp/cfn-update-"$stack_name".log 2>/dev/null; then
            echo "No CloudFormation changes for $stack_name" >&2
          elif aws cloudformation describe-stacks --stack-name "$stack_name" \
            --query 'Stacks[0].StackStatus' --output text 2>/dev/null | grep -q 'IN_PROGRESS'; then
            echo "Stack update already in progress for $stack_name" >&2
          else
            log_stack_failure_events "$stack_name"
            exit $err
          fi
        }
      local stack_status
      stack_status="$(aws cloudformation describe-stacks --stack-name "$stack_name" \
        --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")"
      if [[ "$stack_status" == *"_IN_PROGRESS" ]]; then
        aws cloudformation wait stack-update-complete --stack-name "$stack_name" || {
          log_stack_failure_events "$stack_name"
          exit 1
        }
      fi
    else
      aws cloudformation create-stack \
        --stack-name "$stack_name" \
        --template-body "file://${template}" \
        "${param_args[@]}" "${cap_args[@]}" || {
        log_stack_failure_events "$stack_name"
        exit 1
      }
      aws cloudformation wait stack-create-complete --stack-name "$stack_name" || {
        log_stack_failure_events "$stack_name"
        exit 1
      }
    fi
  )
}

get_stack_output() {
  local stack_name="$1"
  local output_key="$2"
  aws cloudformation describe-stacks --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue" \
    --output text 2>/dev/null || true
}

publish_frontend_bundle() {
  local api_url bucket dist_id cf_url
  api_url="$(get_stack_output "$BACKEND_STACK_NAME" ApiBaseUrl)"
  bucket="$(get_stack_output "$FRONTEND_STACK_NAME" S3BucketName)"
  dist_id="$(get_stack_output "$FRONTEND_STACK_NAME" DistributionId)"
  cf_url="$(get_stack_output "$FRONTEND_STACK_NAME" CloudFrontUrl)"

  if [[ -z "$api_url" || "$api_url" == "None" ]]; then
    echo "Skipping frontend publish — ApiBaseUrl output missing." >&2
    return 0
  fi
  if [[ -z "$bucket" || "$bucket" == "None" ]]; then
    echo "Skipping frontend publish — S3BucketName output missing." >&2
    return 0
  fi

  echo "ApiBaseUrl=${api_url}" >&2
  echo "HealthCheckUrl=${api_url}/health" >&2
  [[ -n "$cf_url" && "$cf_url" != "None" ]] && echo "CloudFrontUrl=${cf_url}" >&2

  (
    cd "$FRONTEND_LAYER_DIR"
    npm ci --include=dev
    VITE_API_BASE_URL="$api_url" npm run build
  )

  aws s3 sync "$FRONTEND_LAYER_DIR/dist/" "s3://${bucket}/" --delete

  if [[ -n "$dist_id" && "$dist_id" != "None" ]]; then
    aws cloudfront create-invalidation --distribution-id "$dist_id" --paths "/*" >/dev/null
  fi

  echo "Frontend assets published to s3://${bucket}" >&2
}

main() {
  if [[ "$INFRA_STACK" == "cloudformation" ]]; then
    prepare_backend_artifact
    deploy_cloudformation_layer "$ROOT/backend" "$BACKEND_STACK_NAME" &
    local backend_pid=$!
    deploy_cloudformation_layer "$FRONTEND_LAYER_DIR" "$FRONTEND_STACK_NAME" &
    local frontend_pid=$!
    wait "$backend_pid"
    wait "$frontend_pid"
    publish_frontend_bundle
  else
    echo "Unsupported INFRA_STACK: $INFRA_STACK" >&2
    exit 1
  fi
}

main "$@"
