# Free cloud builds with Supabase

The builder works fully offline and stores builds in this browser. Cloud saves are optional and use Supabase's free tier: accounts, Postgres and the browser client cost nothing at the scale this site needs. No payment or subscription is involved.

## 1. Create the free project

1. Sign in at <https://supabase.com> and create a project on the free plan.
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](../supabase/schema.sql), and run it. This creates `public.builds`, enables Row Level Security and adds the four owner-only policies.
3. Open **Authentication → Providers → Email**. Email/password is enabled by default. For instant sign-up, turn **Confirm email** off; otherwise users must click the confirmation link before signing in.
4. Open **Project Settings → API** and copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key

The anon key is designed to be public. It only gets the access allowed by the RLS policies. Never put the `service_role` key in this site.

## 2. Connect the site

Edit [`assets/cloud-config.mjs`](../assets/cloud-config.mjs):

```js
export const SUPABASE_URL = 'https://abcdefgh.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';
```

Or run the helper with the same two values:

```sh
node scripts/connect-cloud.mjs https://abcdefgh.supabase.co eyJ...
```

Deploy. The **Cloud builds** panel appears under **My build library** in the builder. Until both values are filled in, the panel stays hidden and everything remains local.

## 3. What users get

- Create a free email/password account, sign in and sign out.
- Save the current build code under a name.
- Load or delete their own cloud builds on any device.
- Local builds and export/import keep working without an account.

## Free-tier notes

Supabase's free plan is enough for early growth, but check the current limits before promoting heavily. Free projects can pause after inactivity; a small uptime ping or regular use keeps them awake. If usage outgrows the free plan, the next step is the paid plan or moving the same schema to Cloudflare D1/Workers. The builder calculations stay in the browser either way; the database only stores build codes and account rows.

## Security checklist

- RLS is enabled on `public.builds`.
- Every policy checks `auth.uid() = user_id`.
- The client only receives the anon key.
- Do not add a service-role key to `cloud-config.mjs` or any browser file.
- Keep the schema migration in version control so a new project can be recreated.
