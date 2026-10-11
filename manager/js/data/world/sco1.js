/* Scottish Premiership 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'SCO1', name: 'Scottish Premiership', country: 'Escocia', nat: 'SCO', tier: 1,
    spots: { UCL: 1, UEL: 1, UECL: 1 }, wealth: 0.3,
    clubs: [
      ['Celtic', 'CEL', 74, 'Celtic Park', '#018749', '#ffffff'],
      ['Rangers', 'RAN', 72, 'Ibrox', '#1b458f', '#ffffff'],
      ['Hearts', 'HEA', 63, 'Tynecastle', '#7a1f3d', '#ffffff'],
      ['Aberdeen', 'ABE', 60, 'Pittodrie', '#e30613', '#ffffff'],
      ['Hibernian', 'HIB', 60, 'Easter Road', '#006b3f', '#ffffff'],
      ['Dundee United', 'DUN', 55, 'Tannadice Park', '#f58220', '#000000'],
      ['Motherwell', 'MOT', 54, 'Fir Park', '#f4a900', '#7a1f3d'],
      ['St Mirren', 'STM', 54, 'SMiSA Stadium', '#000000', '#ffffff'],
      ['Kilmarnock', 'KIL', 54, 'Rugby Park', '#003da5', '#ffffff'],
      ['Dundee', 'DND', 52, 'Dens Park', '#0b1f4f', '#ffffff'],
      ['Falkirk', 'FAL', 50, 'Falkirk Stadium', '#002f6c', '#ffffff'],
      ['Livingston', 'LIV', 50, 'Almondvale', '#f2c500', '#000000'],
    ],
  }, {
    celtic: [
      'Kasper Schmeichel|POR|1986|76|76|DEN', 'Viljami Sinisalo|POR|2001|68|73|FIN',
      'Alistair Johnston|LD|1998|75|76|CAN', 'Anthony Ralston|LD|1998|68|68|SCO', 'Cameron Carter-Vickers|DFC|1997|76|76|USA',
      'Liam Scales|DFC|1998|72|73|IRL', 'Auston Trusty|DFC|1998|72|73|USA', 'Hayato Inamura|DFC|2002|66|71|JPN',
      'Jahmai Simpson-Pusey|DFC|2005|66|76|ENG', 'Kieran Tierney|LI|1997|74|74|SCO', 'Colby Donovan|LD|2006|60|70|USA',
      'Callum McGregor|MC|1993|76|76|SCO', 'Arne Engels|MC|2003|75|80|BEL', 'Reo Hatate|MC|1997|75|75|JPN',
      'Paulo Bernardo|MC|2002|71|75|POR', 'Luke McCowan|MCO|1997|70|70|SCO', 'Benjamin Nygren|MCO|2001|74|76|SWE',
      'Daizen Maeda|EI|1997|77|77|JPN', 'Jota|ED|1999|74|74|POR', 'Hyun-jun Yang|ED|2002|68|72|KOR',
      'Sebastian Tounekti|ED|2002|70|75|TUN', 'Michel-Ange Balikwisha|EI|2001|70|73|BEL',
      'Kelechi Iheanacho|DC|1996|73|73|NGA', 'Johnny Kenny|DC|2003|69|74|IRL', 'Callum Osmand|DC|2005|62|70|ENG',
    ],
    rangers: [
      'Jack Butland|POR|1993|75|75|ENG', 'Liam Kelly|POR|1996|66|66|SCO',
      'James Tavernier|LD|1991|73|73|ENG', 'Max Aarons|LD|2000|71|72|ENG', 'Dujon Sterling|LD|1999|69|70|ENG',
      'John Souttar|DFC|1996|71|71|SCO', 'Robin Pröpper|DFC|1993|71|71|NED', 'Emmanuel Fernandez|DFC|2001|68|72|ENG',
      'Nasser Djiga|DFC|2002|70|75|BFA', 'Jayden Meghoma|LI|2006|65|74|ENG', 'Ridvan Yılmaz|LI|2001|69|72|TUR',
      'Connor Barron|MCD|2002|70|74|SCO', 'Nicolas Raskin|MC|2001|72|74|BEL', 'Mohamed Diomande|MC|2001|73|76|CIV',
      'Joe Rothwell|MC|1995|68|68|ENG', 'Lyall Cameron|MC|2003|67|72|SCO', 'Thelo Aasgaard|MCO|2002|70|74|NOR',
      'Kieran Dowell|MCO|1997|67|67|ENG', 'Oliver Antman|ED|2001|70|73|FIN', 'Djeidi Gassama|EI|2003|71|76|FRA',
      'Mikey Moore|EI|2007|68|80|ENG', 'Danilo|DC|1999|70|71|BRA', 'Cyriel Dessers|DC|1994|71|71|NGA',
      'Bojan Miovski|DC|1999|70|71|MKD', 'Youssef Chermiti|DC|2004|69|76|POR',
    ],
    hearts: [
      'Alexander Schwolow|POR|1992|69|69|GER', 'Craig Gordon|POR|1982|65|65|SCO',
      'Frankie Kent|DFC|1995|66|66|ENG', 'Craig Halkett|DFC|1995|66|66|SCO', 'Stuart Findlay|DFC|1995|66|66|SCO',
      'Michael Steinwender|DFC|2000|65|67|AUT', 'Christian Borchgrevink|LD|1999|65|67|NOR', 'Stephen Kingsley|LI|1994|66|66|SCO',
      'Harry Milne|LI|1999|63|65|SCO', 'Cameron Devlin|MCD|1998|67|67|AUS', 'Beni Baningime|MCD|1998|67|67|COD',
      'Calem Nieuwenhof|MC|2001|66|69|AUS', 'Sander Kartum|MC|2003|64|70|NOR', 'Blair Spittal|MCO|1995|66|66|SCO',
      'Alan Forrest|ED|1996|65|65|SCO', 'Elton Kabangu|EI|2000|67|69|BEL', 'Pierre Landry Kaboré|DC|2006|63|73|BFA',
      'Claudio Braga|DC|1999|68|70|POR', 'Lawrence Shankland|DC|1995|69|69|SCO',
    ],
    aberdeen: [
      'Dimitar Mitov|POR|1997|67|68|BUL',
      'Nicky Devlin|LD|1993|65|65|SCO', 'Jack Milne|DFC|2003|63|68|SCO', 'Gavin Molloy|DFC|2001|65|68|IRL',
      'Mats Knoester|DFC|1999|66|67|NED', 'Alexander Jensen|LI|2002|65|69|SWE', 'Graeme Shinnie|MCD|1991|66|66|SCO',
      'Dante Polvara|MC|2000|65|67|USA', 'Ante Palaversa|MC|2000|66|68|CRO', 'Leighton Clarkson|MCO|2001|67|69|ENG',
      'Topi Keskinen|EI|2003|66|71|FIN', 'Shayden Morris|ED|2001|64|67|ENG', 'Nicolas Milanovic|ED|2001|64|67|AUS',
      'Kevin Nisbet|DC|1997|66|66|SCO', 'Pape Habib Gueye|DC|1999|66|67|SEN', 'Ester Sokler|DC|1999|64|65|SVN',
    ],
    hibernian: [
      'Raphael Sallinger|POR|1995|66|66|AUT',
      'Lewis Miller|LD|2000|65|67|AUS', 'Chris Cadden|LD|1996|65|65|SCO', 'Warren O\'Hora|DFC|1999|65|66|IRL',
      'Rocky Bushiri|DFC|1999|65|66|COD', 'Jack Iredale|DFC|1996|64|64|AUS', 'Grant Hanley|DFC|1991|67|67|SCO',
      'Nicky Cadden|LI|1996|65|65|IRL', 'Joe Newell|MC|1993|65|65|ENG', 'Dylan Levitt|MC|2000|65|67|WAL',
      'Josh Campbell|MC|2000|65|66|SCO', 'Miguel Chaiwa|MCD|2004|62|69|ZAM', 'Jamie McGrath|MCO|1996|66|66|IRL',
      'Martin Boyle|ED|1993|67|67|AUS', 'Junior Hoilett|EI|1990|63|63|CAN', 'Kieron Bowie|DC|2002|66|70|SCO',
      'Thibault Klidjé|DC|2001|64|67|TOG',
    ],
    'dundee-united': [
      'Jack Walton|POR|1998|63|64|ENG',
      'Ryan Strain|LD|1997|63|63|AUS', 'Ross Graham|DFC|2001|63|66|SCO', 'Kevin Holt|DFC|1993|62|62|SCO',
      'Will Ferry|LI|2000|63|65|IRL', 'Vicko Ševelj|MCD|2000|64|66|CRO', 'Craig Sibbald|MC|1995|62|62|SCO',
      'David Babunski|MCO|1994|64|64|MKD', 'Ivan Dolček|ED|1999|64|65|CRO', 'Zac Sapsford|DC|2002|62|66|AUS',
    ],
    motherwell: [
      'Calum Ward|POR|2000|61|64|ENG',
      'Stephen O\'Donnell|LD|1992|62|62|SCO', 'Paul McGinn|DFC|1990|62|62|SCO', 'Liam Gordon|DFC|1999|62|63|SCO',
      'Elliot Watt|MC|2000|64|66|SCO', 'Lukas Fadinger|MC|2000|63|65|AUT', 'Tom Sparrow|MC|2002|61|65|WAL',
      'Tawanda Maswanhise|ED|2002|65|69|ZIM', 'Apostolos Stamatelopoulos|DC|1999|63|64|AUS',
    ],
    'st-mirren': [
      'Marcus Fraser|LD|1994|62|62|SCO', 'Keanu Baccus|MC|1998|63|64|AUS', 'Mark O\'Hara|MC|1995|63|63|SCO',
      'Conor McMenamin|ED|1995|62|62|NIR', 'Mikael Mandron|DC|1994|62|62|FRA',
    ],
    kilmarnock: [
      'Robbie Deas|DFC|2000|61|62|SCO', 'Lewis Mayo|DFC|2000|61|62|SCO', 'Brad Lyons|MC|1997|62|62|NIR',
    ],
    dundee: [
      'Trevor Carson|POR|1988|60|60|NIR', 'Clark Robertson|DFC|1993|60|60|SCO', 'Fin Robertson|MC|2003|60|64|SCO',
      'Simon Murray|DC|1991|62|62|SCO',
    ],
    falkirk: [
      'Scott Bain|POR|1991|61|61|SCO', 'Coll Donaldson|DFC|1995|60|60|SCO', 'Brad Spencer|MC|1996|61|61|SCO',
      'Calvin Miller|LI|1998|59|60|SCO',
    ],
    livingston: [
      'Danny Wilson|DFC|1991|60|60|SCO', 'Andrew Shinnie|MCO|1989|59|59|SCO', 'Stephen Kelly|MC|1999|61|62|SCO',
      'Robbie Muirhead|DC|1996|60|60|SCO',
    ],
  });
})(globalThis.MCM = globalThis.MCM || {});
