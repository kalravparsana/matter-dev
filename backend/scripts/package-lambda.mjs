import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const distDir = join(root, 'dist');
const pkgDir = join(root, 'dist-lambda-pkg');
const zipPath = join(root, 'dist-lambda.zip');

mkdirSync(pkgDir, { recursive: true });
cpSync(distDir, join(pkgDir, 'dist'), { recursive: true });

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const lambdaPkg = {
  name: pkg.name,
  version: pkg.version,
  type: 'module',
  main: 'dist/index.js',
  dependencies: pkg.dependencies,
};
writeFileSync(join(pkgDir, 'package.json'), JSON.stringify(lambdaPkg, null, 2));

execSync('npm install --omit=dev', { cwd: pkgDir, stdio: 'inherit' });

if (existsSync(zipPath)) rmSync(zipPath);
execSync(`cd "${pkgDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
rmSync(pkgDir, { recursive: true, force: true });

console.log('Lambda package created:', zipPath);
