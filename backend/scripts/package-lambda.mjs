import { cpSync, createWriteStream, mkdirSync, rmSync } from 'node:fs';
import archiver from 'archiver';

const staging = 'dist/lambda-package';
const zipPath = 'dist-lambda.zip';

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

cpSync('dist/handlers/api.mjs', `${staging}/index.mjs`);
cpSync('dist/handlers/stream-processor.mjs', `${staging}/stream.mjs`);

rmSync(zipPath, { force: true });

await new Promise((resolve, reject) => {
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(staging, false);
  archive.finalize();
});

console.log('Created dist-lambda.zip');
