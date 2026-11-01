import { h as saveJSON, l as keys, p as loadJSON, r as element } from './shell-DuKJJrzf.js';
import { n as loadKernel } from './kernel-BWpHXNaH.js';

const J_IDS = 'jType.jStyle.jVar.jBase.jR1.jR2.jSpeed.jInput.jCue.jDiff.jSpot.jFt.jLock.jBlend.jFtRating.jMeterOn.jMeterIn.jDir.jHand.jSprint.jHanded.jStick.jLag.jJit.jHost.jSrc.jCtl'.split('.');
const METER_STATES = ['Frozen', 'Cold', 'Neutral', 'Warm', 'Hot', 'Takeover'];
const SA = { cal: ['Calibrated', 85], sa: ['Shot Artist', 89] };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function loadShape(raw) {
  const value = raw ?? {};
  const values = {};
  for (const id of J_IDS) if (typeof value[id] === 'string') values[id] = value[id];
  let pend = clamp(Number(value.jCueBar ?? value.jCueSnap ?? 0) || 0, 0, 3);
  const migrated = value.jCueBar !== undefined || value.jCueSnap !== undefined;
  if (typeof value.jCue === 'number') pend = clamp(value.jCue, 0, 3);
  return { values, pend, migrated };
}

function saveShape(values, pend) {
  return { v: 2, values, pend };
}

function shotBand(values, cue) {
  const base = +!!values.jBase;
  const cueBonus = +!!values.jCue;
  const speed = values.jSpeed === 'Quick' || values.jSpeed === 'Very Quick' ? 2 : 0;
  return clamp(1 + base + cueBonus + speed - +((Number(cue) || 0) > 2), 0, METER_STATES.length - 1);
}

/** Shot composer and share panel. The timing practice lives in /jumpshot-trainer/. */
const JumpshotsView = {
  async render({ root }) {
    const kernel = await loadKernel();
    const animations = kernel.env.animations;
    const bases = animations.filter(row => row[1] === 'Jumper Base');
    const releases = animations.filter(row => /Release/i.test(row[1]));
    const names = list => list.slice(0, 200).map(row => row[0]);
    const saved = loadShape(loadJSON(keys.jumper, {}));
    const values = saved.values;

    const fields = [
      ['jType', 'Shot type', ['Jump Shot', 'Set Shot', 'Fade', 'Hop', 'Pull-Up']],
      ['jBase', 'Base', names(bases)],
      ['jR1', 'Release 1', names(releases.length ? releases : bases)],
      ['jR2', 'Release 2', ['None', ...names(releases.length ? releases : bases).slice(0, 40)]],
      ['jSpeed', 'Speed', ['Very Slow', 'Slow', 'Normal', 'Quick', 'Very Quick']],
      ['jInput', 'Input', ['Shot', 'Stick']],
      ['jCue', 'Visual cue', ['Release', 'Push', 'Set Point', 'Jump', 'Late']],
      ['jDiff', 'Difficulty', ['Easy', 'Normal', 'Hard']],
      ['jSpot', 'Context', ['Standing', 'Moving', 'Off-Screen', 'Post']],
      ['jHand', 'Hand', ['Right', 'Left']],
      ['jSprint', 'Sprint', ['Off', 'On']],
      ['jMeterOn', 'Shot meter', ['On', 'Off']],
      ['jMeterIn', 'Meter side', ['Top', 'Bottom', 'Side']],
    ];

    const shotFieldset = element('div', { class: 'fieldset jumpshot' });
    for (const [id, label, options] of fields) {
      const select = element('select', { class: 'sel', id }, [
        element('option', { value: '', text: '—' }),
        ...options.map(value => element('option', { value, text: value })),
      ]);
      if (values[id]) select.value = values[id];
      select.addEventListener('change', () => {
        values[id] = select.value;
        saveShot();
      });
      shotFieldset.append(element('label', { class: 'lbl', for: id }, [label, select]));
    }

    const cueBar = element('input', { class: 'inp', type: 'number', min: 0, max: 3, value: saved.pend, 'data-field': 'jCueBar' });
    cueBar.addEventListener('change', saveShot);
    const meterBand = element('p', { class: 'meter', 'data-state': 'Neutral' });
    const share = element('input', { class: 'inp code', readonly: true, 'aria-labelledby': 'jumpshotShareHeading' });

    function shotQuery() {
      const query = Object.entries(values)
        .filter(([, value]) => value)
        .map(([id, value]) => `${id}=${encodeURIComponent(value)}`)
        .join('&');
      return `/?tab=jumpshots${query ? `&${query}` : ''}`;
    }

    function updateShare() {
      share.value = shotQuery();
    }

    function updateMeterBand() {
      const state = shotBand(values, cueBar.value);
      meterBand.textContent = `Meter band: ${METER_STATES[state]} · cue bar band ${cueBar.value} · ${SA.cal[0]} at ${SA.cal[1]}, ${SA.sa[0]} at ${SA.sa[1]}`;
      meterBand.dataset.state = METER_STATES[state];
    }

    function saveShot() {
      saveJSON(keys.jumper, saveShape(values, Number(cueBar.value) || 0));
      updateMeterBand();
      updateShare();
    }

    for (const id of J_IDS) if (!(id in values)) values[id] = '';
    updateShare();
    const restored = Object.values(values).filter(Boolean).length;

    root.replaceChildren(
      element('div', { class: 'panel' }, [
        element('h2', { text: 'Shot' }),
        element('p', { class: 'muted', text: `Base list from the animation table: ${bases.length} jumper bases. Saved on this device.` }),
        shotFieldset,
        element('label', { class: 'lbl' }, ['Cue bar band (0–3)', cueBar]),
        element('button', { class: 'btn primary', type: 'button', text: 'Save shot', onclick: saveShot }),
        meterBand,
      ]),
      element('div', { class: 'panel' }, [
        element('h3', { id: 'jumpshotShareHeading', text: 'Share' }),
        share,
        element('button', { class: 'btn', type: 'button', text: 'Copy link', onclick: async () => navigator.clipboard.writeText(location.origin + share.value) }),
        element('p', { class: 'muted', text: saved.migrated ? 'Migrated legacy cue fields into the cue bar.' : restored ? `Restored ${restored} shot field(s) from this device.` : 'No shot fields saved on this device yet.' }),
      ]),
      element('div', { class: 'panel practice-cta' }, [
        element('h2', { text: 'Practice Lab' }),
        element('p', { class: 'muted', text: 'Take the shot you just built into the full practice lab: timed jump shots, free-throw sets, calibration, session history and local suggestions. Every target and window there is an estimated practice value, not an NBA 2K measurement.' }),
        element('ul', { class: 'list' }, [
          element('li', { text: 'Jump-shot and free-throw drills with keyboard and pointer controls.' }),
          element('li', { text: 'A calibration pass that turns your own release pattern into a local offset.' }),
          element('li', { text: 'Session history, clean-rate and error trends, all stored in this browser.' }),
        ]),
        element('p', {}, [element('a', { class: 'btn primary', href: '/jumpshot-trainer/', text: 'Open the full Practice Lab' })]),
      ]),
      element('p', { class: 'muted', text: 'Shot settings are saved on this device only — cloud sync is not part of this rebuild.' }),
    );
    updateMeterBand();
  },
};

export { METER_STATES as GA, J_IDS as J_ID_IDS, JumpshotsView, SA, loadShape, saveShape };
