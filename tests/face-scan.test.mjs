import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('the face scan embeds the recovered photo-to-head tool', async () => {
  const script = await readFile(new URL('assets/face-scan-DUU9j8Vk.js', root), 'utf8');
  assert.match(script, /tool\.html\?embed=1/);
  assert.match(script, /Facescan Lab/);
  for (const file of ['face-scan/tool.html', 'face-scan/cyber_core.js', 'face-scan/find.js', 'face-scan/lib/three.module.min.js', 'face-scan/lib/vision_bundle.mjs', 'face-scan/models/cyber/cyber.bin']) {
    const info = await stat(new URL(file, root));
    assert.ok(info.isFile(), file);
    assert.ok(info.size > 0, file);
  }
});

test('the face scan page describes the local photo workflow', async () => {
  const html = await readFile(new URL('face-scan/index.html', root), 'utf8');
  assert.match(html, /Search a name or add your own photos/);
  assert.match(html, /photo-to-head tool/);
  assert.match(html, /processed in your browser/);
});
