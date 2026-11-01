import { writeFile } from 'node:fs/promises';

const [url, key] = process.argv.slice(2);
if (!url || !key) {
  console.error('Usage: node scripts/connect-cloud.mjs https://YOUR-PROJECT.supabase.co YOUR_PUBLIC_ANON_KEY');
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
  console.error('The project URL should look like https://abcdefgh.supabase.co');
  process.exit(1);
}
if (key.length < 80 || /service_role/i.test(key)) {
  console.error('Use the public anon key, not the service_role key.');
  process.exit(1);
}
const source = `// Free cloud sync configuration.
//
// The anon key is designed to be public; Row Level Security in
// supabase/schema.sql protects every row. Never put a service_role key here.
export const SUPABASE_URL = '${url}';
export const SUPABASE_ANON_KEY = '${key}';

export const CLOUD_ENABLED = true;
`;
await writeFile(new URL('../assets/cloud-config.mjs', import.meta.url), source);
console.log('Cloud config written. Deploy the site and open the builder to sign in.');
