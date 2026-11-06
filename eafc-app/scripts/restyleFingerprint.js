#!/usr/bin/env node
/**
 * Behaviour fingerprint for restyle work.
 *
 * Prints the testIDs, translation keys, router targets and API/store imports a
 * source file uses, one `kind:value` line each, sorted and de-duplicated.
 * Run it before and after restyling a screen; the diff must be empty.
 *
 *   node scripts/restyleFingerprint.js <file...>
 */
const fs = require('fs');

const TEST_ID = /testID\s*=\s*(?:\{\s*)?(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g;
const TEST_ID_EXPR = /testID\s*=\s*\{\s*([^"'`}][^}]*)\}/g;
const T_KEY = /\bt\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/g;
const ROUTE = /router\.(?:push|replace)\(\s*([^)]*?)\s*\)/g;
const IMPORT_FROM = /(?:import\s[^;]*?from\s*|import\s*|require\()\s*['"]([^'"]+)['"]/g;
const IMPORT_RE = /@\/api|@\/store|store\//;

function collect(source) {
  const out = new Set();
  let m;
  while ((m = TEST_ID.exec(source))) out.add(`testID:${m[1] ?? m[2] ?? m[3]}`);
  while ((m = TEST_ID_EXPR.exec(source))) out.add(`testID:{${m[1].trim()}}`);
  while ((m = T_KEY.exec(source))) out.add(`t:${m[1] ?? m[2] ?? m[3]}`);
  while ((m = ROUTE.exec(source))) out.add(`route:${m[1].replace(/\s+/g, ' ')}`);
  while ((m = IMPORT_FROM.exec(source))) {
    if (m[1] === 'expo-router' || IMPORT_RE.test(m[1])) out.add(`import:${m[1]}`);
  }
  return out;
}

function main(files) {
  if (!files.length) {
    process.stderr.write('usage: node scripts/restyleFingerprint.js <file...>\n');
    return 2;
  }
  const all = new Set();
  for (const file of files) {
    let source;
    try {
      source = fs.readFileSync(file, 'utf8');
    } catch (e) {
      process.stderr.write(`cannot read ${file}: ${e.message}\n`);
      return 1;
    }
    collect(source).forEach((line) => all.add(line));
  }
  const lines = [...all].sort();
  if (lines.length) process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
