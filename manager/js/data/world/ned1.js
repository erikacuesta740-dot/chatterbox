/* Eredivisie 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'NED1', name: 'Eredivisie', country: 'Países Bajos', nat: 'NED', tier: 1,
    spots: { UCL: 2, UEL: 1, UECL: 1 }, wealth: 0.45,
    clubs: [
      ['PSV Eindhoven', 'PSV', 79, 'Philips Stadion', '#ed1c24', '#ffffff'],
      ['Ajax', 'AJA', 77, 'Johan Cruijff ArenA', '#ffffff', '#d2122e'],
      ['Feyenoord', 'FEY', 77, 'De Kuip', '#ff0000', '#ffffff'],
      ['AZ Alkmaar', 'AZ', 72, 'AFAS Stadion', '#e30613', '#ffffff'],
      ['FC Twente', 'TWE', 70, 'De Grolsch Veste', '#e30613', '#ffffff'],
      ['FC Utrecht', 'UTR', 66, 'Stadion Galgenwaard', '#e30613', '#ffffff'],
      ['Go Ahead Eagles', 'GAE', 63, 'De Adelaarshorst', '#e30613', '#ffd200'],
      ['NEC Nijmegen', 'NEC', 63, 'Goffertstadion', '#d71920', '#00843d'],
      ['SC Heerenveen', 'HEE', 62, 'Abe Lenstra Stadion', '#0057a8', '#ffffff'],
      ['PEC Zwolle', 'PEC', 58, 'MAC³PARK Stadion', '#0057a8', '#ffffff'],
      ['Fortuna Sittard', 'FOR', 59, 'Fortuna Sittard Stadion', '#ffd200', '#00843d'],
      ['Sparta Rotterdam', 'SPA', 60, 'Het Kasteel', '#e30613', '#ffffff'],
      ['FC Groningen', 'GRO', 61, 'Euroborg', '#00843d', '#ffffff'],
      ['Heracles Almelo', 'HER', 58, 'Erve Asito', '#000000', '#ffffff'],
      ['NAC Breda', 'NAC', 59, 'Rat Verlegh Stadion', '#ffd200', '#000000'],
      ['Excelsior', 'EXC', 56, 'Van Donge & De Roo Stadion', '#e30613', '#000000'],
      ['Telstar', 'TEL', 54, 'BUKO Stadion', '#ffffff', '#000000'],
      ['FC Volendam', 'VOL', 56, 'Kras Stadion', '#f47920', '#ffffff'],
    ],
  }, {
    'psv-eindhoven': [
      'Matej Kovář|POR|2000|77|81|CZE', 'Nick Olij|POR|1995|72|72|NED',
      'Ryan Flamingo|DFC|2002|77|82|NED', 'Armando Obispo|DFC|1999|74|76|NED', 'Yarek Gasiorowski|DFC|2005|72|82|ESP',
      'Sergiño Dest|LD|2000|77|79|USA', 'Mauro Júnior|LI|1999|76|77|BRA', 'Anass Salah-Eddine|LI|2002|73|77|NED',
      'Jerdy Schouten|MCD|1997|80|80|NED', 'Joey Veerman|MC|1998|79|79|NED', 'Guus Til|MCO|1997|77|77|NED',
      'Ismael Saibari|MCO|2001|79|82|MAR', 'Paul Wanner|MCO|2005|73|82|GER', 'Esmir Bajraktarević|ED|2005|71|80|BIH',
      'Dennis Man|ED|1998|76|76|ROU', 'Ivan Perišić|EI|1989|77|77|CRO', 'Ruben van Bommel|EI|2004|73|80|NED',
      'Couhaib Driouech|EI|2002|74|78|NED', 'Tygo Land|MC|2005|67|77|NED', 'Ricardo Pepi|DC|2003|76|81|USA',
    ],
    'ajax': [
      'Vítězslav Jaroš|POR|2001|75|80|CZE', 'Remko Pasveer|POR|1983|71|71|NED',
      'Josip Šutalo|DFC|2000|77|80|CRO', 'Youri Baas|DFC|2003|76|82|NED', 'Aaron Bouwman|DFC|2007|66|80|NED',
      'Anton Gaaei|LD|2002|73|77|DEN', 'Lucas Rosa|LD|2000|72|75|BRA', 'Owen Wijndal|LI|1999|72|72|NED', 'Jorthy Mokio|LI|2008|66|82|BEL',
      'Kenneth Taylor|MC|2002|78|81|NED', 'Youri Regeer|MC|2003|73|78|NED', 'Davy Klaassen|MCO|1993|75|75|NED',
      'Branco van den Boomen|MC|1995|74|74|NED', 'Sean Steur|MC|2007|66|80|NED', 'Oliver Edvardsen|MCO|1999|73|74|NOR',
      'Oscar Gloukh|MCO|2004|75|82|ISR', 'Steven Berghuis|ED|1991|74|74|NED',
      'Mika Godts|EI|2005|75|83|BEL', 'Raúl Moro|EI|2002|72|77|ESP', 'Rayane Bounida|EI|2006|68|81|BEL',
      'Wout Weghorst|DC|1992|75|75|NED', 'Kasper Dolberg|DC|1997|76|76|DEN',
    ],
    'feyenoord': [
      'Timon Wellenreuther|POR|1995|76|76|GER', 'Justin Bijlow|POR|1998|75|77|NED',
      'Gernot Trauner|DFC|1992|76|76|AUT', 'Tsuyoshi Watanabe|DFC|1997|75|75|JPN', 'Thomas Beelen|DFC|2001|71|75|NED',
      'Givairo Read|LD|2006|72|82|NED', 'Bart Nieuwkoop|LD|1996|71|71|NED', 'Jordan Bos|LI|2002|74|78|AUS', 'Gijs Smal|LI|1997|72|72|NED',
      'Hwang In-beom|MC|1996|78|78|KOR', 'Oussama Targhalline|MCD|2002|72|77|MAR',
      'Jakub Moder|MC|1999|73|74|POL', 'Sem Steijn|MCO|2001|76|79|NED', 'Luciano Valente|MCO|2003|73|79|NED',
      'Anis Hadj Moussa|ED|2002|76|80|ALG', 'Gonçalo Borges|ED|2001|73|76|POR', 'Leo Sauer|EI|2006|69|80|SVK',
      'Ayase Ueda|DC|1998|76|76|JPN', 'Casper Tengstedt|DC|2000|71|73|DEN',
    ],
    'az-alkmaar': [
      'Rome-Jayden Owusu-Oduro|POR|2004|73|81|NED',
      'Wouter Goes|DFC|2004|71|79|NED', 'Alexandre Penetra|DFC|2001|74|77|POR', 'Mees de Wit|LI|2000|72|74|NED',
      'Seiya Maikuma|LD|1997|72|72|JPN', 'Denso Kasius|LD|2002|70|74|NED',
      'Jordy Clasie|MCD|1991|73|73|NED', 'Peer Koopmeiners|MC|2000|73|76|NED', 'Kees Smit|MC|2006|71|84|NED',
      'Sven Mijnans|MCO|2000|76|78|NED', 'Zico Buurmeester|MC|2005|68|77|NED',
      'Ibrahim Sadiq|ED|2000|72|74|GHA', 'Mayckel Lahdo|EI|2002|71|76|SWE',
      'Weslley Patati|EI|2003|68|75|BRA', 'Troy Parrott|DC|2002|76|79|IRL',
    ],
    'fc-twente': [
      'Lars Unnerstall|POR|1990|73|73|GER', 'Przemysław Tytoń|POR|1987|66|66|POL',
      'Alec Van Hoorenbeeck|DFC|2004|69|76|BEL', 'Bart van Rooij|LD|2001|71|74|NED',
      'Michel Vlap|MCO|1997|73|73|NED', 'Younes Taha|EI|2002|71|75|NED', 'Daan Rots|ED|2001|74|77|NED', 'Mats Rots|EI|2005|67|76|NED',
      'Sam Lammers|DC|1997|73|73|NED', 'Ricky van Wolfswinkel|DC|1989|70|70|NED',
    ],
    'fc-utrecht': [
      'Vasilis Barkas|POR|1994|73|73|GRE',
      'Mike van der Hoorn|DFC|1992|71|71|NED', 'Nick Viergever|DFC|1989|69|69|NED', 'Siebe Horemans|LD|1998|70|71|BEL', 'Souffian El Karouani|LI|2000|73|75|MAR',
      'Can Bozdogan|MC|2001|71|74|TUR', 'Jens Toornstra|MC|1989|69|69|NED', 'Dani de Wit|MCO|1998|71|72|NED', 'Gjivai Zechiël|MC|2004|69|76|NED',
      'Victor Jensen|MCO|2000|71|73|DEN', 'Paxten Aaronson|MCO|2003|70|76|USA', 'Yoann Cathline|EI|2002|71|75|FRA', 'Miguel Rodríguez|ED|2003|68|75|COL',
      'David Min|DC|1999|70|72|NED', 'Sébastien Haller|DC|1994|72|72|CIV',
    ],
    'go-ahead-eagles': [
      'Jari De Busser|POR|1999|70|72|BEL', 'Mats Deijl|LD|1997|69|69|NED', 'Evert Linthorst|MC|1995|67|67|NED',
      'Jakob Breum|MCO|2003|71|76|DEN', 'Victor Edvardsen|DC|1996|69|69|SWE', 'Milan Smit|DC|2003|67|73|NED',
    ],
    'nec-nijmegen': [
      'Philippe Sandler|DFC|1997|69|69|NED', 'Bram Nuytinck|DFC|1990|68|68|NED',
      'Kodai Sano|MC|2003|71|77|JPN', 'Dirk Proper|MC|2002|69|73|NED', 'Sami Ouaissa|EI|2004|69|76|NED',
      'Vito van Crooij|ED|1996|69|69|NED', 'Koki Ogawa|DC|1997|71|71|JPN',
    ],
    'sc-heerenveen': [
      'Andries Noppert|POR|1994|70|70|NED', 'Oliver Braude|LD|2003|67|72|NOR', 'Ilias Sebaoui|ED|2002|69|74|NED', 'Jacob Trenskow|ED|2000|70|72|DEN',
    ],
    'pec-zwolle': [],
    'fortuna-sittard': [
      'Mattijs Branderhorst|POR|1994|68|68|NED', 'Ivo Pinto|LD|1990|67|67|POR', 'Alen Halilović|MCO|1996|69|69|CRO',
    ],
    'sparta-rotterdam': [
      'Joshua Kitolano|MC|2001|68|71|NOR', 'Tobias Lauritsen|DC|1997|70|70|NOR',
    ],
    'fc-groningen': [
      'Etienne Vaessen|POR|1995|69|69|NED', 'Marco Rente|DFC|1997|68|68|GER', 'Thijmen Blokzijl|DFC|2005|67|76|NED',
      'Marvin Peersman|LI|1991|66|66|BEL', 'Stije Resink|MC|2003|69|74|NED', 'Romano Postema|DC|2002|67|71|NED',
    ],
    'heracles-almelo': [
      'Fabian de Keijzer|POR|2000|67|70|NED', 'Ivan Mesík|DFC|2001|67|71|SVK', 'Brian De Keersmaecker|MC|2000|68|71|BEL',
      'Thomas Bruns|MCO|1992|67|67|NED', 'Jizz Hornkamp|DC|1998|67|67|NED',
    ],
    'nac-breda': [
      'Daniel Bielica|POR|1999|68|71|POL', 'Leo Greiml|DFC|2001|68|72|AUT', 'Jan Van den Bergh|DFC|1994|66|66|BEL', 'Boy Kemper|LI|1999|67|68|NED',
      'Clint Leemans|MC|1995|67|67|NED', 'Dominik Janošek|MC|1998|68|69|CZE', 'Kamal Sowah|ED|2000|68|70|GHA', 'Elías Már Ómarsson|DC|2000|67|69|ISL',
    ],
    'excelsior': [
      'Stijn van Gassel|POR|1996|66|66|NED',
    ],
    'telstar': [],
    'fc-volendam': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
