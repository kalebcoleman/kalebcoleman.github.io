import { CLOUD_ENABLED, SUPABASE_URL } from './cloud-config.mjs';

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\./)?.[1] ?? '';
const sqlEditor = projectRef ? `https://supabase.com/dashboard/project/${projectRef}/sql/new` : 'https://supabase.com/dashboard';

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function input(type, placeholder, ariaLabel) {
  const element = document.createElement('input');
  element.className = 'inp';
  element.type = type;
  element.placeholder = placeholder;
  element.setAttribute('aria-label', ariaLabel);
  element.autocomplete = type === 'password' ? 'current-password' : 'email';
  return element;
}

export async function mountCloudLibrary(root, { getCode, loadCode }) {
  if (!CLOUD_ENABLED) return;
  let cloud;
  try {
    cloud = await import('./cloud.mjs');
  } catch {
    return;
  }

  const panel = node('section', null, 'panel');
  panel.setAttribute('aria-label', 'Cloud builds');
  panel.id = 'cloud';
  const heading = node('h3', 'Cloud builds');
  const intro = node('p', 'Sign in to save builds across devices. Free account, no payment.', 'muted');
  const authHost = node('div');
  const libraryHost = node('div');
  const status = node('p', '', 'muted');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  panel.append(heading, intro, authHost, libraryHost, status);
  root.append(panel);

  let user = null;
  let busy = false;

  function setStatus(message, warning = false) {
    status.className = warning ? 'warn' : 'muted';
    status.textContent = message;
  }

  function setBusy(value) {
    busy = value;
    for (const button of panel.querySelectorAll('button')) button.disabled = value;
  }

  async function refreshLibrary() {
    if (!user) return;
    libraryHost.replaceChildren(node('p', 'Loading cloud builds…', 'muted'));
    try {
      const builds = await cloud.listBuilds();
      const name = input('text', 'Build name', 'Cloud build name');
      const save = node('button', 'Save current build', 'btn primary');
      save.type = 'button';
      const refresh = node('button', 'Refresh', 'btn');
      refresh.type = 'button';
      const row = node('div', null, 'fieldset');
      row.append(name, save, refresh);
      const list = node('ul', null, 'list');
      if (!builds.length) {
        list.append(node('li', 'No cloud builds yet.'));
      } else {
        for (const build of builds) {
          const item = node('li');
          item.append(node('span', `${build.name} · ${new Date(build.updated_at).toLocaleDateString()} `));
          const load = node('button', 'Load', 'btn');
          load.type = 'button';
          load.addEventListener('click', () => {
            if (loadCode(build.code)) setStatus(`Loaded ${build.name} from the cloud.`);
            else setStatus('That cloud build could not be loaded.', true);
          });
          const remove = node('button', 'Delete', 'btn');
          remove.type = 'button';
          remove.addEventListener('click', async () => {
            if (!confirm(`Delete the cloud build "${build.name}"?`)) return;
            try {
              await cloud.deleteBuild(build.id);
              setStatus(`Deleted ${build.name} from the cloud.`);
              await refreshLibrary();
            } catch (error) {
              setStatus(`Could not delete: ${error instanceof Error ? error.message : String(error)}`, true);
            }
          });
          item.append(load, document.createTextNode(' '), remove);
          list.append(item);
        }
      }
      save.addEventListener('click', async () => {
        if (busy) return;
        const code = getCode();
        if (!code) {
          setStatus('This build could not be read, so it was not saved.', true);
          return;
        }
        const title = name.value.trim() || `Build ${new Date().toLocaleString()}`;
        setBusy(true);
        try {
          await cloud.saveBuild(title, code);
          name.value = '';
          setStatus(`Saved ${title} to the cloud.`);
          await refreshLibrary();
        } catch (error) {
          setStatus(`Could not save: ${error instanceof Error ? error.message : String(error)}`, true);
        } finally {
          setBusy(false);
        }
      });
      refresh.addEventListener('click', () => void refreshLibrary());
      libraryHost.replaceChildren(row, list);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const setup = /PGRST205|Could not find the table/i.test(message);
      const retry = node('button', 'Retry', 'btn');
      retry.type = 'button';
      retry.addEventListener('click', () => void refreshLibrary());
      const row = node('div', null, 'fieldset');
      row.append(retry);
      const note = node('p', null, 'warn');
      if (setup) {
        note.append('The cloud table is not set up yet. Run supabase/schema.sql in the ');
        const link = node('a', 'Supabase SQL editor', null);
        link.href = sqlEditor;
        link.target = '_blank';
        link.rel = 'noopener';
        note.append(link, ', then press Retry.');
      } else {
        note.textContent = `Cloud builds are unavailable: ${message}`;
      }
      libraryHost.replaceChildren(note, row);
    }
  }

  function renderAuth() {
    authHost.replaceChildren();
    if (user) {
      const row = node('div', null, 'fieldset');
      row.append(node('span', `Signed in as ${user.email ?? 'your account'} `));
      const out = node('button', 'Sign out', 'btn');
      out.type = 'button';
      out.addEventListener('click', async () => {
        setBusy(true);
        try {
          await cloud.signOut();
          user = null;
          setStatus('Signed out.');
          renderAuth();
        } catch (error) {
          setStatus(`Could not sign out: ${error instanceof Error ? error.message : String(error)}`, true);
        } finally {
          setBusy(false);
        }
      });
      const removeAccount = node('button', 'Delete account', 'btn');
      removeAccount.type = 'button';
      removeAccount.addEventListener('click', async () => {
        if (!confirm('Delete your Free Builder account and every cloud build saved to it? This cannot be undone.')) return;
        setBusy(true);
        try {
          await cloud.deleteAccount();
          user = null;
          setStatus('Account and cloud builds deleted.');
          renderAuth();
        } catch (error) {
          setStatus(`Could not delete the account: ${error instanceof Error ? error.message : String(error)}`, true);
        } finally {
          setBusy(false);
        }
      });
      row.append(out, removeAccount);
      authHost.append(row);
      libraryHost.hidden = false;
      void refreshLibrary();
      return;
    }
    libraryHost.hidden = true;
    const email = input('email', 'Email', 'Cloud account email');
    const password = input('password', 'Password (6+ characters)', 'Cloud account password');
    const signIn = node('button', 'Sign in', 'btn primary');
    signIn.type = 'button';
    const signUp = node('button', 'Create free account', 'btn');
    signUp.type = 'button';
    const forgot = node('button', 'Forgot password?', 'btn');
    forgot.type = 'button';
    const row = node('div', null, 'fieldset');
    row.append(email, password, signIn, signUp, forgot);
    const note = node('p', 'No payment is collected. The account only stores your build codes so you can load them on another device.', 'muted');
    authHost.append(row, note);

    const submit = async create => {
      if (busy) return;
      const address = email.value.trim();
      if (!address || !password.value) {
        setStatus('Enter an email and password first.', true);
        return;
      }
      if (password.value.length < 6) {
        setStatus('Use at least 6 characters for the password.', true);
        return;
      }
      setBusy(true);
      setStatus(create ? 'Creating the account…' : 'Signing in…');
      try {
        if (create) {
          const result = await cloud.signUp(address, password.value);
          if (result.needsConfirmation) {
            setStatus('Check your email to confirm the account, then sign in here.');
          } else {
            user = result.user;
            setStatus('Account created. You are signed in.');
            renderAuth();
          }
        } else {
          user = await cloud.signIn(address, password.value);
          setStatus('Signed in.');
          renderAuth();
        }
      } catch (error) {
        setStatus(`${create ? 'Could not create the account' : 'Could not sign in'}: ${error instanceof Error ? error.message : String(error)}`, true);
      } finally {
        setBusy(false);
      }
    };
    signIn.addEventListener('click', () => void submit(false));
    signUp.addEventListener('click', () => void submit(true));
    forgot.addEventListener('click', async () => {
      const address = email.value.trim();
      if (!address) { setStatus('Enter the account email first.', true); return; }
      setBusy(true);
      try {
        await cloud.resetPassword(address);
        setStatus('Password reset email sent. Check that inbox.');
      } catch (error) {
        setStatus(`Could not send the reset email: ${error instanceof Error ? error.message : String(error)}`, true);
      } finally {
        setBusy(false);
      }
    });
    password.addEventListener('keydown', event => { if (event.key === 'Enter') void submit(false); });
  }

  try {
    user = await cloud.getUser();
  } catch (error) {
    setStatus(`Cloud sync is unavailable: ${error instanceof Error ? error.message : String(error)}`, true);
  }
  renderAuth();
  cloud.onAuthChange(nextUser => {
    user = nextUser;
    renderAuth();
  });
}
