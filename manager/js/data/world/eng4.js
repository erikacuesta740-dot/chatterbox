/* League Two 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'ENG4', name: 'League Two', country: 'Inglaterra', nat: 'ENG', tier: 4,
    upper: 'ENG3', upperRelegate: 4, promote: 3, playoff: 'eng', playoffFrom: 4, wealth: 0.12,
    clubs: [
      ['MK Dons', 'MKD', 50, 'Stadium MK', '#ffffff', '#000000'],
      ['Bristol Rovers', 'BRR', 49, 'Memorial Stadium', '#0033a0', '#ffffff'],
      ['Walsall', 'WAL', 48, 'Bescot Stadium', '#e2001a', '#ffffff'],
      ['Notts County', 'NCO', 48, 'Meadow Lane', '#000000', '#ffffff'],
      ['Cambridge United', 'CAM', 48, 'Abbey Stadium', '#f5a12d', '#000000'],
      ['Salford City', 'SAL', 48, 'Peninsula Stadium', '#e2001a', '#ffffff'],
      ['Chesterfield', 'CHF', 47, 'SMH Group Stadium', '#0033a0', '#ffffff'],
      ['Grimsby Town', 'GRI', 47, 'Blundell Park', '#000000', '#ffffff'],
      ['Colchester United', 'COL', 47, 'Colchester Community Stadium', '#0055a5', '#ffffff'],
      ['Swindon Town', 'SWI', 47, 'County Ground', '#e2001a', '#ffffff'],
      ['Gillingham', 'GIL', 47, 'Priestfield Stadium', '#0033a0', '#ffffff'],
      ['Crawley Town', 'CRA', 46, 'Broadfield Stadium', '#e2001a', '#ffffff'],
      ['Shrewsbury Town', 'SHR', 46, 'New Meadow', '#0033a0', '#f5a12d'],
      ['Oldham Athletic', 'OLD', 46, 'Boundary Park', '#0033a0', '#ffffff'],
      ['Crewe Alexandra', 'CRE', 46, 'Gresty Road', '#e2001a', '#ffffff'],
      ['Tranmere Rovers', 'TRA', 46, 'Prenton Park', '#ffffff', '#0033a0'],
      ['Fleetwood Town', 'FLE', 45, 'Highbury Stadium', '#e2001a', '#ffffff'],
      ['Bromley', 'BRO', 45, 'Hayes Lane', '#ffffff', '#000000'],
      ['Cheltenham Town', 'CHT', 44, 'Whaddon Road', '#e2001a', '#ffffff'],
      ['Barrow', 'BRW', 44, 'Holker Street', '#0033a0', '#ffffff'],
      ['Newport County', 'NPT', 43, 'Rodney Parade', '#f5a12d', '#000000'],
      ['Barnet', 'BNT', 43, 'The Hive', '#f7a600', '#000000'],
      ['Accrington Stanley', 'ACC', 42, 'Crown Ground', '#e2001a', '#ffffff'],
      ['Harrogate Town', 'HAR', 41, 'Wetherby Road', '#fdd20e', '#000000'],
    ],
  }, {
    'mk-dons': [
      'Craig MacGillivray|POR|1993|61|61|SCO',
      'Luke Offord|DFC|1999|61|62|ENG', 'Jack Sanders|DFC|1999|61|62|ENG', 'Laurence Maguire|DFC|1997|60|60|ENG',
      'Joe Tomlinson|LI|2000|61|63|ENG',
      'Alex Gilbey|MC|1994|61|61|ENG', 'Aaron Nemane|ED|1997|61|61|ENG',
      'Callum Paterson|DC|1994|62|62|SCO', 'Scott Hogan|DC|1992|61|61|IRL', 'Matt Dennis|DC|2002|60|64|ENG',
    ],
    'bristol-rovers': [
      'Jed Ward|POR|2003|59|65|ENG',
      'Promise Omochere|DC|2000|60|63|IRL',
    ],
    'walsall': [
      'Albert Adomah|ED|1987|58|58|GHA', 'Jamille Matt|DC|1989|59|59|JAM',
    ],
    'notts-county': [
      'Lewis Macari|DFC|2002|59|63|SCO',
      'Matt Palmer|MC|1993|60|60|ENG', 'Jodi Jones|ED|1997|61|61|ENG',
    ],
    'cambridge-united': [
      'Jack Stevens|POR|1997|60|60|ENG',
      'Michael Morrison|DFC|1988|58|58|ENG',
      'Paul Digby|MC|1995|59|59|ENG', 'James Brophy|EI|1994|60|60|ENG',
    ],
    'salford-city': [
      'Ossama Ashley|MC|2000|60|62|ENG', 'Kelly N\'Mai|ED|2003|60|65|ENG',
    ],
    'chesterfield': [
      'Jamie Grimes|DFC|1990|59|59|ENG', 'Kyle McFadzean|DFC|1987|58|58|ENG',
      'Tom Naylor|MCD|1991|60|60|ENG', 'Ollie Banks|MC|1992|59|59|ENG',
      'Liam Mandeville|MCO|1997|61|61|ENG', 'Armando Dobra|ED|2001|61|63|ALB', 'Dilan Markanday|ED|2001|60|63|ENG',
    ],
    'grimsby-town': [
      'Christy Pym|POR|1995|60|60|ENG',
      'Tyrell Warren|LD|1998|59|59|ENG', 'Harvey Rodgers|DFC|1996|59|59|ENG', 'Cameron McJannet|DFC|2002|59|62|ENG',
      'Kieran Green|MC|1997|60|60|ENG', 'George McEachran|MC|2000|60|61|ENG', 'Evan Khouri|MC|2003|59|63|ENG',
      'Darragh Burns|ED|2002|60|64|IRL', 'Charles Vernam|EI|1996|61|61|ENG',
      'Jaze Kabia|DC|2005|59|66|IRL', 'Danny Rose|DC|1993|60|60|ENG',
    ],
    'colchester-united': [
      'Matt Macey|POR|1994|60|60|ENG',
      'Tom Flanagan|DFC|1991|58|58|NIR', 'Arthur Read|MC|1999|60|61|ENG',
      'Jack Payne|MCO|1994|61|61|ENG', 'Samson Tovide|DC|2003|60|65|ENG',
    ],
    'swindon-town': [
      'Lewis Ward|POR|1997|59|59|ENG',
      'Gavin Kilkenny|MC|1999|59|60|IRL', 'Ollie Clarke|MC|1992|59|59|ENG',
    ],
    'gillingham': [
      'Glenn Morris|POR|1983|57|57|ENG',
      'Remeao Hutton|LD|1998|59|59|ENG', 'Shadrach Ogie|DFC|2001|59|62|IRL', 'Conor Masterson|DFC|1998|60|60|IRL',
      'Robbie McKenzie|MC|1998|60|60|ENG', 'Armani Little|MC|1997|60|60|ENG', 'Jonny Williams|MCO|1993|60|60|WAL',
      'Elliott Nevitt|DC|1996|59|59|ENG', 'Josh Andrews|DC|2001|59|62|ENG',
    ],
    'crawley-town': [
      'Dion Conroy|DFC|1995|58|58|ENG',
    ],
    'shrewsbury-town': [],
    'oldham-athletic': [
      'Mark Kitching|LI|1995|58|58|ENG',
    ],
    'crewe-alexandra': [
      'Ryan Cooney|LD|2000|59|60|ENG', 'Mickey Demetriou|DFC|1990|59|59|ENG', 'Owen Lunt|DFC|2003|58|62|ENG',
      'Lewis Billington|DFC|2004|58|63|ENG',
      'Max Sanders|MC|1999|60|60|ENG', 'Conor Thomas|MC|1993|59|59|ENG', 'Joel Tabiner|MC|2003|58|62|ENG',
      'Shilow Tracey|ED|1998|59|59|ENG', 'Chris Long|DC|1995|59|59|ENG',
    ],
    'tranmere-rovers': [
      'Luke McGee|POR|1995|59|59|ENG',
      'Lee O\'Connor|LD|2000|59|60|IRL',
      'Sam Finley|MC|1992|59|59|ENG', 'Josh Hawkes|MCO|1998|60|60|ENG',
      'Omari Patrick|DC|1996|59|59|ENG',
    ],
    'fleetwood-town': [
      'Jay Lynch|POR|1993|58|58|ENG',
      'Shaun Rooney|DFC|1996|58|58|SCO',
    ],
    'bromley': [
      'Grant Smith|POR|1994|59|59|ENG',
      'Byron Webster|DFC|1987|57|57|ENG', 'Idris Odutayo|LI|1999|58|59|ENG',
      'Ashley Charles|MC|1996|58|58|ENG', 'Corey Whitely|ED|1991|58|58|ENG',
      'Michael Cheek|DC|1991|60|60|ENG',
    ],
    'cheltenham-town': [
      'Liam Kinsella|MC|1996|57|57|ENG',
    ],
    'barrow': [
      'Niall Canavan|DFC|1991|57|57|IRL',
    ],
    'newport-county': [],
    'barnet': [],
    'accrington-stanley': [
      'Farrend Rawson|DFC|1996|57|57|ENG',
      'Seamus Conneely|MC|1988|56|56|IRL', 'Tommy Leigh|MCO|2000|58|59|ENG',
    ],
    'harrogate-town': [
      'James Belshaw|POR|1990|57|57|ENG',
      'Warren Burrell|DFC|1990|56|56|ENG', 'Anthony O\'Connor|DFC|1992|57|57|IRL',
    ],
  });
})(globalThis.MCM = globalThis.MCM || {});
