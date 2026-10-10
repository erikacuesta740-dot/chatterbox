// Carga los scripts del juego en Node (mismo orden que index.html).
const path = require('path');
const FILES = [
  'js/core/util.js', 'js/data/leagues.js', 'js/data/names.js', 'js/data/values.js', 'js/data/real-rosters.js', 'js/data/rosters/esp2.js', 'js/data/rosters/eng2.js', 'js/data/rosters/ita1.js', 'js/data/rosters/ger1.js', 'js/data/rosters/fra1.js',
  'js/engine/players.js',
  'js/engine/lineup.js', 'js/data/generator.js', 'js/engine/schedule.js', 'js/engine/match.js', 'js/engine/comps.js', 'js/engine/market.js', 'js/engine/dev.js', 'js/engine/manager.js', 'js/engine/life.js',
  'js/engine/career.js',
];
const fs = require('fs');
FILES.forEach((f) => { const p = path.join(__dirname, '..', f); if (f.includes('/rosters/') && !fs.existsSync(p)) return; require(p); });
module.exports = globalThis.MCM;
module.exports.FILES = FILES;
