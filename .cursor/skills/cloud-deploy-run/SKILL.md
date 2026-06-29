---
name: cloud-deploy-run
description: Autonomous cloud deploy — run Launchpad materialized env and deploy.sh via the bundled bash runner. First terminal action on every deploy attempt.
disable-model-invocation: true
---

# Cloud Deploy Run (Autonomous Deploy)

**At deploy time, Launchpad injects `.launchpad/cloud-deploy/manifest.json` into your clone.** This skill tells you how to run deploy without hand-building exports or retyping env vars.

Read [`.cursor/rules/deployment-simulation.mdc`](../../rules/deployment-simulation.mdc) only when diagnosing `deploy.sh` or IaC failures **after** the runner exits non-zero.

## Hard rule — first terminal action

From the **development repository root** (where `deploy.sh` lives), run:

```bash
bash .cursor/skills/cloud-deploy-run/launchpad-cloud-deploy-run.sh
```

Do this **before** any other deploy command on every attempt (including retries).

## Do not

- Hand-build `export` lines or copy the redacted deploy command from the launch prompt — the manifest has real values.
- Edit materialized files unless the runner fails and logs show wrong or missing paths.
- Skip AWS verification or run `./deploy.sh` directly without the runner.
- Push git until Launchpad sends a publish follow-up.
- Curl or validate individual API routes after deploy — Launchpad checks **`GET {ApiBaseUrl}/health`** between agent turns.
- Treat OpenAPI or Postman route lists as a deploy gate.

## On failure

1. Read runner output (`[step]` lines and errors).
2. Fix the **development repository only** (`deploy.sh`, IaC templates, `.env`, `parameters.json`).
3. Re-run the same bash command above (never skip verify).

## What the runner does

1. Writes materialized files from `.launchpad/cloud-deploy/manifest.json`
2. Logs env keys and a redacted command preview (matches Launchpad deploy UI)
3. Verifies AWS credentials when `infraStack` is `cloudformation`
4. Runs `./deploy.sh` with the exported environment

**Success signal for this session:** `deploy.sh` exits 0. Launchpad validates backend health at `/health` — you do not need to probe routes yourself.

## Related skills

- [`cloud-deploy-script/SKILL.md`](../cloud-deploy-script/SKILL.md) — authoring `deploy.sh` at release lock (not runtime deploy).
