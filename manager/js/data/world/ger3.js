/* 3. Liga 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'GER3', name: '3. Liga', country: 'Alemania', nat: 'GER', tier: 3,
    upper: 'GER2', upperRelegate: 2, promote: 2, playoff: 'ger', wealth: 0.15,
    clubs: [
      ['TSV 1860 Múnich', 'M60', 56, 'Grünwalder Stadion', '#7ab2e0', '#ffffff'],
      ['Hansa Rostock', 'FCH', 55, 'Ostseestadion', '#005ca9', '#ffffff'],
      ['MSV Duisburg', 'MSV', 54, 'Schauinsland-Reisen-Arena', '#005ca9', '#ffffff'],
      ['Jahn Regensburg', 'SSV', 53, 'Jahnstadion', '#e30613', '#ffffff'],
      ['Energie Cottbus', 'FCE', 53, 'Stadion der Freundschaft', '#e30613', '#ffffff'],
      ['1. FC Saarbrücken', 'FCS', 53, 'Ludwigspark', '#005ca9', '#000000'],
      ['Rot-Weiss Essen', 'RWE', 52, 'Stadion an der Hafenstraße', '#e30613', '#ffffff'],
      ['VfL Osnabrück', 'OSN', 52, 'Bremer Brücke', '#6a2c91', '#ffffff'],
      ['SSV Ulm 1846', 'ULM', 52, 'Donaustadion', '#000000', '#ffffff'],
      ['Alemannia Aachen', 'AAC', 51, 'Tivoli', '#f7d117', '#000000'],
      ['FC Ingolstadt 04', 'FCI', 51, 'Audi Sportpark', '#000000', '#e30613'],
      ['SV Wehen Wiesbaden', 'WIE', 50, 'Brita-Arena', '#e30613', '#000000'],
      ['Waldhof Mannheim', 'WAL', 50, 'Carl-Benz-Stadion', '#005ca9', '#000000'],
      ['Erzgebirge Aue', 'AUE', 50, 'Erzgebirgsstadion', '#6a2c91', '#ffffff'],
      ['Viktoria Köln', 'VIK', 47, 'Sportpark Höhenberg', '#e30613', '#ffffff'],
      ['SC Verl', 'VER', 46, 'Sportclub Arena', '#000000', '#ffffff'],
      ['FC Schweinfurt 05', 'S05', 45, 'Sachs-Stadion', '#00843d', '#ffffff'],
      ['TSV Havelse', 'HAV', 43, 'Wilhelm-Langrehr-Stadion', '#005ca9', '#ffffff'],
      ['VfB Stuttgart II', 'VFB2', 46, 'Gazi-Stadion', '#ffffff', '#e32219'],
      ['TSG Hoffenheim II', 'TSG2', 46, 'Dietmar-Hopp-Stadion', '#1c63b7', '#ffffff'],
    ],
  }, {
    'tsv-1860-munich': [
      'Thore Jacobsen|MC|1997|62|62|GER', 'Kevin Volland|DC|1992|66|66|GER',
      'Florian Niederlechner|DC|1990|63|63|GER', 'Sigurd Haugen|DC|1997|62|62|NOR',
    ],
    'energie-cottbus': ['Tolcay Ciğerci|MC|1995|61|61|GER'],
  });
})(globalThis.MCM = globalThis.MCM || {});
