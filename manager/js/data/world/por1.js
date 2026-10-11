/* Liga Portugal 2025/26 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'POR1', name: 'Liga Portugal', country: 'Portugal', nat: 'POR', tier: 1,
    spots: { UCL: 2, UEL: 1, UECL: 1 }, wealth: 0.45,
    clubs: [
      ['SL Benfica', 'SLB', 81, 'Estádio da Luz', '#e2001a', '#ffffff'],
      ['FC Porto', 'FCP', 80, 'Estádio do Dragão', '#00428c', '#ffffff'],
      ['Sporting CP', 'SCP', 80, 'Estádio José Alvalade', '#008057', '#ffffff'],
      ['SC Braga', 'SCB', 74, 'Estádio Municipal de Braga', '#d71920', '#ffffff'],
      ['Vitória SC', 'VSC', 68, 'Estádio D. Afonso Henriques', '#ffffff', '#000000'],
      ['Santa Clara', 'SCL', 62, 'Estádio de São Miguel', '#d71920', '#ffffff'],
      ['Famalicão', 'FAM', 63, 'Estádio Municipal 22 de Junho', '#1d3f8f', '#ffffff'],
      ['Estoril Praia', 'EST', 61, 'Estádio António Coimbra da Mota', '#ffd200', '#003b7a'],
      ['Casa Pia', 'CPA', 59, 'Estádio Pina Manique', '#000000', '#ffffff'],
      ['Moreirense', 'MOR', 59, 'Parque de Jogos Comendador Joaquim de Almeida Freitas', '#007a3d', '#ffffff'],
      ['Rio Ave', 'RAV', 60, 'Estádio do Rio Ave FC', '#00843d', '#ffffff'],
      ['Arouca', 'ARO', 59, 'Estádio Municipal de Arouca', '#ffd200', '#003b7a'],
      ['Gil Vicente', 'GIL', 60, 'Estádio Cidade de Barcelos', '#d71920', '#003b7a'],
      ['Nacional', 'NAC', 56, 'Estádio da Madeira', '#000000', '#ffffff'],
      ['Estrela Amadora', 'EAM', 56, 'Estádio José Gomes', '#d71920', '#00843d'],
      ['AVS Futebol SAD', 'AVS', 55, 'Estádio do CD Aves', '#d71920', '#ffffff'],
      ['Alverca', 'ALV', 55, 'Complexo Desportivo do FC Alverca', '#d71920', '#ffffff'],
      ['Tondela', 'TON', 55, 'Estádio João Cardoso', '#ffd200', '#00843d'],
    ],
  }, {
    'sl-benfica': [
      'Anatoliy Trubin|POR|2001|82|86|UKR', 'Samuel Soares|POR|2002|70|76|POR',
      'Nicolás Otamendi|DFC|1988|78|78|ARG', 'António Silva|DFC|2003|79|85|POR', 'Tomás Araújo|DFC|2002|77|83|POR',
      'Amar Dedić|LD|2002|76|82|BIH', 'Alexander Bah|LD|1997|75|75|DEN', 'Samuel Dahl|LI|2003|73|79|SWE', 'Rafael Obrador|LI|2004|70|78|ESP',
      'Enzo Barrenechea|MCD|2001|77|81|ARG', 'Richard Ríos|MC|2000|79|82|COL', 'Fredrik Aursnes|MC|1995|79|79|NOR',
      'Leandro Barreiro|MC|2000|75|78|LUX', 'Manu Silva|MCD|2001|72|77|POR', 'Georgiy Sudakov|MCO|2002|79|84|UKR',
      'Dodi Lukébakio|ED|1997|78|78|BEL', 'Andreas Schjelderup|EI|2004|74|82|NOR', 'Gianluca Prestianni|ED|2006|71|83|ARG',
      'Bruma|EI|1994|74|74|POR', 'Vangelis Pavlidis|DC|1998|80|81|GRE', 'Franjo Ivanović|DC|2003|74|80|CRO',
    ],
    'fc-porto': [
      'Diogo Costa|POR|1999|84|87|POR', 'Cláudio Ramos|POR|1991|71|71|POR',
      'Jan Bednarek|DFC|1996|76|76|POL', 'Jakub Kiwior|DFC|2000|77|80|POL', 'Nehuén Pérez|DFC|2000|75|78|ARG',
      'Dominik Prpić|DFC|2004|68|76|CRO', 'Iván Marcano|DFC|1987|72|72|ESP',
      'Alberto Costa|LD|2003|74|80|POR', 'Martim Fernandes|LD|2006|73|83|POR', 'Francisco Moura|LI|2000|76|78|POR', 'Zaidu Sanusi|LI|1997|72|72|NGA',
      'Alan Varela|MCD|2001|79|83|ARG', 'Stephen Eustáquio|MC|1996|76|76|CAN', 'Pablo Rosario|MCD|1997|74|74|NED',
      'Victor Froholdt|MC|2006|74|84|DEN', 'Gabri Veiga|MC|2002|78|82|ESP',
      'Rodrigo Mora|MCO|2007|76|87|POR', 'Pepê|ED|1997|77|77|BRA', 'William Gomes|ED|2006|73|83|BRA',
      'Borja Sainz|EI|2001|76|79|ESP', 'Samu Aghehowa|DC|2004|79|86|ESP', 'Luuk de Jong|DC|1990|74|74|NED', 'Deniz Gül|DC|2004|71|78|SWE',
    ],
    'sporting-cp': [
      'Rui Silva|POR|1994|80|80|POR', 'João Virgínia|POR|2000|70|73|POR',
      'Ousmane Diomande|DFC|2003|80|86|CIV', 'Gonçalo Inácio|DFC|2001|80|84|POR', 'Zeno Debast|DFC|2003|76|82|BEL',
      'Eduardo Quaresma|DFC|2002|75|80|POR', 'Matheus Reis|DFC|1995|74|74|BRA',
      'Iván Fresneda|LD|2004|73|80|ESP', 'Georgios Vagiannidis|LD|2001|74|77|GRE', 'Maxi Araújo|LI|2000|77|79|URU', 'Ricardo Mangas|LI|1998|73|73|POR',
      'Morten Hjulmand|MCD|1999|81|83|DEN', 'Hidemasa Morita|MC|1995|77|77|JPN', 'Daniel Bragança|MC|1999|75|77|POR',
      'João Simões|MC|2007|70|82|POR', 'Giorgi Kochorashvili|MC|1999|73|75|GEO',
      'Pedro Gonçalves|MCO|1998|81|81|POR', 'Francisco Trincão|ED|2000|81|83|POR', 'Geovany Quenda|ED|2007|75|86|POR',
      'Geny Catamo|ED|2001|75|78|MOZ', 'Nuno Santos|EI|1995|74|74|POR', 'Luis Suárez|DC|1997|79|79|COL', 'Fotis Ioannidis|DC|2000|76|78|GRE',
    ],
    'sc-braga': [
      'Lukáš Horníček|POR|2002|74|80|CZE', 'Tiago Sá|POR|1995|68|68|POR',
      'Sikou Niakaté|DFC|1999|74|76|MLI', 'Paulo Oliveira|DFC|1992|71|71|POR', 'Bright Arrey-Mbi|DFC|2003|71|77|GER',
      'Gustaf Lagerbielke|DFC|2000|72|75|SWE', 'Víctor Gómez|LD|2000|73|75|ESP', 'Leonardo Lelo|LI|2000|70|73|POR',
      'Vítor Carvalho|MCD|1997|74|74|BRA', 'Florian Grillitsch|MC|1995|73|73|AUT', 'Jean-Baptiste Gorby|MC|2002|71|76|FRA',
      'Mario Dorgeles|MC|2004|70|78|CIV', 'João Moutinho|MC|1986|72|72|POR', 'Rodrigo Zalazar|MCO|1999|77|79|URU',
      'Ricardo Horta|EI|1994|78|78|POR', 'Gabri Martínez|ED|2003|72|79|ESP',
      'Amine El Ouazzani|DC|2001|72|76|MAR', 'Fran Navarro|DC|1998|72|73|ESP', 'Pau Víctor|DC|2001|72|77|ESP',
    ],
    'vitoria-sc': [
      'Bruno Varela|POR|1994|72|72|POR', 'Charles|POR|1994|67|67|BRA',
      'Tomás Händel|MC|2000|72|75|POR', 'Telmo Arcanjo|MCO|2001|70|74|POR', 'Gustavo Silva|ED|1997|69|69|BRA', 'Nélson Oliveira|DC|1991|69|69|POR',
    ],
    'santa-clara': [
      'Gabriel Batista|POR|1998|70|72|BRA',
    ],
    'famalicao': [
      'Lazar Carević|POR|2000|69|73|MNE', 'Justin de Haas|DFC|2000|69|72|NED', 'Rodrigo Pinheiro|LD|2000|68|71|POR',
      'Zaydou Youssouf|MC|1999|71|73|FRA', 'Mathias de Amorim|MC|2003|68|74|DEN', 'Gustavo Sá|MCO|2004|72|80|POR',
    ],
    'estoril-praia': [
      'Joel Robles|POR|1990|70|70|ESP', 'Kevin Boma|DFC|2002|67|72|TOG', 'Pedro Amaral|LI|1997|69|69|POR',
      'Jordan Holsgrove|MC|1999|70|71|SCO', 'Rafik Guitane|MCO|1999|71|72|FRA', 'Yanis Begraoui|DC|2001|70|73|MAR',
    ],
    'casa-pia': [],
    'moreirense': [
      'Kewin|POR|1995|68|68|BRA',
    ],
    'rio-ave': [
      'Cezary Miszta|POR|2001|69|73|POL',
    ],
    'arouca': [
      'Nico Mantl|POR|2000|69|72|GER', 'Tiago Esgaio|LD|1995|67|67|POR', 'Jason|ED|1994|69|69|ESP',
    ],
    'gil-vicente': [
      'Andrew|POR|2001|69|73|BRA',
    ],
    'nacional': [],
    'estrela-amadora': [],
    'avs-futebol-sad': [],
    'alverca': [],
    'tondela': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
