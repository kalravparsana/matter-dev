import * as esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('dist/handlers', { recursive: true });

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  external: ['@aws-sdk/*'],
  sourcemap: true,
};

await esbuild.build({
  ...shared,
  entryPoints: ['src/handlers/api.ts'],
  outfile: 'dist/handlers/api.mjs',
});

await esbuild.build({
  ...shared,
  entryPoints: ['src/handlers/stream-processor.ts'],
  outfile: 'dist/handlers/stream-processor.mjs',
});

console.log('Bundled Lambda handlers');
