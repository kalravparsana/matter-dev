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

patch_dotenv_key() {
  local env_file="$1"
  local key="$2"
  local value="$3"
  node - "$key" "$value" "$env_file" <<'NODE'
const fs = require('fs');
const [key, value, file] = process.argv.slice(2);
let text = '';
try { text = fs.readFileSync(file, 'utf8'); } catch { text = ''; }
const line = key + '=' + value;
const pattern = new RegExp('^' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=.*$', 'm');
text = pattern.test(text) ? text.replace(pattern, line) : (text.trimEnd() + (text.endsWith('\n') || !text ? '' : '\n') + line + '\n');
fs.writeFileSync(file, text);
NODE
}

read_cfn_stack_output() {
  local stack_name="$1"
  local output_key="$2"
  aws cloudformation describe-stacks --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue | [0]" \
    --output text 2>/dev/null | sed 's/^None$//' || true
}

read_stack_output_with_fallbacks() {
  local stack_name="$1"
  shift
  local key value
  for key in "$@"; do
    value="$(read_cfn_stack_output "$stack_name" "$key")"
    if [[ -n "$value" && "$value" != "None" ]]; then
      printf '%s' "$value"
      return 0
    fi
  done
  return 1
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

  # Install devDependencies (typescript, esbuild) even when NODE_ENV=production.
  (cd "$ROOT/backend" && npm ci --include=dev && npm run package:lambda)
  local zip_file="$ROOT/backend/dist-lambda.zip"
  [[ -f "$zip_file" ]] || { echo "Lambda zip was not created. Check package:lambda." >&2; exit 1; }
  aws s3 cp "$zip_file" "s3://${bucket}/${key}"
  rm -f "$zip_file"
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
      set +e
      local update_output
      update_output="$(aws cloudformation update-stack \
        --stack-name "$stack_name" \
        --template-body "file://${template}" \
        "${param_args[@]}" "${cap_args[@]}" 2>&1)"
      local update_exit=$?
      set -e
      if [[ $update_exit -ne 0 ]]; then
        if echo "$update_output" | grep -q 'No updates are to be performed'; then
          echo "No CloudFormation changes for $stack_name" >&2
        elif aws cloudformation describe-stacks --stack-name "$stack_name" \
          --query 'Stacks[0].StackStatus' --output text 2>/dev/null | grep -q 'IN_PROGRESS'; then
          echo "Stack update already in progress for $stack_name" >&2
        else
          echo "$update_output" >&2
          log_stack_failure_events "$stack_name"
          exit "$update_exit"
        fi
      fi
      aws cloudformation wait stack-update-complete --stack-name "$stack_name" || {
        log_stack_failure_events "$stack_name"
        exit 1
      }
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

resolve_frontend_build_dir() {
  local ui_root="$1"
  if [[ -d "$ui_root/dist" ]]; then
    printf '%s' "$ui_root/dist"
  elif [[ -d "$ui_root/build" ]]; then
    printf '%s' "$ui_root/build"
  else
    printf '%s' "$ui_root/dist"
  fi
}

sync_backend_auth_with_frontend() {
  echo "[step] Syncing backend OAuth redirect and CORS with frontend URL…" >&2
  local frontend_url
  frontend_url="$(read_stack_output_with_fallbacks "$FRONTEND_STACK_NAME" \
    CloudFrontUrl || true)"
  [[ -n "$frontend_url" ]] || {
    echo "Frontend CloudFrontUrl output is missing; skipping backend auth sync." >&2
    return 0
  }

  local oauth_redirect="${frontend_url%/}/auth/callback"
  local logout_redirect="${frontend_url%/}/login"
  local allowed_origins="${frontend_url},http://localhost:5173"

  patch_cfn_param "$ROOT/backend/parameters.json" "OAuthRedirectUri" "$oauth_redirect"
  patch_cfn_param "$ROOT/backend/parameters.json" "LogoutRedirectUri" "$logout_redirect"
  patch_cfn_param "$ROOT/backend/parameters.json" "AllowedOrigins" "$allowed_origins"

  deploy_cloudformation_layer "$ROOT/backend" "$BACKEND_STACK_NAME"
}

publish_frontend_assets() {
  echo "[step] Publishing frontend assets (Phase D)…" >&2

  local api_url cognito_pool_id cognito_client_id cognito_region cognito_domain frontend_url
  api_url="$(read_stack_output_with_fallbacks "$BACKEND_STACK_NAME" ApiBaseUrl || true)"
  cognito_pool_id="$(read_stack_output_with_fallbacks "$BACKEND_STACK_NAME" CognitoUserPoolId || true)"
  cognito_client_id="$(read_stack_output_with_fallbacks "$BACKEND_STACK_NAME" CognitoClientId || true)"
  cognito_region="$(read_stack_output_with_fallbacks "$BACKEND_STACK_NAME" CognitoRegion || true)"
  cognito_domain="$(read_stack_output_with_fallbacks "$BACKEND_STACK_NAME" CognitoDomain || true)"
  frontend_url="$(read_stack_output_with_fallbacks "$FRONTEND_STACK_NAME" CloudFrontUrl || true)"

  local ui_env="$FRONTEND_LAYER_DIR/.env"
  touch "$ui_env"

  if [[ -n "$api_url" ]]; then
    patch_dotenv_key "$ui_env" "VITE_API_BASE_URL" "$api_url"
  fi
  if [[ -n "$cognito_pool_id" ]]; then
    patch_dotenv_key "$ui_env" "VITE_COGNITO_USER_POOL_ID" "$cognito_pool_id"
  fi
  if [[ -n "$cognito_client_id" ]]; then
    patch_dotenv_key "$ui_env" "VITE_COGNITO_CLIENT_ID" "$cognito_client_id"
  fi
  if [[ -n "$cognito_region" ]]; then
    patch_dotenv_key "$ui_env" "VITE_COGNITO_REGION" "$cognito_region"
  fi
  if [[ -n "$cognito_domain" ]]; then
    patch_dotenv_key "$ui_env" "VITE_COGNITO_DOMAIN" "$cognito_domain"
  fi
  if [[ -n "$frontend_url" ]]; then
    patch_dotenv_key "$ui_env" "VITE_OAUTH_REDIRECT_URI" "${frontend_url%/}/auth/callback"
  fi

  local bucket distribution_id
  bucket="$(read_stack_output_with_fallbacks "$FRONTEND_STACK_NAME" \
    S3BucketName || true)"
  distribution_id="$(read_stack_output_with_fallbacks "$FRONTEND_STACK_NAME" \
    CloudFrontDistributionId DistributionId || true)"

  if [[ -z "$bucket" ]]; then
    echo "Frontend stack is missing the S3 bucket output." >&2
    exit 1
  fi
  if [[ -z "$distribution_id" ]]; then
    echo "Frontend stack is missing the CloudFront distribution id output." >&2
    exit 1
  fi

  (cd "$FRONTEND_LAYER_DIR" && npm ci --include=dev && npm run build)

  local build_dir
  build_dir="$(resolve_frontend_build_dir "$FRONTEND_LAYER_DIR")"
  [[ -d "$build_dir" ]] || { echo "Build output folder not found after npm run build." >&2; exit 1; }

  aws s3 sync "$build_dir/" "s3://${bucket}/" --delete

  local invalidation_id
  invalidation_id="$(aws cloudfront create-invalidation \
    --distribution-id "$distribution_id" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)"
  echo "[step] CloudFront invalidation started: ${invalidation_id}" >&2
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
    sync_backend_auth_with_frontend
    publish_frontend_assets
  else
    echo "Unsupported INFRA_STACK: $INFRA_STACK" >&2
    exit 1
  fi
}

main "$@"
