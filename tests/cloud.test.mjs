import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('the free cloud schema protects builds with owner-only RLS', async () => {
  const schema = await readFile(new URL('supabase/schema.sql', root), 'utf8');
  assert.match(schema, /create table if not exists public\.builds/);
  assert.match(schema, /enable row level security/);
  assert.match(schema, /auth\.uid\(\) = user_id/g);
  assert.match(schema, /for select/);
  assert.match(schema, /for insert/);
  assert.match(schema, /for update/);
  assert.match(schema, /for delete/);
});

test('cloud config stays local until a project is connected', async () => {
  const config = await readFile(new URL('assets/cloud-config.mjs', root), 'utf8');
  assert.match(config, /YOUR-PROJECT/);
  assert.match(config, /CLOUD_ENABLED/);
  assert.doesNotMatch(config, /service_role/i);
  const library = await readFile(new URL('assets/build-library.mjs', root), 'utf8');
  assert.match(library, /mountCloudLibrary/);
  const ui = await readFile(new URL('assets/cloud-ui.mjs', root), 'utf8');
  assert.match(ui, /Create free account/);
  assert.match(ui, /Save current build/);
  assert.match(ui, /No payment/);
  const cloud = await readFile(new URL('assets/cloud.mjs', root), 'utf8');
  assert.doesNotMatch(cloud, /service_role/i);
  assert.match(cloud, /signInWithPassword/);
  assert.match(cloud, /from\('builds'\)/);
});
