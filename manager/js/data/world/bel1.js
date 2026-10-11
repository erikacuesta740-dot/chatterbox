/* Pro League 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'BEL1', name: 'Pro League', country: 'Bélgica', nat: 'BEL', tier: 1,
    spots: { UCL: 1, UEL: 1, UECL: 1 }, wealth: 0.35,
    clubs: [
      ['Club Brugge', 'BRU', 76, 'Jan Breydel', '#0071b9', '#000000'],
      ['Union Saint-Gilloise', 'USG', 72, 'Stade Joseph Marien', '#ffd100', '#1e3a8a'],
      ['Anderlecht', 'AND', 70, 'Lotto Park', '#4b2b83', '#ffffff'],
      ['KRC Genk', 'GNK', 69, 'Cegeka Arena', '#004b93', '#ffffff'],
      ['KAA Gent', 'GNT', 67, 'Planet Group Arena', '#0033a0', '#ffffff'],
      ['Royal Antwerp', 'ANT', 65, 'Bosuilstadion', '#e30613', '#ffffff'],
      ['Standard Lieja', 'STL', 63, 'Stade Maurice Dufrasne', '#e30613', '#ffffff'],
      ['Cercle Brugge', 'CER', 60, 'Jan Breydel', '#00843d', '#000000'],
      ['KV Mechelen', 'KVM', 60, 'AFAS Stadion Achter de Kazerne', '#ffd200', '#e30613'],
      ['KVC Westerlo', 'WES', 59, 'Het Kuipje', '#ffd200', '#0057a8'],
      ['Sporting Charleroi', 'CHA', 61, 'Stade du Pays de Charleroi', '#000000', '#ffffff'],
      ['Oud-Heverlee Leuven', 'OHL', 58, 'Den Dreef', '#ffffff', '#00843d'],
      ['Sint-Truiden', 'STV', 58, 'Stayen', '#ffd200', '#0057a8'],
      ['FCV Dender EH', 'DEN', 54, 'Van Roy Stadion', '#e30613', '#ffffff'],
      ['Zulte Waregem', 'ZWA', 56, 'Elindus Arena', '#e30613', '#ffffff'],
      ['RAAL La Louvière', 'RAAL', 53, 'Stade du Tivoli', '#00843d', '#ffffff'],
    ],
  }, {
    'club-brugge': [
      'Simon Mignolet|POR|1988|76|76|BEL', 'Nordin Jackers|POR|1997|71|72|BEL', 'Dani van den Heuvel|POR|2003|66|74|NED',
      'Joel Ordóñez|DFC|2004|77|83|ECU', 'Brandon Mechele|DFC|1993|75|75|BEL', 'Zaid Romero|DFC|1999|73|76|ARG', 'Jorne Spileers|DFC|2005|71|79|BEL',
      'Kyriani Sabbe|LD|2005|70|78|BEL', 'Hugo Siquet|LD|2002|71|75|BEL', 'Joaquin Seys|LI|2005|71|78|BEL', 'Bjorn Meijer|LI|2003|73|77|NED',
      'Raphael Onyedika|MCD|2001|78|82|NGA', 'Aleksandar Stanković|MC|2005|74|82|SRB', 'Hugo Vetlesen|MC|2000|75|77|NOR',
      'Hans Vanaken|MCO|1992|79|79|BEL', 'Christos Tzolis|EI|2002|79|82|GRE', 'Carlos Forbs|ED|2004|75|81|POR',
      'Mamadou Diakhon|ED|2005|70|79|FRA', 'Cisse Sandra|MC|2003|70|75|BEL', 'Michał Skóraś|ED|2000|73|74|POL',
      'Nicolò Tresoldi|DC|2004|74|81|GER', 'Romeo Vermant|DC|2004|72|79|BEL', 'Gustaf Nilsson|DC|1997|72|72|SWE',
    ],
    'union-saint-gilloise': [
      'Kjell Scherpen|POR|2000|73|77|NED',
      'Christian Burgess|DFC|1991|74|74|ENG', 'Kevin Mac Allister|DFC|1997|74|74|ARG', 'Ross Sykes|DFC|1999|72|74|ENG', 'Fedde Leysen|DFC|2003|71|77|BEL',
      'Ousseynou Niang|LI|2001|71|74|SEN', 'Rob Schoofs|MC|1994|71|71|BEL',
      'Mathias Rasmussen|MC|1997|71|71|NOR', 'Anouar Ait El Hadj|MCO|2002|72|76|BEL', 'Kevin Rodríguez|DC|2000|73|75|ECU',
      'Promise David|DC|2001|73|77|CAN', 'Mohammed Fuseini|ED|2002|71|75|GHA', 'Raul Florucz|ED|2001|71|74|AUT', 'Guillaume François|LD|1990|68|68|BEL',
    ],
    'anderlecht': [
      'Colin Coosemans|POR|1992|74|74|BEL', 'Mads Kikkenborg|POR|1999|70|72|DEN',
      'Killian Sardella|LD|2002|72|75|BEL', 'Moussa N\'Diaye|LI|2002|72|76|SEN', 'Ludwig Augustinsson|LI|1994|70|70|SWE', 'Lucas Hey|DFC|2004|69|75|DEN',
      'Marco Kana|DFC|2002|70|74|BEL', 'Enric Llansana|MCD|2001|70|74|ESP', 'Mats Rits|MC|1993|70|70|BEL', 'Theo Leoni|MC|2000|70|72|BEL',
      'Nathan De Cat|MC|2008|67|83|BEL', 'Yari Verschaeren|MCO|2001|73|76|BEL', 'Mario Stroeykens|MCO|2004|72|79|BEL',
      'Thorgan Hazard|EI|1993|73|73|BEL', 'Tristan Degreef|ED|2005|68|77|BEL', 'Luis Vázquez|DC|2001|71|75|ARG',
    ],
    'krc-genk': [
      'Hendrik Van Crombrugge|POR|1993|73|73|BEL', 'Tobias Lawal|POR|2000|70|73|AUT',
      'Matte Smets|DFC|2004|71|78|BEL', 'Mujaid Sadick|DFC|2000|72|74|ESP', 'Zakaria El Ouahdi|LD|2001|73|76|MAR', 'Joris Kayembe|LI|1994|71|71|COD',
      'Bryan Heynen|MC|1997|74|74|BEL', 'Patrik Hrošovský|MC|1992|72|72|SVK', 'Konstantinos Karetsas|MCO|2007|70|84|GRE',
      'Jarne Steuckers|ED|2002|71|76|BEL', 'Junya Ito|ED|1993|73|73|JPN', 'Yira Sor|EI|2000|71|73|NGA', 'Noah Adedeji-Sternberg|EI|2005|67|76|GER',
      'Oh Hyeon-gyu|DC|2001|71|75|KOR',
    ],
    'kaa-gent': [
      'Davy Roef|POR|1994|72|72|BEL', 'Matisse Samoise|LD|2001|69|72|BEL', 'Tiago Araújo|LI|2001|69|72|POR',
      'Max Dean|DC|2004|69|76|ENG', 'Momodou Sonko|ED|2005|68|77|SWE',
    ],
    'royal-antwerp': [
      'Zeno Van den Bosch|DFC|2003|70|75|BEL', 'Dennis Praet|MC|1994|71|71|BEL', 'Gyrano Kerk|ED|1995|71|71|NED', 'Vincent Janssen|DC|1994|72|72|NED',
    ],
    'standard-lieja': [
      'Matthieu Epolo|POR|2005|69|77|BEL', 'Marlon Fossey|LD|2003|69|74|USA', 'Ibe Hautekiet|DFC|2002|68|72|BEL',
    ],
    'cercle-brugge': [
      'Warleson|POR|1997|67|68|BRA',
    ],
    'kv-mechelen': [
      'Ortwin De Wolf|POR|1997|68|69|BEL',
    ],
    'kvc-westerlo': [],
    'sporting-charleroi': [
      'Mardochée Nzita|LI|2002|67|71|BEL', 'Parfait Guiagon|EI|2001|69|73|CIV',
    ],
    'oud-heverlee-leuven': [
      'Tobe Leysen|POR|1999|67|70|BEL',
    ],
    'sint-truiden': [
      'Leo Kokubo|POR|2001|68|73|JPN',
    ],
    'fcv-dender-eh': [],
    'zulte-waregem': [],
    'raal-la-louviere': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
