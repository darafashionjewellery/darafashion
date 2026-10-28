// Imports every module under src/ so syntax and import errors surface without a database.
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.NODE_ENV ||= 'test';
const root = resolve(import.meta.dirname, '../src');
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.js') && name !== 'server.js') files.push(full);
  }
};
walk(root);
for (const file of files) await import(pathToFileURL(file).href);
console.log(`OK: ${files.length} modules loaded`);
process.exit(0);
