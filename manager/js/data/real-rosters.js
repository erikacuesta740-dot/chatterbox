/*
 * PLANTILLAS REALES — NO VERIFICADAS
 * -----------------------------------
 * Jugadores reales de Primera División y Premier League según el conocimiento del asistente
 * (temporada 2025/26, información hasta mediados de 2026). NO están contrastadas con EA SPORTS FC 27:
 * pueden faltar fichajes del verano de 2026 o haber jugadores que ya cambiaron de club.
 * Media y potencial son ESTIMACIONES del asistente, no las valoraciones oficiales de FC 27.
 * No incluyen valores de mercado: esos solo llegan por importación con fuente (ver docs/FC27_VALUES.md).
 *
 * Formato: 'Nombre|Posición|Año de nacimiento|Media estimada|Potencial estimado|Nacionalidad'
 * Los huecos de la plantilla se completan con jugadores ficticios marcados como tales.
 */
(function (MCM) {
  'use strict';
  MCM.DATA = MCM.DATA || {};

  MCM.DATA.realRostersInfo = {
    id: 'real-2025-26-conocimiento',
    name: 'Plantillas reales (no verificadas)',
    note: 'Jugadores reales según conocimiento hasta mediados de 2026. Medias y potenciales estimados; no son datos de FC 27. Los huecos de cada plantilla y los agentes libres son ficticios.',
    knowledgeCutoff: '2026-06',
  };

  MCM.DATA.realRosters = {
    // ---------------- Primera División ----------------
    'real-madrid': [
      'Thibaut Courtois|POR|1992|89|89|BEL', 'Andriy Lunin|POR|1999|80|83|UKR', 'Fran González|POR|2005|65|78|ESP',
      'Dani Carvajal|LD|1992|84|84|ESP', 'Trent Alexander-Arnold|LD|1998|86|86|ENG', 'Éder Militão|DFC|1998|84|85|BRA',
      'Antonio Rüdiger|DFC|1993|86|86|GER', 'Dean Huijsen|DFC|2005|81|88|ESP', 'Raúl Asencio|DFC|2003|76|83|ESP',
      'David Alaba|DFC|1992|80|80|AUT', 'Ferland Mendy|LI|1995|81|81|FRA', 'Álvaro Carreras|LI|2003|80|86|ESP',
      'Fran García|LI|1999|78|79|ESP', 'Aurélien Tchouaméni|MCD|2000|85|87|FRA', 'Federico Valverde|MC|1998|89|89|URU',
      'Jude Bellingham|MCO|2003|89|92|ENG', 'Eduardo Camavinga|MC|2002|83|88|FRA', 'Dani Ceballos|MC|1996|79|79|ESP',
      'Arda Güler|MCO|2005|81|89|TUR', 'Brahim Díaz|MCO|1999|80|80|MAR', 'Franco Mastantuono|ED|2007|76|89|ARG',
      'Rodrygo|ED|2001|84|86|BRA', 'Vinícius Júnior|EI|2000|89|90|BRA', 'Kylian Mbappé|DC|1998|91|91|FRA',
      'Gonzalo García|DC|2004|73|82|ESP', 'Endrick|DC|2006|76|88|BRA',
    ],
    'fc-barcelona': [
      'Joan Garcia|POR|2001|82|87|ESP', 'Marc-André ter Stegen|POR|1992|86|86|GER', 'Wojciech Szczęsny|POR|1990|80|80|POL',
      'Jules Koundé|LD|1998|85|86|FRA', 'Ronald Araujo|DFC|1999|83|84|URU', 'Pau Cubarsí|DFC|2007|83|91|ESP',
      'Eric García|DFC|2001|79|81|ESP', 'Andreas Christensen|DFC|1996|80|80|DEN', 'Alejandro Balde|LI|2003|82|86|ESP',
      'Gerard Martín|LI|2002|74|79|ESP', 'Frenkie de Jong|MC|1997|86|86|NED', 'Pedri|MC|2002|89|91|ESP',
      'Gavi|MC|2004|82|88|ESP', 'Marc Casadó|MCD|2003|78|83|ESP', 'Marc Bernal|MCD|2007|72|85|ESP',
      'Fermín López|MCO|2003|81|86|ESP', 'Dani Olmo|MCO|2000|84|85|ESP', 'Lamine Yamal|ED|2007|90|95|ESP',
      'Raphinha|EI|1996|88|88|BRA', 'Marcus Rashford|EI|1997|81|81|ENG', 'Roony Bardghji|ED|2005|72|83|SWE',
      'Robert Lewandowski|DC|1988|85|85|POL', 'Ferran Torres|DC|2000|80|80|ESP',
    ],
    'atletico-de-madrid': [
      'Jan Oblak|POR|1993|87|87|SVN', 'Juan Musso|POR|1994|77|77|ARG', 'Marcos Llorente|LD|1995|82|82|ESP',
      'Nahuel Molina|LD|1998|79|79|ARG', 'José María Giménez|DFC|1995|82|82|URU', 'Robin Le Normand|DFC|1996|81|81|ESP',
      'Clément Lenglet|DFC|1995|79|79|FRA', 'Dávid Hancko|DFC|1997|81|82|SVK', 'Marc Pubill|DFC|2003|76|82|ESP',
      'Matteo Ruggeri|LI|2002|77|81|ITA', 'Koke|MC|1992|80|80|ESP', 'Pablo Barrios|MC|2003|80|86|ESP',
      'Johnny Cardoso|MCD|2001|78|82|USA', 'Conor Gallagher|MC|2000|81|82|ENG', 'Álex Baena|MCO|2001|83|85|ESP',
      'Thiago Almada|MCO|2001|79|83|ARG', 'Giuliano Simeone|ED|2002|79|84|ARG', 'Nicolás González|EI|1998|80|80|ARG',
      'Antoine Griezmann|DC|1991|84|84|FRA', 'Julián Álvarez|DC|2000|87|88|ARG', 'Alexander Sørloth|DC|1995|81|81|NOR',
    ],
    'athletic-club': [
      'Unai Simón|POR|1997|84|85|ESP', 'Álex Padilla|POR|2003|72|78|MEX', 'Óscar de Marcos|LD|1989|76|76|ESP',
      'Jesús Areso|LD|1999|77|78|ESP', 'Dani Vivian|DFC|1999|82|83|ESP', 'Aitor Paredes|DFC|2000|78|80|ESP',
      'Yeray Álvarez|DFC|1995|77|77|ESP', 'Yuri Berchiche|LI|1990|77|77|ESP', 'Adama Boiro|LI|2002|72|78|ESP',
      'Mikel Vesga|MCD|1993|77|77|ESP', 'Mikel Jauregizar|MC|2003|78|85|ESP', 'Beñat Prados|MC|2001|77|81|ESP',
      'Iñigo Ruiz de Galarreta|MC|1993|78|78|ESP', 'Oihan Sancet|MCO|2000|81|84|ESP', 'Unai Gómez|MCO|2003|73|79|ESP',
      'Iñaki Williams|ED|1994|80|80|GHA', 'Nico Williams|EI|2002|85|88|ESP', 'Álex Berenguer|EI|1995|77|77|ESP',
      'Robert Navarro|ED|2002|74|79|ESP', 'Gorka Guruzeta|DC|1996|78|78|ESP', 'Maroan Sannadi|DC|2001|71|77|ESP',
    ],
    'villarreal-cf': [
      'Luiz Júnior|POR|2001|78|82|BRA', 'Arnau Tenas|POR|2001|73|78|ESP', 'Santiago Mouriño|LD|2002|75|80|URU',
      'Kiko Femenía|LD|1991|74|74|ESP', 'Juan Foyth|DFC|1998|79|79|ARG', 'Logan Costa|DFC|2001|76|81|CPV',
      'Rafa Marín|DFC|2002|77|82|ESP', 'Renato Veiga|DFC|2003|77|83|POR', 'Sergi Cardona|LI|1999|77|78|ESP',
      'Alfonso Pedraza|LI|1996|78|78|ESP', 'Dani Parejo|MC|1989|80|80|ESP', 'Santi Comesaña|MC|1996|78|78|ESP',
      'Pape Gueye|MCD|1999|78|79|SEN', 'Thomas Partey|MCD|1993|80|80|GHA', 'Alberto Moleiro|MCO|2003|79|85|ESP',
      'Tajon Buchanan|ED|1999|76|77|CAN', 'Nicolas Pépé|ED|1995|79|79|CIV', 'Ilias Akhomach|EI|2004|74|81|MAR',
      'Gerard Moreno|DC|1992|80|80|ESP', 'Ayoze Pérez|DC|1993|80|80|ESP', 'Georges Mikautadze|DC|2000|78|81|GEO',
      'Tani Oluwaseyi|DC|2000|72|75|CAN',
    ],
    'real-betis': [
      'Álvaro Valles|POR|1997|77|78|ESP', 'Pau López|POR|1994|78|78|ESP', 'Adrián|POR|1987|72|72|ESP',
      'Héctor Bellerín|LD|1995|76|76|ESP', 'Aitor Ruibal|LD|1996|76|76|ESP', 'Diego Llorente|DFC|1993|78|78|ESP',
      'Marc Bartra|DFC|1991|77|77|ESP', 'Natan|DFC|2001|77|81|BRA', 'Valentín Gómez|DFC|2003|74|81|ARG',
      'Ricardo Rodríguez|LI|1992|76|76|SUI', 'Junior Firpo|LI|1996|75|75|DOM', 'Marc Roca|MCD|1996|79|79|ESP',
      'Sofyan Amrabat|MCD|1996|80|80|MAR', 'Sergi Altimira|MC|2001|76|80|ESP', 'Pablo Fornals|MC|1996|80|80|ESP',
      'Giovani Lo Celso|MCO|1996|81|81|ARG', 'Isco|MCO|1992|82|82|ESP', 'Abde Ezzalzouli|EI|2001|80|83|MAR',
      'Antony|ED|2000|80|81|BRA', 'Rodrigo Riquelme|EI|2000|76|79|ESP', 'Cucho Hernández|DC|1999|80|81|COL',
      'Chimy Ávila|DC|1994|75|75|ARG', 'Cédric Bakambu|DC|1991|74|74|COD',
    ],
    'real-sociedad': [
      'Álex Remiro|POR|1995|83|83|ESP', 'Unai Marrero|POR|2001|70|76|ESP', 'Jon Aramburu|LD|2002|77|81|VEN',
      'Álvaro Odriozola|LD|1995|74|74|ESP', 'Igor Zubeldia|DFC|1997|80|80|ESP', 'Jon Martín|DFC|2006|70|82|ESP',
      'Duje Ćaleta-Car|DFC|1996|77|77|CRO', 'Aritz Elustondo|DFC|1994|75|75|ESP', 'Aihen Muñoz|LI|1997|75|75|ESP',
      'Sergio Gómez|LI|2000|78|80|ESP', 'Jon Gorrotxategi|MCD|2003|74|80|ESP', 'Beñat Turrientes|MC|2002|76|80|ESP',
      'Brais Méndez|MC|1997|80|80|ESP', 'Luka Sučić|MC|2002|77|82|CRO', 'Carlos Soler|MC|1997|79|79|ESP',
      'Arsen Zakharyan|MCO|2003|76|82|RUS', 'Pablo Marín|MC|2003|73|79|ESP', 'Takefusa Kubo|ED|2001|82|84|JPN',
      'Ander Barrenetxea|EI|2001|79|81|ESP', 'Gonçalo Guedes|ED|1996|77|77|POR', 'Mikel Oyarzabal|DC|1997|83|83|ESP',
      'Orri Óskarsson|DC|2004|74|82|ISL',
    ],
    'sevilla-fc': [
      'Ørjan Nyland|POR|1990|76|76|NOR', 'Odysseas Vlachodimos|POR|1994|76|76|GRE', 'José Ángel Carmona|LD|2002|75|80|ESP',
      'Juanlu Sánchez|LD|2003|74|79|ESP', 'Kike Salas|DFC|2002|75|80|ESP', 'Tanguy Nianzou|DFC|2002|74|78|FRA',
      'Marcão|DFC|1996|76|76|BRA', 'Andrés Castrín|DFC|2004|68|77|ESP', 'César Azpilicueta|DFC|1989|75|75|ESP',
      'Gabriel Suazo|LI|1997|75|75|CHI', 'Nemanja Gudelj|MCD|1991|77|77|SRB', 'Lucien Agoumé|MCD|2002|76|80|FRA',
      'Djibril Sow|MC|1997|77|77|SUI', 'Batista Mendy|MCD|2000|74|77|FRA', 'Joan Jordán|MC|1994|74|74|ESP',
      'Rubén Vargas|EI|1998|77|77|SUI', 'Chidera Ejuke|EI|1998|76|76|NGA', 'Peque Fernández|ED|2002|73|78|ESP',
      'Isaac Romero|DC|2000|75|78|ESP', 'Akor Adams|DC|2000|75|78|NGA', 'Alexis Sánchez|DC|1988|74|74|CHI',
    ],
    'valencia-cf': [
      'Stole Dimitrievski|POR|1993|77|77|MKD', 'Julen Agirrezabala|POR|2000|74|79|ESP', 'Dimitri Foulquier|LD|1993|74|74|FRA',
      'Thierry Correia|LD|1999|74|75|POR', 'Mouctar Diakhaby|DFC|1996|77|77|GUI', 'César Tárrega|DFC|2002|76|82|ESP',
      'José Copete|DFC|1999|74|76|ESP', 'Eray Cömert|DFC|1998|74|74|SUI', 'José Luis Gayà|LI|1995|79|79|ESP',
      'Jesús Vázquez|LI|2003|72|78|ESP', 'Pepelu|MCD|1998|77|78|ESP', 'Javi Guerra|MC|2003|78|84|ESP',
      'Baptiste Santamaria|MC|1995|75|75|FRA', 'André Almeida|MC|2000|75|77|POR', 'Diego López|ED|2002|76|81|ESP',
      'Luis Rioja|EI|1993|76|76|ESP', 'Largie Ramazani|EI|2001|74|78|BEL', 'Arnaut Danjuma|EI|1997|77|77|NED',
      'Hugo Duro|DC|1999|77|78|ESP', 'Lucas Beltrán|DC|2001|75|79|ARG',
    ],
    'girona-fc': [
      'Paulo Gazzaniga|POR|1992|79|79|ARG', 'Dominik Livaković|POR|1995|80|80|CRO', 'Arnau Martínez|LD|2003|77|82|ESP',
      'Daley Blind|DFC|1990|77|77|NED', 'David López|DFC|1989|75|75|ESP', 'Vitor Reis|DFC|2006|72|84|BRA',
      'Alejandro Francés|DFC|2002|73|77|ESP', 'Àlex Moreno|LI|1993|76|76|ESP', 'Yangel Herrera|MC|1998|80|80|VEN',
      'Iván Martín|MC|1999|78|79|ESP', 'Axel Witsel|MCD|1989|76|76|BEL', 'Jhon Solís|MCD|2004|72|79|COL',
      'Thomas Lemar|MC|1995|76|76|FRA', 'Azzedine Ounahi|MC|2000|77|79|MAR', 'Bryan Gil|EI|2001|76|78|ESP',
      'Viktor Tsygankov|ED|1997|79|79|UKR', 'Joel Roca|EI|2005|71|80|ESP', 'Cristhian Stuani|DC|1986|73|73|URU',
      'Abel Ruiz|DC|2000|75|77|ESP', 'Vladyslav Vanat|DC|2002|76|81|UKR',
    ],
    'rc-celta': [
      'Iván Villar|POR|1997|74|75|ESP', 'Ionuț Radu|POR|1997|75|76|ROU', 'Óscar Mingueza|LD|1999|78|79|ESP',
      'Javi Rueda|LD|2003|70|76|ESP', 'Sergio Carreira|LD|2000|73|75|ESP', 'Javi Rodríguez|DFC|2003|74|79|ESP',
      'Carl Starfelt|DFC|1995|76|76|SWE', 'Marcos Alonso|DFC|1990|76|76|ESP', 'Joseph Aidoo|DFC|1995|74|74|GHA',
      'Ilaix Moriba|MC|2003|76|80|GUI', 'Fran Beltrán|MC|1999|77|77|ESP', 'Hugo Sotelo|MC|2003|72|79|ESP',
      'Damián Rodríguez|MC|2003|70|77|ESP', 'Williot Swedberg|MCO|2004|73|80|SWE', 'Hugo Álvarez|EI|2003|74|80|ESP',
      'Bryan Zaragoza|EI|2001|76|79|ESP', 'Pablo Durán|DC|2001|73|77|ESP', 'Borja Iglesias|DC|1993|78|78|ESP',
      'Iago Aspas|DC|1987|78|78|ESP', 'Ferran Jutglà|DC|1999|75|76|ESP', 'Jones El-Abdellaoui|DC|2006|65|78|NOR',
    ],
    'ca-osasuna': [
      'Sergio Herrera|POR|1993|79|79|ESP', 'Aitor Fernández|POR|1991|74|74|ESP', 'Valentin Rosier|LD|1996|74|74|FRA',
      'Alejandro Catena|DFC|1994|78|78|ESP', 'Jorge Herrando|DFC|2001|74|78|ESP', 'Enzo Boyomo|DFC|2001|76|79|CMR',
      'Juan Cruz|LI|1992|74|74|ESP', 'Abel Bretones|LI|2000|74|77|ESP', 'Lucas Torró|MCD|1994|76|76|ESP',
      'Jon Moncayola|MC|1998|77|77|ESP', 'Iker Muñoz|MC|2002|73|78|ESP', 'Moi Gómez|MC|1994|76|76|ESP',
      'Aimar Oroz|MCO|2001|76|79|ESP', 'Rubén García|EI|1993|77|77|ESP', 'Kike Barja|ED|1997|73|73|ESP',
      'Víctor Muñoz|EI|2003|73|80|ESP', 'Ante Budimir|DC|1991|79|79|CRO', 'Raúl García de Haro|DC|2000|73|76|ESP',
    ],
    'rayo-vallecano': [
      'Augusto Batalla|POR|1996|77|78|ARG', 'Dani Cárdenas|POR|1997|72|73|ESP', 'Andrei Rațiu|LD|1998|78|79|ROU',
      'Iván Balliu|LD|1992|74|74|ALB', 'Florian Lejeune|DFC|1991|78|78|FRA', 'Abdul Mumin|DFC|1998|74|75|GHA',
      'Luiz Felipe|DFC|1997|76|76|ITA', 'Pep Chavarría|LI|1998|76|77|ESP', 'Óscar Valentín|MCD|1994|76|76|ESP',
      'Pathé Ciss|MCD|1994|77|77|SEN', 'Unai López|MC|1995|76|76|ESP', 'Gerard Gumbau|MC|1994|74|74|ESP',
      'Óscar Trejo|MCO|1988|75|75|ARG', 'Isi Palazón|ED|1994|79|79|ESP', 'Jorge de Frutos|ED|1997|78|78|ESP',
      'Álvaro García|EI|1992|77|77|ESP', 'Fran Pérez|ED|2002|72|77|ESP', 'Sergio Camello|DC|2001|76|78|ESP',
      'Alemão|DC|1998|74|75|BRA', 'Randy Nteka|DC|1997|73|73|FRA',
    ],
    'rcd-mallorca': [
      'Leo Román|POR|2000|76|80|ESP', 'Pablo Maffeo|LD|1997|76|76|ARG',
      'Mateu Morey|LD|2000|72|74|ESP', 'Martin Valjent|DFC|1995|78|78|SVK', 'Antonio Raíllo|DFC|1991|77|77|ESP',
      'Marash Kumbulla|DFC|2000|74|76|ALB', 'Johan Mojica|LI|1992|75|75|COL', 'Toni Lato|LI|1997|73|73|ESP',
      'Samú Costa|MCD|2000|78|79|POR', 'Omar Mascarell|MCD|1993|74|74|ESP', 'Sergi Darder|MC|1993|77|77|ESP',
      'Antonio Sánchez|MC|1997|74|74|ESP', 'Manu Morlanes|MC|1999|75|77|ESP', 'Dani Rodríguez|MCO|1988|74|74|ESP',
      'Jan Virgili|EI|2006|70|80|ESP', 'Takuma Asano|ED|1994|75|75|JPN', 'Vedat Muriqi|DC|1994|79|79|KOS',
      'Cyle Larin|DC|1995|75|75|CAN', 'Abdón Prats|DC|1992|72|72|ESP', 'Mateo Joseph|DC|2003|72|78|ESP',
    ],
    'getafe-cf': [
      'David Soria|POR|1993|79|79|ESP', 'Jiří Letáček|POR|1999|70|74|CZE', 'Juan Iglesias|LD|1998|75|75|ESP',
      'Allan Nyom|LD|1988|72|72|CMR', 'Djené|DFC|1991|78|78|TOG', 'Domingos Duarte|DFC|1995|76|76|POR',
      'Abdel Abqar|DFC|1999|75|76|MAR', 'Diego Rico|LI|1993|75|75|ESP', 'Davinchi|LI|2007|65|78|ESP',
      'Mauro Arambarri|MC|1995|79|79|URU', 'Luis Milla|MC|1994|79|79|ESP', 'Mario Martín|MC|2004|72|79|ESP',
      'Yvan Neyou|MCD|1997|74|74|CMR', 'Carles Aleñá|MC|1998|75|75|ESP', 'Adrián Liso|ED|2005|72|81|ESP',
      'Juanmi|EI|1993|74|74|ESP', 'Álex Sancris|ED|2003|69|75|ESP', 'Abu Kamara|ED|2003|72|77|ENG',
      'Borja Mayoral|DC|1997|77|77|ESP',
    ],
    'rcd-espanyol': [
      'Marko Dmitrović|POR|1992|77|77|SRB', 'Ángel Fortuño|POR|2001|67|74|ESP', 'Omar El Hilali|LD|2003|75|80|MAR',
      'Rubén Sánchez|LD|2001|72|76|ESP', 'Leandro Cabrera|DFC|1991|77|77|URU', 'Fernando Calero|DFC|1995|74|74|ESP',
      'Miguel Rubio|DFC|1998|72|75|ESP', 'Clemens Riedel|DFC|2003|72|78|GER', 'Carlos Romero|LI|2001|75|79|ESP',
      'José Salinas|LI|2000|71|73|ESP', 'Pol Lozano|MC|1999|75|76|ESP', 'Edu Expósito|MC|1996|77|77|ESP',
      'Urko González|MCD|2001|75|79|ESP', 'Ramón Terrats|MC|2000|74|77|ESP', 'Charles Pickel|MCD|1997|74|74|SUI',
      'Pere Milla|MCO|1992|75|75|ESP', 'Tyrhys Dolan|EI|2001|74|77|ENG', 'Jofre Carreras|ED|2001|74|77|ESP',
      'Antoniu Roca|EI|2002|70|76|ESP', 'Javi Puado|DC|1998|77|77|ESP', 'Roberto Fernández|DC|2002|74|79|ESP',
      'Kike García|DC|1989|74|74|ESP',
    ],
    'deportivo-alaves': [
      'Antonio Sivera|POR|1996|77|78|ESP', 'Raúl Fernández|POR|1988|71|71|ESP', 'Jonny Otto|LD|1994|75|75|ESP',
      'Nahuel Tenaglia|DFC|1996|76|76|ARG', 'Facundo Garcés|DFC|1999|73|76|ARG', 'Moussa Diarra|DFC|2000|73|76|MLI',
      'Víctor Parada|DFC|2002|71|76|ESP', 'Manu Sánchez|LI|2000|73|75|ESP', 'Antonio Blanco|MCD|2000|77|80|ESP',
      'Jon Guridi|MC|1995|75|75|ESP', 'Carlos Benavídez|MC|1998|74|75|URU', 'Denis Suárez|MCO|1994|74|74|ESP',
      'Pablo Ibáñez|MC|1998|73|74|ESP', 'Ander Guevara|MC|1997|74|74|ESP', 'Carlos Vicente|ED|1999|75|76|ESP',
      'Abde Rebbach|EI|1998|73|74|ALG', 'Lucas Boyé|DC|1996|76|76|ARG', 'Toni Martínez|DC|1997|74|74|ESP',
      'Mariano Díaz|DC|1993|72|72|DOM',
    ],
    'levante-ud': [
      'Mathew Ryan|POR|1992|75|75|AUS', 'Pablo Cuñat|POR|2002|68|74|ESP', 'Jeremy Toljan|LD|1994|73|73|GER',
      'Víctor García|LD|1997|70|71|ESP', 'Unai Elgezabal|DFC|1993|73|73|ESP', 'Adrián de la Fuente|DFC|2000|71|74|ESP',
      'Alan Matturro|DFC|2004|71|79|URU', 'Matías Moreno|DFC|2003|70|77|ARG', 'Diego Pampín|LI|2000|70|73|ESP',
      'Oriol Rey|MCD|1998|72|73|ESP', 'Unai Vencedor|MC|2000|73|75|ESP', 'Kervin Arriaga|MC|1998|73|74|HON',
      'Pablo Martínez|MC|1998|71|72|ESP', 'Jon Ander Olasagasti|MC|2000|71|73|ESP', 'Carlos Álvarez|MCO|2003|76|82|ESP',
      'Roger Brugué|ED|1996|74|74|ESP', 'Iván Romero|DC|2001|73|76|ESP', 'José Luis Morales|DC|1987|71|71|ESP',
      'Karl Etta Eyong|DC|2003|72|80|CMR',
    ],
    'elche-cf': [
      'Matías Dituro|POR|1987|74|74|ARG', 'Iñaki Peña|POR|1999|75|79|ESP', 'Álvaro Núñez|LD|2000|72|74|ESP',
      'Héctor Fort|LD|2006|70|80|ESP', 'David Affengruber|DFC|2001|75|78|AUT', 'Pedro Bigas|DFC|1990|73|73|ESP',
      'Víctor Chust|DFC|2000|73|75|ESP', 'Adrià Pedrosa|LI|1998|73|74|ESP', 'Marc Aguado|MCD|2000|74|77|ESP',
      'Aleix Febas|MC|1996|74|74|ESP', 'Martim Neto|MC|2003|71|78|POR', 'Federico Redondo|MCD|2003|73|79|ARG',
      'Rodrigo Mendoza|MC|2005|70|80|ESP', 'Germán Valera|ED|2002|73|77|ESP', 'Josan|ED|1989|71|71|ESP',
      'Yago Santiago|EI|2003|69|75|ESP', 'Grady Diangana|EI|1998|73|73|COD', 'Rafa Mir|DC|1997|75|75|ESP',
      'André Silva|DC|1995|77|77|POR', 'Álvaro Rodríguez|DC|2004|72|79|URU',
    ],
    'real-oviedo': [
      'Aarón Escandell|POR|1995|74|74|ESP', 'Horațiu Moldovan|POR|1998|74|76|ROU', 'Nacho Vidal|LD|1995|72|72|ESP',
      'Lucas Ahijado|LD|1995|70|70|ESP', 'Eric Bailly|DFC|1994|74|74|CIV', 'David Costas|DFC|1995|72|72|ESP',
      'Dani Calvo|DFC|1994|73|73|ESP', 'Rahim Alhassane|LI|2002|70|75|NIG', 'Javi López|LI|2002|70|74|ESP',
      'Santiago Colombatto|MC|1997|75|75|ARG', 'Alberto Reina|MC|1997|73|73|ESP', 'Kwasi Sibo|MCD|1998|73|74|GHA',
      'Leander Dendoncker|MCD|1995|74|74|BEL', 'Luka Ilić|MCO|1999|73|74|SRB', 'Santi Cazorla|MCO|1984|74|74|ESP',
      'Ilyas Chaira|EI|2001|73|77|MAR', 'Haissem Hassan|ED|2002|73|77|FRA', 'Federico Viñas|DC|1998|74|75|URU',
      'Salomón Rondón|DC|1989|75|75|VEN', 'Álex Forés|DC|2001|70|74|ESP',
    ],

    // ---------------- Premier League ----------------
    'liverpool': [
      'Alisson Becker|POR|1992|88|88|BRA', 'Giorgi Mamardashvili|POR|2000|82|86|GEO', 'Conor Bradley|LD|2003|77|83|NIR',
      'Jeremie Frimpong|LD|2000|83|84|NED', 'Virgil van Dijk|DFC|1991|88|88|NED', 'Ibrahima Konaté|DFC|1999|84|86|FRA',
      'Joe Gomez|DFC|1997|78|78|ENG', 'Giovanni Leoni|DFC|2006|72|84|ITA', 'Andrew Robertson|LI|1994|82|82|SCO',
      'Milos Kerkez|LI|2003|80|85|HUN', 'Ryan Gravenberch|MCD|2002|85|88|NED', 'Alexis Mac Allister|MC|1998|86|86|ARG',
      'Dominik Szoboszlai|MC|2000|84|85|HUN', 'Curtis Jones|MC|2001|80|82|ENG', 'Wataru Endo|MCD|1993|76|76|JPN',
      'Florian Wirtz|MCO|2003|88|91|GER', 'Mohamed Salah|ED|1992|89|89|EGY', 'Cody Gakpo|EI|1999|84|85|NED',
      'Federico Chiesa|ED|1997|78|78|ITA', 'Rio Ngumoha|EI|2008|67|85|ENG', 'Hugo Ekitiké|DC|2002|83|87|FRA',
      'Alexander Isak|DC|1999|87|88|SWE',
    ],
    'arsenal': [
      'David Raya|POR|1995|87|87|ESP', 'Kepa Arrizabalaga|POR|1994|78|78|ESP', 'Ben White|LD|1997|82|82|ENG',
      'Jurriën Timber|LD|2001|83|86|NED', 'William Saliba|DFC|2001|88|90|FRA', 'Gabriel Magalhães|DFC|1997|87|87|BRA',
      'Cristhian Mosquera|DFC|2004|76|84|ESP', 'Piero Hincapié|DFC|2002|81|85|ECU', 'Riccardo Calafiori|LI|2002|81|85|ITA',
      'Myles Lewis-Skelly|LI|2006|76|86|ENG', 'Declan Rice|MC|1999|88|88|ENG', 'Martín Zubimendi|MCD|1999|86|87|ESP',
      'Mikel Merino|MC|1996|83|83|ESP', 'Christian Nørgaard|MCD|1994|79|79|DEN', 'Martin Ødegaard|MCO|1998|87|87|NOR',
      'Eberechi Eze|MCO|1998|83|84|ENG', 'Ethan Nwaneri|MCO|2007|74|87|ENG', 'Bukayo Saka|ED|2001|88|90|ENG',
      'Noni Madueke|ED|2002|80|84|ENG', 'Max Dowman|ED|2009|62|85|ENG', 'Gabriel Martinelli|EI|2001|81|82|BRA',
      'Leandro Trossard|EI|1994|81|81|BEL', 'Viktor Gyökeres|DC|1998|86|86|SWE', 'Kai Havertz|DC|1999|83|83|GER',
    ],
    'manchester-city': [
      'Gianluigi Donnarumma|POR|1999|89|90|ITA', 'James Trafford|POR|2002|78|84|ENG', 'Matheus Nunes|LD|1998|79|79|POR',
      'Rico Lewis|LD|2004|78|84|ENG', 'Rúben Dias|DFC|1997|87|87|POR', 'Joško Gvardiol|DFC|2002|85|88|CRO',
      'John Stones|DFC|1994|82|82|ENG', 'Abdukodir Khusanov|DFC|2004|76|84|UZB', 'Nathan Aké|DFC|1995|81|81|NED',
      'Rayan Aït-Nouri|LI|2001|81|84|ALG', 'Rodri|MCD|1996|89|89|ESP', 'Tijjani Reijnders|MC|1998|84|85|NED',
      'Nico González|MCD|2002|79|83|ESP', 'Mateo Kovačić|MC|1994|82|82|CRO', 'Bernardo Silva|MC|1994|85|85|POR',
      'Phil Foden|MCO|2000|86|87|ENG', 'Rayan Cherki|MCO|2003|82|88|FRA', 'Jérémy Doku|EI|2002|82|86|BEL',
      'Savinho|ED|2004|81|87|BRA', 'Oscar Bobb|ED|2003|74|82|NOR', 'Omar Marmoush|DC|1999|83|84|EGY',
      'Erling Haaland|DC|2000|91|92|NOR',
    ],
    'chelsea': [
      'Robert Sánchez|POR|1997|80|81|ESP', 'Filip Jørgensen|POR|2002|75|81|DEN', 'Reece James|LD|1999|84|84|ENG',
      'Malo Gusto|LD|2003|80|84|FRA', 'Levi Colwill|DFC|2003|82|86|ENG', 'Wesley Fofana|DFC|2000|80|81|FRA',
      'Trevoh Chalobah|DFC|1999|80|80|ENG', 'Tosin Adarabioyo|DFC|1997|78|78|ENG', 'Benoît Badiashile|DFC|2001|78|81|FRA',
      'Josh Acheampong|DFC|2006|70|82|ENG', 'Marc Cucurella|LI|1998|84|84|ESP', 'Jorrel Hato|LI|2006|78|87|NED',
      'Moisés Caicedo|MCD|2001|87|88|ECU', 'Enzo Fernández|MC|2001|86|87|ARG', 'Roméo Lavia|MCD|2004|78|84|BEL',
      'Andrey Santos|MC|2004|76|83|BRA', 'Cole Palmer|MCO|2002|87|89|ENG', 'Pedro Neto|ED|2000|82|83|POR',
      'Estêvão|ED|2007|80|90|BRA', 'Jamie Gittens|EI|2004|79|85|ENG', 'Alejandro Garnacho|EI|2004|80|85|ARG',
      'João Pedro|DC|2001|83|85|BRA', 'Liam Delap|DC|2003|77|83|ENG',
    ],
    'newcastle-united': [
      'Nick Pope|POR|1992|83|83|ENG', 'Aaron Ramsdale|POR|1998|78|78|ENG', 'Kieran Trippier|LD|1990|79|79|ENG',
      'Tino Livramento|LD|2002|80|84|ENG', 'Sven Botman|DFC|2000|81|83|NED', 'Fabian Schär|DFC|1991|80|80|SUI',
      'Dan Burn|DFC|1992|79|79|ENG', 'Malick Thiaw|DFC|2001|80|83|GER', 'Lewis Hall|LI|2004|79|85|ENG',
      'Bruno Guimarães|MC|1997|87|87|BRA', 'Sandro Tonali|MCD|2000|85|86|ITA', 'Joelinton|MC|1996|82|82|BRA',
      'Jacob Ramsey|MC|2001|77|80|ENG', 'Joe Willock|MC|1999|76|76|ENG', 'Anthony Gordon|EI|2001|83|85|ENG',
      'Harvey Barnes|EI|1997|79|79|ENG', 'Jacob Murphy|ED|1995|79|79|ENG', 'Anthony Elanga|ED|2002|80|83|SWE',
      'Nick Woltemade|DC|2002|80|86|GER', 'Yoane Wissa|DC|1996|80|80|COD', 'William Osula|DC|2003|72|78|DEN',
    ],
    'manchester-united': [
      'Senne Lammens|POR|2002|77|84|BEL', 'Altay Bayındır|POR|1998|74|76|TUR', 'Diogo Dalot|LD|1999|80|80|POR',
      'Noussair Mazraoui|LD|1997|80|80|MAR', 'Matthijs de Ligt|DFC|1999|82|83|NED', 'Lisandro Martínez|DFC|1998|83|83|ARG',
      'Leny Yoro|DFC|2005|78|87|FRA', 'Harry Maguire|DFC|1993|78|78|ENG', 'Ayden Heaven|DFC|2006|69|81|ENG',
      'Luke Shaw|LI|1995|79|79|ENG', 'Patrick Dorgu|LI|2004|77|83|DEN', 'Casemiro|MCD|1992|80|80|BRA',
      'Manuel Ugarte|MCD|2001|79|82|URU', 'Kobbie Mainoo|MC|2005|79|86|ENG', 'Bruno Fernandes|MCO|1994|86|86|POR',
      'Mason Mount|MCO|1999|78|78|ENG', 'Amad Diallo|ED|2002|80|84|CIV', 'Bryan Mbeumo|ED|1999|83|84|CMR',
      'Matheus Cunha|EI|1999|82|83|BRA', 'Benjamin Šeško|DC|2003|80|87|SVN', 'Joshua Zirkzee|DC|2001|76|79|NED',
    ],
    'tottenham-hotspur': [
      'Guglielmo Vicario|POR|1996|83|83|ITA', 'Antonín Kinský|POR|2003|72|80|CZE', 'Pedro Porro|LD|1999|82|83|ESP',
      'Djed Spence|LD|2000|76|77|ENG', 'Cristian Romero|DFC|1998|85|85|ARG', 'Micky van de Ven|DFC|2001|84|86|NED',
      'Kevin Danso|DFC|1998|78|78|AUT', 'Radu Drăgușin|DFC|2002|76|80|ROU', 'Destiny Udogie|LI|2002|80|84|ITA',
      'João Palhinha|MCD|1995|83|83|POR', 'Rodrigo Bentancur|MC|1997|81|81|URU', 'Yves Bissouma|MCD|1996|79|79|MLI',
      'Pape Matar Sarr|MC|2002|80|84|SEN', 'Lucas Bergvall|MC|2006|77|86|SWE', 'Archie Gray|MC|2006|74|84|ENG',
      'Xavi Simons|MCO|2003|84|87|NED', 'James Maddison|MCO|1996|83|83|ENG', 'Dejan Kulusevski|ED|2000|82|83|SWE',
      'Mohammed Kudus|ED|2000|83|84|GHA', 'Brennan Johnson|ED|2001|79|81|WAL', 'Wilson Odobert|EI|2004|74|81|FRA',
      'Richarlison|DC|1997|78|78|BRA', 'Dominic Solanke|DC|1997|80|80|ENG', 'Randal Kolo Muani|DC|1998|80|80|FRA',
    ],
    'aston-villa': [
      'Emiliano Martínez|POR|1992|86|86|ARG', 'Marco Bizot|POR|1991|74|74|NED', 'Matty Cash|LD|1997|79|79|POL',
      'Andrés García|LD|2003|72|78|ESP', 'Ezri Konsa|DFC|1997|82|82|ENG', 'Pau Torres|DFC|1997|82|82|ESP',
      'Tyrone Mings|DFC|1993|78|78|ENG', 'Victor Lindelöf|DFC|1994|77|77|SWE', 'Lucas Digne|LI|1993|79|79|FRA',
      'Ian Maatsen|LI|2002|78|82|NED', 'Boubacar Kamara|MCD|1999|83|83|FRA', 'Amadou Onana|MCD|2001|82|84|BEL',
      'Youri Tielemans|MC|1997|83|83|BEL', 'John McGinn|MC|1994|81|81|SCO', 'Ross Barkley|MC|1993|76|76|ENG',
      'Morgan Rogers|MCO|2002|82|86|ENG', 'Emiliano Buendía|MCO|1996|78|78|ARG', 'Harvey Elliott|MCO|2003|78|82|ENG',
      'Jadon Sancho|EI|2000|77|78|ENG', 'Evann Guessand|ED|2001|76|79|CIV', 'Ollie Watkins|DC|1995|84|84|ENG',
      'Donyell Malen|DC|1999|79|80|NED',
    ],
    'brighton-hove-albion': [
      'Bart Verbruggen|POR|2002|79|84|NED', 'Jason Steele|POR|1990|72|72|ENG', 'Joël Veltman|LD|1992|75|75|NED',
      'Mats Wieffer|LD|2000|78|80|NED', 'Jan Paul van Hecke|DFC|2000|81|83|NED', 'Lewis Dunk|DFC|1991|79|79|ENG',
      'Olivier Boscagli|DFC|1997|76|76|FRA', 'Diego Coppola|DFC|2003|73|80|ITA', 'Ferdi Kadıoğlu|LI|1999|79|80|TUR',
      'Maxim De Cuyper|LI|2000|77|80|BEL', 'Carlos Baleba|MCD|2004|81|87|CMR', 'Jack Hinshelwood|MC|2005|75|82|ENG',
      'Yasin Ayari|MC|2003|76|81|SWE', 'James Milner|MC|1986|72|72|ENG', 'Diego Gómez|MC|2003|76|82|PAR',
      'Georginio Rutter|MCO|2002|78|82|FRA', 'Kaoru Mitoma|EI|1997|82|82|JPN', 'Brajan Gruda|EI|2004|74|81|GER',
      'Yankuba Minteh|ED|2004|77|84|GAM', 'Solly March|ED|1994|75|75|ENG', 'Danny Welbeck|DC|1990|77|77|ENG',
      'Stefanos Tzimas|DC|2005|70|80|GRE', 'Charalampos Kostoulas|DC|2007|68|81|GRE',
    ],
    'nottingham-forest': [
      'Matz Sels|POR|1992|82|82|BEL', 'John Victor|POR|1996|73|74|BRA', 'Neco Williams|LD|2001|78|79|WAL',
      'Ola Aina|LD|1996|78|78|NGA', 'Nicolò Savona|LD|2003|73|80|ITA', 'Murillo|DFC|2002|82|86|BRA',
      'Nikola Milenković|DFC|1997|82|82|SRB', 'Morato|DFC|2001|74|78|BRA', 'Oleksandr Zinchenko|LI|1996|76|76|UKR',
      'Elliot Anderson|MC|2002|82|86|ENG', 'Ibrahim Sangaré|MCD|1997|78|78|CIV', 'Nicolás Domínguez|MC|1998|76|76|ARG',
      'Douglas Luiz|MC|1998|78|78|BRA', 'Morgan Gibbs-White|MCO|2000|82|83|ENG', 'James McAtee|MCO|2002|75|80|ENG',
      'Omari Hutchinson|ED|2003|76|82|JAM', 'Dan Ndoye|ED|2000|79|81|SUI', 'Callum Hudson-Odoi|EI|2000|78|78|ENG',
      'Chris Wood|DC|1991|80|80|NZL', 'Igor Jesus|DC|2001|77|80|BRA', 'Arnaud Kalimuendo|DC|2002|77|80|FRA',
      'Taiwo Awoniyi|DC|1997|73|73|NGA',
    ],
    'crystal-palace': [
      'Dean Henderson|POR|1997|82|82|ENG', 'Walter Benítez|POR|1993|76|76|ARG', 'Daniel Muñoz|LD|1996|81|81|COL',
      'Nathaniel Clyne|LD|1991|72|72|ENG', 'Maxence Lacroix|DFC|2000|81|82|FRA', 'Marc Guéhi|DFC|2000|83|84|ENG',
      'Chris Richards|DFC|2000|77|78|USA', 'Chadi Riad|DFC|2003|72|78|MAR', 'Jaydee Canvot|DFC|2006|70|80|FRA',
      'Tyrick Mitchell|LI|1999|78|78|ENG', 'Borna Sosa|LI|1998|74|74|CRO', 'Adam Wharton|MC|2004|80|87|ENG',
      'Jefferson Lerma|MCD|1994|78|78|COL', 'Cheick Doucouré|MCD|2000|77|78|MLI', 'Will Hughes|MC|1995|76|76|ENG',
      'Justin Devenny|MC|2003|70|76|NIR', 'Daichi Kamada|MCO|1996|77|77|JPN', 'Christantus Uche|MCO|2003|73|78|NGA',
      'Ismaïla Sarr|ED|1998|80|80|SEN', 'Yéremy Pino|EI|2002|78|81|ESP', 'Jean-Philippe Mateta|DC|1997|80|80|FRA',
      'Eddie Nketiah|DC|1999|75|75|ENG',
    ],
    'afc-bournemouth': [
      'Đorđe Petrović|POR|1999|79|82|SRB', 'Will Dennis|POR|2000|68|73|ENG', 'Adam Smith|LD|1991|73|73|ENG',
      'Álex Jiménez|LD|2005|72|80|ESP', 'Marcos Senesi|DFC|1997|79|79|ARG', 'Bafodé Diakité|DFC|2001|77|80|FRA',
      'James Hill|DFC|2002|70|76|ENG', 'Veljko Milosavljević|DFC|2007|66|80|SRB', 'Adrien Truffert|LI|2001|78|80|FRA',
      'Julio Soler|LI|2005|68|78|ARG', 'Tyler Adams|MCD|1999|79|79|USA', 'Lewis Cook|MC|1997|77|77|ENG',
      'Alex Scott|MC|2003|76|82|ENG', 'Ryan Christie|MC|1995|76|76|SCO', 'Marcus Tavernier|MC|1999|78|79|ENG',
      'Justin Kluivert|MCO|1999|80|80|NED', 'Antoine Semenyo|ED|2000|82|83|GHA', 'David Brooks|ED|1997|75|75|WAL',
      'Amine Adli|EI|2000|77|78|MAR', 'Ben Gannon-Doak|EI|2005|70|79|SCO', 'Evanilson|DC|1999|79|80|BRA',
      'Enes Ünal|DC|1997|74|74|TUR', 'Eli Junior Kroupi|DC|2006|72|84|FRA',
    ],
    'brentford': [
      'Caoimhín Kelleher|POR|1998|80|82|IRL', 'Hákon Valdimarsson|POR|2001|70|75|ISL', 'Michael Kayode|LD|2004|74|81|ITA',
      'Aaron Hickey|LD|2002|74|78|SCO', 'Nathan Collins|DFC|2001|80|82|IRL', 'Kristoffer Ajer|DFC|1998|76|76|NOR',
      'Sepp van den Berg|DFC|2001|77|80|NED', 'Ethan Pinnock|DFC|1993|76|76|JAM', 'Rico Henry|LI|1997|74|74|ENG',
      'Keane Lewis-Potter|LI|2001|76|78|ENG', 'Vitaly Janelt|MCD|1998|76|76|GER', 'Jordan Henderson|MC|1990|77|77|ENG',
      'Mathias Jensen|MC|1996|77|77|DEN', 'Yehor Yarmolyuk|MC|2004|73|79|UKR', 'Mikkel Damsgaard|MCO|2000|78|79|DEN',
      'Fábio Carvalho|MCO|2002|74|78|POR', 'Kevin Schade|EI|2001|77|79|GER', 'Reiss Nelson|EI|1999|73|73|ENG',
      'Dango Ouattara|ED|2002|77|80|BFA', 'Igor Thiago|DC|2001|78|81|BRA',
    ],
    'fulham': [
      'Bernd Leno|POR|1992|82|82|GER', 'Benjamin Lecomte|POR|1991|72|72|FRA', 'Kenny Tete|LD|1995|77|77|NED',
      'Timothy Castagne|LD|1995|77|77|BEL', 'Joachim Andersen|DFC|1996|80|80|DEN', 'Calvin Bassey|DFC|1999|79|80|NGA',
      'Issa Diop|DFC|1997|76|76|FRA', 'Jorge Cuenca|DFC|1999|74|75|ESP', 'Antonee Robinson|LI|1997|81|81|USA',
      'Ryan Sessegnon|LI|2000|73|74|ENG', 'Sander Berge|MCD|1998|79|79|NOR', 'Saša Lukić|MC|1996|77|77|SRB',
      'Harrison Reed|MC|1995|75|75|ENG', 'Tom Cairney|MC|1991|75|75|SCO', 'Emile Smith Rowe|MCO|2000|79|80|ENG',
      'Andreas Pereira|MCO|1996|79|79|BRA', 'Alex Iwobi|ED|1996|80|80|NGA', 'Samuel Chukwueze|ED|1999|77|77|NGA',
      'Harry Wilson|ED|1997|78|78|WAL', 'Adama Traoré|ED|1996|75|75|ESP', 'Kevin|EI|2003|74|81|BRA',
      'Raúl Jiménez|DC|1991|78|78|MEX', 'Rodrigo Muniz|DC|2001|77|79|BRA',
    ],
    'west-ham-united': [
      'Alphonse Areola|POR|1993|78|78|FRA', 'Mads Hermansen|POR|2000|77|81|DEN', 'Aaron Wan-Bissaka|LD|1997|79|79|COD',
      'Kyle Walker-Peters|LD|1997|75|75|ENG', 'Max Kilman|DFC|1997|79|79|ENG', 'Konstantinos Mavropanos|DFC|1997|78|78|GRE',
      'Jean-Clair Todibo|DFC|1999|78|79|FRA', 'El Hadji Malick Diouf|LI|2004|76|83|SEN', 'Oliver Scarles|LI|2005|65|76|ENG',
      'Tomáš Souček|MC|1995|79|79|CZE', 'Mateus Fernandes|MC|2004|75|82|POR', 'Guido Rodríguez|MCD|1994|77|77|ARG',
      'Soungoutou Magassa|MCD|2003|72|79|FRA', 'Andy Irving|MC|2000|72|74|SCO', 'Lucas Paquetá|MCO|1997|82|82|BRA',
      'George Earthy|MCO|2004|66|75|ENG', 'Jarrod Bowen|ED|1996|83|83|ENG', 'Luis Guilherme|ED|2006|68|80|BRA',
      'Crysencio Summerville|EI|2001|77|80|NED', 'Niclas Füllkrug|DC|1993|77|77|GER', 'Callum Wilson|DC|1992|75|75|ENG',
    ],
    'everton': [
      'Jordan Pickford|POR|1994|83|83|ENG', 'Mark Travers|POR|1999|72|74|IRL', 'Seamus Coleman|LD|1988|72|72|IRL',
      'Nathan Patterson|LD|2001|73|75|SCO', 'Jake O\'Brien|DFC|2001|76|79|IRL', 'James Tarkowski|DFC|1992|80|80|ENG',
      'Jarrad Branthwaite|DFC|2002|80|85|ENG', 'Michael Keane|DFC|1993|75|75|ENG', 'Vitalii Mykolenko|LI|1999|77|78|UKR',
      'Idrissa Gueye|MCD|1989|77|77|SEN', 'James Garner|MC|2001|78|80|ENG', 'Tim Iroegbunam|MC|2003|71|77|ENG',
      'Merlin Röhl|MC|2002|71|77|GER', 'Kiernan Dewsbury-Hall|MC|1998|78|78|ENG', 'Carlos Alcaraz|MCO|2002|73|78|ARG',
      'Jack Grealish|EI|1995|80|80|ENG', 'Iliman Ndiaye|EI|2000|79|81|SEN', 'Dwight McNeil|EI|1999|77|77|ENG',
      'Tyler Dibling|ED|2006|71|82|ENG', 'Beto|DC|1998|75|76|POR', 'Thierno Barry|DC|2002|75|80|FRA',
    ],
    'wolverhampton': [
      'José Sá|POR|1993|79|79|POR', 'Sam Johnstone|POR|1993|74|74|ENG', 'Matt Doherty|LD|1992|74|74|IRL',
      'Jackson Tchatchoua|LD|2001|73|78|CMR', 'Santiago Bueno|DFC|1998|76|77|URU', 'Toti Gomes|DFC|1999|76|77|POR',
      'Emmanuel Agbadou|DFC|1997|76|77|CIV', 'Ladislav Krejčí|DFC|1999|77|78|CZE', 'Yerson Mosquera|DFC|2001|74|78|COL',
      'Hugo Bueno|LI|2002|72|76|ESP', 'David Møller Wolfe|LI|2002|72|76|NOR', 'André|MCD|2001|77|81|BRA',
      'João Gomes|MC|2001|80|82|BRA', 'Marshall Munetsi|MC|1996|75|75|ZIM', 'Jean-Ricner Bellegarde|MCO|1998|76|76|HAI',
      'Fer López|MCO|2004|72|80|ESP', 'Rodrigo Gomes|ED|2003|72|78|POR', 'Jhon Arias|ED|1997|78|78|COL',
      'Mateus Mané|ED|2007|64|80|POR', 'Hwang Hee-chan|DC|1996|75|75|KOR', 'Jørgen Strand Larsen|DC|2000|78|80|NOR',
      'Tolu Arokodare|DC|2000|74|76|NGA',
    ],
    'leeds-united': [
      'Lucas Perri|POR|1997|76|78|BRA', 'Illan Meslier|POR|2000|74|77|FRA', 'Karl Darlow|POR|1990|70|70|WAL',
      'Jayden Bogle|LD|2000|75|76|ENG', 'James Justin|LD|1998|74|74|ENG', 'Pascal Struijk|DFC|1999|76|77|NED',
      'Joe Rodon|DFC|1997|77|77|WAL', 'Jaka Bijol|DFC|1999|77|78|SVN', 'Gabriel Gudmundsson|LI|1999|75|76|SWE',
      'Sam Byram|LI|1993|71|71|ENG', 'Ethan Ampadu|MCD|2000|77|78|WAL', 'Ao Tanaka|MC|1998|76|77|JPN',
      'Anton Stach|MC|1998|77|77|GER', 'Ilia Gruev|MCD|2000|73|75|BUL', 'Sean Longstaff|MC|1997|75|75|ENG',
      'Brenden Aaronson|MCO|2000|75|76|USA', 'Daniel James|ED|1997|75|75|WAL', 'Wilfried Gnonto|EI|2003|75|79|ITA',
      'Noah Okafor|EI|2000|76|77|SUI', 'Dominic Calvert-Lewin|DC|1997|75|75|ENG', 'Lukas Nmecha|DC|1998|74|74|GER',
      'Joël Piroe|DC|1999|75|76|NED',
    ],
    'sunderland': [
      'Robin Roefs|POR|2003|76|83|NED', 'Anthony Patterson|POR|2000|72|76|ENG', 'Trai Hume|LD|2002|74|78|NIR',
      'Lutsharel Geertruida|LD|2000|76|78|NED', 'Omar Alderete|DFC|1996|76|76|PAR', 'Dan Ballard|DFC|1999|74|76|NIR',
      'Nordi Mukiele|DFC|1997|77|77|FRA', 'Luke O\'Nien|DFC|1994|71|71|ENG', 'Reinildo Mandava|LI|1994|76|76|MOZ',
      'Dennis Cirkin|LI|2002|71|75|ENG', 'Granit Xhaka|MC|1992|82|82|SUI', 'Noah Sadiki|MCD|2004|75|83|COD',
      'Habib Diarra|MC|2004|76|83|SEN', 'Enzo Le Fée|MCO|2000|77|79|FRA', 'Dan Neil|MC|2001|72|75|ENG',
      'Chris Rigg|MC|2007|69|83|ENG', 'Simon Adingra|EI|2002|77|80|CIV', 'Bertrand Traoré|ED|1995|75|75|BFA',
      'Chemsdine Talbi|ED|2005|72|80|MAR', 'Wilson Isidor|DC|2000|76|78|FRA', 'Eliezer Mayenda|DC|2005|71|79|ESP',
      'Brian Brobbey|DC|2002|76|80|NED',
    ],
    'burnley': [
      'Martin Dúbravka|POR|1989|76|76|SVK', 'Max Weiß|POR|2004|70|78|GER', 'Kyle Walker|LD|1990|79|79|ENG',
      'Connor Roberts|LD|1995|72|72|WAL', 'Maxime Estève|DFC|2002|76|80|FRA', 'Hjalmar Ekdal|DFC|1998|73|74|SWE',
      'Axel Tuanzebe|DFC|1997|73|73|COD', 'Joe Worrall|DFC|1997|71|71|ENG', 'Quilindschy Hartman|LI|2001|74|78|NED',
      'Lucas Pires|LI|2001|71|75|BRA', 'Josh Cullen|MC|1996|75|75|IRL', 'Lesley Ugochukwu|MCD|2004|74|80|FRA',
      'Florentino Luís|MCD|1999|77|78|POR', 'Josh Laurent|MC|1995|72|72|ENG', 'Hannibal Mejbri|MC|2003|72|78|TUN',
      'Jaidon Anthony|EI|1999|75|75|ENG', 'Loum Tchaouna|ED|2003|74|78|FRA', 'Marcus Edwards|ED|1998|74|74|ENG',
      'Jacob Bruun Larsen|EI|1998|72|72|DEN', 'Lyle Foster|DC|2000|74|76|RSA', 'Zian Flemming|DC|1998|75|75|NED',
      'Armando Broja|DC|2001|73|76|ALB', 'Zeki Amdouni|DC|2000|74|76|SUI',
    ],
  };

  // Construye el dataset «real»: ligas de la demo + plantillas reales donde las hay.
  MCM.DATA.realDataset = function () {
    const U = MCM.util;
    const rosters = MCM.DATA.realRosters;
    const year = 2026;
    const leagues = MCM.DATA.leagues.map((L) => Object.assign({}, L, {
      clubs: L.clubs.map((row) => {
        const c = { name: row[0], short: row[1], rep: row[2], stadium: row[3], colors: [row[4], row[5]] };
        Object.assign(c, row[6] || {});
        const list = rosters[U.slug(row[0])];
        if (list) {
          c.fill = true;
          c.players = list.map((line) => {
            const [name, pos, by, ovr, pot, nat] = line.split('|');
            return {
              id: 'mc:' + U.slug(name) + '-' + by, name, pos, nat, age: year - Number(by),
              ovr: Number(ovr), pot: Math.max(Number(ovr), Number(pot)), src: 'knowledge',
            };
          });
        }
        return c;
      }),
    }));
    return {
      info: { id: MCM.DATA.realRostersInfo.id, name: MCM.DATA.realRostersInfo.name, isDemo: false, partialReal: true },
      leagues,
    };
  };
})(globalThis.MCM = globalThis.MCM || {});
