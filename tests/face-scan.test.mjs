import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the face scan accepts a photo and passes the fileset to the landmarker', async () => {
  const script = await readFile(new URL('../assets/face-scan-DUU9j8Vk.js', import.meta.url), 'utf8');
  assert.match(script, /createImageBitmap/);
  assert.match(script, /createFromOptions\(fileset/);
  assert.match(script, /facePhoto/);
  assert.match(script, /Download face profile/);
  assert.match(script, /drawLandmarks/);
});

test('the face scan page describes the local photo workflow', async () => {
  const html = await readFile(new URL('../face-scan/index.html', import.meta.url), 'utf8');
  assert.match(html, /Upload a photo or capture a selfie/);
  assert.match(html, /478 points and basic measurements/);
  assert.match(html, /nothing is uploaded|Nothing is uploaded|no upload/);
});
