/**
 * Build Doctor: explain the displayed/raw overall and suggest the smallest
 * legal changes toward an overall or badge-tier target. Uses the recovered
 * GBLE validator; never bypasses ceilings, linked ratings or the 99 wall.
 */

const ATTRS = (G) => G.ATTRS ?? [];

function clone(alloc) {
  return [...alloc];
}

function evaluate(G, build, alloc) {
  const caps = G.ceilingsFor(build.h, build.w, build.s);
  const hb = build.h - 63;
  const next = clone(alloc);
  G.settle(next, hb, caps);
  return {
    alloc: next,
    raw: G.ratingOf(next, hb),
    overall: G.overallOf(next, hb, caps),
    trueOvr: G.trueOvr(next, hb),
  };
}

export function diagnoseBuild(G, build, targetOverall = 99) {
  const caps = G.ceilingsFor(build.h, build.w, build.s);
  const hb = build.h - 63;
  const raw = G.ratingOf(build.alloc, hb);
  const overall = G.overallOf(build.alloc, hb, caps);
  const trueOvr = G.trueOvr(build.alloc, hb);
  const atCap = build.alloc.map((value, index) => value >= caps[index] ? index : -1).filter(index => index >= 0);
  const below = build.alloc.map((value, index) => value < caps[index] ? index : -1).filter(index => index >= 0);
  const changes = [];
  const target = Math.max(25, Math.min(99, Number(targetOverall) || 99));
  const reached = overall >= target;

  if (raw >= 99) {
    return {
      raw, overall, trueOvr, target, caps, atCap, below,
      changes: [],
      diagnosis: `This build is over the 99 wall (raw ${raw.toFixed(4)}). Lower an attribute before applying another change.`,
      reached: false,
    };
  }
  if (reached) {
    return {
      raw, overall, trueOvr, target, caps, atCap, below,
      changes: [],
      diagnosis: `This build already reaches the target overall of ${target}. ${atCap.length} attribute${atCap.length === 1 ? ' is' : 's are'} at this frame's ceiling.`,
      reached: true,
    };
  }

  for (const index of below) {
    const next = clone(build.alloc);
    next[index] += 1;
    const result = evaluate(G, build, next);
    if (result.raw <= raw + 1e-9 || result.raw >= 99) continue;
    changes.push({
      kind: 'raise',
      index,
      alloc: result.alloc,
      raw: result.raw,
      overall: result.overall,
      trueOvr: result.trueOvr,
      reaches: result.overall >= target,
      gain: result.raw - raw,
    });
  }

  for (const raise of below) {
    for (const lower of below) {
      if (raise === lower || build.alloc[lower] <= 25) continue;
      const next = clone(build.alloc);
      next[raise] += 1;
      next[lower] -= 1;
      const result = evaluate(G, build, next);
      if (result.raw <= raw + 1e-9 || result.raw >= 99) continue;
      changes.push({
        kind: 'swap',
        raise,
        lower,
        alloc: result.alloc,
        raw: result.raw,
        overall: result.overall,
        trueOvr: result.trueOvr,
        reaches: result.overall >= target,
        gain: result.raw - raw,
      });
    }
  }

  changes.sort((left, right) => Number(right.reaches) - Number(left.reaches) || right.overall - left.overall || right.raw - left.raw);
  const unique = [];
  const seen = new Set();
  for (const change of changes) {
    const key = change.alloc.join('.');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(change);
    if (unique.length >= 5) break;
  }

  let diagnosis = `The displayed overall is ${overall} because the raw score is ${raw.toFixed(4)}. The wall stops at 99; ${atCap.length} attribute${atCap.length === 1 ? ' is' : 's are'} already at this frame's ceilings.`;
  if (!unique.length) diagnosis += ' No single +1 or one-for-one swap improves the raw score legally; try another frame or lower a different attribute first.';

  return {
    raw,
    overall,
    trueOvr,
    target,
    caps,
    atCap,
    below,
    changes: unique,
    diagnosis,
    reached,
  };
}

export function diagnoseBadge(G, build, badgeIndex, tier) {
  const badge = G.BADGES?.[badgeIndex];
  if (!badge) return null;
  const hb = build.h - 63;
  const current = G.tierMetAt(badgeIndex, build.alloc, hb);
  const requirements = badge[1]?.[tier - 1] ?? [];
  const gaps = requirements.map(([attribute, rating]) => ({
    attribute,
    rating,
    current: build.alloc[attribute] ?? 0,
    gap: Math.max(0, rating - (build.alloc[attribute] ?? 0)),
  }));
  const isOr = !!badge[2];
  const caps = G.ceilingsFor(build.h, build.w, build.s);
  const unreachable = gaps.filter(gap => gap.rating > (caps[gap.attribute] ?? 99));
  const reachable = gaps.filter(gap => gap.rating <= (caps[gap.attribute] ?? 99));
  const needed = isOr
    ? [reachable.filter(gap => gap.gap > 0).sort((left, right) => left.gap - right.gap)[0]].filter(Boolean)
    : reachable.filter(gap => gap.gap > 0);
  return {
    badge: badge[0],
    tier,
    current,
    requirements: gaps,
    needed,
    unreachable,
    reachable,
    caps,
    isOr,
    met: current >= tier,
    name: badge[0],
  };
}

export function planToTarget(G, build, targetOverall = 99, maxSteps = 300) {
  let current = { ...build, alloc: [...build.alloc] };
  const steps = [];
  const seen = new Set([current.alloc.join('.')]);
  let result = diagnoseBuild(G, current, targetOverall);
  for (let index = 0; index < maxSteps; index += 1) {
    if (result.reached) return { ok: true, final: current, steps, result };
    const change = result.changes.find(item => item.reaches) ?? result.changes[0];
    if (!change) return { ok: false, final: current, steps, result };
    const key = change.alloc.join('.');
    if (seen.has(key)) return { ok: false, final: current, steps, result };
    seen.add(key);
    current = { ...current, alloc: change.alloc };
    steps.push({ label: changeLabel(G, change), overall: change.overall, raw: change.raw });
    result = diagnoseBuild(G, current, targetOverall);
  }
  return { ok: result.reached, final: current, steps, result };
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function option(value, label, selected) {
  const element = document.createElement('option');
  element.value = String(value);
  element.textContent = label;
  element.selected = !!selected;
  return element;
}

export function changeLabel(G, change) {
  const names = ATTRS(G);
  if (change.kind === 'raise') return `Raise ${names[change.index] ?? `Attribute ${change.index + 1}`} +1`;
  return `Raise ${names[change.raise] ?? `Attribute ${change.raise + 1}`} +1, lower ${names[change.lower] ?? `Attribute ${change.lower + 1}`} −1`;
}

export function mountBuildDoctor(root, { getBuild }) {
  const panel = node('section', 'panel build-doctor');
  panel.setAttribute('aria-label', 'Build Doctor');
  const head = node('div', 'panel-head');
  head.append(node('h2', null, 'Build Doctor'), node('span', 'muted', 'local diagnosis'));
  const status = node('p', 'fb-doctor-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const diagnosis = node('p', 'muted fb-doctor-diagnosis');
  const targetRow = node('div', 'fieldset fb-doctor-target');
  const target = document.createElement('select');
  target.className = 'sel';
  target.setAttribute('aria-label', 'Target overall');
  for (let value = 95; value <= 99; value += 1) target.append(option(value, `Target overall ${value}`, value === 99));
  const diagnose = node('button', 'btn primary', 'Diagnose');
  diagnose.type = 'button';
  const plan = node('button', 'btn', 'Plan to target');
  plan.type = 'button';
  const undo = node('button', 'btn', 'Undo last');
  undo.type = 'button';
  const targetLabel = node('label', 'lbl', 'Target');
  targetLabel.append(target);
  targetRow.append(targetLabel, diagnose, plan, undo);
  const suggestions = node('div', 'fb-doctor-suggestions');
  const planHost = node('div', 'fb-doctor-plan');
  const badgeDetails = document.createElement('details');
  badgeDetails.className = 'fb-doctor-badge';
  badgeDetails.append(node('summary', null, 'Target a badge tier'));
  const badgeRow = node('div', 'fieldset');
  const badgeSelect = document.createElement('select');
  badgeSelect.className = 'sel';
  badgeSelect.setAttribute('aria-label', 'Badge to diagnose');
  window.GBLE?.BADGES?.forEach((badge, index) => badgeSelect.append(option(index, badge[0], index === 0)));
  const tierSelect = document.createElement('select');
  tierSelect.className = 'sel';
  tierSelect.setAttribute('aria-label', 'Badge tier to diagnose');
  for (let tier = 1; tier <= 4; tier += 1) tierSelect.append(option(tier, window.GBLE?.TIERNAME?.[tier] ?? `Tier ${tier}`, tier === 1));
  const badgeButton = node('button', 'btn', 'Check badge');
  badgeButton.type = 'button';
  const badgeLabel = node('label', 'lbl', 'Badge');
  badgeLabel.append(badgeSelect);
  const tierLabel = node('label', 'lbl', 'Tier');
  tierLabel.append(tierSelect);
  badgeRow.append(badgeLabel, tierLabel, badgeButton);
  const badgeResult = node('div', 'fb-doctor-badge-result');
  badgeDetails.append(badgeRow, badgeResult);
  panel.append(head, status, diagnosis, targetRow, planHost, suggestions, badgeDetails);
  root.append(panel);

  function buildValue() {
    try { return getBuild(); } catch { return null; }
  }

  function renderOverall() {
    const build = buildValue();
    if (!build) return;
    const result = diagnoseBuild(window.GBLE, build, Number(target.value) || 99);
    status.textContent = `Overall ${result.overall} · true ${result.trueOvr.toFixed(1)} · raw ${result.raw.toFixed(4)} / 99`;
    diagnosis.textContent = result.diagnosis;
    if (!result.changes.length) {
      suggestions.replaceChildren(node('p', 'muted', result.reached ? 'No change needed for this target.' : 'No legal single-step improvement found.'));
      return;
    }
    const list = node('div', 'fb-doctor-list');
    const keyOf = change => change.kind === 'raise' ? `r:${change.index}` : `s:${change.raise}`;
    const visible = [];
    for (const change of result.changes) {
      const key = keyOf(change);
      if (visible.some(item => keyOf(item) === key)) continue;
      visible.push(change);
      if (visible.length >= 3) break;
    }
    for (const change of visible) {
      const row = node('div', 'fb-doctor-change');
      const label = node('span', null, `${changeLabel(window.GBLE, change)} → ${change.reaches ? `Overall ${change.overall}` : `raw ${change.raw.toFixed(4)}`}`);
      const apply = node('button', 'btn', 'Apply');
      apply.type = 'button';
      apply.addEventListener('click', () => {
        const applied = window.__fbApplyBuild?.({ alloc: change.alloc });
        if (applied?.ok) {
          status.textContent = `Applied: ${changeLabel(window.GBLE, change)}. Use Undo last to revert.`;
          renderOverall();
        } else {
          status.textContent = applied?.message || 'The builder rejected that change.';
        }
      });
      row.append(label, apply);
      list.append(row);
    }
    suggestions.replaceChildren(list);
  }

  function renderBadge() {
    const build = buildValue();
    if (!build) return;
    const result = diagnoseBadge(window.GBLE, build, Number(badgeSelect.value), Number(tierSelect.value));
    if (!result) {
      badgeResult.replaceChildren(node('p', 'warn', 'That badge could not be read.'));
      return;
    }
    const currentLabel = result.current ? (window.GBLE.TIERNAME?.[result.current] ?? `Tier ${result.current}`) : 'not earned';
    const lines = [node('p', null, `${result.name} ${window.GBLE.TIERNAME?.[result.tier] ?? `Tier ${result.tier}`} · current ${currentLabel}`)];
    for (const requirement of result.requirements) {
      const name = window.GBLE.ATTRS?.[requirement.attribute] ?? `Attribute ${requirement.attribute + 1}`;
      lines.push(node('p', requirement.gap ? 'warn' : 'ok', `${name}: ${requirement.current} / ${requirement.rating}${requirement.gap ? ` · needs +${requirement.gap}` : ' · met'}`));
    }
    const tierLabel = window.GBLE.TIERNAME?.[result.tier] ?? `Tier ${result.tier}`;
    if (result.met) {
      lines.push(node('p', 'ok', 'This build already earns that tier.'));
    } else if (!result.needed.length && result.unreachable.length) {
      const detail = result.unreachable.map(gap => {
        const name = window.GBLE.ATTRS?.[gap.attribute] ?? `Attribute ${gap.attribute + 1}`;
        return `${name} ${gap.rating} (ceiling ${result.caps[gap.attribute]})`;
      }).join(', ');
      lines.push(node('p', 'warn', `${tierLabel} is unreachable on this frame: ${detail}. Change the body or find a build that can reach it.`));
      const gap = result.unreachable[0];
      const find = node('a', 'btn', 'Find a body');
      find.href = `/finder/?attribute=${gap.attribute}&target=${gap.rating}&position=${build.p}&height=${build.h}&caps=0`;
      lines.push(find);
    } else if (result.needed.length) {
      if (result.unreachable.length) {
        const detail = result.unreachable.map(gap => {
          const name = window.GBLE.ATTRS?.[gap.attribute] ?? `Attribute ${gap.attribute + 1}`;
          return `${name} ${gap.rating} (ceiling ${result.caps[gap.attribute]})`;
        }).join(', ');
        lines.push(node('p', 'muted', `Other option${result.unreachable.length === 1 ? '' : 's'} unreachable on this frame: ${detail}.`));
      }
      const apply = node('button', 'btn primary', `Write ${result.needed.length} target${result.needed.length === 1 ? '' : 's'}`);
      apply.type = 'button';
      apply.addEventListener('click', () => {
        const targets = Object.fromEntries(result.needed.map(gap => [gap.attribute, gap.rating]));
        const written = window.__fbWriteTargets?.(targets, true);
        if (!written) {
          status.textContent = 'The builder is not ready to write targets.';
          return;
        }
        status.textContent = written.limited?.length
          ? `Wrote ${written.written} target(s); ${written.limited.length} stayed below the target because of the wall or ceilings. Lower another attribute and retry.`
          : `Wrote ${written.written} target(s) into the build.`;
        renderBadge();
        renderOverall();
      });
      lines.push(apply);
    }
    badgeResult.replaceChildren(...lines);
  }

  diagnose.addEventListener('click', renderOverall);
  plan.addEventListener('click', () => {
    const build = buildValue();
    if (!build) return;
    const targetValue = Number(target.value) || 99;
    const path = planToTarget(window.GBLE, build, targetValue);
    if (!path.steps.length) {
      planHost.replaceChildren(node('p', path.ok ? 'ok' : 'muted', path.ok ? `Already at overall ${targetValue}.` : 'No legal path found from this build.'));
      return;
    }
    const summary = path.ok
      ? `Reached ${targetValue} in ${path.steps.length} step${path.steps.length === 1 ? '' : 's'}.`
      : `Best effort: overall ${path.result.overall} after ${path.steps.length} step${path.steps.length === 1 ? '' : 's'}.`;
    const applyPlan = node('button', 'btn primary', 'Apply plan');
    applyPlan.type = 'button';
    applyPlan.addEventListener('click', () => {
      const applied = window.__fbApplyBuild?.({ alloc: path.final.alloc });
      if (applied?.ok) {
        status.textContent = `${summary} Applied. Use Undo last to revert.`;
        renderOverall();
      } else {
        status.textContent = applied?.message || 'The builder rejected the plan.';
      }
    });
    planHost.replaceChildren(
      node('p', path.ok ? 'ok' : 'muted', summary),
      node('p', 'muted', `${path.steps[0].label} → ${path.steps[path.steps.length - 1].label}`),
      applyPlan,
    );
  });
  target.addEventListener('change', renderOverall);
  undo.addEventListener('click', () => {
    if (typeof window.__fbUndo === 'function') {
      window.__fbUndo();
      renderOverall();
    } else {
      status.textContent = 'History is not ready yet.';
    }
  });
  badgeButton.addEventListener('click', renderBadge);
  badgeSelect.addEventListener('change', renderBadge);
  tierSelect.addEventListener('change', renderBadge);
  renderOverall();
  renderBadge();

  let renderTimer = 0;
  const schedule = () => {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => {
      if (document.documentElement.dataset.fbDragging === '1') {
        schedule();
        return;
      }
      renderOverall();
      renderBadge();
    }, 220);
  };
  const overall = document.querySelector('.overall');
  if (overall) new MutationObserver(schedule).observe(overall, { childList: true, subtree: true, characterData: true });
  const view = document.getElementById('view');
  if (view) {
    view.addEventListener('change', schedule, true);
    view.addEventListener('input', schedule, true);
    view.addEventListener('click', schedule, true);
  }
  return { render: renderOverall };
}
