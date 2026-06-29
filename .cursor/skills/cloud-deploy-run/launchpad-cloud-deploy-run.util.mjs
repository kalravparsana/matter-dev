#!/usr/bin/env node
/**
 * Reads Launchpad cloud deploy manifest, writes materialized files, emits runner metadata JSON.
 * Usage: node launchpad-cloud-deploy-run.util.mjs <manifestPath> <repoRoot>
 */
import fs from "fs";
import path from "path";

const manifestPath = process.argv[2];
const repoRoot = process.argv[3];

if (!manifestPath || !repoRoot) {
  process.stderr.write("Usage: launchpad-cloud-deploy-run.util.mjs <manifestPath> <repoRoot>\n");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const SECRET_KEY_RE = /SECRET|PASSWORD|TOKEN|PRIVATE|CREDENTIAL|API_KEY/i;
const REDACTED = "[REDACTED]";

function shellQuote(value) {
  const s = String(value ?? "");
  return `'${s.replace(/'/g, "'\\''")}'`;
}

function isSecretKey(key) {
  return SECRET_KEY_RE.test(String(key ?? ""));
}

function formatExportLines(rows, { redactSecrets = false } = {}) {
  return (rows ?? [])
    .map((row) => {
      const key = String(row.key ?? "").trim();
      if (!key) return "";
      const rawValue = redactSecrets && isSecretKey(key) ? REDACTED : String(row.value ?? "");
      return `export ${key}=${shellQuote(rawValue)}`;
    })
    .filter(Boolean)
    .join("; ");
}

function formatExportScript(rows, commandLine, { redactSecrets = false } = {}) {
  const exports = formatExportLines(rows, { redactSecrets });
  const unset = "unset AWS_PROFILE AWS_DEFAULT_PROFILE AWS_SESSION_TOKEN";
  const cmd = String(commandLine ?? "").trim();
  if (!exports) return cmd ? `${unset}; ${cmd}` : unset;
  return cmd ? `${unset}; ${exports}; ${cmd}` : `${unset}; ${exports}`;
}

const envLabel = String(manifest.environmentLabel ?? manifest.environmentId ?? "").trim();
const infraStack = String(manifest.infraStack ?? "").trim();
const exportRows = Array.isArray(manifest.exportRows) ? manifest.exportRows : [];
const files = Array.isArray(manifest.files) ? manifest.files : [];

const materializedPaths = files.map((f) => {
  const rel = String(f.path ?? "").replace(/\\/g, "/");
  const abs = path.join(repoRoot, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, String(f.content ?? ""), "utf8");
  return abs;
});

process.stdout.write(
  JSON.stringify({
    environmentLabel: envLabel,
    infraStack,
    envKeys: [...new Set(exportRows.map((r) => String(r.key ?? "").trim()).filter(Boolean))].sort(),
    commandPreviewRedacted: formatExportScript(exportRows, "./deploy.sh", {
      redactSecrets: true,
    }),
    commandAwsVerifyRedacted: formatExportScript(exportRows, "aws sts get-caller-identity", {
      redactSecrets: true,
    }),
    exportScriptReal: formatExportScript(exportRows, "", { redactSecrets: false }),
    materializedPaths,
  }),
);
