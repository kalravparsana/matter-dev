#!/usr/bin/env bash
# Launchpad cloud deploy runner — materialize env files, verify AWS, run deploy.sh.
# Reads .launchpad/cloud-deploy/manifest.json at the development repository root.
set -euo pipefail

REPO_ROOT="${1:-.}"
REPO_ROOT="$(cd "$REPO_ROOT" && pwd)"
MANIFEST="$REPO_ROOT/.launchpad/cloud-deploy/manifest.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_HELPER="$SCRIPT_DIR/launchpad-cloud-deploy-run.util.mjs"

step() {
  printf '%s\n' "$1"
}

log_command() {
  printf '$ %s\n' "$1"
}

if [[ ! -f "$MANIFEST" ]]; then
  PARENT_MANIFEST="$REPO_ROOT/../.launchpad/cloud-deploy/manifest.json"
  if [[ -f "$PARENT_MANIFEST" ]]; then
    mkdir -p "$REPO_ROOT/.launchpad/cloud-deploy"
    node -e "
      const fs = require('fs');
      const path = require('path');
      const repoRoot = process.argv[1];
      const parentManifest = process.argv[2];
      const dest = process.argv[3];
      const prefix = path.basename(repoRoot) + '/';
      const manifest = JSON.parse(fs.readFileSync(parentManifest, 'utf8'));
      manifest.files = (manifest.files || []).map((file) => ({
        ...file,
        path: String(file.path || '').replace(new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')), ''),
      }));
      fs.writeFileSync(dest, JSON.stringify(manifest, null, 2) + '\n');
    " "$REPO_ROOT" "$PARENT_MANIFEST" "$MANIFEST"
    step "[step] Resolved deploy manifest from workspace parent."
  else
    echo "[error] Missing deploy manifest: $MANIFEST" >&2
    exit 1
  fi
fi

if [[ ! -f "$REPO_ROOT/deploy.sh" ]]; then
  echo "[error] Add deploy.sh to your development repository root." >&2
  exit 1
fi

META_JSON="$(node "$NODE_HELPER" "$MANIFEST" "$REPO_ROOT")"

read_meta() {
  printf '%s' "$META_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const k=process.argv[1]; const v=d[k]; process.stdout.write(Array.isArray(v)?v.join(', '):String(v??''));" "$1"
}

ENV_LABEL="$(read_meta environmentLabel)"
INFRA_STACK="$(read_meta infraStack)"
ENV_KEYS="$(read_meta envKeys)"
ENV_KEY_COUNT="$(printf '%s' "$META_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(String((d.envKeys||[]).length));")"
MATERIALIZED_LIST="$(read_meta materializedPaths)"
MATERIALIZED_COUNT="$(printf '%s' "$META_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(String((d.materializedPaths||[]).length));")"
CMD_PREVIEW="$(read_meta commandPreviewRedacted)"
CMD_AWS_VERIFY="$(read_meta commandAwsVerifyRedacted)"
EXPORT_REAL="$(read_meta exportScriptReal)"

step "[step] Starting cloud deploy (environment: ${ENV_LABEL}, infra: ${INFRA_STACK})"
step "[step] Cloning development repository…"
step "[step] Preparing environment values…"
step "[step] Materialized ${MATERIALIZED_COUNT} file(s): ${MATERIALIZED_LIST}"
step "[step] Environment variables for deploy.sh (${ENV_KEY_COUNT} keys): ${ENV_KEYS}"
log_command "$CMD_PREVIEW"

run_with_exports() {
  # shellcheck disable=SC2086
  eval "$EXPORT_REAL; $1"
}

if [[ "$INFRA_STACK" == "cloudformation" && "${LAUNCHPAD_SKIP_AWS_VERIFY:-}" != "1" ]]; then
  step "[step] Verifying AWS credentials…"
  log_command "$CMD_AWS_VERIFY"
  if ! run_with_exports "aws sts get-caller-identity"; then
    echo "[error] AWS credentials could not be verified." >&2
    exit 1
  fi
  step "[step] AWS credentials verified."
fi

step "[step] Running deploy.sh…"
cd "$REPO_ROOT"
chmod +x ./deploy.sh 2>/dev/null || true
run_with_exports "./deploy.sh"
