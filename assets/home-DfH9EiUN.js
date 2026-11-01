import { c as routeInfo, r as element, s as engineInfo } from './shell-DuKJJrzf.js';

const tools = [
  ['Builder', '/builder', 'Body, ceilings, overall and cap-breaker planning.'],
  ['Builds', '/builds/', 'GOAT builds, GOATED builds and community presets.'],
  ['Cap Breakers', '/cap-breakers', 'Reference finder table, ladder and category boosts.'],
  ['Badges', '/badges', 'All 53 badges, every tier, planner and gap read-outs.'],
  ['Takeovers', '/takeovers', 'Takeover requirements plus the badge glossary.'],
  ['Animations', '/animations', 'All 2,494 animations with requirement filters.'],
  ['Archetypes', '/archetypes', 'Name the build your attributes produce.'],
  ['Shades Of', '/shades', 'Player comparisons by body and attributes.'],
  ['Jumpshot Lab', '/jumpshot-lab/', 'Game-arithmetic timing trainer with 3D practice.'],
  ['Mechanics Lab', '/mechanics/', 'Badges, takeovers, gameplay, boosts and motion styles.'],
  ['Face Scan (Beta)', '/face-scan', 'On-device face scan — nothing is uploaded.'],
];

const HomeView = {
  async render({ root }) {
    const engine = await engineInfo();
    const info = routeInfo();
    const title = document.getElementById('pageTitle');
    const lede = document.getElementById('pageLede');
    if (title) title.textContent = 'Find a build';
    if (lede) lede.textContent = 'Set exact targets, a position, a height and your cap breakers. The recovered reference finder searches complete legal builds locally.';
    const finder = element('div', { id: 'finder-page' });
    root.append(
      element('p', { class: 'muted' }, [
        info.srcApp ? 'Launched as an app. ' : '',
        engine.kind === 'wasm' ? `Engine: WASM ${engine.version}.` : 'Engine: local fallback kernel.',
      ]),
      finder,
      element('h2', { class: 'title', text: 'All tools' }),
      element('section', { class: 'grid' }, tools.map(([name, href, description]) =>
        element('a', { class: 'card', href }, [element('h2', { text: name }), element('p', { class: 'muted', text: description })])
      )),
      element('p', { class: 'muted', text: 'Everything runs on your device. Your builds stay in this browser.' }),
    );
    try {
      await import('./finder-page.mjs');
    } catch {
      finder.replaceChildren(element('p', { class: 'warn', text: 'The finder could not start. Open the Find a build page instead.' }));
    }
  },
};

export { HomeView };
