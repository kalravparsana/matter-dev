import fs from 'node:fs';

const [key, value, file] = process.argv.slice(2);
let text = '';
try {
  text = fs.readFileSync(file, 'utf8');
} catch {
  text = '';
}

const line = `${key}=${value}`;
const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp(`^${escapedKey}=.*$`, 'm');
text = pattern.test(text)
  ? text.replace(pattern, line)
  : `${text.trimEnd()}${text.endsWith('\n') || !text ? '' : '\n'}${line}\n`;

fs.writeFileSync(file, text);
