import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

const staging = 'dist/lambda-package';
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

cpSync('dist/handlers/api.mjs', `${staging}/index.mjs`);
cpSync('dist/handlers/stream-processor.mjs', `${staging}/stream.mjs`);

rmSync('dist-lambda.zip', { force: true });
execSync(`cd ${staging} && zip -r ../dist-lambda.zip .`, { stdio: 'inherit' });

console.log('Created dist-lambda.zip');
