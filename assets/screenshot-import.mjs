const LAYOUT_NAMES = { A: '2K HQ app', B: 'Bar screen', C: 'Attribute Editor' };

const text = (tag, value, className) => {
  const element = document.createElement(tag);
  if (value != null) element.textContent = value;
  if (className) element.className = className;
  return element;
};

const numberInput = (value, min, max, label) => {
  const input = document.createElement('input');
  input.className = 'inp num';
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.setAttribute('aria-label', label);
  return input;
};

function layoutName(raw) {
  const code = raw?._layout ?? raw?.layout;
  return LAYOUT_NAMES[code] ?? (code ? `Layout ${code}` : 'Unknown layout');
}

function currentBody(build) {
  return { p: build.p, h: build.h, w: build.w, s: build.s };
}

function setPositionHint(position) {
  let hint = document.getElementById('pos');
  if (!hint) {
    hint = document.createElement('i');
    hint.id = 'pos';
    hint.hidden = true;
    document.body.append(hint);
  }
  hint.value = String(position ?? 0);
}

export function normalizeScreenshot(raw, checked, current) {
  const attrs = window.GBLE?.ATTRS ?? [];
  const missing = new Set(checked?.missing ?? []);
  const bad = new Set((checked?.bad ?? []).map(item => attrs.find(name => String(item).startsWith(name)) ?? String(item).split(' ')[0]));
  const values = attrs.map((name, index) => {
    if (missing.has(name)) return current.alloc?.[index] ?? 25;
    const fromChecked = checked?.vals?.[index];
    if (Number.isFinite(fromChecked) && fromChecked >= 25) return fromChecked;
    const fromRaw = Number(raw?.attrs?.[name]);
    if (Number.isFinite(fromRaw) && fromRaw >= 25) return fromRaw;
    return current.alloc?.[index] ?? 25;
  });
  const positions = window.GBLE?.POSN ?? [];
  const rawPosition = typeof raw?.pos === 'number' ? raw.pos : positions.indexOf(String(raw?.pos ?? '').toUpperCase());
  const body = checked?.body ?? (raw?.height && raw?.weight && raw?.wingspan ? {
    p: rawPosition >= 0 ? rawPosition : 0,
    h: Number(raw.height),
    w: Number(raw.weight),
    ws: Number(raw.wingspan),
  } : null);
  return {
    layout: layoutName(raw),
    body: body && Number.isFinite(body.h) ? body : null,
    values,
    missing: [...missing],
    bad: [...bad],
    over: checked?.over ?? raw?.over ?? null,
    fits: checked?.fits,
    got: checked?.got ?? 0,
  };
}

export function buildCandidate(body, values) {
  return {
    p: Number(body.p),
    h: Number(body.h),
    w: Number(body.w),
    s: Number(body.s ?? body.ws),
    alloc: values.map(value => Number(value)),
  };
}

export function createScreenshotImport(root, { getCurrentBuild, applyBuild, loadCode }) {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.setAttribute('aria-label', 'Import from screenshot');
  const heading = text('h3', 'Import from screenshot');
  const description = text('p', 'Read a 2K HQ app, bar-screen or Attribute Editor screenshot. The image is processed on this device and is never uploaded.', 'muted');
  const privacy = text('p', 'Screenshots stay on this device. Nothing is sent to a server.', 'muted');
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'image/png,image/jpeg,image/webp';
  file.hidden = true;
  file.id = `screenshot-import-${Math.random().toString(36).slice(2)}`;
  const choose = document.createElement('label');
  choose.className = 'btn';
  choose.htmlFor = file.id;
  choose.textContent = 'Choose screenshot';
  const drop = text('div', 'Or drop a PNG or JPEG here.', 'muted');
  drop.tabIndex = 0;
  const status = text('p', 'No screenshot read yet.', 'muted');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const review = document.createElement('div');
  review.hidden = true;
  const row = document.createElement('div');
  row.className = 'fieldset';
  row.append(choose, file);
  panel.append(heading, description, privacy, row, drop, status, review);
  root.append(panel);

  let templates = null;
  let pendingCard = null;
  let lastReview = null;
  let busy = false;

  function setStatus(message, warning = false) {
    status.className = warning ? 'warn' : 'muted';
    status.textContent = message;
  }

  function setBusy(value) {
    busy = value;
    for (const button of panel.querySelectorAll('button')) button.disabled = value;
  }

  function clearReview() {
    review.hidden = true;
    review.replaceChildren();
    lastReview = null;
    pendingCard = null;
  }

  function renderReview(raw, checked) {
    const current = getCurrentBuild();
    const data = normalizeScreenshot(raw, checked, current);
    lastReview = data;
    review.hidden = false;
    review.replaceChildren();
    const summary = text('p', `${data.layout} · ${data.got}/21 attribute${data.got === 1 ? '' : 's'} read`, 'muted');
    const bodyLine = text('p', data.body ? `Body: ${(window.GBLE?.POSN ?? [])[data.body.p] ?? '—'} · ${data.body.h}" · ${data.body.w} lb · ${data.body.ws}" wingspan` : 'Body was not read; the current body will be used unless you change it.', data.body ? 'muted' : 'warn');
    const bodyRow = document.createElement('div');
    bodyRow.className = 'fieldset';
    const positions = window.GBLE?.POSN ?? ['PG', 'SG', 'SF', 'PF', 'C'];
    const position = document.createElement('select');
    position.className = 'sel';
    position.setAttribute('aria-label', 'Imported position');
    positions.forEach((name, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = name;
      option.selected = index === (data.body?.p ?? current.p);
      position.append(option);
    });
    const height = numberInput(data.body?.h ?? current.h, 69, 88, 'Imported height in inches');
    const weight = numberInput(data.body?.w ?? current.w, 100, 320, 'Imported weight in pounds');
    const wingspan = numberInput(data.body?.ws ?? current.s, 60, 100, 'Imported wingspan in inches');
    for (const [label, control] of [['Position', position], ['Height', height], ['Weight', weight], ['Wingspan', wingspan]]) {
      const wrapper = document.createElement('label');
      wrapper.className = 'lbl';
      wrapper.append(label, control);
      bodyRow.append(wrapper);
    }
    const attrs = document.createElement('div');
    attrs.className = 'rows';
    const values = [...data.values];
    attrs.append(...(window.GBLE?.ATTRS ?? []).map((name, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'row';
      const label = document.createElement('label');
      label.className = 'row-label';
      label.textContent = name;
      const control = numberInput(values[index], 25, 99, `Imported ${name}`);
      control.dataset.attribute = String(index);
      if (data.missing.includes(name) || data.bad.includes(name)) {
        control.classList.add('warn');
        control.title = 'This value was missing or unclear in the screenshot; correct it before applying.';
      }
      control.addEventListener('input', () => { values[index] = Number(control.value); });
      wrapper.append(label, control);
      return wrapper;
    }));
    const warnings = [];
    if (data.missing.length) warnings.push(`Missing: ${data.missing.join(', ')}`);
    if (data.bad.length) warnings.push(`Unreadable or illegal: ${data.bad.join(', ')}`);
    if (data.over) warnings.push(`The read build is over the 99 wall (raw ${data.over.toFixed(2)}); applying will be checked by the builder.`);
    if (data.fits === false) warnings.push('The read body does not fit the attribute set exactly; review the values.');
    const warningList = warnings.length ? text('ul', null, 'list warn') : null;
    if (warningList) warningList.append(...warnings.map(message => text('li', message)));
    const actions = document.createElement('div');
    actions.className = 'fieldset';
    const apply = text('button', 'Apply to builder', 'btn primary');
    apply.type = 'button';
    const cancel = text('button', 'Cancel', 'btn');
    cancel.type = 'button';
    apply.addEventListener('click', () => {
      if (busy) return;
      const body = { p: Number(position.value), h: Number(height.value), w: Number(weight.value), s: Number(wingspan.value) };
      const candidate = buildCandidate(body, values);
      const result = applyBuild(candidate);
      if (!result?.ok) {
        setStatus(result?.message ?? 'The builder rejected the screenshot values; nothing was changed.', true);
        return;
      }
      setStatus(`Applied ${data.layout} screenshot to the builder. Review the build before saving.`);
      review.hidden = true;
    });
    cancel.addEventListener('click', () => {
      clearReview();
      setStatus('Screenshot review cancelled; the current build was not changed.');
    });
    actions.append(apply, cancel);
    if (pendingCard?.code && loadCode) {
      const cardButton = text('button', 'Load Build Lab card instead', 'btn');
      cardButton.type = 'button';
      cardButton.addEventListener('click', () => {
        if (loadCode(pendingCard.code)) setStatus('Loaded the Build Lab card from the screenshot.');
        else setStatus('The Build Lab card could not be loaded.', true);
      });
      actions.prepend(cardButton);
    }
    review.append(summary, bodyLine, bodyRow, warningList ?? '', attrs, actions);
    setStatus(warnings.length ? 'Review the highlighted fields, correct anything wrong, then apply.' : 'Review the read build, then apply.');
  }

  async function readFile(fileObject) {
    if (!fileObject || !fileObject.type.startsWith('image/')) {
      setStatus('Choose a PNG or JPEG image.', true);
      return;
    }
    if (busy) return;
    setBusy(true);
    clearReview();
    setStatus('Reading the screenshot on this device…');
    try {
      const G = window.GBLE;
      if (!G?.decodeShot || !G?.pixelsOf || !G?.OCR?.read || !G?.ocrToRaw || !G?.vetImport) {
        throw new Error('the screenshot reader is not available on this page');
      }
      const image = await G.decodeShot(fileObject);
      const card = G.tryCard?.(image);
      if (card?.ok && card.code) {
        pendingCard = card;
        setStatus('That is a Build Lab card. Loading it through the normal share path.');
        if (loadCode?.(card.code)) setStatus('Loaded the build from that Build Lab card.');
        else setStatus('The Build Lab card was found but could not be loaded.', true);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
      const pixels = G.pixelsOf(image);
      templates ??= G.ocrTemplates();
      setPositionHint(getCurrentBuild().p);
      const ocr = G.OCR.read(pixels, templates);
      const raw = G.ocrToRaw(ocr);
      if (!raw) throw new Error('no attribute numbers were recognized');
      const checked = G.vetImport(raw);
      if (!checked) throw new Error('the screenshot values did not validate');
      renderReview(raw, checked);
    } catch (error) {
      setStatus(`Could not read that screenshot: ${error instanceof Error ? error.message : String(error)}. Use the whole screen, not a crop.`, true);
    } finally {
      setBusy(false);
    }
  }

  file.addEventListener('change', () => {
    void readFile(file.files?.[0]);
    file.value = '';
  });
  drop.addEventListener('dragover', event => {
    event.preventDefault();
    drop.classList.add('warn');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('warn'));
  drop.addEventListener('drop', event => {
    event.preventDefault();
    drop.classList.remove('warn');
    void readFile(event.dataTransfer?.files?.[0]);
  });
  drop.addEventListener('click', () => file.click());
  drop.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') file.click(); });

  return { panel, readFile };
}

export function mountScreenshotImport(root, options) {
  return createScreenshotImport(root, options);
}
