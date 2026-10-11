#!/usr/bin/env node
/* Actualiza index.html y sw.js con los archivos de js/data/rosters/ y js/data/world/ (en ese orden). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const list = (d) => (fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith('.js')).sort().map((f) => d + '/' + f) : []);
const data = list('js/data/rosters').concat(list('js/data/world'));
let index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
index = index.replace(/\n<script src="js\/data\/(rosters|world)\/[^"]+"><\/script>/g, '');
index = index.replace('<script src="js/data/real-rosters.js"></script>', '<script src="js/data/real-rosters.js"></script>' + data.map((f) => '\n<script src="' + f + '"></script>').join(''));
fs.writeFileSync(path.join(root, 'index.html'), index);
const scripts = [...index.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const files = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', 'icons/icon.svg'].concat(scripts);
let sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
sw = sw.replace(/const FILES = \[[\s\S]*?\];/, 'const FILES = ' + JSON.stringify(files).replace(/","/g, '", "') + ';');
sw = sw.replace(/mcm-v(\d+)/, (m, n) => 'mcm-v' + (Number(n) + 1));
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log(data.length + ' archivos de datos enlazados');
