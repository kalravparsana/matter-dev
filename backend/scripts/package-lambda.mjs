import { cpSync, createWriteStream, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import archiver from 'archiver';

const staging = 'dist/lambda-package';
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

cpSync('dist/handlers/api.mjs', `${staging}/index.mjs`);
cpSync('dist/handlers/stream-processor.mjs', `${staging}/stream.mjs`);
writeFileSync(
  `${staging}/package.json`,
  JSON.stringify({ type: 'module' }, null, 2),
);

const zipPath = 'dist-lambda.zip';
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
