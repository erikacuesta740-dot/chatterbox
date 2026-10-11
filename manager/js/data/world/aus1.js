/* A-League Men 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'AUS1', name: 'A-League', country: 'Australia', nat: 'AUS', tier: 1,
    uefa: false, wealth: 0.15,
    clubs: [
      // [name, short, reputation, stadium, color1, color2]
      ['Melbourne City', 'MCY', 60, 'AAMI Park', '#6cace4', '#ffffff'],
      ['Auckland FC', 'AUC', 60, 'Go Media Stadium', '#000000', '#00a3e0'],
      ['Sydney FC', 'SYD', 59, 'Allianz Stadium', '#6cace4', '#002f6c'],
      ['Melbourne Victory', 'MVC', 59, 'AAMI Park', '#002f6c', '#ffffff'],
      ['Western Sydney Wanderers', 'WSW', 58, 'CommBank Stadium', '#e30613', '#000000'],
      ['Adelaide United', 'ADL', 57, 'Coopers Stadium', '#e30613', '#ffd100'],
      ['Central Coast Mariners', 'CCM', 56, 'Industree Group Stadium', '#ffd100', '#002f6c'],
      ['Macarthur FC', 'MAC', 56, 'Campbelltown Stadium', '#000000', '#c9a227'],
      ['Wellington Phoenix', 'WEL', 55, 'Sky Stadium', '#ffd100', '#000000'],
      ['Brisbane Roar', 'BRI', 54, 'Suncorp Stadium', '#f37021', '#002f6c'],
      ['Newcastle Jets', 'NEW', 54, 'McDonald Jones Stadium', '#002f6c', '#e30613'],
      ['Perth Glory', 'PER', 53, 'HBF Park', '#5b2d8e', '#f37021'],
    ],
  }, {
    'melbourne-city': [
      'Patrick Beach|POR|2003|64|70|AUS', 'Aziz Behich|LI|1990|65|65|AUS', 'Kai Trewin|DFC|2001|64|68|AUS',
      'Marco Tilio|EI|2001|65|69|AUS', 'Mathew Leckie|ED|1991|66|66|AUS',
    ],
    'auckland-fc': [
      'Michael Woud|POR|1999|65|67|NZL', 'Hiroki Sakai|LD|1990|65|65|JPN', 'Tommy Smith|DFC|1990|63|63|NZL',
      'Nando Pijnaker|DFC|1999|64|66|NZL', 'Louis Verstraete|MCD|1999|65|66|BEL', 'Cameron Howieson|MC|1994|62|62|NZL',
      'Jake Brimmer|MCO|1998|64|65|AUS', 'Felipe Gallegos|MC|1991|63|63|CHI', 'Logan Rogerson|ED|1998|64|65|NZL',
      'Neyder Moreno|EI|1997|63|64|COL', 'Guillermo May|DC|1998|64|65|URU',
    ],
    'sydney-fc': [
      'Andrew Redmayne|POR|1989|64|64|AUS', 'Rhyan Grant|LD|1991|62|62|AUS', 'Anthony Caceres|MC|1992|64|64|AUS',
      'Joe Lolley|ED|1992|66|66|ENG', 'Patrick Wood|DC|2002|63|67|AUS',
    ],
    'melbourne-victory': ['Roderick Miranda|DFC|1991|64|64|POR', 'Nishan Velupillay|EI|2001|64|68|AUS'],
    'western-sydney-wanderers': [],
    'adelaide-united': ['Ryan Kitto|LI|1994|62|62|AUS', 'Zach Clough|MCO|1995|64|64|ENG', 'Craig Goodwin|EI|1991|66|66|AUS'],
    'central-coast-mariners': [],
    'macarthur-fc': [],
    'wellington-phoenix': [],
    'brisbane-roar': [],
    'newcastle-jets': [],
    'perth-glory': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
