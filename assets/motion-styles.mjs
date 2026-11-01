/**
 * Motion styles catalog: recovered data access, filtering, sorting and rendering.
 *
 * The rows are the recovered NBA 2K27 motion-style table from the Goated Build Lab
 * Mechanics Lab page. Each row is:
 *   [name, [minHeightIn, maxHeightIn, requiredSpeed, requiredAgility],
 *    [offenseJogTime, offenseJogTopSpeed], [offenseSprintTime, offenseSprintTopSpeed],
 *    [defenseJogTime, defenseJogTopSpeed], [defenseSprintTime, defenseSprintTopSpeed]]
 *
 * Everything here runs locally. There are no network calls except loading the
 * static JSON file passed to loadCatalog().
 */

export const RUNS = Object.freeze([
  'Offense jog',
  'Offense sprint',
  'Defense jog',
  'Defense sprint',
]);

/**
 * The reference page exposes five run choices. Row indexes 2–5 hold the four
 * [time, top speed] pairs in RUNS order.
 */
export const RUN_DEFINITIONS = Object.freeze([
  Object.freeze({ value: 'both', label: 'Offense + defense sprint', indexes: [3, 5], both: true }),
  Object.freeze({ value: 'offense-sprint', label: 'Offense sprint', indexes: [3], both: false }),
  Object.freeze({ value: 'defense-sprint', label: 'Defense sprint', indexes: [5], both: false }),
  Object.freeze({ value: 'offense-jog', label: 'Offense jog', indexes: [2], both: false }),
  Object.freeze({ value: 'defense-jog', label: 'Defense jog', indexes: [4], both: false }),
]);

export const SORT_DEFINITIONS = Object.freeze([
  Object.freeze({ value: 'time', label: 'Fastest time' }),
  Object.freeze({ value: 'speed', label: 'Top speed' }),
  Object.freeze({ value: 'name', label: 'Name, A to Z' }),
]);

/**
 * The three test builds. Height ranges start and end on these band edges; a
 * height in a band is shown the times from that band's build.
 */
export const BANDS = Object.freeze([
  Object.freeze({ id: 'guard', label: 'Guard', minHeight: 69, maxHeight: 76, buildHeight: 74 }),
  Object.freeze({ id: 'wing', label: 'Wing', minHeight: 77, maxHeight: 81, buildHeight: 78 }),
  Object.freeze({ id: 'big', label: 'Big', minHeight: 82, maxHeight: 88, buildHeight: 84 }),
]);

export const DEFAULT_HEIGHT = 78;
export const STORAGE_KEY = 'fb_motion_height';

const RUN_BY_VALUE = new Map(RUN_DEFINITIONS.map((definition) => [definition.value, definition]));
const SORT_BY_VALUE = new Map(SORT_DEFINITIONS.map((definition) => [definition.value, definition]));
const NAMED_STYLE_INDEX_CACHE = new WeakMap();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** 74 -> 6'2". Kept byte-for-byte compatible with the reference formatter. */
export function formatHeight(inches) {
  const value = Math.trunc(Number(inches));
  if (!Number.isFinite(value) || value < 0) return '';
  return `${Math.floor(value / 12)}'${value % 12}"`;
}

export function formatHeightRange(minHeight, maxHeight) {
  return `${formatHeight(minHeight)} to ${formatHeight(maxHeight)}`;
}

export function bandForHeight(height) {
  const value = Number(height);
  if (!Number.isFinite(value)) return null;
  return BANDS.find((band) => value >= band.minHeight && value <= band.maxHeight) || null;
}

export function heightOptions() {
  const heights = [];
  for (const band of BANDS) {
    for (let height = band.minHeight; height <= band.maxHeight; height += 1) {
      if (!heights.includes(height)) heights.push(height);
    }
  }
  return heights;
}

export function runDefinition(value) {
  return RUN_BY_VALUE.get(value) || RUN_BY_VALUE.get('both');
}

export function sortDefinition(value) {
  return SORT_BY_VALUE.get(value) || SORT_BY_VALUE.get('time');
}

/**
 * Check the recovered table before the page uses it. This catches a truncated
 * download, a changed row shape or an inconsistent height gate.
 */
export function validateCatalog(data) {
  assert(data && typeof data === 'object', 'Motion-style data is missing.');
  assert(Array.isArray(data.groups) && data.groups.length > 0, 'Motion-style data has no height groups.');
  assert(Array.isArray(data.runs) && data.runs.length === RUNS.length, 'Motion-style data must describe four runs.');

  const gates = new Map();
  let rowCount = 0;

  for (const group of data.groups) {
    assert(group && typeof group === 'object', 'A height group is malformed.');
    assert(typeof group.id === 'string' && group.id, 'A height group has no id.');
    assert(typeof group.label === 'string' && group.label, `The ${group.id} group has no label.`);
    assert(Number.isFinite(group.buildHeight), `The ${group.id} group has no build height.`);
    const band = bandForHeight(group.buildHeight);
    assert(band && band.id === group.id, `The ${group.id} group's build height is outside its band.`);
    assert(Array.isArray(group.rows) && group.rows.length > 0, `The ${group.id} group has no rows.`);

    for (const row of group.rows) {
      rowCount += 1;
      assert(Array.isArray(row) && row.length === 6, `${group.id} row ${rowCount} does not have six fields.`);
      assert(typeof row[0] === 'string' && row[0].trim(), `${group.id} row ${rowCount} has no name.`);
      const gate = row[1];
      assert(Array.isArray(gate) && gate.length === 4 && gate.every(Number.isFinite),
        `${row[0]} has an invalid height or rating gate.`);
      assert(gate[0] <= gate[1], `${row[0]} has a reversed height range.`);
      assert(gate[2] >= 0 && gate[2] <= 99, `${row[0]} has an invalid Speed requirement.`);
      assert(gate[3] >= 0 && gate[3] <= 99, `${row[0]} has an invalid Agility requirement.`);

      for (let index = 2; index < 6; index += 1) {
        const pair = row[index];
        assert(Array.isArray(pair) && pair.length === 2 && pair.every(Number.isFinite),
          `${row[0]} has an invalid ${RUNS[index - 2]} measurement.`);
        assert(pair[0] > 0 && pair[1] > 0, `${row[0]} has a non-positive ${RUNS[index - 2]} measurement.`);
      }

      const previous = gates.get(row[0]);
      if (previous) {
        assert(JSON.stringify(previous) === JSON.stringify(gate), `${row[0]} has conflicting height gates.`);
      } else {
        gates.set(row[0], gate);
      }
    }
  }

  for (const band of BANDS) {
    assert(data.groups.some((group) => group.id === band.id), `The recovered data is missing the ${band.label} group.`);
  }

  const counts = data.about && data.about.counts;
  if (counts) {
    assert(counts.heightGroups === data.groups.length, 'The recorded height-group count does not match the data.');
    assert(counts.rows === rowCount, 'The recorded row count does not match the data.');
    assert(counts.uniqueStyles === gates.size, 'The recorded unique-style count does not match the data.');
  }

  return { groups: data.groups.length, rows: rowCount, styles: gates.size };
}

export async function loadCatalog(url) {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Motion-style data could not be loaded (HTTP ${response.status}).`);
  const data = await response.json();
  validateCatalog(data);
  return data;
}

/** Unique style names and their height/rating gates, in first-seen order. */
export function buildStyleIndex(data) {
  const styles = new Map();
  for (const group of data.groups) {
    for (const row of group.rows) {
      if (styles.has(row[0])) continue;
      styles.set(row[0], Object.freeze({
        name: row[0],
        minHeight: row[1][0],
        maxHeight: row[1][1],
        speed: row[1][2],
        agility: row[1][3],
      }));
    }
  }
  return styles;
}

function catalogIndex(data) {
  if (NAMED_STYLE_INDEX_CACHE.has(data)) return NAMED_STYLE_INDEX_CACHE.get(data);

  const styles = buildStyleIndex(data);
  const timedByGroup = new Map();
  const timedOnBuildHeights = new Map();

  for (const group of data.groups) {
    timedByGroup.set(group.id, new Map(group.rows.map((row) => [row[0], row])));
    for (const row of group.rows) {
      const heights = timedOnBuildHeights.get(row[0]) || [];
      if (!heights.includes(group.buildHeight)) heights.push(group.buildHeight);
      timedOnBuildHeights.set(row[0], heights);
    }
  }

  for (const heights of timedOnBuildHeights.values()) heights.sort((a, b) => a - b);

  const index = { styles, timedByGroup, timedOnBuildHeights };
  NAMED_STYLE_INDEX_CACHE.set(data, index);
  return index;
}

function compareNames(a, b) {
  return a.name.localeCompare(b.name);
}

function roundedHundredths(value) {
  return Math.round(value * 100);
}

function roundedTenths(value) {
  return Math.round(value * 10);
}

/** Combined offense + defense sprint time, to the reference's hundredth precision. */
export function sprintTime(row) {
  return row[3][0] + row[5][0];
}

/** Average of the offense and defense sprint top speeds. */
export function sprintTopSpeed(row) {
  return (row[3][1] + row[5][1]) / 2;
}

export function sprintTimeKey(row) {
  return roundedHundredths(row[3][0]) + roundedHundredths(row[5][0]);
}

export function sprintTopSpeedKey(row) {
  return roundedTenths(row[3][1]) + roundedTenths(row[5][1]);
}

/** Reference ordering: fastest combined sprint, ties to the higher top speed. */
export function compareCombinedSprint(a, b) {
  return sprintTimeKey(a) - sprintTimeKey(b)
    || sprintTopSpeedKey(b) - sprintTopSpeedKey(a);
}

export function recommend(records) {
  let best = null;
  for (const record of records) {
    if (!record.timed) continue;
    if (!best || compareCombinedSprint(record.row, best.row) < 0) best = record;
  }
  return best;
}

/**
 * Every style a MyPLAYER of this height can wear. Timed rows come only from the
 * height's own band build; a style without a row for that build is returned as
 * untimed and is never given borrowed times.
 */
export function recordsForHeight(data, height) {
  const numericHeight = Math.trunc(Number(height));
  const band = bandForHeight(numericHeight);
  if (!band) throw new RangeError(`No motion-style band covers ${height}.`);

  const { styles, timedByGroup, timedOnBuildHeights } = catalogIndex(data);
  const group = data.groups.find((candidate) => candidate.id === band.id)
    || data.groups.find((candidate) => candidate.buildHeight === band.buildHeight);
  if (!group) throw new Error(`The recovered data has no ${band.label} build.`);

  const timedRows = timedByGroup.get(group.id) || new Map();
  const records = [];

  for (const style of styles.values()) {
    if (numericHeight < style.minHeight || numericHeight > style.maxHeight) continue;
    const row = timedRows.get(style.name) || null;
    records.push({
      ...style,
      row,
      timed: row !== null,
      timedOnBuildHeights: timedOnBuildHeights.get(style.name) || [],
    });
  }

  records.sort(compareNames);
  const timed = records.filter((record) => record.timed);
  const untimed = records.filter((record) => !record.timed);
  const eligibleNames = new Set(records.map((record) => record.name));
  const extraTimed = group.rows.filter((row) => !eligibleNames.has(row[0]));

  return {
    height: numericHeight,
    band,
    group,
    records,
    timed,
    untimed,
    extraTimed,
    recommended: recommend(timed),
    counts: {
      eligible: records.length,
      timed: timed.length,
      untimed: untimed.length,
      extraTimed: extraTimed.length,
      groupRows: group.rows.length,
    },
  };
}

function optionalRating(value) {
  if (value === null || value === undefined || value === '') return null;
  const rating = Number(value);
  if (!Number.isFinite(rating)) return null;
  return Math.max(0, Math.min(99, Math.trunc(rating)));
}

export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function filterRecords(records, { query = '', speed = null, agility = null } = {}) {
  const needle = normalizeSearch(query);
  const speedLimit = optionalRating(speed);
  const agilityLimit = optionalRating(agility);

  return records.filter((record) => {
    if (needle && !normalizeSearch(record.name).includes(needle)) return false;
    if (speedLimit !== null && record.speed > speedLimit) return false;
    if (agilityLimit !== null && record.agility > agilityLimit) return false;
    return true;
  });
}

function compareForSort(a, b, definition, sort) {
  if (definition.both) {
    if (sort === 'speed') {
      return sprintTopSpeedKey(b.row) - sprintTopSpeedKey(a.row)
        || sprintTimeKey(a.row) - sprintTimeKey(b.row)
        || compareNames(a, b);
    }
    return sprintTimeKey(a.row) - sprintTimeKey(b.row)
      || sprintTopSpeedKey(b.row) - sprintTopSpeedKey(a.row)
      || compareNames(a, b);
  }

  const index = definition.indexes[0];
  if (sort === 'speed') {
    return roundedTenths(b.row[index][1]) - roundedTenths(a.row[index][1])
      || a.row[index][0] - b.row[index][0]
      || compareNames(a, b);
  }
  return a.row[index][0] - b.row[index][0]
    || b.row[index][1] - a.row[index][1]
    || compareNames(a, b);
}

/**
 * Sort the visible records. Untimed styles always sort last unless sorting by
 * name, where the full list is alphabetical.
 */
export function sortRecords(records, { sort = 'time', run = 'both' } = {}) {
  const definition = runDefinition(run);
  const mode = sortDefinition(sort).value;

  if (mode === 'name') return records.slice().sort(compareNames);

  const timed = records.filter((record) => record.timed)
    .sort((a, b) => compareForSort(a, b, definition, mode));
  const untimed = records.filter((record) => !record.timed).sort(compareNames);
  return timed.concat(untimed);
}

function suggestionsFor(data, height, query) {
  const needle = normalizeSearch(query);
  if (!needle) return [];
  const { styles } = catalogIndex(data);
  return [...styles.values()]
    .filter((style) => {
      const fits = style.minHeight <= height && height <= style.maxHeight;
      return !fits && normalizeSearch(style.name).includes(needle);
    })
    .sort(compareNames)
    .slice(0, 3);
}

export function buildView(data, {
  height = DEFAULT_HEIGHT,
  query = '',
  run = 'both',
  sort = 'time',
  speed = null,
  agility = null,
} = {}) {
  const catalog = recordsForHeight(data, height);
  const definition = runDefinition(run);
  const mode = sortDefinition(sort).value;
  const speedLimit = optionalRating(speed);
  const agilityLimit = optionalRating(agility);
  const filtersActive = Boolean(normalizeSearch(query)) || speedLimit !== null || agilityLimit !== null;

  const filtered = filterRecords(catalog.records, { query, speed, agility });
  const shown = sortRecords(filtered, { sort: mode, run: definition.value });
  const suggestions = filtersActive && shown.length === 0
    ? suggestionsFor(data, catalog.height, query)
    : [];

  return {
    catalog,
    filtered,
    shown,
    suggestions,
    filtersActive,
    options: {
      height: catalog.height,
      query: String(query ?? ''),
      run: definition.value,
      sort: mode,
      speed: speedLimit,
      agility: agilityLimit,
    },
    counts: {
      eligible: catalog.counts.eligible,
      timed: catalog.counts.timed,
      untimed: catalog.counts.untimed,
      shown: shown.length,
      shownTimed: shown.filter((record) => record.timed).length,
      shownUntimed: shown.filter((record) => !record.timed).length,
    },
  };
}

export function describeView(view) {
  const { catalog, shown, filtersActive } = view;
  const parts = [
    `${catalog.counts.eligible} styles fit ${formatHeight(catalog.height)} (${catalog.band.label} band)`,
    `${catalog.counts.timed} timed on the ${formatHeight(catalog.group.buildHeight)} build`,
  ];
  if (filtersActive) {
    parts.push(`${shown.length} match${shown.length === 1 ? '' : 'es'}`);
  }
  return parts.join(' · ');
}

export function formatRecordGate(record) {
  const parts = [`MyPLAYER ${formatHeightRange(record.minHeight, record.maxHeight)}`];
  if (record.speed) parts.push(`Speed ${record.speed}+`);
  if (record.agility) parts.push(`Agility ${record.agility}+`);
  if (!record.speed && !record.agility) parts.push('No Speed or Agility requirement');
  return parts.join(' · ');
}

export function summarizeGroups(data) {
  return BANDS.map((band) => {
    const view = recordsForHeight(data, band.buildHeight);
    return {
      ...band,
      counts: view.counts,
      recommended: view.recommended,
    };
  });
}

function createElement(doc, tag, className, text) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function appendText(doc, node, text) {
  node.appendChild(doc.createTextNode(text));
}

/**
 * Wire the catalog UI. The HTML owns the controls and landmarks; this function
 * only fills the data-dependent options, group summary, recommendation and
 * result list.
 */
export function initMotionStyles(data, doc = globalThis.document) {
  if (!doc) throw new Error('The motion-style catalog needs a document.');

  const byId = (id) => {
    const node = doc.getElementById(id);
    if (!node) throw new Error(`The motion-style page is missing #${id}.`);
    return node;
  };

  const form = byId('motion-filters');
  const search = byId('motion-search');
  const height = byId('motion-height');
  const run = byId('motion-run');
  const sort = byId('motion-sort');
  const speed = byId('motion-speed');
  const agility = byId('motion-agility');
  const status = byId('motion-status');
  const recommendation = byId('motion-recommendation');
  const groups = byId('motion-groups');
  const results = byId('motion-results');
  const empty = byId('motion-empty');
  const reset = byId('motion-reset');

  height.replaceChildren();
  for (const value of heightOptions()) {
    const option = createElement(doc, 'option', null, formatHeight(value));
    option.value = String(value);
    height.appendChild(option);
  }

  let storedHeight = null;
  try {
    storedHeight = globalThis.localStorage ? globalThis.localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    storedHeight = null;
  }
  height.value = storedHeight && heightOptions().includes(Number(storedHeight))
    ? storedHeight
    : String(DEFAULT_HEIGHT);

  function persistHeight() {
    try {
      if (globalThis.localStorage) globalThis.localStorage.setItem(STORAGE_KEY, height.value);
    } catch {
      /* storage can be unavailable in private or file contexts */
    }
  }

  function renderGroups() {
    const cards = summarizeGroups(data).map((band) => {
      const card = createElement(doc, 'article', 'group-card');
      card.appendChild(createElement(doc, 'h3', null, `${band.label} · ${formatHeightRange(band.minHeight, band.maxHeight)}`));
      card.appendChild(createElement(doc, 'p', 'group-build', `Tested on a ${formatHeight(band.buildHeight)} build`));

      const bits = [
        `${band.counts.eligible} styles fit this band`,
        `${band.counts.timed} timed on this build`,
      ];
      if (band.counts.extraTimed) {
        bits.push(`${band.counts.extraTimed} extra measured rows outside the band`);
      }
      if (band.counts.untimed) {
        bits.push(`${band.counts.untimed} not timed yet`);
      }
      card.appendChild(createElement(doc, 'p', 'group-counts', bits.join(' · ')));

      if (band.counts.untimed) {
        card.appendChild(createElement(doc, 'p', 'group-note',
          `The ${band.counts.untimed} untimed styles still appear at these heights, with no times borrowed from another build.`));
      }
      if (band.counts.extraTimed) {
        card.appendChild(createElement(doc, 'p', 'group-note',
          `The ${band.counts.extraTimed} extra rows were timed on this build even though their height range does not cover the band.`));
      }
      return card;
    });
    groups.replaceChildren(...cards);
  }

  function renderRecommendation(view) {
    recommendation.replaceChildren();
    const best = view.catalog.recommended;
    if (!best) {
      recommendation.appendChild(createElement(doc, 'p', 'note', 'No timed motion style is available at this height.'));
      return;
    }
    const line = createElement(doc, 'p');
    const lead = createElement(doc, 'span', 'rec-label', `Recommended at ${formatHeight(view.catalog.height)}: `);
    line.appendChild(lead);
    line.appendChild(createElement(doc, 'strong', null, best.name));
    appendText(doc, line,
      ` — ${sprintTime(best.row).toFixed(2)} s combined sprint, `
      + `${sprintTopSpeed(best.row).toFixed(2)} ft/s average top speed.`);
    recommendation.appendChild(line);
  }

  function renderRuns(record, definition) {
    const list = createElement(doc, 'dl', 'runs');
    list.setAttribute('aria-label', `Timing runs for ${record.name}`);

    RUNS.forEach((label, index) => {
      const rowIndex = index + 2;
      const selected = definition.both
        ? rowIndex === 3 || rowIndex === 5
        : rowIndex === definition.indexes[0];
      const item = createElement(doc, 'div', `run${selected ? ' is-selected' : ''}`);
      if (selected) item.setAttribute('aria-current', 'true');
      item.appendChild(createElement(doc, 'dt', null, label));
      const values = createElement(doc, 'dd');
      values.appendChild(createElement(doc, 'b', null, `${record.row[rowIndex][0].toFixed(2)} s`));
      values.appendChild(createElement(doc, 'span', null, `${record.row[rowIndex][1].toFixed(1)} ft/s`));
      item.appendChild(values);
      list.appendChild(item);
    });
    return list;
  }

  function renderCard(record, index, view) {
    const item = doc.createElement('li');
    item.className = `style-item${record.timed ? '' : ' is-untimed'}${record === view.catalog.recommended ? ' is-recommended' : ''}`;
    item.dataset.styleName = record.name;

    const card = createElement(doc, 'article', 'style-card');
    const headingId = `motion-style-${index}-name`;
    card.setAttribute('aria-labelledby', headingId);

    const head = createElement(doc, 'div', 'style-head');
    if (view.options.sort !== 'name') {
      const rank = createElement(doc, 'span', 'style-rank', `#${index + 1}`);
      rank.setAttribute('aria-hidden', 'true');
      head.appendChild(rank);
    }

    const title = createElement(doc, 'div', 'style-title');
    const heading = createElement(doc, 'h3', null, record.name);
    heading.id = headingId;
    if (record === view.catalog.recommended) {
      heading.appendChild(createElement(doc, 'span', 'badge', 'Recommended'));
    }
    title.appendChild(heading);
    title.appendChild(createElement(doc, 'p', 'gate', formatRecordGate(record)));
    head.appendChild(title);
    card.appendChild(head);

    if (!record.timed) {
      card.appendChild(createElement(doc, 'p', 'not-timed',
        `Not timed on the ${formatHeight(view.catalog.group.buildHeight)} build.`));
      const otherBuilds = record.timedOnBuildHeights.map((value) => formatHeight(value));
      card.appendChild(createElement(doc, 'p', 'hint', otherBuilds.length
        ? `Only timed on the ${otherBuilds.join(' and ')} build${otherBuilds.length === 1 ? '' : 's'}; no times are borrowed here.`
        : 'No timing runs were recovered for this style.'));
      item.appendChild(card);
      return item;
    }

    const definition = runDefinition(view.options.run);
    card.appendChild(renderRuns(record, definition));

    if (definition.both) {
      card.appendChild(createElement(doc, 'p', 'summary',
        `Combined sprint: ${sprintTime(record.row).toFixed(2)} s · `
        + `${sprintTopSpeed(record.row).toFixed(2)} ft/s average top speed`));
    } else {
      const indexInRow = definition.indexes[0];
      card.appendChild(createElement(doc, 'p', 'summary',
        `${definition.label}: ${record.row[indexInRow][0].toFixed(2)} s · `
        + `${record.row[indexInRow][1].toFixed(1)} ft/s top speed`));
    }

    item.appendChild(card);
    return item;
  }

  function renderResults(view) {
    const fragment = doc.createDocumentFragment();
    view.shown.forEach((record, index) => {
      fragment.appendChild(renderCard(record, index, view));
    });
    results.replaceChildren(fragment);

    if (view.shown.length) {
      empty.hidden = true;
      empty.replaceChildren();
      return;
    }

    empty.hidden = false;
    const message = createElement(doc, 'p', null,
      view.filtersActive
        ? `No styles match these filters at ${formatHeight(view.catalog.height)}.`
        : `No styles are available at ${formatHeight(view.catalog.height)}.`);
    empty.appendChild(message);

    if (view.suggestions.length) {
      const note = createElement(doc, 'p', 'hint', 'That style is available at another height: ');
      note.appendChild(doc.createTextNode(view.suggestions
        .map((style) => `${style.name} is for ${formatHeightRange(style.minHeight, style.maxHeight)}.`)
        .join(' ')));
      empty.appendChild(note);
    }
  }

  function render() {
    const view = buildView(data, {
      height: height.value,
      query: search.value,
      run: run.value,
      sort: sort.value,
      speed: speed.value,
      agility: agility.value,
    });
    renderRecommendation(view);
    status.textContent = describeView(view);
    renderResults(view);
    return view;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render();
  });
  search.addEventListener('input', render);
  height.addEventListener('change', () => {
    persistHeight();
    render();
  });
  run.addEventListener('change', render);
  sort.addEventListener('change', render);
  speed.addEventListener('input', render);
  agility.addEventListener('input', render);
  reset.addEventListener('click', () => {
    search.value = '';
    height.value = String(DEFAULT_HEIGHT);
    run.value = 'both';
    sort.value = 'time';
    speed.value = '';
    agility.value = '';
    persistHeight();
    render();
    search.focus();
  });

  renderGroups();
  render();
  return { render, renderGroups };
}
