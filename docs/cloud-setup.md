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

- Password reset by email from the sign-in form.

- Create a free email/password account, sign in and sign out.
- Save the current build code under a name.
- Load or delete their own cloud builds on any device.
- Local builds and export/import keep working without an account.

## Free-tier notes

Supabase's free plan is enough for early growth, but check the current limits before promoting heavily. Free projects can pause after inactivity; a small uptime ping or regular use keeps them awake. If usage outgrows the free plan, the next step is the paid plan or moving the same schema to Cloudflare D1/Workers. The builder calculations stay in the browser either way; the database only stores build codes and account rows.

## Account deletion

Re-run `supabase/schema.sql` once after this file changes so `delete_own_account()` exists. The Cloud builds panel has a **Delete account** button; it calls that RPC and removes only the signed-in user's auth row. The `builds` table cascades from `auth.users`, so that user's cloud builds are deleted too. Local browser data is separate.

## Security checklist

- RLS is enabled on `public.builds`.
- Every policy checks `auth.uid() = user_id`.
- The client only receives the anon key.
- Do not add a service-role key to `cloud-config.mjs` or any browser file.
- Keep the schema migration in version control so a new project can be recreated.

## Verified against the live free project (2026-11-01)

Project ref `aqlalsliksavorsncdxw`, schema applied from a VPS with `psql` over SSL. Two disposable users were created, exercised through the public Auth and PostgREST APIs, and deleted. A third disposable user was then driven through the real builder UI in headless Chromium at 390x844.

API-level isolation, users A and B:

- Anonymous read of `builds` with the anon key: HTTP 200, 0 rows.
- A inserts a build: 201, one row.
- B lists builds: 200, 0 rows. A's row is invisible to B.
- B `PATCH` and `DELETE` of A's row: 200 with an empty representation, 0 rows affected. A's row is unchanged afterwards.
- B inserts a row with `user_id` set to A: 403, Postgres error `42501` (RLS violation).
- A updates its own row: 200, one row.
- A calls `delete_own_account()`: 204. A's builds are removed by the cascade, and B still exists and can still query.
- Cleanup left 0 test users and 0 builds.

UI flow, headless Chromium at 390x844 using the shipped `assets/cloud.mjs`:

- Sign in with a confirmed account: the panel shows "Signed in as ...".
- Save current build: one cloud row with a 128-character build code.
- Sign out, then sign in again: the build is still listed.
- Reset the builder, then press Load: Close Shot 51 to 54 restored, status "Loaded ... from the cloud."
- Delete the cloud build: 0 rows left for that user.
- Delete account: the auth user row and its builds are both gone.

Notes and gotchas found while testing:

- Email confirmation is enabled in this project, so **Create free account** ends with "Check your email ...". Supabase Auth also rejects `example.com` and `*.test` addresses as invalid, so use a real mailbox for a signup test.
- Seeding a confirmed user with raw SQL requires `confirmation_token`, `recovery_token`, `email_change` and `email_change_token_new` to be `''` because their column defaults are NULL. Leaving them NULL makes the password grant fail with HTTP 500 "Database error querying schema".
- `deleteAccount()` in `assets/cloud.mjs` calls `client.auth.signOut()` after `delete_own_account()`. The session is already gone, so the browser logs a 403 `session_not_found` for the logout request. The UI still reports success; `signOut({ scope: 'local' })` would avoid the noise.
- The direct database host `db.<ref>.supabase.co:5432` refused connections during this test while the REST API stayed up. `aws-0-us-east-1.pooler.supabase.com:5432` with user `postgres.<ref>` worked for the same schema and queries. Use whichever host the dashboard's **Connect** dialog shows.
