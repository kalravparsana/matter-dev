import archiver from 'archiver';
import { cpSync, createWriteStream, mkdirSync, rmSync } from 'node:fs';
import { finished } from 'node:stream/promises';

const staging = 'dist/lambda-package';
const zipPath = 'dist-lambda.zip';

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

cpSync('dist/handlers/api.mjs', `${staging}/index.mjs`);
cpSync('dist/handlers/stream-processor.mjs', `${staging}/stream.mjs`);

rmSync(zipPath, { force: true });

const output = createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

const archiveDone = finished(output);
archive.pipe(output);
archive.directory(staging, false);
await archive.finalize();
await archiveDone;

console.log('Created dist-lambda.zip');
