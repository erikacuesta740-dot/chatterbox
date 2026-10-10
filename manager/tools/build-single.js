/*
 * Empaqueta el juego en un único HTML (CSS y JS en línea).
 * Uso: node tools/build-single.js <salida.html> [--fragment]
 * --fragment omite doctype/html/head/body (para la vista previa en claude.ai, que añade su propio esqueleto).
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = process.argv[2] || path.join(root, 'dist', 'modo-carrera-manager.html');
const fragment = process.argv.includes('--fragment');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...index.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((s) => '/* ' + s + ' */\n' + fs.readFileSync(path.join(root, s), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(root, 'css/app.css'), 'utf8');
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap">';
const bodyHtml = '<div id="app"><main class="no-tabs"><p>Cargando…</p></main></div>\n<div id="sheet" class="scrim" hidden></div>\n<div id="busy" class="busy" hidden></div>\n<div id="toast" class="toast" hidden></div>\n' +
  '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\nMCM.app.start();\n</script>';
let html;
if (fragment) {
  html = '<title>Modo Carrera Manager</title>\n' + fonts + '\n<style>\n' + css + '\n</style>\n' + bodyHtml + '\n';
} else {
  html = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>Modo Carrera Manager</title>\n' +
    fonts + '\n<style>\n' + css + '\n</style>\n</head>\n<body>\n' + bodyHtml + '\n</body>\n</html>\n';
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('OK', out, Math.round(html.length / 1024) + ' KB');
