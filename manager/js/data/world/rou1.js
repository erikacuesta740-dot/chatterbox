/* SuperLiga rumana 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'ROU1', name: 'SuperLiga rumana', country: 'Rumanía', nat: 'ROU', tier: 1,
    spots: { UCL: 0, UEL: 1, UECL: 1 }, wealth: 0.15,
    clubs: [
      ['FCSB', 'FCS', 63, 'Arena Națională', '#e30613', '#003da5'],
      ['CFR Cluj', 'CFR', 60, 'Dr. Constantin Rădulescu', '#9b1b30', '#ffffff'],
      ['Universitatea Craiova', 'UCV', 59, 'Ion Oblemenco', '#00a3e0', '#ffffff'],
      ['Universitatea Cluj', 'UCJ', 55, 'Cluj Arena', '#000000', '#ffffff'],
      ['Rapid București', 'RAP', 56, 'Giulești-Valentin Stănescu', '#9b1b30', '#ffffff'],
      ['Dinamo București', 'DIN', 55, 'Arcul de Triumf', '#e30613', '#ffffff'],
      ['FC Botoșani', 'BOT', 50, 'Municipal Botoșani', '#e30613', '#ffffff'],
      ['Petrolul Ploiești', 'PET', 50, 'Ilie Oană', '#ffd100', '#003da5'],
      ['UTA Arad', 'UTA', 50, 'Francisc von Neuman', '#e30613', '#ffffff'],
      ['Farul Constanța', 'FAR', 52, 'Stadionul Farul', '#003da5', '#ffffff'],
      ['Oțelul Galați', 'OTE', 50, 'Stadionul Oțelul', '#e30613', '#ffffff'],
      ['FC Hermannstadt', 'HER', 49, 'Municipal Sibiu', '#e30613', '#000000'],
      ['Unirea Slobozia', 'SLO', 46, '1 Mai Slobozia', '#003da5', '#ffffff'],
      ['FC Argeș', 'ARG', 48, 'Nicolae Dobrin', '#9b1b30', '#00a3e0'],
      ['Metaloglobus București', 'MET', 44, 'Stadionul Metaloglobus', '#003da5', '#ffffff'],
      ['FK Csíkszereda', 'CSI', 45, 'Municipal Miercurea Ciuc', '#e30613', '#ffffff'],
    ],
  }, {
    'fcsb': [
      'Ștefan Târnovanu|POR|2000|67|71|ROU', 'Valentin Crețu|LD|1989|63|63|ROU', 'Mihai Popescu|DFC|1993|66|66|ROU',
      'Siyabonga Ngezana|DFC|1997|67|68|RSA', 'Joyskim Dawa|DFC|1996|65|65|CMR', 'Vlad Chiricheș|DFC|1989|63|63|ROU',
      'Risto Radunović|LI|1992|65|65|MNE', 'Adrian Șut|MCD|1999|67|69|ROU', 'Mihai Lixandru|MC|2001|66|70|ROU',
      'Baba Alhassan|MCD|2000|65|67|GHA', 'Darius Olaru|MCO|1998|69|70|ROU', 'Florin Tănase|MCO|1994|67|67|ROU',
      'Juri Cisotti|ED|1993|65|65|ITA', 'David Miculescu|ED|2001|66|69|ROU', 'Octavian Popescu|EI|2002|65|70|ROU',
      'Alexandru Băluță|MC|1993|64|64|ROU', 'Marius Ștefănescu|EI|1998|64|65|ROU', 'Daniel Bîrligea|DC|2000|68|71|ROU',
    ],
    'cfr-cluj': [
      'Otto Hindrich|POR|2002|64|69|ROU', 'Mário Camora|LI|1986|60|60|POR', 'Ciprian Deac|MCO|1986|62|62|ROU',
      'Louis Munteanu|DC|2002|67|72|ROU',
    ],
    'universitatea-craiova': [
      'Nicușor Bancu|LI|1992|65|65|ROU', 'Vladimir Screciu|DFC|2000|64|67|ROU', 'Anzor Mekvabishvili|MCD|2001|64|68|GEO',
      'Alexandru Crețu|MC|1992|63|63|ROU', 'Alexandru Mitriță|EI|1995|68|68|ROU', 'Ștefan Baiaram|ED|2002|65|70|ROU',
    ],
    'universitatea-cluj': [], 'rapid-bucuresti': [], 'dinamo-bucuresti': [], 'fc-botosani': [], 'petrolul-ploiesti': [],
    'uta-arad': [], 'farul-constanta': [], 'otelul-galati': [], 'fc-hermannstadt': [], 'unirea-slobozia': [],
    'fc-arges': [], 'metaloglobus-bucuresti': [], 'fk-csikszereda': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
