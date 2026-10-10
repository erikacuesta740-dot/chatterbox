// Carga los scripts del juego en Node (mismo orden que index.html).
const path = require('path');
const FILES = [
  'js/core/util.js', 'js/data/leagues.js', 'js/data/names.js', 'js/data/values.js', 'js/data/real-rosters.js', 'js/engine/players.js',
  'js/engine/lineup.js', 'js/data/generator.js', 'js/engine/schedule.js', 'js/engine/match.js', 'js/engine/comps.js', 'js/engine/market.js', 'js/engine/dev.js', 'js/engine/manager.js',
  'js/engine/career.js',
];
FILES.forEach((f) => require(path.join(__dirname, '..', f)));
module.exports = globalThis.MCM;
module.exports.FILES = FILES;
