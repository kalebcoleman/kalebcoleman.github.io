import { LeagueView as Base } from './league-core.js';
import { r as c } from './shell-DuKJJrzf.js';

const KEY = 'fb_my_games';

function readGames() {
  try {
    const games = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(games) ? games : [];
  } catch {
    return [];
  }
}

function table(headers, rows) {
  return c('div', { class: 'tbl-wrap', role: 'region', tabindex: '0', 'aria-label': 'League table' }, [
    c('table', { class: 'tbl' }, [
      c('thead', {}, [c('tr', {}, headers.map(label => c('th', { text: label })))]),
      c('tbody', {}, rows.length ? rows.map(row => c('tr', {}, row.map(value => c('td', { text: String(value) })))) : [c('tr', {}, [c('td', { text: 'No games yet. Add a sample game or read a box score.' })])]),
    ]),
  ]);
}

function extras() {
  const games = readGames();
  const wins = games.filter(game => game.win).length;
  const average = key => games.length ? games.reduce((sum, game) => sum + (Number(game[key]) || 0), 0) / games.length : 0;
  const modes = [...new Set(games.map(game => game.mode || 'REC'))];
  const standings = modes.map(mode => {
    const modeGames = games.filter(game => (game.mode || 'REC') === mode);
    const modeWins = modeGames.filter(game => game.win).length;
    return [mode, modeGames.length, modeWins, modeGames.length - modeWins, modeGames.length ? (modeGames.reduce((sum, game) => sum + (Number(game.pts) || 0), 0) / modeGames.length).toFixed(1) : '0.0'];
  });
  const leaders = [['Points', 'pts'], ['Rebounds', 'reb'], ['Assists', 'ast'], ['Steals', 'stl'], ['Blocks', 'blk']].map(([label, key]) => {
    const best = games.reduce((top, game) => (Number(game[key]) || 0) > (Number(top[key]) || 0) ? game : top, { [key]: 0, at: '—' });
    return [label, best[key], best.at || '—'];
  });
  const challenges = [
    ['Play 10 games', games.length, 10],
    ['Win 5 games', wins, 5],
    ['Score 30+ in 3 games', games.filter(game => (Number(game.pts) || 0) >= 30).length, 3],
    ['Average 20+ points', Math.round(average('pts')), 20],
    ['Average 5+ assists', Math.round(average('ast')), 5],
  ];
  return c('div', { class: 'grid' }, [
    c('section', { class: 'panel' }, [c('h2', { text: 'Season board' }), c('p', { class: 'muted', text: 'Local standings from this browser\'s game log.' }), table(['Mode', 'GP', 'W', 'L', 'PPG'], standings)]),
    c('section', { class: 'panel' }, [c('h2', { text: 'Leaders' }), c('p', { class: 'muted', text: 'Best single game in each category.' }), table(['Category', 'Best', 'Date'], leaders)]),
    c('section', { class: 'panel' }, [c('h2', { text: 'Challenges' }), c('p', { class: 'muted', text: 'Local season goals. They reset when you clear this browser\'s league games.' }), c('ul', { class: 'list' }, challenges.map(([label, have, need]) => c('li', { class: have >= need ? 'ok' : 'muted', text: `${label}: ${Math.min(have, need)} / ${need}${have >= need ? ' ✓' : ''}` })))])]);
}

export const LeagueView = {
  async render(context) {
    await Base.render(context);
    const host = c('div');
    context.root.append(host);
    const paint = () => host.replaceChildren(extras());
    paint();
    const add = [...context.root.querySelectorAll('button')].find(button => /Add sample game/i.test(button.textContent || ''));
    add?.addEventListener('click', () => setTimeout(paint, 0));
  },
};
