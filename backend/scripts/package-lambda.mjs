import { cpSync, createWriteStream, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import archiver from 'archiver';

const staging = 'dist/lambda-package';
const zipPath = resolve('dist-lambda.zip');

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

cpSync('dist/handlers/api.mjs', `${staging}/index.mjs`);
cpSync('dist/handlers/stream-processor.mjs', `${staging}/stream.mjs`);

rmSync(zipPath, { force: true });

await new Promise((resolvePromise, reject) => {
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', resolvePromise);
  archive.on('error', reject);

  archive.pipe(output);
  archive.directory(staging, false);
  archive.finalize();
});

console.log('Created dist-lambda.zip');
