/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/cloud-delete-account.browser.cjs */
const { chromium } = require('playwright');

const SUPABASE = 'https://aqlalsliksavorsncdxw.supabase.co';
const user = {
  id: '00000000-0000-0000-0000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'cloud-test@example.com',
  email_confirmed_at: '2026-11-01T00:00:00Z',
  phone: '',
  confirmed_at: '2026-11-01T00:00:00Z',
  last_sign_in_at: '2026-11-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  is_anonymous: false,
};

const json = (route, status, body) => route.fulfill({
  status,
  headers: {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': '*',
  },
  body: JSON.stringify(body),
});

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light', serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  const logoutRequests = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('dialog', dialog => void dialog.accept());

  await page.route(`${SUPABASE}/**`, route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
      return json(route, 200, {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'test-refresh-token',
        user,
      });
    }
    if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') {
      return json(route, 200, {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'test-refresh-token',
        user,
      });
    }
    if (url.pathname === '/auth/v1/user') return json(route, 200, user);
    if (url.pathname === '/auth/v1/logout') {
      const scope = url.searchParams.get('scope') || 'global';
      logoutRequests.push({ scope, status: scope === 'local' ? 204 : 403 });
      if (scope === 'local') {
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
      }
      return json(route, 403, { code: 'session_not_found', msg: 'Session not found' });
    }
    if (url.pathname === '/rest/v1/rpc/delete_own_account') return json(route, 200, null);
    if (url.pathname === '/rest/v1/builds') return json(route, 200, []);
    return json(route, 200, {});
  });

  await page.goto('http://127.0.0.1:8123/builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const panel = page.locator('section[aria-label="Cloud builds"]');
  if (await panel.count() !== 1) throw new Error('cloud panel did not mount');
  await panel.getByRole('textbox', { name: 'Cloud account email' }).fill(user.email);
  await panel.getByLabel('Cloud account password').fill('password123');
  await panel.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(1200);
  if (!(await panel.innerText()).includes('Signed in as')) throw new Error('mock sign-in did not reach the signed-in UI');
  await panel.getByRole('button', { name: 'Delete account' }).click();
  await page.waitForTimeout(1200);
  const text = await panel.innerText();
  if (!/Account and cloud builds deleted/i.test(text)) throw new Error(`delete account did not report success: ${text}`);
  if (logoutRequests.some(request => request.scope === 'global')) throw new Error(`deleteAccount called a global logout: ${JSON.stringify(logoutRequests)}`);
  if (logoutRequests.some(request => request.status >= 400)) throw new Error(`deleteAccount received a 4xx logout: ${JSON.stringify(logoutRequests)}`);
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
  console.log({ signIn: 'ok', deleted: 'ok', logoutRequests, errors: 0 });
  await browser.close();
})();
