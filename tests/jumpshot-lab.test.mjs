import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);

test('the reference Jumpshot Lab page mounts its local engine and trainer', async () => {
  const html = await readFile(new URL('jumpshot-lab/index.html', root), 'utf8');
  assert.match(html, /\/assets\/lab-engine\.js/);
  assert.match(html, /\/assets\/lab\.js/);
  assert.match(html, /\/assets\/lab\.css/);
  assert.match(html, /GBLLAB_MOUNT/);
  assert.match(html, /vJumper/);
  assert.match(html, /data-fb-route="jumpshot-lab"/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test('the local trainer bypasses the hostname fallback and remote shot log', async () => {
  const script = await readFile(new URL('assets/lab.js', root), 'utf8');
  assert.match(script, /if\(false\)\{T\$\(\);return\}/);
  assert.doesNotMatch(script, /fetch\(DO\(\)\+"\/jumpshot\/rh"/);
  assert.doesNotMatch(script, /https:\/\/www\.goatedbuildlab\.com\//);
  assert.match(script, /GBLLAB_MOUNT=function/);
});

test('the recovered 3D models and animation clips are present locally', async () => {
  for (const file of ['j3d/manifest.json', 'j3d/index.json', 'j3d/m_1k.glb', 'j3d/f_1k.glb', 'j3d/rig_m.json', 'j3d/rig_f.json', 'j3d/ball.glb', 'j3d/c/165.bin']) {
    const info = await stat(new URL(file, root));
    assert.ok(info.isFile(), file);
    assert.ok(info.size > 0, file);
  }
  const model = await stat(new URL('j3d/m_1k.glb', root));
  assert.ok(model.size > 1_000_000, 'male model is the full recovered asset');
});


test('trainer initialization failures offer the estimated practice lab', async () => {
  const html = await readFile(new URL('jumpshot-lab/index.html', root), 'utf8');
  const inline = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline);
  const target = { innerHTML: '' };
  const context = { window: { GBLLAB_MOUNT() { throw new Error('timing data unavailable'); } }, document: { getElementById: () => target } };
  assert.doesNotThrow(() => vm.runInNewContext(inline, context));
  assert.match(target.innerHTML, /Jumpshot Lab is unavailable/);
  assert.match(target.innerHTML, /href="\/jumpshot-trainer\/"/);
  assert.match(target.innerHTML, /estimates/);
});
