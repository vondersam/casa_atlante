import fs from 'node:fs';

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('messages/es.json', 'utf8'));

function flatten(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flatten(v, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

const enKeys = new Set(flatten(en));
const esKeys = new Set(flatten(es));

const missingInEs = [...enKeys].filter((k) => !esKeys.has(k));
const extraInEs = [...esKeys].filter((k) => !enKeys.has(k));

if (missingInEs.length || extraInEs.length) {
  if (missingInEs.length) {
    console.error('Missing keys in es.json:');
    for (const key of missingInEs) console.error(`- ${key}`);
  }
  if (extraInEs.length) {
    console.error('Extra keys in es.json:');
    for (const key of extraInEs) console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log('i18n key sets are in sync.');
