import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(new URL('../', import.meta.url));

async function htmlFiles(directory = rootPath) {
  const out = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

async function exists(relative) {
  try { return (await stat(path.join(rootPath, relative))).isFile(); } catch { return false; }
}

function localTarget(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean.startsWith('//') || /^[a-z]+:/i.test(clean)) return null;
  if (!clean.startsWith('/')) return null;
  const pathname = clean.replace(/^\//, '');
  if (!pathname) return 'index.html';
  if (pathname.endsWith('/')) return `${pathname}index.html`;
  if (path.extname(pathname)) return pathname;
  return [pathname, `${pathname}.html`, `${pathname}/index.html`];
}

test('every local link and asset in the static pages exists', async () => {
  const failures = [];
  for (const file of await htmlFiles()) {
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = localTarget(match[1]);
      if (!target) continue;
      const candidates = Array.isArray(target) ? target : [target];
      let found = false;
      for (const candidate of candidates) if (await exists(candidate)) { found = true; break; }
      if (!found) failures.push(`${path.relative(rootPath, file)} -> ${match[1]}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('removed surfaces are not linked from the site', async () => {
  const failures = [];
  for (const file of await htmlFiles()) {
    if (file.endsWith(path.join('face-scan', 'tool.html'))) continue;
    const html = await readFile(file, 'utf8');
    if (/\/community|\/league|\/locker|tab=community|tab=league|tab=locker|radioBtn|id="radio"/i.test(html)) {
      failures.push(path.relative(rootPath, file));
    }
  }
  assert.deepEqual(failures, []);
});

test('every mapped badge icon file exists', async () => {
  const map = JSON.parse(await readFile(new URL('assets/badge-icons/map.json', root), 'utf8'));
  assert.equal(Object.keys(map).length, 53);
  const missing = [];
  for (const [name, slug] of Object.entries(map)) {
    if (!await exists(`assets/badge-icons/${slug}.svg`)) missing.push(`${name}: ${slug}`);
  }
  assert.deepEqual(missing, []);
});

test('the service worker shell URLs exist', async () => {
  const source = await readFile(new URL('sw.js', root), 'utf8');
  const match = /const SHELL = \[([^\]]+)\]/.exec(source);
  assert.ok(match);
  const urls = [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]);
  for (const url of urls) {
    const target = localTarget(url);
    if (!target) continue;
    const candidates = Array.isArray(target) ? target : [target];
    let found = false;
    for (const candidate of candidates) if (await exists(candidate)) { found = true; break; }
    assert.ok(found, `missing service worker shell URL ${url}`);
  }
});
