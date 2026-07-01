import { cpSync, createWriteStream, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZipArchive } from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const staging = join(backendRoot, 'dist/lambda-package');
const zipPath = join(backendRoot, 'dist-lambda.zip');

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

cpSync(join(backendRoot, 'dist/handlers/api.mjs'), join(staging, 'index.mjs'));
cpSync(join(backendRoot, 'dist/handlers/stream-processor.mjs'), join(staging, 'stream.mjs'));

rmSync(zipPath, { force: true });

await new Promise((resolve, reject) => {
  const output = createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on('close', resolve);
  output.on('error', reject);
  archive.on('error', reject);

  archive.pipe(output);
  archive.directory(staging, false);
  archive.finalize();
});

console.log('Created dist-lambda.zip');
