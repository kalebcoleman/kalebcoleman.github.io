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
  assert.match(schema, /delete_own_account/);
  assert.match(schema, /security definer/);
});

test('cloud config stays local until a project is connected', async () => {
  const config = await readFile(new URL('assets/cloud-config.mjs', root), 'utf8');
  assert.match(config, /SUPABASE_URL/);
  assert.match(config, /SUPABASE_ANON_KEY/);
  assert.match(config, /CLOUD_ENABLED/);
  assert.doesNotMatch(config, /sb_secret_/);
  assert.match(config, /SUPABASE_ANON_KEY = '(sb_publishable_|eyJ)/);
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
  assert.match(cloud, /delete_own_account/);
  assert.match(ui, /Delete account/);
});


test('the legal pages describe the optional Supabase account and deletion path', async () => {
  for (const file of ['privacy.html', 'privacy/index.html', 'terms.html', 'terms/index.html', 'delete-account.html', 'delete-account/index.html']) {
    const html = await readFile(new URL(file, root), 'utf8');
    assert.match(html, /Supabase/);
    assert.match(html, /builder#cloud|Cloud builds/);
    assert.doesNotMatch(html, /There are no accounts|no accounts, no analytics/);
  }
});
