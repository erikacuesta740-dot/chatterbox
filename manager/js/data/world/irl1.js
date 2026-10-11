/* League of Ireland Premier Division 2025 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'IRL1', name: 'League of Ireland', country: 'Irlanda', nat: 'IRL', tier: 1,
    spots: { UCL: 0, UEL: 0, UECL: 1 }, wealth: 0.12,
    clubs: [
      ['Shamrock Rovers', 'SHR', 58, 'Tallaght Stadium', '#00843d', '#ffffff'],
      ['Shelbourne', 'SHE', 52, 'Tolka Park', '#e30613', '#ffffff'],
      ['Derry City', 'DER', 52, 'Brandywell Stadium', '#e30613', '#ffffff'],
      ['Bohemians', 'BOH', 50, 'Dalymount Park', '#e30613', '#000000'],
      ["St Patrick's Athletic", 'STP', 51, 'Richmond Park', '#e30613', '#ffffff'],
      ['Galway United', 'GAL', 47, 'Eamonn Deacy Park', '#8b0000', '#ffffff'],
      ['Sligo Rovers', 'SLI', 46, 'The Showgrounds', '#ffffff', '#e30613'],
      ['Drogheda United', 'DRO', 45, 'Weaver\'s Park', '#003da5', '#e30613'],
      ['Waterford FC', 'WAT', 45, 'RSC', '#003da5', '#ffffff'],
      ['Cork City', 'COR', 46, "Turner's Cross", '#00843d', '#ffffff'],
    ],
  }, {
    'shamrock-rovers': [
      'Leon Pöhls|POR|1996|60|60|GER', 'Roberto Lopes|DFC|1992|62|62|CPV', 'Dan Cleary|DFC|1996|61|61|IRL',
      'Lee Grace|DFC|1992|60|60|IRL', 'Josh Honohan|DFC|2001|60|63|IRL', 'Markus Poom|MC|1999|62|63|EST',
      "Gary O'Neill|MC|2002|61|65|IRL", 'Dylan Watts|MC|1997|62|62|IRL', 'Connor Malley|MC|2000|60|62|ENG',
      'Graham Burke|MCO|1993|63|63|IRL', 'Neil Farrugia|ED|1999|61|62|IRL', 'Trevor Clarke|EI|1998|61|62|IRL',
      'Aaron Greene|DC|1990|61|61|IRL', 'Rory Gaffney|DC|1989|61|61|IRL',
    ],
    'shelbourne': [
      'Conor Kearns|POR|1998|59|60|IRL', 'Paddy Barrett|DFC|1993|59|59|IRL', 'Mark Coyle|MC|1997|60|60|SCO',
      'Will Jarvis|ED|2002|58|61|ENG', 'Harry Wood|MCO|2002|59|62|ENG', 'Sean Boyd|DC|1998|59|60|IRL',
    ],
    'derry-city': [
      'Brian Maher|POR|2000|60|62|IRL', 'Mark Connolly|DFC|1991|59|59|IRL', 'Will Patching|MC|1998|60|61|ENG',
      'Michael Duffy|EI|1994|61|61|IRL', 'Patrick Hoban|DC|1991|60|60|IRL',
    ],
    'st-patrick-s-athletic': [
      'Joseph Anang|POR|2000|60|62|GHA', 'Jamie Lennon|MCD|1998|59|60|IRL', 'Chris Forrester|MCO|1992|61|61|IRL',
    ],
    'bohemians': [
      'James Clarke|LD|1989|57|57|IRL',
    ],
    'galway-united': [], 'sligo-rovers': [], 'drogheda-united': [], 'waterford-fc': [], 'cork-city': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
