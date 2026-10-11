/* 2. Bundesliga 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'GER2', name: '2. Bundesliga', country: 'Alemania', nat: 'GER', tier: 2,
    upper: 'GER1', upperRelegate: 2, promote: 2, playoff: 'ger', wealth: 0.3,
    clubs: [
      ['FC Schalke 04', 'S04', 70, 'Veltins-Arena', '#004d9d', '#ffffff'],
      ['Hertha BSC', 'BSC', 68, 'Olympiastadion', '#005ca9', '#ffffff'],
      ['VfL Bochum', 'BOC', 65, 'Vonovia Ruhrstadion', '#005ca9', '#ffffff'],
      ['Holstein Kiel', 'KSV', 64, 'Holstein-Stadion', '#0a3d91', '#e30613'],
      ['Fortuna Düsseldorf', 'F95', 63, 'Merkur Spiel-Arena', '#e30613', '#ffffff'],
      ['Hannover 96', 'H96', 63, 'Heinz-von-Heiden-Arena', '#00843d', '#000000'],
      ['1. FC Kaiserslautern', 'FCK', 63, 'Fritz-Walter-Stadion', '#e30613', '#ffffff'],
      ['1. FC Nürnberg', 'FCN', 62, 'Max-Morlock-Stadion', '#9b1b30', '#000000'],
      ['SV Darmstadt 98', 'D98', 61, 'Merck-Stadion am Böllenfalltor', '#004e9f', '#ffffff'],
      ['Karlsruher SC', 'KSC', 60, 'BBBank Wildpark', '#004e9f', '#ffffff'],
      ['Arminia Bielefeld', 'DSC', 60, 'SchücoArena', '#004e9f', '#000000'],
      ['SC Paderborn 07', 'SCP', 59, 'Home Deluxe Arena', '#005ca9', '#000000'],
      ['1. FC Magdeburg', 'FCM', 59, 'Avnet Arena', '#005ca9', '#ffffff'],
      ['Dynamo Dresden', 'SGD', 59, 'Rudolf-Harbig-Stadion', '#f7d117', '#000000'],
      ['Eintracht Braunschweig', 'EBS', 57, 'Eintracht-Stadion', '#f7d117', '#005ca9'],
      ['SpVgg Greuther Fürth', 'SGF', 57, 'Sportpark Ronhof', '#00843d', '#ffffff'],
      ['SV Elversberg', 'SVE', 56, 'Ursapharm-Arena', '#000000', '#ffffff'],
      ['Preussen Münster', 'PRM', 55, 'Preußenstadion', '#00843d', '#000000'],
    ],
  }, {
    'fc-schalke-04': [
      'Loris Karius|POR|1993|70|70|GER', 'Justin Heekeren|POR|2000|65|70|GER',
      'Nikola Katić|DFC|1996|70|70|SUI', 'Hasan Kurucay|DFC|1997|67|68|DEN', 'Timo Becker|DFC|1997|67|67|GER',
      'Ron Schallenberg|MCD|1998|68|68|GER', 'Derry Murkin|LI|1999|66|67|ENG', 'Adrian Gantenbein|LD|2001|66|68|SUI',
      'Paul Seguin|MC|1995|68|68|GER', 'Dejan Ljubičić|MC|1997|71|71|AUT',
      'Kenan Karaman|DC|1994|70|70|TUR', 'Moussa Sylla|DC|1999|69|70|MLI', 'Edin Džeko|DC|1986|72|72|BIH',
    ],
    'hertha-bsc': [
      'Tjark Ernst|POR|2003|69|76|GER',
      'Toni Leistner|DFC|1990|66|66|GER', 'Linus Gechter|DFC|2004|66|74|GER', 'Marton Dárdai|DFC|2002|67|72|HUN',
      'John Anthony Brooks|DFC|1993|68|68|USA', 'Deyovaisio Zeefuik|LD|1998|67|68|NED', 'Jonjoe Kenny|LD|1997|67|67|ENG',
      'Michal Karbownik|LI|2001|67|70|POL',
      'Diego Demme|MCD|1991|67|67|GER', 'Kevin Sessa|MC|2000|67|69|GER', 'Michael Cuisance|MCO|1999|68|69|FRA',
      'Pascal Klemens|MC|2005|62|72|GER', 'Kennet Eichhorn|MC|2009|58|80|GER',
      'Fabian Reese|EI|1997|72|72|GER', 'Marten Winkler|ED|2002|64|69|GER', 'Derry Scherhant|DC|2002|65|70|GER',
      'Dawid Kownacki|DC|1997|67|67|POL', 'Luca Schuler|DC|1999|66|67|GER',
    ],
    'vfl-bochum': [
      'Timo Horn|POR|1993|67|67|GER',
      'Erhan Mašović|DFC|1998|68|68|SRB', 'Felix Passlack|LD|1998|66|66|GER', 'Maximilian Wittek|LI|1995|67|67|GER',
      'Ibrahima Sissoko|MCD|1997|68|68|FRA', 'Matúš Bero|MC|1995|69|69|SVK', 'Koji Miyoshi|MCO|1997|67|67|JPN',
      'Philipp Hofmann|DC|1993|68|68|GER',
    ],
    'holstein-kiel': [
      'Timon Weiner|POR|1999|66|68|GER',
      'David Zec|DFC|2000|66|68|SVN', 'Max Geschwill|DFC|2001|64|67|GER', 'Patrick Erras|MCD|1995|65|65|GER',
      'Magnus Knudsen|MC|2001|65|68|NOR', 'Lewis Holtby|MCO|1990|66|66|GER', 'Finn Porath|ED|1997|65|65|GER',
      'Steven Skrzybski|DC|1992|66|66|GER', 'Phil Harres|DC|2002|66|70|GER',
    ],
    'fortuna-dusseldorf': [
      'Florian Kastenmeier|POR|1997|68|68|GER',
      'Tim Oberdorf|DFC|1996|65|65|GER', 'Andre Hoffmann|DFC|1993|65|65|GER', 'Matthias Zimmermann|LD|1992|65|65|GER',
      'Marcel Sobottka|MC|1994|65|65|GER', 'Shinta Appelkamp|MCO|2000|67|69|GER', 'Felix Klaus|ED|1992|65|65|GER',
      'Cedric Itten|DC|1996|67|67|SUI',
    ],
    'hannover-96': [
      'Marcel Halstenberg|DFC|1991|67|67|GER', 'Jannik Dehm|LD|1996|65|65|GER',
      'Enzo Leopold|MC|2000|67|68|GER', 'Benjamin Källman|DC|1994|66|66|FIN',
    ],
    '1-fc-kaiserslautern': [
      'Julian Krahl|POR|2000|65|68|GER',
      'Jan Elvedi|DFC|1996|65|65|SUI', 'Boris Tomiak|DFC|1998|66|66|GER', 'Jean Zimmer|LD|1993|64|64|GER',
      'Erik Wekesser|LI|1997|64|64|GER', 'Filip Kaloč|MC|2000|66|67|CZE', 'Marlon Ritter|MCO|1995|68|68|GER',
      'Daniel Hanslik|DC|1996|65|65|GER',
    ],
    '1-fc-nurnberg': [],
    'sv-darmstadt-98': [
      'Marcel Schuhen|POR|1993|66|66|GER',
      'Matthias Bader|LD|1997|64|64|GER', 'Fabian Nürnberger|MC|1999|66|66|GER',
      'Isac Lidberg|DC|1998|67|67|SWE', 'Fraser Hornby|DC|1999|66|67|SCO',
    ],
    'karlsruher-sc': [
      'Christoph Kobald|DFC|1997|64|64|AUT', 'Marcel Franke|DFC|1993|64|64|GER', 'Sebastian Jung|LD|1990|63|63|GER',
      'Philip Heise|LI|1991|63|63|GER', 'David Herold|LI|2003|63|69|GER', 'Leon Jensen|MC|1997|64|64|GER',
      'Marvin Wanitzek|MCO|1993|68|68|GER', 'Fabian Schleusener|DC|1991|65|65|GER',
    ],
    'arminia-bielefeld': [
      'Jonas Kersken|POR|2000|64|67|GER',
      'Maximilian Großer|DFC|2001|63|66|GER', 'Christopher Lannert|LD|1998|63|64|GER', 'Mael Corboz|MC|1994|65|65|USA',
      'Marius Wörl|MCO|2004|64|70|GER', 'Joel Grodowski|DC|1997|65|65|GER',
    ],
    'sc-paderborn-07': [
      'Felix Götze|DFC|1998|63|64|GER', 'Raphael Obermair|LD|1996|64|64|AUT', 'Sven Michel|DC|1990|63|63|GER',
    ],
    '1-fc-magdeburg': [
      'Dominik Reimann|POR|1997|65|66|GER',
      'Daniel Heber|DFC|1994|63|63|GER', 'Mohammed El Hankouri|MC|1997|65|65|MAR', 'Baris Atik|MCO|1995|68|68|GER',
      'Alexander Nollenberger|ED|1997|64|64|GER',
    ],
    'dynamo-dresden': [
      'Tim Schreiber|POR|2002|63|69|GER',
      'Niklas Hauptmann|MC|1996|63|63|GER', 'Stefan Kutschke|DC|1988|63|63|GER', 'Christoph Daferner|DC|1998|64|65|GER',
    ],
    'eintracht-braunschweig': [
      'Sven Köhler|MCD|1996|63|63|GER', 'Fabio Kaufmann|ED|1992|62|62|GER',
    ],
    'spvgg-greuther-furth': [
      'Julian Green|MC|1995|65|65|USA', 'Branimir Hrgota|DC|1993|67|67|SWE',
    ],
    'sv-elversberg': [],
    'preussen-munster': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
