import { CLOUD_ENABLED, SUPABASE_ANON_KEY, SUPABASE_URL } from './cloud-config.mjs';

let clientPromise = null;

function assertEnabled() {
  if (!CLOUD_ENABLED) throw new Error('Cloud sync is not configured yet.');
}

async function getClient() {
  assertEnabled();
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }))
      .catch(error => {
        clientPromise = null;
        throw new Error(`The cloud client could not load: ${error instanceof Error ? error.message : String(error)}`);
      });
  }
  return clientPromise;
}

export async function getUser() {
  const client = await getClient();
  const { data, error } = await client.auth.getUser();
  if (error && error.name !== 'AuthSessionMissingError') throw error;
  return data?.user ?? null;
}

export async function signIn(email, password) {
  const client = await getClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password) {
  const client = await getClient();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user, needsConfirmation: !data.session };
}

export async function resetPassword(email) {
  const client = await getClient();
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/builder` });
  if (error) throw error;
}

export async function signOut() {
  const client = await getClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function listBuilds() {
  const client = await getClient();
  const { data, error } = await client
    .from('builds')
    .select('id,name,code,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveBuild(name, code) {
  const client = await getClient();
  const user = await getUser();
  if (!user) throw new Error('Sign in before saving a cloud build.');
  const { data, error } = await client
    .from('builds')
    .insert({ user_id: user.id, name, code })
    .select('id,name,code,updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAccount() {
  const client = await getClient();
  const { error } = await client.rpc('delete_own_account');
  if (error) throw error;
  await client.auth.signOut();
}

export async function deleteBuild(id) {
  const client = await getClient();
  const { error } = await client.from('builds').delete().eq('id', id);
  if (error) throw error;
}

export function onAuthChange(callback) {
  let subscription = null;
  getClient().then(client => {
    const { data } = client.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null));
    subscription = data?.subscription ?? null;
  }).catch(() => {});
  return () => subscription?.unsubscribe();
}
