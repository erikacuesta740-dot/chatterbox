/* Eliteserien 2025 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'NOR1', name: 'Eliteserien', country: 'Noruega', nat: 'NOR', tier: 1,
    spots: { UCL: 1, UEL: 0, UECL: 2 }, wealth: 0.2,
    clubs: [
      ['Bodø/Glimt', 'BOD', 70, 'Aspmyra Stadion', '#ffd200', '#000000'],
      ['Brann', 'BRA', 62, 'Brann Stadion', '#e30613', '#ffffff'],
      ['Molde', 'MOL', 63, 'Aker Stadion', '#003da5', '#ffffff'],
      ['Rosenborg', 'RBK', 60, 'Lerkendal Stadion', '#000000', '#ffffff'],
      ['Viking', 'VIK', 60, 'SR-Bank Arena', '#003da5', '#ffffff'],
      ['Vålerenga', 'VIF', 57, 'Intility Arena', '#003da5', '#e30613'],
      ['Fredrikstad', 'FFK', 55, 'Nye Fredrikstad Stadion', '#ffffff', '#e30613'],
      ['Sarpsborg 08', 'S08', 54, 'Sarpsborg Stadion', '#003da5', '#ffffff'],
      ['Tromsø IL', 'TIL', 55, 'Romssa Arena', '#e30613', '#ffffff'],
      ['Sandefjord', 'SAN', 50, 'Release Arena', '#003da5', '#ffffff'],
      ['Strømsgodset', 'SIF', 52, 'Marienlyst Stadion', '#00a3e0', '#ffffff'],
      ['HamKam', 'HAM', 51, 'Briskeby Arena', '#00843d', '#ffffff'],
      ['KFUM Oslo', 'KFU', 50, 'KFUM Arena', '#ffffff', '#e30613'],
      ['Kristiansund BK', 'KBK', 50, 'Kristiansund Stadion', '#003da5', '#ffffff'],
      ['FK Haugesund', 'FKH', 51, 'Haugesund Stadion', '#003da5', '#ffffff'],
      ['Bryne FK', 'BRY', 48, 'Bryne Stadion', '#e30613', '#ffffff'],
    ],
  }, {
    'bod-glimt': [
      'Nikita Haikin|POR|1995|71|71|ISR', 'Julian Lund|POR|1999|63|65|NOR',
      'Odin Bjørtuft|DFC|1998|70|71|NOR', 'Haitam Aleesami|DFC|1991|68|68|NOR', 'Jostein Gundersen|DFC|1996|69|69|NOR',
      'Villads Nielsen|DFC|2001|67|70|DEN', 'Brede Moe|DFC|1991|65|65|NOR', 'Fredrik Sjøvold|LD|2003|67|72|NOR',
      'Fredrik Bjørkan|LI|1998|70|71|NOR', 'Patrick Berg|MCD|1997|73|74|NOR', 'Håkon Evjen|MC|2000|72|74|NOR',
      'Ulrik Saltnes|MC|1992|69|69|NOR', 'Sondre Brunstad Fet|MC|1997|71|71|NOR', 'Isak Dybvik Määttä|MC|2001|66|69|NOR',
      'Jens Petter Hauge|ED|1999|74|75|NOR', 'Ole Didrik Blomberg|EI|2000|69|71|NOR', 'Sondre Auklend|MCO|2003|64|70|NOR',
      'Kasper Høgh|DC|2000|72|73|DEN', 'Andreas Helmersen|DC|2001|65|69|NOR',
    ],
    'molde': [
      'Jacob Karlstrøm|POR|1997|66|67|NOR', 'Martin Bjørnbak|DFC|1992|66|66|NOR', 'Eirik Haugan|DFC|1997|67|68|NOR',
      'Kristoffer Haugen|LI|1994|66|66|NOR', 'Martin Linnes|LD|1991|65|65|NOR', 'Emil Breivik|MC|2000|67|69|NOR',
      'Magnus Wolff Eikrem|MCO|1990|67|67|NOR', 'Mats Møller Dæhli|MCO|1995|67|67|NOR', 'Halldór Stenevik|EI|2000|64|67|NOR',
      'Magnus Grødem|ED|1998|67|68|NOR', 'Eric Kitolano|MC|1997|65|65|NOR', 'Fredrik Gulbrandsen|DC|1992|66|66|NOR',
      'Veton Berisha|DC|1994|66|66|NOR',
    ],
    'rosenborg': [
      'Ulrik Yttergård Jenssen|DFC|1996|66|66|NOR', 'Adrian Pereira|LI|1999|66|67|NOR',
      'Erlend Dahl Reitan|LD|1997|66|66|NOR', 'Ole Selnæs|MC|1994|68|68|NOR', 'Edvard Tagseth|MC|2001|65|68|NOR',
      'Noah Holm|DC|2001|65|68|NOR',
    ],
    'brann': [
      'Mathias Dyngeland|POR|1995|67|67|NOR', 'Fredrik Pallesen Knudsen|DFC|1996|66|66|NOR', 'Ruben Kristiansen|LI|1988|62|62|NOR',
      'Denzel De Roeve|LD|2004|65|72|BEL', 'Felix Horn Myhre|MC|1999|68|69|NOR', 'Emil Kornvig|MC|2000|66|68|DEN',
      'Eggert Aron Guðmundsson|MCO|2004|65|72|ISL', 'Bård Finne|ED|1995|67|67|NOR', 'Sævar Atli Magnússon|DC|2000|66|68|ISL',
      'Joachim Soltvedt|ED|2000|64|66|NOR',
    ],
    'viking': [
      'Zlatko Tripić|MCO|1992|67|67|NOR', 'Kristoffer Løkberg|MC|1992|65|65|NOR',
    ],
    'troms-il': [
      'Jakob Haugaard|POR|1992|63|63|DEN',
    ],
    'valerenga': [], 'fredrikstad': [], 'sarpsborg-08': [], 'sandefjord': [], 'str-msgodset': [], 'hamkam': [],
    'kfum-oslo': [], 'kristiansund-bk': [], 'fk-haugesund': [], 'bryne-fk': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
