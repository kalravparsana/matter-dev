import archiver from 'archiver';
import { cpSync, createWriteStream, mkdirSync, rmSync } from 'node:fs';

const staging = 'dist/lambda-package';
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

cpSync('dist/handlers/api.mjs', `${staging}/index.mjs`);
cpSync('dist/handlers/stream-processor.mjs', `${staging}/stream.mjs`);

rmSync('dist-lambda.zip', { force: true });

const output = createWriteStream('dist-lambda.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

await new Promise((resolve, reject) => {
  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(staging, false);
  archive.finalize();
});

console.log('Created dist-lambda.zip');
