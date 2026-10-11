// Carga los scripts del juego en Node (mismo orden que index.html).
const path = require('path');
const FILES = [
  'js/core/util.js', 'js/data/leagues.js', 'js/data/names.js', 'js/data/values.js', 'js/data/real-rosters.js', 'js/engine/players.js',
  'js/engine/lineup.js', 'js/data/generator.js', 'js/engine/schedule.js', 'js/engine/match.js', 'js/engine/comps.js', 'js/engine/market.js', 'js/engine/dev.js', 'js/engine/manager.js', 'js/engine/life.js',
  'js/engine/career.js', 'js/engine/online.js',
];
const fs = require('fs');
// Ligas añadidas (js/data/world/*.js), justo después de las plantillas.
const ROSTERS = fs.existsSync(path.join(__dirname, '..', 'js/data/rosters')) ? fs.readdirSync(path.join(__dirname, '..', 'js/data/rosters')).filter((f) => f.endsWith('.js')).sort().map((f) => 'js/data/rosters/' + f) : [];
const WORLD = fs.existsSync(path.join(__dirname, '..', 'js/data/world')) ? fs.readdirSync(path.join(__dirname, '..', 'js/data/world')).filter((f) => f.endsWith('.js')).sort().map((f) => 'js/data/world/' + f) : [];
FILES.splice(FILES.indexOf('js/engine/players.js'), 0, ...ROSTERS, ...WORLD);
FILES.forEach((f) => { const p = path.join(__dirname, '..', f); if (f.includes('/rosters/') && !fs.existsSync(p)) return; require(p); });
module.exports = globalThis.MCM;
module.exports.FILES = FILES;
