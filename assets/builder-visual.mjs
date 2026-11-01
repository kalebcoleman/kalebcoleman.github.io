/* Builder visual layer: layout, controls and dense attribute rows. No engine math. */
const GROUP_COLORS = {
  Finishing: '#d95f24',
  Shooting: '#1e88b5',
  Playmaking: '#7a5af8',
  Defense: '#2e8b57',
  Rebounding: '#b8860b',
  Physicals: '#c62828',
};
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
let draggingRange = false;
const FALLBACK_GROUPS = [
  ['Finishing', 0, 5], ['Shooting', 5, 8], ['Playmaking', 8, 11],
  ['Defense', 11, 15], ['Rebounding', 15, 17], ['Physicals', 17, 21],
];

function sideChild(side, element) {
  let current = element;
  while (current && current.parentElement !== side) current = current.parentElement;
  return current;
}

function outerPanel(element) {
  let current = element;
  while (current?.parentElement && !current.parentElement.matches('#view, .builder-side')) current = current.parentElement;
  return current;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function groups() {
  return window.GBLE?.GROUPS ?? FALLBACK_GROUPS;
}

function groupFor(index) {
  const list = groups();
  return list.find(([, start, end]) => index >= start && index < end) ?? list[list.length - 1];
}

function paintRange(input) {
  const index = Number(input.dataset.attr);
  const [name] = groupFor(index);
  const min = Number(input.min) || 25;
  const max = Number(input.max) || 99;
  const value = Number(input.value);
  const pct = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;
  input.style.setProperty('--fb-pct', `${pct}%`);
  input.style.setProperty('--fb-color', GROUP_COLORS[name] ?? GROUP_COLORS.Physicals);
}

function decorateRange(input) {
  if (input.dataset.fbRange) {
    paintRange(input);
    return;
  }
  const index = Number(input.dataset.attr);
  if (!Number.isFinite(index)) return;
  input.dataset.fbRange = '1';
  input.addEventListener('input', () => paintRange(input));
  input.addEventListener('change', () => paintRange(input));
  let startX = 0;
  let startY = 0;
  let startValue = 0;
  let previewValue = null;
  let custom = false;
  let horizontal = false;
  const touchLike = event => event.pointerType === 'touch' || event.pointerType === 'pen';
  const restorePreview = () => {
    input.value = String(startValue);
    const number = input.closest('.row')?.querySelector('input[data-num]');
    if (number) number.value = String(startValue);
    paintRange(input);
  };
  input.addEventListener('pointerdown', event => {
    input.__fbCancelStep?.();
    if (!touchLike(event)) return;
    custom = true;
    horizontal = false;
    startX = event.clientX;
    startY = event.clientY;
    startValue = Number(input.value);
    previewValue = startValue;
    input.__fbVerticalLock = true;
  });
  input.addEventListener('pointermove', event => {
    if (!custom) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) + 4) horizontal = true;
    if (horizontal) {
      const rect = input.getBoundingClientRect();
      const min = Number(input.min) || 25;
      const max = Number(input.max) || 99;
      const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      previewValue = Math.round(min + pct * (max - min));
      input.value = String(previewValue);
      const number = input.closest('.row')?.querySelector('input[data-num]');
      if (number) number.value = String(previewValue);
      paintRange(input);
    } else if (Math.abs(dy) > Math.abs(dx) + 4) {
      restorePreview();
    }
  });
  const finishPointer = () => {
    if (!custom) return;
    custom = false;
    if (horizontal) {
      const value = previewValue;
      if (typeof window.__fbSetAttr === 'function') window.__fbSetAttr(Number(input.dataset.attr), value);
      window.__fbCommit?.();
      window.__fbSnapshot?.();
    } else {
      restorePreview();
    }
    horizontal = false;
    window.setTimeout(() => { input.__fbVerticalLock = false; }, 120);
  };
  input.addEventListener('pointerup', finishPointer);
  input.addEventListener('pointercancel', finishPointer);
  paintRange(input);
}

function decorateGroups(rows) {
  if (rows.dataset.fbGroups) return;
  for (const [name, start] of [...groups()].reverse()) {
    const row = rows.querySelector(`[data-row="${start}"]`);
    if (!row) continue;
    const group = groups().find(([label]) => label === name);
    const header = node('div', 'fb-attr-group');
    header.style.setProperty('--group-color', GROUP_COLORS[name] ?? GROUP_COLORS.Physicals);
    header.append(node('i'), node('span', null, name), node('b', null, String(group ? group[2] - group[1] : 0)));
    rows.insertBefore(header, row);
  }
  rows.dataset.fbGroups = '1';
}

function ensureActions(side) {
  let panel = side.querySelector('.builder-actions');
  if (!panel) {
    panel = node('section', 'panel builder-actions');
    panel.append(node('h2', null, 'Build actions'));
    panel.append(node('div', 'fb-action-grid'));
    const importSection = side.querySelector('section[aria-label="Import from screenshot"]');
    const importPanel = sideChild(side, importSection) ?? side.querySelector(':scope > .panel');
    importPanel?.after(panel);
  }
  const grid = panel.querySelector('.fb-action-grid');
  const wanted = new Set([
    'Fill to 99', 'Reset', 'Clear breakers', 'Optimize this build',
    'Min-max this build', 'Find a better frame', 'Max badge tokens',
  ]);
  const shortLabel = {
    'Min-max this build': 'Min-max',
    'Find a better frame': 'Better frame',
    'Optimize this build': 'Optimize',
    'Max badge tokens': 'Max tokens',
  };
  for (const button of document.querySelectorAll('#view button')) {
    const label = button.textContent.trim();
    if (!wanted.has(label) || grid.contains(button)) continue;
    button.classList.add('fb-action');
    if (label === 'Fill to 99') button.classList.add('primary');
    else button.classList.remove('primary');
    if (shortLabel[label]) {
      button.setAttribute('aria-label', button.getAttribute('aria-label') || label);
      button.textContent = shortLabel[label];
    }
    grid.append(button);
  }
  for (const fieldset of document.querySelectorAll('#view .fieldset')) {
    if (fieldset.closest('.builder-actions')) continue;
    if (!fieldset.querySelector('button,input,select,textarea') && !fieldset.textContent.trim()) fieldset.remove();
  }
}

function ensureName(side) {
  const input = document.querySelector('#buildName');
  const keep = [...document.querySelectorAll('#view button')].find(button => button.textContent.trim() === 'Keep my build name');
  if (!input || !keep) return;
  let panel = side.querySelector('.builder-name');
  if (!panel) {
    panel = node('section', 'panel builder-name');
    panel.append(node('h2', null, 'Build name'));
    const before = sideChild(side, side.querySelector('.build-doctor, .builder-history, .builder-badges'));
    side.insertBefore(panel, before ?? null);
  }
  const label = input.closest('label.lbl') ?? input;
  if (!panel.contains(label)) panel.append(label);
  if (!panel.contains(keep)) panel.append(keep);
}

function ensurePosition() {
  const select = document.querySelector('#fPos');
  if (!select) return;
  const fieldset = select.closest('.fieldset');
  let segmented = fieldset?.querySelector('.fb-segmented');
  if (!segmented) {
    segmented = node('div', 'fb-segmented');
    segmented.setAttribute('role', 'group');
    segmented.setAttribute('aria-label', 'Position');
    POSITIONS.forEach((name, index) => {
      const button = node('button', 'fb-seg', name);
      button.type = 'button';
      button.dataset.pos = String(index);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        select.value = String(index);
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncPosition();
      });
      segmented.append(button);
    });
    const label = select.closest('label.lbl');
    (label ?? fieldset)?.after(segmented);
    select.classList.add('fb-native-hidden');
    select.setAttribute('tabindex', '-1');
    select.addEventListener('change', syncPosition);
  }
  syncPosition();
}

function syncPosition() {
  const select = document.querySelector('#fPos');
  const segmented = document.querySelector('#view .fb-segmented');
  if (!select || !segmented) return;
  for (const button of segmented.querySelectorAll('.fb-seg')) {
    const active = button.dataset.pos === select.value;
    if (button.classList.contains('on') !== active) button.classList.toggle('on', active);
    const pressed = String(active);
    if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
  }
}

function ensureBodyRange(control, key, read, write, labelText) {
  if (!control) return;
  const label = control.closest('label.lbl') ?? control.parentElement;
  if (!label) return;
  let wrap = label.querySelector(`.fb-body-slider[data-body="${key}"]`);
  if (!wrap) {
    wrap = node('div', 'fb-body-slider');
    wrap.dataset.body = key;
    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'fb-body-range';
    range.dataset.body = key;
    range.setAttribute('aria-label', labelText);
    const value = node('span', 'fb-body-value');
    wrap.append(range, value);
    label.append(wrap);
    let startX = 0;
    let startY = 0;
    let startValue = 0;
    let previewValue = null;
    let custom = false;
    let horizontal = false;
    const touchLike = event => event.pointerType === 'touch' || event.pointerType === 'pen';
    const restore = () => {
      range.value = String(startValue);
      syncBodyRange(control, key, read, write, labelText);
    };
    range.addEventListener('input', () => {
      if (range.__fbVerticalLock) return;
      write(control, range);
      syncBodyRange(control, key, read, write, labelText);
    });
    range.addEventListener('change', () => {
      if (range.__fbVerticalLock) {
        restore();
        return;
      }
      control.dispatchEvent(new Event('change', { bubbles: true }));
    });
    range.addEventListener('pointerdown', event => {
      if (!touchLike(event)) return;
      custom = true;
      horizontal = false;
      startX = event.clientX;
      startY = event.clientY;
      startValue = Number(range.value);
      previewValue = startValue;
      range.__fbVerticalLock = true;
    });
    range.addEventListener('pointermove', event => {
      if (!custom) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) + 4) horizontal = true;
      if (horizontal) {
        const rect = range.getBoundingClientRect();
        const min = Number(range.min) || 0;
        const max = Number(range.max) || 100;
        const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        previewValue = Math.round(min + pct * (max - min));
        range.value = String(previewValue);
        syncBodyRange(control, key, read, write, labelText);
      } else if (Math.abs(dy) > Math.abs(dx) + 4) {
        restore();
      }
    });
    const finish = () => {
      if (!custom) return;
      custom = false;
      if (horizontal) {
        write(control, range);
        control.dispatchEvent(new Event('change', { bubbles: true }));
        syncBodyRange(control, key, read, write, labelText);
        startValue = Number(range.value);
      } else {
        restore();
      }
      horizontal = false;
      window.setTimeout(() => { range.__fbVerticalLock = false; }, 120);
    };
    range.addEventListener('pointerup', finish);
    range.addEventListener('pointercancel', finish);
    control.addEventListener('change', () => syncBodyRange(control, key, read, write, labelText));
  }
  syncBodyRange(control, key, read, write, labelText);
}

function syncBodyRange(control, key, read, write, labelText) {
  const wrap = control.closest('label.lbl')?.querySelector(`.fb-body-slider[data-body="${key}"]`);
  if (!wrap) return;
  const range = wrap.querySelector('input');
  const value = wrap.querySelector('.fb-body-value');
  const state = read(control);
  if (!state) return;
  if (range.min !== String(state.min)) range.min = String(state.min);
  if (range.max !== String(state.max)) range.max = String(state.max);
  if (range.step !== String(state.step)) range.step = String(state.step);
  if (range.value !== String(state.value)) range.value = String(state.value);
  const pct = state.max > state.min ? ((state.value - state.min) / (state.max - state.min)) * 100 : 0;
  range.style.setProperty('--fb-pct', `${pct}%`);
  if (value.textContent !== state.text) value.textContent = state.text;
  if (range.getAttribute('aria-label') !== labelText) range.setAttribute('aria-label', labelText);
}

function ensureBodyRanges() {
  const height = document.querySelector('#fH');
  const weight = document.querySelector('#fW');
  const wingspan = document.querySelector('#fS');
  if (!height || !weight || !wingspan) return;

  ensureBodyRange(height, 'h', control => {
    const options = [...control.options];
    const index = Math.max(0, Math.min(options.length - 1, control.selectedIndex));
    return {
      min: 0,
      max: Math.max(0, options.length - 1),
      step: 1,
      value: index,
      text: options[index]?.textContent.split(' (')[0] ?? '—',
    };
  }, (control, range) => {
    const index = Number(range.value);
    if (control.selectedIndex !== index) control.selectedIndex = index;
  }, 'Height');

  ensureBodyRange(weight, 'w', control => {
    const min = Number(control.min) || 100;
    const max = Number(control.max) || 320;
    const value = Math.max(min, Math.min(max, Number(control.value) || min));
    return { min, max, step: 1, value, text: `${value} lb` };
  }, (control, range) => {
    if (control.value !== range.value) control.value = range.value;
  }, 'Weight');

  ensureBodyRange(wingspan, 's', control => {
    const min = Number(control.min) || 60;
    const max = Number(control.max) || 100;
    const value = Math.max(min, Math.min(max, Number(control.value) || min));
    return { min, max, step: 1, value, text: `${value}"` };
  }, (control, range) => {
    if (control.value !== range.value) control.value = range.value;
  }, 'Wingspan');

  for (const control of [height, weight, wingspan]) control.classList.add('fb-native-hidden');
}

function ensureGroupLegend() {
  const attributes = [...document.querySelectorAll('#view > .panel')].find(panel => panel.querySelector('h2')?.textContent.trim() === 'Attributes');
  if (!attributes) return;
  let legend = attributes.querySelector('.fb-group-legend');
  if (!legend) {
    legend = node('div', 'fb-group-legend');
    legend.setAttribute('aria-label', 'Attribute group colors');
    for (const [name] of groups()) {
      const item = node('span');
      const dot = node('i');
      dot.style.setProperty('--group-color', GROUP_COLORS[name] ?? GROUP_COLORS.Physicals);
      item.append(dot, document.createTextNode(name));
      legend.append(item);
    }
    const head = attributes.querySelector('.panel-head');
    (head ?? attributes.querySelector('h2'))?.after(legend);
  }
}

function ensureRowExtras() {
  for (const row of document.querySelectorAll('.rows .row[data-row]')) {
    const range = row.querySelector('input.rng[data-attr]');
    const number = row.querySelector('input[data-num]');
    if (!range || !number) continue;
    let wrap = range.closest('.fb-range');
    if (!wrap) {
      wrap = node('div', 'fb-range');
      range.before(wrap);
      wrap.append(range);
      wrap.append(node('div', 'fb-range-meta'));
    }
    const meta = wrap.querySelector('.fb-range-meta');
    const cap = Number(range.max) || 99;
    const text = `max ${cap}`;
    if (meta && meta.textContent !== text) meta.textContent = text;
    if (!row.querySelector('.fb-stepper')) {
      const stepper = node('div', 'fb-stepper');
      const minus = node('button', 'fb-step', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', `Lower ${row.querySelector('.row-label span')?.textContent ?? 'attribute'}`);
      const plus = node('button', 'fb-step', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', `Raise ${row.querySelector('.row-label span')?.textContent ?? 'attribute'}`);
      let pendingStep = null;
      let stepTimer = 0;
      let lastApplied = Number(range.value);
      const applyValue = value => {
        if (value == null) return false;
        if (typeof window.__fbSetAttr === 'function') {
          window.__fbSetAttr(Number(range.dataset.attr), value);
        } else {
          range.value = String(value);
          range.dispatchEvent(new Event('input', { bubbles: true }));
        }
        lastApplied = Number(range.value);
        window.clearTimeout(range.__fbCommit);
        range.__fbCommit = window.setTimeout(() => {
          if (typeof window.__fbCommit === 'function') window.__fbCommit();
          else range.dispatchEvent(new Event('change', { bubbles: true }));
        }, 250);
        return true;
      };
      const flushStep = () => {
        if (pendingStep == null) return false;
        window.clearTimeout(stepTimer);
        const value = pendingStep;
        pendingStep = null;
        return applyValue(value);
      };
      const step = delta => {
        const min = Number(range.min) || 25;
        const max = Number(range.max) || 99;
        const current = pendingStep ?? Number(range.value);
        const next = Math.max(min, Math.min(max, current + delta));
        if (next === current) return;
        if (pendingStep == null) lastApplied = Number(range.value);
        pendingStep = next;
        range.value = String(next);
        const number = row.querySelector('input[data-num]');
        if (number) number.value = String(next);
        window.clearTimeout(stepTimer);
        stepTimer = window.setTimeout(flushStep, 80);
      };
      range.__fbFlushStep = flushStep;
      range.__fbCancelStep = () => {
        if (pendingStep == null) return;
        window.clearTimeout(stepTimer);
        pendingStep = null;
        range.value = String(lastApplied);
        const number = row.querySelector('input[data-num]');
        if (number) number.value = String(lastApplied);
      };
      minus.addEventListener('click', () => step(-1));
      plus.addEventListener('click', () => step(1));
      stepper.append(minus, plus);
      row.append(stepper);
    }
  }
}

const mobileOrder = window.matchMedia('(max-width: 900px)');

function syncPanelOrder() {
  const view = document.getElementById('view');
  const side = view?.querySelector('.builder-side');
  const finder = view?.querySelector('#find');
  if (!view || !side || !finder) return;
  const doctor = outerPanel(side.querySelector('.build-doctor') ?? view.querySelector('.build-doctor'));
  const history = outerPanel(side.querySelector('.builder-history') ?? view.querySelector('.builder-history'));
  const badges = outerPanel(side.querySelector('.builder-badges') ?? view.querySelector('.builder-badges'));
  if (!doctor || !history || !badges) return;
  if (mobileOrder.matches) {
    if (finder.nextElementSibling === doctor && doctor.nextElementSibling === history && history.nextElementSibling === badges) return;
    finder.after(doctor, history, badges);
  } else {
    if (side.lastElementChild === badges && badges.previousElementSibling === history && history.previousElementSibling === doctor) return;
    side.append(doctor, history, badges);
  }
}

function decorate() {
  if (draggingRange) return;
  const view = document.getElementById('view');
  if (!view) return;
  const side = view.querySelector('.builder-side');
  if (side) {
    ensureActions(side);
    ensureName(side);
  }
  syncPanelOrder();
  ensurePosition();
  ensureBodyRanges();
  ensureGroupLegend();
  const rows = view.querySelector('[data-row="0"]')?.closest('.rows');
  if (rows) {
    rows.classList.add('fb-dense');
    decorateGroups(rows);
  }
  for (const input of view.querySelectorAll('input.rng[data-attr]')) decorateRange(input);
  ensureRowExtras();
}

const view = document.getElementById('view');
if (view) {
  let scheduled = false;
  const run = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate();
    });
  };
  mobileOrder.addEventListener?.('change', () => {
    syncPanelOrder();
    run();
  });
  const flushPendingSteps = () => {
    let changed = false;
    for (const range of document.querySelectorAll('input.rng[data-attr]')) {
      if (typeof range.__fbFlushStep === 'function' && range.__fbFlushStep()) changed = true;
    }
    if (typeof window.__fbCommit === 'function') window.__fbCommit();
    window.__fbSnapshot?.();
  };
  document.addEventListener('click', event => {
    if (event.target?.closest?.('.fb-step, input.rng, input.fb-body-range')) return;
    flushPendingSteps();
  }, true);
  const markDrag = event => {
    const target = event.target;
    if (!target?.closest?.('input.rng, input.fb-body-range')) return;
    draggingRange = true;
    document.documentElement.dataset.fbDragging = '1';
  };
  const releaseDrag = () => {
    if (!draggingRange) return;
    draggingRange = false;
    delete document.documentElement.dataset.fbDragging;
    run();
  };
  document.addEventListener('pointerdown', markDrag, true);
  document.addEventListener('touchstart', markDrag, { capture: true, passive: true });
  document.addEventListener('pointerup', releaseDrag, true);
  document.addEventListener('pointercancel', releaseDrag, true);
  document.addEventListener('touchend', releaseDrag, true);
  document.addEventListener('touchcancel', releaseDrag, true);
  run();
  new MutationObserver(run).observe(view, { childList: true, subtree: true });
}
