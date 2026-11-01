/**
 * Free Builder · Jumpshot Practice Lab
 *
 * All interaction is local to this browser: no authentication, no backend,
 * no game integration, no network reads beyond the same-origin animation
 * table. Timing values come from the estimated practice model in
 * trainer-engine.mjs.
 */

import {
  CONTEXTS,
  DEFAULT_SETTINGS,
  DIFFICULTY_NAMES,
  HANDS,
  INPUTS,
  METER_SIDES,
  METER_STATES,
  MODE_LABELS,
  RESULT_META,
  SETTING_LABELS,
  SHOT_TYPES,
  SPEEDS,
  SPRINTS,
  TABS,
  VISUAL_CUES,
  attemptsForDrill,
  buildRecommendations,
  buildShareQuery,
  clearStoredState,
  computeCalibration,
  createShot,
  estimateProfile,
  evaluateRelease,
  loadStoredState,
  makeAttempt,
  normalizeAttempts,
  normalizeSettings,
  normalizeTab,
  parseStateJson,
  recordAttempt,
  saveStoredState,
  serializeState,
  summarizeAttempts,
  summarizeDrill,
} from './trainer-engine.mjs';

function byId(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Trainer markup is missing #${id}.`);
  return node;
}

const dom = {
  modeBadge: byId('modeBadge'),
  shotStage: byId('shotStage'),
  courtScene: byId('courtScene'),
  meterPanel: byId('meterPanel'),
  windowChip: byId('windowChip'),
  meterReadout: byId('meterReadout'),
  shotProfileText: byId('shotProfileText'),
  shotPad: byId('shotPad'),
  shotPadState: byId('shotPadState'),
  shotPadLabel: byId('shotPadLabel'),
  shotPadHint: byId('shotPadHint'),
  startJumpBtn: byId('startJumpBtn'),
  cancelShotBtn: byId('cancelShotBtn'),
  autoAdvanceToggle: byId('autoAdvanceToggle'),
  feedback: byId('feedback'),
  sessionCount: byId('sessionCount'),
  sessionLabel: byId('sessionLabel'),
  statClean: byId('statClean'),
  statError: byId('statError'),
  statBias: byId('statBias'),
  statStreak: byId('statStreak'),
  recentShots: byId('recentShots'),
  coachLine: byId('coachLine'),
  openPlanBtn: byId('openPlanBtn'),
  saveState: byId('saveState'),
  trainerTabs: byId('trainerTabs'),
  startJumpShotBtn: byId('startJumpShotBtn'),
  sessionStatsLine: byId('sessionStatsLine'),
  historyBody: byId('historyBody'),
  ftStartBtn: byId('ftStartBtn'),
  ftProfile: byId('ftProfile'),
  ftStatus: byId('ftStatus'),
  ftDots: byId('ftDots'),
  ftSummary: byId('ftSummary'),
  ftPastSets: byId('ftPastSets'),
  calibrationStartBtn: byId('calibrationStartBtn'),
  calibrationOffset: byId('calibrationOffset'),
  calibrationOffsetOut: byId('calibrationOffsetOut'),
  calibrationSamples: byId('calibrationSamples'),
  calibrationBias: byId('calibrationBias'),
  calibrationSpread: byId('calibrationSpread'),
  calibrationConfidence: byId('calibrationConfidence'),
  calibrationSuggested: byId('calibrationSuggested'),
  applyCalibrationBtn: byId('applyCalibrationBtn'),
  resetCalibrationBtn: byId('resetCalibrationBtn'),
  calibrationPlot: byId('calibrationPlot'),
  calibrationAdvice: byId('calibrationAdvice'),
  recConfidence: byId('recConfidence'),
  recHeadline: byId('recHeadline'),
  recBody: byId('recBody'),
  applyRecBtn: byId('applyRecBtn'),
  openCalibrationBtn: byId('openCalibrationBtn'),
  recObservations: byId('recObservations'),
  recChanges: byId('recChanges'),
  recDrills: byId('recDrills'),
  recSampleNote: byId('recSampleNote'),
  settingsForm: byId('settingsForm'),
  settingsGrid: byId('settingsGrid'),
  animationStatus: byId('animationStatus'),
  shareOutput: byId('shareOutput'),
  copyShareBtn: byId('copyShareBtn'),
  exportBtn: byId('exportBtn'),
  importInput: byId('importInput'),
  restoreDefaultsBtn: byId('restoreDefaultsBtn'),
  clearDataBtn: byId('clearDataBtn'),
  storageError: byId('storageError'),
  srAnnouncer: byId('srAnnouncer'),
};

const TAB_UI = TABS.map((tab) => ({
  tab,
  button: byId(`tab-${tab}`),
  panel: byId(`panel-${tab}`),
}));

const TAB_LABELS = {
  shooting: 'Shooting',
  'free-throws': 'Free throws',
  calibration: 'Calibration',
  recommendations: 'Recommendations',
  setup: 'Shot setup',
};

function readStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = readStorage();
const loaded = loadStoredState(storage);

let settings = normalizeSettings(loaded.state.settings);
let attempts = normalizeAttempts(loaded.state.attempts);
let activeTab = normalizeTab(loaded.state.ui.tab);
const hashTab = window.location.hash.slice(1);
if (TABS.includes(hashTab)) activeTab = hashTab;

const pageAttempts = [];
let freeThrowRun = null;
let activeShot = null;
let shotFrame = 0;
let cuePulseTimer = 0;
let autoTimer = 0;
let persistTimer = 0;
let announceTimer = 0;
let audioContext = null;
let scheduledCueNodes = [];
let lastRecommendation = null;
let persistPaused = false;
let storageFailureAnnounced = false;
let settingsFormBuilt = false;
let idCounter = 0;

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function signed(value, digits = 1) {
  const number = Number(value) || 0;
  return `${number > 0 ? '+' : ''}${number.toFixed(digits)}`;
}

function formatMs(value, digits = 0) {
  return `${Number(value).toFixed(digits)} ms`;
}

function percent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function formatWhen(timestamp) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return 'recently';
  }
}

function formatTimeNow() {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
  } catch {
    return 'now';
  }
}

function firstSentence(text) {
  const value = String(text || '').trim();
  const end = value.indexOf('. ');
  return end === -1 ? value : value.slice(0, end + 1);
}

function flashButton(button, text) {
  if (!button) return;
  if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent;
  button.textContent = text;
  window.clearTimeout(Number(button.dataset.flashTimer) || 0);
  button.dataset.flashTimer = String(window.setTimeout(() => {
    button.textContent = button.dataset.originalLabel;
  }, 1800));
}

function createId(prefix) {
  idCounter += 1;
  const uuid = globalThis.crypto?.randomUUID?.().slice(0, 8)
    ?? Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${uuid}`;
}

function announce(message) {
  window.clearTimeout(announceTimer);
  dom.srAnnouncer.textContent = '';
  announceTimer = window.setTimeout(() => {
    dom.srAnnouncer.textContent = message;
  }, 40);
}

function modeForTab(tab = activeTab) {
  if (tab === 'free-throws') return 'freeThrow';
  if (tab === 'calibration') return 'calibration';
  return 'jump';
}

function formatSettingValue(key, value) {
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  if (key === 'offsetMs') return `${value} ms`;
  if (value === '') return 'None';
  return String(value);
}

/* ---------------------------------------------------------------------------
   Persistence
   --------------------------------------------------------------------------- */

function setStorageMessage(message, error = '') {
  dom.saveState.textContent = message;
  dom.storageError.textContent = error;
}

function persistNow() {
  if (persistPaused) return;
  window.clearTimeout(persistTimer);
  persistTimer = 0;
  const saved = saveStoredState(storage, {
    settings,
    attempts,
    ui: { tab: activeTab },
  });
  if (saved) {
    storageFailureAnnounced = false;
    setStorageMessage(`Saved on this device · ${formatTimeNow()}`);
  } else {
    setStorageMessage(
      'Local saving is unavailable. Practice still works in this tab, but changes will not persist.',
      'Browser storage could not be written. Check private-browsing or storage settings.',
    );
    if (!storageFailureAnnounced) {
      storageFailureAnnounced = true;
      announce('Local saving is unavailable. Practice still works in this tab, but changes will not persist.');
    }
  }
}

function queuePersist() {
  if (persistPaused) return;
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(persistNow, 100);
}

function markPersistenceWritable() {
  persistPaused = false;
}

function initialStorageMessage() {
  if (loaded.error) {
    setStorageMessage(loaded.error, loaded.error);
    return;
  }
  if (attempts.length) {
    setStorageMessage(`Loaded ${attempts.length} saved rep${attempts.length === 1 ? '' : 's'} from this browser.`);
  } else {
    setStorageMessage('Saving locally; no account needed.');
  }
}

/* ---------------------------------------------------------------------------
   Tabs
   --------------------------------------------------------------------------- */

function renderTabs() {
  for (const entry of TAB_UI) {
    const selected = entry.tab === activeTab;
    entry.button.classList.toggle('is-active', selected);
    entry.button.setAttribute('aria-selected', String(selected));
    entry.button.tabIndex = selected ? 0 : -1;
    entry.panel.hidden = !selected;
  }
}

function setTab(tab, {
  announceTab = true,
  cancelAuto = true,
  persist = true,
  updateUrl = true,
  focus = false,
} = {}) {
  const next = normalizeTab(tab);
  const changed = next !== activeTab;
  activeTab = next;
  renderTabs();
  if (cancelAuto && changed) cancelAutoTimer();
  if (changed && updateUrl) {
    try {
      window.history.replaceState(null, '', `#${next}`);
    } catch {
      /* History updates are optional. */
    }
  }
  if (changed && persist) queuePersist();
  if (changed) renderMode();
  if (announceTab && changed) announce(`${TAB_LABELS[next]} section.`);
  if (focus) {
    TAB_UI.find((entry) => entry.tab === next)?.button.focus();
  }
}

function renderMode() {
  renderProfile();
  syncShotControls();
  if (!activeShot) renderIdleMeter();
}

function handleTabKeys(event) {
  const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const focusedEntry = TAB_UI.find((entry) => entry.button === document.activeElement);
  const currentTab = focusedEntry?.tab ?? activeTab;
  const currentIndex = TABS.indexOf(currentTab);
  let nextIndex = currentIndex;
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length;
  if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = TABS.length - 1;
  setTab(TABS[nextIndex], { focus: true });
}

/* ---------------------------------------------------------------------------
   Settings form
   --------------------------------------------------------------------------- */

function appendHelp(wrapper, key, help) {
  if (!help) return;
  const helpNode = document.createElement('span');
  helpNode.className = 'field-help';
  helpNode.id = `help-${key}`;
  helpNode.textContent = help;
  wrapper.append(helpNode);
}

function createSelectField(key, label, options, help) {
  const wrapper = document.createElement('label');
  wrapper.className = 'field';
  wrapper.htmlFor = `setting-${key}`;
  const text = document.createElement('span');
  text.className = 'field-label';
  text.textContent = label;
  const select = document.createElement('select');
  select.className = 'sel fit';
  select.id = `setting-${key}`;
  select.dataset.setting = key;
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '—';
  select.append(placeholder);
  for (const optionValue of options) {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    select.append(option);
  }
  wrapper.append(text, select);
  appendHelp(wrapper, key, help);
  if (help) select.setAttribute('aria-describedby', `help-${key}`);
  return wrapper;
}

function createNumberField(key, label, { min, max, step = 1 }, help) {
  const wrapper = document.createElement('label');
  wrapper.className = 'field';
  wrapper.htmlFor = `setting-${key}`;
  const text = document.createElement('span');
  text.className = 'field-label';
  text.textContent = label;
  const input = document.createElement('input');
  input.className = 'inp num';
  input.type = 'number';
  input.id = `setting-${key}`;
  input.dataset.setting = key;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.inputMode = 'numeric';
  wrapper.append(text, input);
  appendHelp(wrapper, key, help);
  if (help) input.setAttribute('aria-describedby', `help-${key}`);
  return wrapper;
}

function createCheckboxField(key, label, help) {
  const wrapper = document.createElement('label');
  wrapper.className = 'field-check';
  wrapper.htmlFor = `setting-${key}`;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `setting-${key}`;
  input.dataset.setting = key;
  const text = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = label;
  text.append(strong);
  if (help) {
    const small = document.createElement('small');
    small.id = `help-${key}`;
    small.textContent = help;
    text.append(small);
    input.setAttribute('aria-describedby', `help-${key}`);
  }
  wrapper.append(input, text);
  return wrapper;
}

function createRangeField(key, label, { min, max }, help) {
  const wrapper = document.createElement('label');
  wrapper.className = 'field field-wide';
  wrapper.htmlFor = `setting-${key}`;
  const text = document.createElement('span');
  text.className = 'field-label';
  text.textContent = label;
  const row = document.createElement('span');
  row.className = 'offset-field';
  const input = document.createElement('input');
  input.type = 'range';
  input.id = `setting-${key}`;
  input.dataset.setting = key;
  input.min = String(min);
  input.max = String(max);
  input.step = '1';
  const output = document.createElement('output');
  output.id = `setting-${key}Out`;
  output.htmlFor = `setting-${key}`;
  row.append(input, output);
  wrapper.append(text, row);
  appendHelp(wrapper, key, help);
  if (help) input.setAttribute('aria-describedby', `help-${key}`);
  return wrapper;
}

function buildSettingsForm() {
  if (settingsFormBuilt) return;
  const fields = [
    ['shotType', 'Shot type', SHOT_TYPES, 'Changes the estimated practice tempo; it is not game data.'],
    ['base', 'Base', [], 'Saved label only. Animation choice does not alter the local timing estimate.'],
    ['release1', 'Release 1', [], 'Saved label only. The recovered animation table has no separate Release category.'],
    ['release2', 'Release 2', [], 'Saved label only. Choose None for a single release.'],
    ['speed', 'Speed', SPEEDS, 'Adjusts the estimated tempo of the local practice target.'],
    ['input', 'Input', INPUTS, 'A planning label for your setup; it does not change the browser timer.'],
    ['cue', 'Visual cue', VISUAL_CUES, 'Chooses when the visual cue appears before the estimated target.'],
    ['difficulty', 'Difficulty', DIFFICULTY_NAMES, 'Widens or narrows the local green window.'],
    ['context', 'Context', CONTEXTS, 'Changes the estimated practice tempo for the drill label.'],
    ['hand', 'Hand', HANDS, 'Saved label only; it does not change scoring.'],
    ['sprint', 'Sprint', SPRINTS, 'Saved label only; it does not change scoring.'],
    ['meter', 'Shot meter', METER_STATES, 'Turn the visual window off to practise from the cue and audio.'],
    ['meterSide', 'Meter placement', METER_SIDES, 'Moves the local meter when it is shown. It does not change timing or scoring.'],
  ];
  const animationRoles = new Set(['base', 'release1', 'release2']);
  for (const [key, label, options, help] of fields) {
    if (animationRoles.has(key)) {
      const wrapper = createSelectField(key, label, [], help);
      wrapper.querySelector('select').dataset.animation = key;
      dom.settingsGrid.append(wrapper);
    } else {
      dom.settingsGrid.append(createSelectField(key, label, options, help));
    }
  }
  dom.settingsGrid.append(
    createNumberField('cueBar', 'Cue bar band', { min: 0, max: 3 }, 'Adds 10 ms of cue lead per band. This keeps the recovered cue-bar field meaningful.'),
    createNumberField('freeThrowRating', 'Free-throw rating', { min: 25, max: 99 }, 'Planning note only. It does not change the local timing estimate or window.'),
    createCheckboxField('sound', 'Audio cue', 'Play a short tone at the estimated cue. Useful for non-visual timing.'),
    createCheckboxField('autoAdvance', 'Auto-advance', 'Start the next rep 1.4 seconds after a result.'),
    createRangeField('offsetMs', 'Calibration offset', { min: -120, max: 120 }, 'Shifts the local target earlier (+) or later (−). Also editable in Calibration.'),
  );
  settingsFormBuilt = true;
  syncSettingsForm();
}

function syncSettingsForm() {
  if (!settingsFormBuilt) return;
  for (const control of dom.settingsGrid.querySelectorAll('[data-setting]')) {
    const key = control.dataset.setting;
    const value = settings[key];
    if (control.type === 'checkbox') {
      control.checked = Boolean(value);
    } else if (control.tagName === 'SELECT') {
      if (value !== '' && !Array.from(control.options).some((option) => option.value === String(value))) {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = String(value);
        control.append(option);
      }
      control.value = String(value ?? '');
    } else {
      control.value = String(value ?? '');
    }
  }
  const offsetOutput = document.getElementById('setting-offsetMsOut');
  if (offsetOutput) offsetOutput.textContent = `${signed(settings.offsetMs, 0)} ms`;
  dom.autoAdvanceToggle.checked = settings.autoAdvance;
  dom.calibrationOffset.value = String(settings.offsetMs);
  dom.calibrationOffsetOut.textContent = `${signed(settings.offsetMs, 0)} ms`;
  dom.calibrationOffset.setAttribute('aria-valuetext', `${signed(settings.offsetMs, 0)} milliseconds`);
}

function commitSettings(patch, { persist = 'queue', announceMessage = '' } = {}) {
  const previousSound = settings.sound;
  settings = normalizeSettings({ ...settings, ...patch });
  if (previousSound && !settings.sound) stopScheduledCue();
  markPersistenceWritable();
  syncSettingsForm();
  renderAll();
  if (persist === 'now') persistNow();
  else queuePersist();
  if (announceMessage) announce(announceMessage);
}

function handleSettingInput(event) {
  const control = event.target.closest('[data-setting]');
  if (!control) return;
  const key = control.dataset.setting;
  let value;
  if (control.type === 'checkbox') value = control.checked;
  else if (control.type === 'number' || control.type === 'range') value = Number(control.value);
  else value = control.value;
  if (key === 'cueBar') value = clamp(Math.round(Number(value) || 0), 0, 3);
  if (key === 'freeThrowRating') value = clamp(Math.round(Number(value) || 0), 25, 99);
  if (key === 'offsetMs') value = clamp(Math.round(Number(value) || 0), -120, 120);
  if (key === 'autoAdvance' && value === false) cancelAutoTimer();
  commitSettings({ [key]: value });
}

/* ---------------------------------------------------------------------------
   Animation catalog
   --------------------------------------------------------------------------- */

function fillAnimationSelect(role, values, currentValue, { allowNone = false } = {}) {
  const select = dom.settingsGrid.querySelector(`select[data-animation="${role}"]`);
  if (!select) return;
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '—';
  const options = [placeholder];
  if (allowNone) {
    const none = document.createElement('option');
    none.value = 'None';
    none.textContent = 'None';
    options.push(none);
  }
  const seen = new Set(['', ...(allowNone ? ['None'] : [])]);
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    options.push(option);
  }
  if (currentValue && !seen.has(currentValue)) {
    const saved = document.createElement('option');
    saved.value = currentValue;
    saved.textContent = currentValue;
    options.push(saved);
  }
  select.replaceChildren(...options);
  select.value = currentValue === '' ? '' : currentValue;
}

function populateAnimationSelects() {
  fillAnimationSelect('base', animationOptions.bases, settings.base);
  fillAnimationSelect('release1', animationOptions.releases, settings.release1);
  fillAnimationSelect('release2', animationOptions.releases, settings.release2, { allowNone: true });
}

const animationOptions = {
  bases: [],
  releases: [],
  total: 0,
  hasReleaseCategory: false,
};

async function loadAnimations() {
  try {
    const response = await fetch('/data/animations.json', { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Animation table returned ${response.status}`);
    const data = await response.json();
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    const baseRows = rows.filter((row) => Array.isArray(row) && row[1] === 'Jumper Base');
    const releaseRows = rows.filter((row) => Array.isArray(row) && /Release/i.test(String(row[1])));
    const bases = [...new Set(baseRows.map((row) => String(row[0])))].slice(0, 200);
    const releases = (releaseRows.length
      ? [...new Set(releaseRows.map((row) => String(row[0])))]
      : bases).slice(0, 200);
    animationOptions.bases = bases;
    animationOptions.releases = releases;
    animationOptions.total = Number(data?.count) || rows.length;
    animationOptions.hasReleaseCategory = releaseRows.length > 0;
    populateAnimationSelects();
    if (!bases.length) {
      dom.animationStatus.textContent = 'The local animation table loaded but contained no jumper bases. Other settings still work; animation names remain as saved labels.';
      return;
    }
    dom.animationStatus.textContent = `${animationOptions.total.toLocaleString()} local animations. Showing ${bases.length} jumper bases and ${releases.length} release ${releaseRows.length ? 'entries' : 'fallbacks'}. The recovered table has no separate Release category, so the Jumpshot Lab base list is used as the release fallback. Animation names label the plan only.`;
  } catch {
    dom.animationStatus.textContent = 'The local animation table could not be loaded. The trainer still works; animation names remain editable as saved labels and no animation timing is used.';
  }
}

/* ---------------------------------------------------------------------------
   Audio cues
   --------------------------------------------------------------------------- */

function ensureAudio() {
  if (!settings.sound) return null;
  if (audioContext) {
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  try {
    audioContext = new Context();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  } catch {
    audioContext = null;
  }
  return audioContext;
}

function stopScheduledCue() {
  for (const node of scheduledCueNodes) {
    try {
      node.stop();
    } catch {
      /* The node may already have ended. */
    }
    try {
      node.disconnect();
    } catch {
      /* Disconnecting twice is harmless. */
    }
  }
  scheduledCueNodes = [];
}

function scheduleCue(shot) {
  stopScheduledCue();
  const context = ensureAudio();
  if (!context) return;
  const when = context.currentTime + Math.max(0, shot.cueMs) / 1000;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.055, when + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.08);
  scheduledCueNodes.push(oscillator);
}

function playTone(frequency, duration = 0.075, delay = 0) {
  const context = ensureAudio();
  if (!context) return;
  const when = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.045, when + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function playResultTone(tone) {
  if (tone === 'green') {
    playTone(880, 0.07);
    playTone(1174, 0.06, 0.09);
  } else if (tone === 'warm') {
    playTone(640, 0.08);
  } else {
    playTone(220, 0.12);
  }
}

/* ---------------------------------------------------------------------------
   Shot meter
   --------------------------------------------------------------------------- */

function setMeterGeometry(profile) {
  const max = Math.max(1, profile.maxMs || 1);
  const bandStart = clamp((profile.targetMs - profile.windowMs / 2) / max, 0, 1);
  const bandSize = clamp(profile.windowMs / max, 0.015, 1);
  const cue = clamp(profile.cueMs / max, 0, 1);
  const target = clamp(profile.targetMs / max, 0, 1);
  dom.meterPanel.style.setProperty('--band-start', bandStart.toFixed(5));
  dom.meterPanel.style.setProperty('--band-size', bandSize.toFixed(5));
  dom.meterPanel.style.setProperty('--cue-p', cue.toFixed(5));
  dom.meterPanel.style.setProperty('--target-p', target.toFixed(5));
}

function setMeterProgress(progress) {
  dom.meterPanel.style.setProperty('--progress', clamp(progress, 0, 1).toFixed(5));
}

function renderIdleMeter() {
  if (activeShot) return;
  const profile = estimateProfile(settings, modeForTab());
  setMeterGeometry(profile);
  setMeterProgress(0);
  if (settings.meter === 'Off') {
    dom.meterReadout.textContent = `Meter hidden. Release on the cue flash or audio cue. Estimated cue at ~${profile.cueMs} ms.`;
  } else {
    dom.meterReadout.textContent = `Estimated window: ~${profile.targetMs} ms target, ${profile.windowMs} ms wide. Press start when ready.`;
  }
}

function fireCue() {
  dom.courtScene.classList.add('is-cue');
  window.clearTimeout(cuePulseTimer);
  cuePulseTimer = window.setTimeout(() => {
    dom.courtScene.classList.remove('is-cue');
  }, 520);
  dom.meterReadout.textContent = 'Cue — release now.';
  if (settings.sound) {
    try {
      navigator.vibrate?.(18);
    } catch {
      /* Haptics are an optional enhancement. */
    }
  }
}

function tickShot(now) {
  if (!activeShot) return;
  const elapsed = now - activeShot.startedAt;
  if (!activeShot.cueFired && elapsed >= activeShot.cueMs) {
    activeShot.cueFired = true;
    fireCue();
  }
  setMeterProgress(elapsed / activeShot.maxMs);
  if (elapsed >= activeShot.maxMs && !activeShot.windowClosed) {
    activeShot.windowClosed = true;
    dom.shotPad.classList.add('is-closed');
    dom.shotPadState.textContent = 'Window closed';
    dom.shotPadLabel.textContent = 'Release to log a late rep';
    dom.shotPadHint.textContent = 'The estimated practice window has passed. Release to log it, or press Esc to cancel.';
    dom.shotPad.setAttribute('aria-label', 'Practice window closed. Activate the pad to log a late attempt, or press Escape to cancel.');
    dom.meterReadout.textContent = 'The estimated practice window has closed. Release to log a late attempt or cancel.';
    setNeutralFeedback('Practice window closed. Release to log a late attempt, or press Esc to cancel.');
    return;
  }
  if (!activeShot.windowClosed) shotFrame = window.requestAnimationFrame(tickShot);
}

/* ---------------------------------------------------------------------------
   Feedback and shot controls
   --------------------------------------------------------------------------- */

function setNeutralFeedback(message) {
  dom.feedback.dataset.tone = '';
  const span = document.createElement('span');
  span.className = 'feedback-placeholder';
  span.textContent = message;
  dom.feedback.replaceChildren(span);
}

function setFeedback(evaluation, shot, releaseMs, { drillIndex = null, completed = null } = {}) {
  dom.feedback.dataset.tone = evaluation.tone;
  const strong = document.createElement('strong');
  strong.textContent = `${evaluation.label} —`;
  const timing = document.createElement('span');
  const absolute = Math.abs(evaluation.errorMs);
  timing.textContent = ` ${absolute < 1 ? 'on the estimated target' : `${absolute.toFixed(1)} ms ${evaluation.direction}`}. `;
  const detail = document.createElement('span');
  detail.className = 'feedback-detail';
  const drill = drillIndex ? `Free-throw rep ${drillIndex} of 10 · ` : '';
  const estimate = `Released at ${Math.round(releaseMs)} ms against an estimated ${shot.targetMs} ms target · ${shot.windowMs} ms local window.`;
  const completion = completed
    ? ` Set complete: ${completed.cleans} of ${completed.total} clean releases.`
    : '';
  detail.textContent = `${drill}${estimate}${completion} Local estimate, not an NBA 2K measurement.`;
  dom.feedback.replaceChildren(strong, timing, detail);
}

function syncShotControls() {
  const isActive = Boolean(activeShot);
  dom.startJumpBtn.disabled = isActive;
  dom.startJumpShotBtn.disabled = isActive;
  dom.ftStartBtn.disabled = isActive;
  dom.calibrationStartBtn.disabled = isActive;
  dom.cancelShotBtn.disabled = !isActive;
  dom.autoAdvanceToggle.checked = settings.autoAdvance;

  if (!activeShot) {
    const mode = modeForTab();
    const labels = {
      jump: 'Start jump shot',
      freeThrow: 'Start free throw',
      calibration: 'Start calibration rep',
    };
    dom.shotPad.classList.remove('is-armed', 'is-closed');
    dom.shotPadState.textContent = 'Ready';
    dom.shotPadLabel.textContent = labels[mode] ?? 'Start shot';
    dom.shotPadHint.textContent = 'Click this pad, or press Space / Enter when it is focused.';
    dom.shotPad.setAttribute('aria-label', `${labels[mode] ?? 'Start shot'}. Press Enter or Space to start, then press again to release at the cue.`);
    return;
  }

  dom.shotPad.classList.add('is-armed');
  dom.shotPad.classList.toggle('is-closed', Boolean(activeShot.windowClosed));
  dom.shotPadState.textContent = activeShot.windowClosed ? 'Window closed' : 'Shot live';
  dom.shotPadLabel.textContent = activeShot.windowClosed ? 'Release to log a late rep' : 'Release now';
  dom.shotPadHint.textContent = activeShot.windowClosed
    ? 'The estimated practice window has passed. Release to log it, or press Esc to cancel.'
    : 'Click or press Space / Enter to log the release. Esc cancels without an attempt.';
  dom.shotPad.setAttribute('aria-label', `Release the ${MODE_LABELS[activeShot.mode].toLowerCase()} at the cue. Press Enter or Space to release.`);
}

function renderProfile() {
  const mode = modeForTab();
  const profile = activeShot ?? estimateProfile(settings, mode);
  dom.modeBadge.textContent = MODE_LABELS[profile.mode];
  const offsetText = profile.offsetMs ? ` · local offset ${signed(profile.offsetMs, 0)} ms` : '';
  dom.shotProfileText.textContent = `${MODE_LABELS[profile.mode]} · estimated release ~${profile.targetMs} ms · ${profile.windowMs} ms local window · cue ~${profile.cueMs} ms${offsetText}`;
  dom.windowChip.textContent = settings.meter === 'Off' ? 'Meter hidden' : `${profile.windowMs} ms window`;
  const ftProfile = estimateProfile(settings, 'freeThrow');
  dom.ftProfile.textContent = `Free-throw estimate: ~${ftProfile.targetMs} ms target · ${ftProfile.windowMs} ms local window · ${settings.speed} speed. This is an estimated practice tempo, not game data.`;
}

/* ---------------------------------------------------------------------------
   Main renderers
   --------------------------------------------------------------------------- */

function renderStats(recommendation) {
  const stats = summarizeAttempts(attempts, { limit: 20 });
  dom.sessionCount.textContent = `${attempts.length} saved`;
  if (attempts.length) {
    const jump = attempts.filter((attempt) => attempt.mode !== 'freeThrow').length;
    const freeThrows = attempts.filter((attempt) => attempt.mode === 'freeThrow').length;
    dom.sessionLabel.textContent = `${stats.grade} · ${jump} jump/calibration · ${freeThrows} free-throw · last ${formatWhen(attempts[attempts.length - 1].at)}`;
  } else {
    dom.sessionLabel.textContent = 'No shots logged yet.';
  }
  dom.statClean.textContent = stats.count ? percent(stats.cleanRate) : '—';
  dom.statError.textContent = stats.count ? formatMs(stats.medianAbsErrorMs) : '—';
  if (!stats.count) {
    dom.statBias.textContent = '—';
  } else if (Math.abs(stats.meanErrorMs) < 7) {
    dom.statBias.textContent = 'Centered';
  } else {
    dom.statBias.textContent = `${stats.meanErrorMs > 0 ? 'Late' : 'Early'} ${Math.abs(stats.meanErrorMs).toFixed(0)} ms`;
  }
  dom.statStreak.textContent = stats.count ? String(stats.bestStreak) : '—';
  if (!recommendation) {
    dom.coachLine.textContent = 'Log a few reps to unlock a local practice focus.';
  } else if (!stats.count) {
    dom.coachLine.textContent = 'Start with a 10-shot baseline, then check calibration.';
  } else {
    dom.coachLine.textContent = `${recommendation.headline}. ${firstSentence(recommendation.body)}`;
  }
}

function renderRecent() {
  const stats = summarizeAttempts(attempts, { limit: 10 });
  const nodes = [];
  const blanks = Math.max(0, 10 - stats.recent.length);
  for (let index = 0; index < blanks; index += 1) {
    const item = document.createElement('li');
    item.dataset.tone = 'empty';
    item.setAttribute('aria-hidden', 'true');
    nodes.push(item);
  }
  for (const attempt of stats.recent) {
    const meta = RESULT_META[attempt.result];
    const item = document.createElement('li');
    item.dataset.tone = meta.tone;
    const label = `${meta.label}: ${Math.abs(attempt.errorMs).toFixed(1)} ms ${attempt.errorMs > 0 ? 'late' : attempt.errorMs < 0 ? 'early' : 'on target'}`;
    item.setAttribute('aria-label', label);
    item.title = `${label} · ${MODE_LABELS[attempt.mode]}`;
    const hidden = document.createElement('span');
    hidden.className = 'sr-only';
    hidden.textContent = label;
    item.append(hidden);
    nodes.push(item);
  }
  dom.recentShots.replaceChildren(...nodes);
}

function renderHistory() {
  if (!attempts.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'muted';
    cell.textContent = 'No reps yet. Start a jump shot above.';
    row.append(cell);
    dom.historyBody.replaceChildren(row);
    return;
  }
  const start = Math.max(0, attempts.length - 12);
  const rows = attempts.slice(start).map((attempt, index) => ({
    attempt,
    number: start + index + 1,
  })).reverse();
  const nodes = rows.map(({ attempt, number }) => {
    const row = document.createElement('tr');
    row.title = formatWhen(attempt.at);
    const rep = document.createElement('th');
    rep.scope = 'row';
    rep.textContent = `#${number}`;
    const mode = document.createElement('td');
    mode.textContent = attempt.drillIndex
      ? `${MODE_LABELS[attempt.mode]} ${attempt.drillIndex}/10`
      : MODE_LABELS[attempt.mode];
    const result = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = 'result-pill';
    pill.dataset.tone = RESULT_META[attempt.result].tone;
    pill.textContent = RESULT_META[attempt.result].label;
    result.append(pill);
    const release = document.createElement('td');
    release.textContent = formatMs(attempt.releaseMs, 1);
    const target = document.createElement('td');
    target.textContent = formatMs(attempt.targetMs);
    const error = document.createElement('td');
    error.textContent = `${signed(attempt.errorMs)} ms`;
    row.append(rep, mode, result, release, target, error);
    return row;
  });
  dom.historyBody.replaceChildren(...nodes);
}

function renderSessionStats() {
  if (!pageAttempts.length) {
    dom.sessionStatsLine.textContent = `No reps in this page session yet. ${attempts.length} saved local rep${attempts.length === 1 ? '' : 's'} available in this browser.`;
    return;
  }
  const stats = summarizeAttempts(pageAttempts, { limit: 100 });
  dom.sessionStatsLine.textContent = `This page session: ${stats.count} reps · ${stats.cleans} clean (${percent(stats.cleanRate)}) · median error ${formatMs(stats.medianAbsErrorMs)}. Saved history: ${attempts.length}.`;
}

function renderFreeThrows() {
  const profile = estimateProfile(settings, 'freeThrow');
  dom.ftProfile.textContent = `Free-throw estimate: ~${profile.targetMs} ms target · ${profile.windowMs} ms local window · ${settings.speed} speed. This is an estimated practice tempo, not game data.`;

  const run = freeThrowRun;
  const summary = run ? summarizeDrill(attempts, run.id, 10) : null;
  const count = summary ? summary.count : 0;
  const dots = [];
  for (let index = 0; index < 10; index += 1) {
    const dot = document.createElement('li');
    const dotState = summary?.dots[index]?.state ?? 'pending';
    let state = dotState;
    if (run?.active && index === count && count < 10) state = 'active';
    dot.dataset.state = state;
    dot.textContent = String(index + 1);
    let label = `Free-throw rep ${index + 1}: pending`;
    if (state === 'clean') label = `Free-throw rep ${index + 1}: clean release`;
    if (state === 'missed') label = `Free-throw rep ${index + 1}: ${RESULT_META[summary.dots[index].result].label}`;
    if (state === 'active') label = `Free-throw rep ${index + 1}: next rep`;
    dot.setAttribute('aria-label', label);
    dots.push(dot);
  }
  dom.ftDots.replaceChildren(...dots);

  if (!run) {
    dom.ftStatus.textContent = 'No free-throw set in progress.';
    dom.ftSummary.textContent = 'Ten reps per set. A green release counts as a clean practice rep. This is a local timing-drill score, not a simulated game result.';
  } else if (run.active) {
    dom.ftStatus.textContent = activeShot?.mode === 'freeThrow'
      ? `Set live · ${count} of 10 logged · release at the cue.`
      : `Set live · ${count} of 10 logged · next rep ready.`;
    dom.ftSummary.textContent = `${count}/10 logged. Green releases count as clean practice reps; other outcomes stay in the local log.`;
  } else {
    const cleans = summary?.cleans ?? 0;
    dom.ftStatus.textContent = `Set complete · ${cleans} of 10 clean releases.`;
    dom.ftSummary.textContent = `Clean-release score: ${cleans}/10. This is a timing-drill score, not a simulated game result.`;
  }

  if (!run) dom.ftStartBtn.textContent = 'Start 10 free throws';
  else if (run.active) dom.ftStartBtn.textContent = 'Continue free-throw set';
  else dom.ftStartBtn.textContent = 'Start another 10 free throws';

  const groups = new Map();
  for (const attempt of attempts) {
    if (attempt.mode !== 'freeThrow' || !attempt.drillId) continue;
    const group = groups.get(attempt.drillId) ?? {
      id: attempt.drillId,
      count: 0,
      cleans: 0,
      lastAt: 0,
    };
    group.count += 1;
    if (attempt.clean) group.cleans += 1;
    group.lastAt = Math.max(group.lastAt, attempt.at);
    groups.set(attempt.drillId, group);
  }
  const previous = [...groups.values()]
    .filter((group) => !run || group.id !== run.id)
    .sort((left, right) => right.lastAt - left.lastAt)
    .slice(0, 4);
  if (!previous.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Completed sets will appear here.';
    dom.ftPastSets.replaceChildren(empty);
  } else {
    dom.ftPastSets.replaceChildren(...previous.map((group) => {
      const item = document.createElement('div');
      item.className = 'past-set';
      const strong = document.createElement('strong');
      strong.textContent = `${group.cleans}/10 clean`;
      const detail = document.createElement('span');
      detail.textContent = `${group.count >= 10 ? 'complete' : 'partial'} · ${group.count} logged · ${formatWhen(group.lastAt)}`;
      item.append(strong, detail);
      return item;
    }));
  }
}

function renderCalibration() {
  const calibration = computeCalibration(attempts, settings.offsetMs);
  dom.calibrationSamples.textContent = calibration.ready
    ? `${calibration.sampleSize} reps`
    : `${calibration.sampleSize} / ${calibration.minimumSamples}`;
  dom.calibrationBias.textContent = calibration.sampleSize ? `${signed(calibration.biasMs)} ms` : '—';
  dom.calibrationSpread.textContent = calibration.sampleSize ? `${calibration.spreadMs.toFixed(1)} ms` : '—';
  dom.calibrationConfidence.textContent = calibration.confidence === 'none'
    ? 'No data'
    : calibration.confidence;
  dom.calibrationSuggested.textContent = calibration.ready
    ? `${signed(calibration.suggestedOffsetMs, 0)} ms`
    : '— ms';
  dom.calibrationAdvice.textContent = calibration.advice;
  dom.applyCalibrationBtn.disabled = !calibration.canApply;
  dom.applyCalibrationBtn.title = calibration.confidence === 'low'
    ? 'Collect more stable reps before applying a suggested offset. Manual adjustment remains available.'
    : 'Apply the suggested local offset.';
  dom.calibrationOffset.value = String(settings.offsetMs);
  dom.calibrationOffsetOut.textContent = `${signed(settings.offsetMs, 0)} ms`;
  dom.calibrationOffset.setAttribute('aria-valuetext', `${signed(settings.offsetMs, 0)} milliseconds`);

  const samples = calibration.samples;
  if (!samples.length) {
    dom.calibrationPlot.replaceChildren();
    dom.calibrationPlot.setAttribute('aria-label', `No calibration samples at the current ${signed(settings.offsetMs, 0)} millisecond offset.`);
    return;
  }
  const dots = samples.map((sample, index) => {
    const dot = document.createElement('span');
    dot.className = 'plot-dot';
    dot.dataset.tone = RESULT_META[sample.result].tone;
    const x = clamp(50 + (sample.errorMs / 120) * 46, 4, 96);
    const y = 17 + ((index * 37) % 62);
    dot.style.setProperty('--x', `${x.toFixed(2)}%`);
    dot.style.setProperty('--y', `${y}%`);
    dot.title = `${signed(sample.errorMs)} ms · ${RESULT_META[sample.result].label}`;
    dot.setAttribute('aria-hidden', 'true');
    return dot;
  });
  dom.calibrationPlot.replaceChildren(...dots);
  dom.calibrationPlot.setAttribute(
    'aria-label',
    `${samples.length} recent release errors at the current offset. Median ${signed(calibration.biasMs)} milliseconds, ${calibration.direction}. Left is early, right is late.`,
  );
}

function renderRecommendations(recommendation) {
  dom.recHeadline.textContent = recommendation.headline;
  dom.recBody.textContent = recommendation.body;
  dom.recConfidence.textContent = `Confidence: ${recommendation.confidence}`;
  dom.recConfidence.dataset.confidence = recommendation.confidence;
  dom.recSampleNote.textContent = `${recommendation.sampleSize} local rep${recommendation.sampleSize === 1 ? '' : 's'} considered · ${recommendation.freeThrowStats.count} free-throw rep${recommendation.freeThrowStats.count === 1 ? '' : 's'} in the recent block. Practice suggestions only.`;

  const observations = recommendation.observations.length
    ? recommendation.observations
    : ['No strong timing pattern yet. A few more reps will make the local log more useful.'];
  dom.recObservations.replaceChildren(...observations.map((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));

  const keys = recommendation.changedKeys;
  if (!keys.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'The current setup is appropriate for this local sample. No changes suggested.';
    dom.recChanges.replaceChildren(empty);
  } else {
    dom.recChanges.replaceChildren(...keys.map((key) => {
      const chip = document.createElement('span');
      chip.className = 'change-chip';
      const label = document.createElement('strong');
      label.textContent = SETTING_LABELS[key] ?? key;
      chip.append(
        label,
        document.createTextNode(`: ${formatSettingValue(key, settings[key])} → ${formatSettingValue(key, recommendation.changes[key])}`),
      );
      return chip;
    }));
  }
  dom.applyRecBtn.disabled = keys.length === 0;

  dom.recDrills.replaceChildren(...recommendation.drills.map((drill) => {
    const card = document.createElement('article');
    card.className = 'drill-card';
    const title = document.createElement('h4');
    title.textContent = drill.title;
    const detail = document.createElement('p');
    detail.textContent = drill.detail;
    const button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.textContent = drill.mode === 'freeThrow' ? 'Start free throws' : drill.mode === 'calibration' ? 'Start calibration' : 'Start drill';
    button.addEventListener('click', () => startDrill(drill.mode));
    card.append(title, detail, button);
    return card;
  }));
}

function renderShare() {
  dom.shareOutput.value = buildShareQuery(settings, '/?tab=jumpshots');
}

function renderAll() {
  const recommendation = buildRecommendations(settings, attempts);
  lastRecommendation = recommendation;
  syncSettingsForm();
  const effectiveMeterSide = settings.meter === 'Off' ? 'Bottom' : settings.meterSide;
  dom.meterPanel.dataset.side = effectiveMeterSide;
  dom.shotStage.dataset.side = effectiveMeterSide;
  dom.meterPanel.classList.toggle('is-meter-off', settings.meter === 'Off');
  renderProfile();
  renderStats(recommendation);
  renderRecent();
  renderHistory();
  renderSessionStats();
  renderFreeThrows();
  renderCalibration();
  renderRecommendations(recommendation);
  renderShare();
  syncShotControls();
  if (!activeShot) renderIdleMeter();
}

/* ---------------------------------------------------------------------------
   Shot lifecycle
   --------------------------------------------------------------------------- */

function cancelAutoTimer() {
  if (!autoTimer) return;
  window.clearTimeout(autoTimer);
  autoTimer = 0;
}

function scheduleNextAuto(mode) {
  cancelAutoTimer();
  if (!settings.autoAdvance) return;
  if (mode === 'freeThrow') {
    const summary = freeThrowRun ? summarizeDrill(attempts, freeThrowRun.id, 10) : null;
    if (!summary || summary.complete || !freeThrowRun.active) return;
  }
  autoTimer = window.setTimeout(() => {
    autoTimer = 0;
    if (!activeShot) startShot(mode);
  }, 1400);
}

function ensureFreeThrowRun() {
  if (freeThrowRun?.active) {
    const summary = summarizeDrill(attempts, freeThrowRun.id, 10);
    if (summary.count < 10) return freeThrowRun;
    freeThrowRun = { ...freeThrowRun, active: false };
  }
  freeThrowRun = {
    id: createId('ft'),
    active: true,
    startedAt: Date.now(),
  };
  return freeThrowRun;
}

function startShot(mode = modeForTab(), { scroll = false } = {}) {
  if (activeShot) return;
  cancelAutoTimer();
  /*
   * Panel buttons can sit well below the cockpit. Jump to the pad before the
   * clock starts so the player never loses the first part of a rep to a
   * smooth-scroll animation.
   */
  if (scroll) {
    try {
      dom.shotPad.scrollIntoView({ block: 'center', behavior: 'auto' });
    } catch {
      dom.shotPad.scrollIntoView();
    }
  }
  if (mode === 'freeThrow') ensureFreeThrowRun();
  const shot = createShot(settings, mode, Math.random);
  shot.startedAtEpoch = Date.now();
  shot.cueFired = false;
  shot.windowClosed = false;
  shot.settingsSnapshot = normalizeSettings(settings);
  activeShot = shot;
  dom.courtScene.classList.remove('is-live', 'is-cue', 'is-released', 'is-green', 'is-warm', 'is-miss');
  dom.courtScene.classList.add('is-live');
  setMeterGeometry(shot);
  setMeterProgress(0);
  dom.meterReadout.textContent = settings.meter === 'Off'
    ? 'Shot armed. Release on the cue flash or audio cue.'
    : 'Shot armed. Release when the marker reaches the green band.';
  renderAll();
  setNeutralFeedback(settings.meter === 'Off'
    ? 'Shot armed. Release on the cue flash or the audio cue.'
    : 'Shot armed. Release when the marker reaches the green band.');
  dom.shotPad.focus({ preventScroll: true });
  /*
   * The display and focus work above happens before the clock starts, so the
   * audio cue, the visual marker and the eventual release share one start time.
   */
  activeShot.startedAt = performance.now();
  scheduleCue(activeShot);
  shotFrame = window.requestAnimationFrame(tickShot);
}

function releaseShot() {
  if (!activeShot) return;
  const shot = activeShot;
  const releaseMs = performance.now() - shot.startedAt;
  activeShot = null;
  window.cancelAnimationFrame(shotFrame);
  shotFrame = 0;
  stopScheduledCue();
  window.clearTimeout(cuePulseTimer);
  dom.courtScene.classList.remove('is-cue');

  const evaluation = evaluateRelease(shot, releaseMs);
  let drillId = null;
  let drillIndex = null;
  let completedSummary = null;
  if (shot.mode === 'freeThrow') {
    const run = ensureFreeThrowRun();
    const count = attemptsForDrill(attempts, run.id).length;
    drillId = run.id;
    drillIndex = Math.min(10, count + 1);
  }
  const attempt = makeAttempt({
    shot,
    releaseMs,
    mode: shot.mode,
    settings: shot.settingsSnapshot ?? settings,
    id: createId('rep'),
    at: Date.now(),
    drillId,
    drillIndex,
  });
  attempts = recordAttempt(attempts, attempt);
  pageAttempts.push(attempt);

  if (shot.mode === 'freeThrow' && freeThrowRun) {
    const summary = summarizeDrill(attempts, freeThrowRun.id, 10);
    if (summary.complete) {
      completedSummary = summary;
      freeThrowRun = { ...freeThrowRun, active: false, completedAt: Date.now() };
    }
  }

  dom.courtScene.classList.remove('is-live', 'is-green', 'is-warm', 'is-miss');
  dom.courtScene.classList.add('is-released', `is-${evaluation.tone}`);

  markPersistenceWritable();
  renderAll();
  /*
   * Freeze the completed meter instead of immediately resetting it to the
   * next idle preview. The next startShot() replaces it.
   */
  setMeterGeometry(shot);
  setMeterProgress(releaseMs / shot.maxMs);
  const shotMeter = shot.settingsSnapshot?.meter ?? settings.meter;
  dom.windowChip.textContent = shotMeter === 'Off' ? 'Meter hidden' : `${shot.windowMs} ms window`;
  dom.meterReadout.textContent = `Released at ${Math.round(releaseMs)} ms · estimated target ${shot.targetMs} ms · ${signed(evaluation.errorMs)} ms.`;
  setFeedback(evaluation, shot, releaseMs, { drillIndex, completed: completedSummary });
  persistNow();
  playResultTone(evaluation.tone);
  scheduleNextAuto(shot.mode);
}

function cancelShot() {
  if (!activeShot) return;
  activeShot = null;
  window.cancelAnimationFrame(shotFrame);
  shotFrame = 0;
  stopScheduledCue();
  window.clearTimeout(cuePulseTimer);
  dom.courtScene.classList.remove('is-live', 'is-cue', 'is-green', 'is-warm', 'is-miss');
  dom.courtScene.classList.remove('is-released');
  renderAll();
  setNeutralFeedback('Shot cancelled. No attempt was logged.');
}

function startJumpShot({ scroll = true } = {}) {
  if (activeShot) cancelShot();
  setTab('shooting', { announceTab: false });
  startShot('jump', { scroll });
}

function startFreeThrowSet({ scroll = true } = {}) {
  if (activeShot) cancelShot();
  ensureFreeThrowRun();
  setTab('free-throws', { announceTab: false });
  startShot('freeThrow', { scroll });
}

function startCalibrationShot({ scroll = true } = {}) {
  if (activeShot) cancelShot();
  setTab('calibration', { announceTab: false });
  startShot('calibration', { scroll });
}

function startDrill(mode) {
  if (mode === 'freeThrow') startFreeThrowSet();
  else if (mode === 'calibration') startCalibrationShot();
  else startJumpShot();
}

/* ---------------------------------------------------------------------------
   Data actions
   --------------------------------------------------------------------------- */

async function copyShareLink() {
  let url;
  try {
    url = new URL(dom.shareOutput.value, window.location.href).href;
  } catch {
    announce('The Jumpshot Lab link could not be prepared.');
    return;
  }
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(url);
    flashButton(dom.copyShareBtn, 'Copied');
    announce('Jumpshot Lab link copied to the clipboard.');
  } catch {
    dom.shareOutput.focus();
    dom.shareOutput.select();
    try {
      document.execCommand('copy');
      flashButton(dom.copyShareBtn, 'Copied');
      announce('Jumpshot Lab link selected and copied.');
    } catch {
      announce('Clipboard access is unavailable. The link is selected for manual copying.');
    }
  }
}

function exportPracticeData() {
  const text = serializeState({ settings, attempts, ui: { tab: activeTab } });
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `free-builder-jumpshot-practice-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  flashButton(dom.exportBtn, 'Exported');
  announce(`Exported ${attempts.length} local reps and the current setup.`);
}

async function importPracticeData(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const imported = parseStateJson(text);
    if (attempts.length && !window.confirm(`Replace ${attempts.length} saved reps and the current setup with ${imported.attempts.length} reps from this backup?`)) {
      return;
    }
    cancelShot();
    settings = normalizeSettings(imported.settings);
    attempts = normalizeAttempts(imported.attempts);
    activeTab = normalizeTab(imported.ui.tab);
    freeThrowRun = null;
    pageAttempts.length = 0;
    markPersistenceWritable();
    syncSettingsForm();
    setTab(activeTab, { announceTab: false, updateUrl: true, persist: false });
    renderAll();
    persistNow();
    setNeutralFeedback(`Imported ${attempts.length} rep${attempts.length === 1 ? '' : 's'} from a local backup.`);
    dom.storageError.textContent = '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The backup could not be imported.';
    dom.storageError.textContent = message;
  } finally {
    dom.importInput.value = '';
  }
}

function clearAllData() {
  if (!window.confirm('Clear the saved setup, calibration offset and every local rep from this browser? Export a backup first if you need it.')) {
    return;
  }
  cancelShot();
  cancelAutoTimer();
  window.clearTimeout(persistTimer);
  persistTimer = 0;
  clearStoredState(storage);
  persistPaused = true;
  settings = normalizeSettings(DEFAULT_SETTINGS);
  attempts = [];
  freeThrowRun = null;
  pageAttempts.length = 0;
  activeTab = 'shooting';
  syncSettingsForm();
  setTab('shooting', { announceTab: false, updateUrl: true, persist: false });
  renderAll();
  setNeutralFeedback('All local data was cleared. No attempt was logged.');
  setStorageMessage('All local data cleared from this browser.', '');
  dom.shotPad.focus({ preventScroll: true });
}

function restoreDefaults() {
  settings = normalizeSettings(DEFAULT_SETTINGS);
  markPersistenceWritable();
  syncSettingsForm();
  renderAll();
  persistNow();
  setNeutralFeedback('Default setup restored. Your saved practice log was kept.');
}

/* ---------------------------------------------------------------------------
   Event wiring and boot
   --------------------------------------------------------------------------- */

function wireEvents() {
  dom.shotPad.addEventListener('click', () => {
    if (activeShot) releaseShot();
    else startShot(modeForTab());
  });
  /*
   * Buttons synthesise a click from Space/Enter. Handle the shot pad's
   * keyboard path explicitly and cancel the native click so holding or
   * pressing Space twice cannot be mistaken for an automatic early release.
   */
  dom.shotPad.addEventListener('keydown', (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (event.repeat) return;
    if (activeShot) releaseShot();
    else startShot(modeForTab());
  });
  dom.shotPad.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.key === 'Enter') event.preventDefault();
  });
  dom.startJumpBtn.addEventListener('click', () => startJumpShot());
  dom.startJumpShotBtn.addEventListener('click', () => startJumpShot());
  dom.cancelShotBtn.addEventListener('click', () => cancelShot());
  dom.openPlanBtn.addEventListener('click', () => setTab('recommendations'));
  dom.openCalibrationBtn.addEventListener('click', () => setTab('calibration'));

  dom.autoAdvanceToggle.addEventListener('change', () => {
    if (!dom.autoAdvanceToggle.checked) cancelAutoTimer();
    commitSettings({ autoAdvance: dom.autoAdvanceToggle.checked });
  });

  dom.trainerTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[role="tab"]');
    if (!button) return;
    const entry = TAB_UI.find((item) => item.button === button);
    if (entry) setTab(entry.tab);
  });
  dom.trainerTabs.addEventListener('keydown', handleTabKeys);

  dom.settingsForm.addEventListener('submit', (event) => event.preventDefault());
  dom.settingsForm.addEventListener('change', handleSettingInput);
  dom.settingsForm.addEventListener('input', (event) => {
    if (event.target.matches('input[type="range"]')) handleSettingInput(event);
  });

  dom.ftStartBtn.addEventListener('click', () => startFreeThrowSet());
  dom.calibrationStartBtn.addEventListener('click', () => startCalibrationShot());
  dom.calibrationOffset.addEventListener('input', () => {
    const value = clamp(Math.round(Number(dom.calibrationOffset.value) || 0), -120, 120);
    commitSettings({ offsetMs: value });
  });
  dom.applyCalibrationBtn.addEventListener('click', () => {
    const calibration = computeCalibration(attempts, settings.offsetMs);
    if (!calibration.canApply) return;
    commitSettings(
      { offsetMs: calibration.suggestedOffsetMs },
      { persist: 'now' },
    );
    setNeutralFeedback(`Calibration offset applied: ${signed(calibration.suggestedOffsetMs, 0)} ms. Log new reps at this offset to refresh the sample.`);
  });
  dom.resetCalibrationBtn.addEventListener('click', () => {
    if (settings.offsetMs === 0) return;
    commitSettings({ offsetMs: 0 }, { persist: 'now' });
    setNeutralFeedback('Calibration offset reset. New reps use the unadjusted local target.');
  });

  dom.applyRecBtn.addEventListener('click', () => {
    if (!lastRecommendation?.changedKeys.length) return;
    const changes = { ...lastRecommendation.changes };
    commitSettings(
      changes,
      { persist: 'now' },
    );
    setNeutralFeedback(`Suggested setup applied: ${Object.keys(changes).map((key) => SETTING_LABELS[key] ?? key).join(', ')}. The recommendation will refresh as you log more reps.`);
  });

  dom.copyShareBtn.addEventListener('click', copyShareLink);
  dom.exportBtn.addEventListener('click', exportPracticeData);
  dom.importInput.addEventListener('change', () => importPracticeData(dom.importInput.files?.[0]));
  dom.restoreDefaultsBtn.addEventListener('click', restoreDefaults);
  dom.clearDataBtn.addEventListener('click', clearAllData);

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const target = event.target;
    const editable = target instanceof HTMLElement
      && Boolean(target.closest('input, select, textarea, [contenteditable="true"]'));
    const interactive = target instanceof HTMLElement
      && Boolean(target.closest('button, a, input, select, textarea, summary, [contenteditable="true"]'));
    if (event.key === 'Escape') {
      if (!editable && activeShot) {
        event.preventDefault();
        cancelShot();
      }
      return;
    }
    if (event.key === ' ' || event.code === 'Space') {
      if (interactive) return;
      if (activeShot) {
        event.preventDefault();
        releaseShot();
        return;
      }
      /*
       * Do not steal Space for shot timing when the timing bay is off-screen;
       * off-screen Space should keep its normal page-scroll behaviour.
       */
      const padRect = dom.shotPad.getBoundingClientRect();
      const padInView = padRect.top < window.innerHeight && padRect.bottom > 0;
      if (!padInView) return;
      event.preventDefault();
      startShot(modeForTab());
      return;
    }
    if (event.key.toLowerCase() === 's' && !editable) {
      event.preventDefault();
      if (!activeShot) startShot(modeForTab(), { scroll: true });
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    cancelAutoTimer();
    if (activeShot) {
      cancelShot();
      setNeutralFeedback('Shot cancelled because the tab was hidden. No attempt was logged.');
    }
  });

  window.addEventListener('pagehide', () => {
    if (!persistPaused) {
      saveStoredState(storage, { settings, attempts, ui: { tab: activeTab } });
    }
  });
}

function boot() {
  buildSettingsForm();
  renderTabs();
  setTab(activeTab, {
    announceTab: false,
    cancelAuto: false,
    persist: false,
    updateUrl: false,
  });
  wireEvents();
  renderAll();
  initialStorageMessage();
  loadAnimations();
}

boot();
