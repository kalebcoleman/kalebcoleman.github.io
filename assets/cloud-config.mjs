// Free cloud sync configuration.
//
// Create a free Supabase project, run supabase/schema.sql in its SQL editor,
// then paste the project URL and the public anon key here. The anon key is
// designed to be public; Row Level Security in schema.sql protects every row.
//
// Leave these placeholders in place to keep the site completely local. The
// account panel stays hidden until both values are filled in.
export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-PUBLIC-ANON-KEY';

export const CLOUD_ENABLED = !SUPABASE_URL.includes('YOUR-PROJECT') && !SUPABASE_ANON_KEY.includes('YOUR-PUBLIC-ANON-KEY');
