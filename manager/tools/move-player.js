#!/usr/bin/env node
/* Mueve un jugador real de un club a otro en los archivos de datos. Uso: node tools/move-player.js "Nombre" club-origen club-destino */
const fs = require('fs');
const path = require('path');
const [name, from, to] = process.argv.slice(2);
const root = path.join(__dirname, '..');
const files = ['js/data/real-rosters.js'].concat(...['js/data/rosters', 'js/data/world'].map((d) => fs.readdirSync(path.join(root, d)).map((f) => d + '/' + f)));
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const keyAt = (s, k) => { let i = s.indexOf("'" + k + "': ["); if (i >= 0) return [i, i + k.length + 5]; const m = new RegExp('(^|\\s)' + k.replace(/-/g, '\\-') + ': \\[', 'm').exec(s); return m ? [m.index, m.index + m[0].length] : null; };
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let line = null;
for (const f of files) {
  let s = read(f);
  const at = keyAt(s, from);
  if (!at) continue;
  const k = at[0];
  const end = s.indexOf(']', k);
  const block = s.slice(k, end);
  const m = block.match(new RegExp("'(" + esc(name) + "\\|[^']*)',?\\s*"));
  if (!m) continue;
  line = m[1];
  s = s.slice(0, k) + block.replace(m[0], '') + s.slice(end);
  fs.writeFileSync(path.join(root, f), s);
  break;
}
if (!line) { console.error('No encontrado: ' + name + ' en ' + from); process.exit(1); }
for (const f of files) {
  let s = read(f);
  const at = keyAt(s, to);
  if (!at) continue;
  const open = at[1];
  s = s.slice(0, open) + "\n      '" + line.replace(/'/g, "\\'") + "'," + s.slice(open);
  fs.writeFileSync(path.join(root, f), s);
  console.log('Movido:', line, from, '→', to, '(' + f + ')');
  process.exit(0);
}
console.error('Club destino no encontrado: ' + to);
process.exit(1);
