/* Nombres ficticios por origen. Las combinaciones son aleatorias: no representan a personas reales. */
(function (MCM) {
  'use strict';
  MCM.DATA = MCM.DATA || {};

  const POOLS = {
    es: {
      first: ['Adrián', 'Álvaro', 'Andrés', 'Ángel', 'Borja', 'Carlos', 'César', 'Dani', 'David', 'Diego', 'Eduardo', 'Enrique', 'Fernando', 'Gonzalo', 'Guillermo', 'Hugo', 'Iker', 'Iván', 'Jaime', 'Javier', 'Jesús', 'Jorge', 'José', 'Juan', 'Julián', 'Lucas', 'Luis', 'Manuel', 'Marcos', 'Mario', 'Martín', 'Mateo', 'Miguel', 'Nacho', 'Néstor', 'Óscar', 'Pablo', 'Pedro', 'Rafael', 'Raúl', 'Rubén', 'Samuel', 'Santiago', 'Sergio', 'Tomás', 'Unai', 'Víctor', 'Xabier', 'Aitor', 'Joel', 'Íñigo', 'Ander', 'Bruno', 'Rodrigo', 'Emilio'],
      last: ['Alonso', 'Arranz', 'Blanco', 'Bravo', 'Cabrera', 'Calvo', 'Campos', 'Castro', 'Cortés', 'Delgado', 'Díaz', 'Domínguez', 'Escudero', 'Esteban', 'Fuentes', 'Gallego', 'Garrido', 'Gil', 'Herrera', 'Ibáñez', 'Iglesias', 'Lorenzo', 'Lozano', 'Marín', 'Medina', 'Molina', 'Montero', 'Mora', 'Navarro', 'Nieto', 'Ortega', 'Pascual', 'Peña', 'Prieto', 'Ramos', 'Reyes', 'Rubio', 'Sáez', 'Santos', 'Serrano', 'Soler', 'Toledo', 'Vargas', 'Vega', 'Vidal', 'Zamora', 'Aguirre', 'Echeverría', 'Larrañaga', 'Olabarria', 'Quintana', 'Robles', 'Salinas', 'Vicente', 'Barrios'],
    },
    la: {
      first: ['Agustín', 'Alexis', 'Benjamín', 'Bautista', 'Cristian', 'Emiliano', 'Facundo', 'Franco', 'Gastón', 'Gonzalo', 'Ignacio', 'Joaquín', 'Juan Cruz', 'Kevin', 'Leandro', 'Lautaro', 'Matías', 'Maximiliano', 'Nahuel', 'Nicolás', 'Rodrigo', 'Santiago', 'Thiago', 'Valentín', 'Brian', 'Yeferson', 'Jhon', 'Wilmar', 'Édgar', 'Luciano'],
      last: ['Acosta', 'Benítez', 'Cáceres', 'Correa', 'Ferreyra', 'Giménez', 'Godoy', 'Ledesma', 'Maidana', 'Medina', 'Montiel', 'Ojeda', 'Paredes', 'Quiroga', 'Riquelme', 'Romero', 'Sosa', 'Suárez', 'Villalba', 'Zárate', 'Arango', 'Cuadrado', 'Mosquera', 'Valencia', 'Olivera', 'Cardozo', 'Peralta', 'Ríos', 'Aquino', 'Bermúdez'],
    },
    pt: {
      first: ['André', 'Bruno', 'Caio', 'Diogo', 'Eduardo', 'Felipe', 'Gabriel', 'Gonçalo', 'Guilherme', 'Henrique', 'João', 'Leonardo', 'Lucas', 'Matheus', 'Nuno', 'Paulo', 'Pedro', 'Rafael', 'Ricardo', 'Rodrigo', 'Tiago', 'Vinícius', 'Vitor', 'Wesley', 'Rúben', 'Igor', 'Murilo', 'Danilo'],
      last: ['Almeida', 'Araújo', 'Barbosa', 'Cardoso', 'Carvalho', 'Costa', 'Cunha', 'Duarte', 'Ferreira', 'Gomes', 'Lima', 'Lopes', 'Machado', 'Martins', 'Mendes', 'Moreira', 'Nascimento', 'Neves', 'Oliveira', 'Pereira', 'Pinto', 'Ribeiro', 'Rocha', 'Santana', 'Teixeira', 'Vieira', 'Fonseca', 'Coelho'],
    },
    en: {
      first: ['Aaron', 'Adam', 'Alfie', 'Ben', 'Callum', 'Charlie', 'Connor', 'Daniel', 'Dylan', 'Ethan', 'Finley', 'George', 'Harry', 'Harvey', 'Jack', 'Jacob', 'Jake', 'James', 'Jordan', 'Josh', 'Kieran', 'Leo', 'Liam', 'Louis', 'Luke', 'Mason', 'Max', 'Nathan', 'Oliver', 'Owen', 'Reece', 'Ryan', 'Sam', 'Theo', 'Tom', 'Tyler', 'Will', 'Archie', 'Rhys', 'Declan'],
      last: ['Barnes', 'Bennett', 'Bradley', 'Brooks', 'Carter', 'Chapman', 'Clarke', 'Cole', 'Cooper', 'Davies', 'Dawson', 'Ellis', 'Fletcher', 'Foster', 'Gibson', 'Graham', 'Harper', 'Hayes', 'Holland', 'Hughes', 'Hunt', 'Jenkins', 'Knight', 'Lawson', 'Marshall', 'Mason', 'Mills', 'Morgan', 'Palmer', 'Parker', 'Pearson', 'Porter', 'Reid', 'Russell', 'Shaw', 'Spencer', 'Stevens', 'Turner', 'Walsh', 'Webb', 'Wells', 'Whitaker'],
    },
    it: {
      first: ['Alessandro', 'Andrea', 'Antonio', 'Christian', 'Daniele', 'Davide', 'Edoardo', 'Emanuele', 'Fabio', 'Federico', 'Filippo', 'Francesco', 'Gabriele', 'Giacomo', 'Gianluca', 'Giorgio', 'Giovanni', 'Leonardo', 'Lorenzo', 'Luca', 'Manuel', 'Marco', 'Matteo', 'Mattia', 'Michele', 'Nicolò', 'Pietro', 'Riccardo', 'Simone', 'Stefano', 'Tommaso'],
      last: ['Barella', 'Bellini', 'Bianchi', 'Bruno', 'Caruso', 'Colombo', 'Conti', 'Costa', 'De Luca', 'Esposito', 'Fabbri', 'Ferrara', 'Ferri', 'Galli', 'Gatti', 'Greco', 'Leone', 'Lombardi', 'Mancini', 'Marchetti', 'Marini', 'Moretti', 'Pellegrini', 'Rinaldi', 'Rizzo', 'Romano', 'Russo', 'Santoro', 'Serra', 'Testa', 'Villa', 'Vitale'],
    },
    de: {
      first: ['Alexander', 'Benedikt', 'Christoph', 'Dominik', 'Elias', 'Felix', 'Finn', 'Florian', 'Jan', 'Jonas', 'Julian', 'Kai', 'Leon', 'Lukas', 'Malte', 'Marius', 'Max', 'Maximilian', 'Moritz', 'Niklas', 'Nico', 'Paul', 'Philipp', 'Robin', 'Sebastian', 'Simon', 'Tim', 'Tobias', 'Yannik', 'Jannis'],
      last: ['Bauer', 'Becker', 'Brandt', 'Braun', 'Fischer', 'Frank', 'Hartmann', 'Hoffmann', 'Horn', 'Jung', 'Kaiser', 'Keller', 'Klein', 'Koch', 'Krause', 'Kraus', 'Lang', 'Lehmann', 'Lorenz', 'Meyer', 'Neumann', 'Richter', 'Schäfer', 'Schmitt', 'Schneider', 'Schulz', 'Vogel', 'Wagner', 'Weber', 'Winkler', 'Wolf', 'Ziegler'],
    },
    fr: {
      first: ['Adrien', 'Alexis', 'Antoine', 'Arthur', 'Baptiste', 'Benjamin', 'Clément', 'Corentin', 'Dylan', 'Enzo', 'Florian', 'Hugo', 'Jérémy', 'Jules', 'Julien', 'Kylian', 'Léo', 'Lucas', 'Mathis', 'Maxence', 'Nathan', 'Nicolas', 'Quentin', 'Rayan', 'Romain', 'Théo', 'Thomas', 'Valentin', 'Yanis', 'Mattéo'],
      last: ['Bernard', 'Bertrand', 'Blanc', 'Bonnet', 'Chevalier', 'Dubois', 'Dumont', 'Durand', 'Fontaine', 'Fournier', 'Gauthier', 'Girard', 'Guerin', 'Lambert', 'Laurent', 'Lefebvre', 'Leroy', 'Martin', 'Mercier', 'Moreau', 'Morel', 'Perrin', 'Petit', 'Renaud', 'Robin', 'Rousseau', 'Roux', 'Simon', 'Vincent', 'Masson'],
    },
    af: {
      first: ['Abdou', 'Amadou', 'Boubacar', 'Cheikh', 'Ibrahima', 'Ismaïla', 'Lamine', 'Mamadou', 'Moussa', 'Ousmane', 'Pape', 'Sadio', 'Seydou', 'Youssouf', 'Kalidou', 'Yves', 'Serge', 'Wilfried', 'Franck', 'Christ'],
      last: ['Bamba', 'Camara', 'Cissé', 'Coulibaly', 'Diallo', 'Diarra', 'Diop', 'Doumbia', 'Fofana', 'Gueye', 'Kanté', 'Keïta', 'Koné', 'Konaté', 'Mendy', 'Ndiaye', 'Sanogo', 'Sarr', 'Touré', 'Traoré', 'Kouassi', 'Zadi'],
    },
    ng: {
      first: ['Ademola', 'Chidera', 'Chukwuemeka', 'Emeka', 'Femi', 'Ikenna', 'Kelechi', 'Oluwaseun', 'Samuel', 'Tobi', 'Victor', 'Wilfred', 'Kingsley', 'Calvin', 'Raphael'],
      last: ['Adeyemi', 'Akinola', 'Balogun', 'Eze', 'Ibe', 'Nwosu', 'Obi', 'Okafor', 'Okonkwo', 'Olayinka', 'Onuachu', 'Uche', 'Udoh', 'Ajayi', 'Babatunde'],
    },
    ar: {
      first: ['Achraf', 'Adam', 'Amine', 'Anass', 'Bilal', 'Hakim', 'Ilias', 'Ismael', 'Karim', 'Mehdi', 'Nayef', 'Noussair', 'Oussama', 'Riad', 'Sofiane', 'Yassine', 'Youssef', 'Zakaria'],
      last: ['Amrabat', 'Benali', 'Bennani', 'Bouzid', 'Chakir', 'El Amrani', 'El Idrissi', 'Haddad', 'Hamdaoui', 'Kaddouri', 'Mansouri', 'Ouali', 'Saidi', 'Tahiri', 'Zerrouki', 'Belkacem'],
    },
    nl: {
      first: ['Bart', 'Daan', 'Jesse', 'Joey', 'Jurriën', 'Lars', 'Luuk', 'Milan', 'Noa', 'Ruben', 'Sem', 'Stijn', 'Thijs', 'Tijn', 'Wout', 'Kees', 'Arne', 'Dries', 'Jelle', 'Maarten'],
      last: ['Bakker', 'de Boer', 'de Jong', 'de Vries', 'Dekker', 'Hendriks', 'Jansen', 'Kok', 'Mertens', 'Meijer', 'Mulder', 'Peeters', 'Smit', 'van Dijk', 'van der Berg', 'Visser', 'Willems', 'Janssens', 'Claes', 'Wouters'],
    },
    sl: {
      first: ['Ante', 'Bruno', 'Dejan', 'Dušan', 'Filip', 'Ivan', 'Josip', 'Luka', 'Marko', 'Mateo', 'Milan', 'Nikola', 'Petar', 'Stefan', 'Vladimir', 'Jakub', 'Kacper', 'Piotr', 'Tomasz', 'Michał'],
      last: ['Babić', 'Horvat', 'Jurić', 'Kovačić', 'Marić', 'Novak', 'Perić', 'Petrović', 'Radić', 'Savić', 'Stanković', 'Vuković', 'Živković', 'Kowalski', 'Nowak', 'Wiśniewski', 'Zieliński', 'Lewandowicz'],
    },
    no: {
      first: ['Anders', 'Emil', 'Erik', 'Gustav', 'Isak', 'Jesper', 'Kasper', 'Magnus', 'Mikkel', 'Oscar', 'Rasmus', 'Sander', 'Viktor', 'Oliver', 'Mathias', 'Andreas'],
      last: ['Andersen', 'Berg', 'Christensen', 'Dahl', 'Eriksson', 'Hansen', 'Holm', 'Johansson', 'Karlsson', 'Larsen', 'Lindqvist', 'Madsen', 'Nielsen', 'Olsen', 'Pedersen', 'Sørensen'],
    },
    jp: {
      first: ['Daichi', 'Haruto', 'Hiroki', 'Kaito', 'Kenta', 'Ren', 'Ritsu', 'Shota', 'Sota', 'Takumi', 'Yuki', 'Yuto', 'Kaoru', 'Takefusa'],
      last: ['Endo', 'Fujita', 'Ito', 'Kato', 'Kobayashi', 'Matsuda', 'Nakamura', 'Saito', 'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Yamamoto'],
    },
  };

  // Nacionalidad (código FIFA-like) -> grupo de nombres
  const NATIONS = {
    ESP: ['es', 'España'], ARG: ['la', 'Argentina'], URU: ['la', 'Uruguay'], COL: ['la', 'Colombia'], MEX: ['la', 'México'],
    POR: ['pt', 'Portugal'], BRA: ['pt', 'Brasil'], ENG: ['en', 'Inglaterra'], SCO: ['en', 'Escocia'], IRL: ['en', 'Irlanda'],
    USA: ['en', 'EE. UU.'], WAL: ['en', 'Gales'], ITA: ['it', 'Italia'], GER: ['de', 'Alemania'], AUT: ['de', 'Austria'],
    SUI: ['de', 'Suiza'], FRA: ['fr', 'Francia'], SEN: ['af', 'Senegal'], CIV: ['af', 'Costa de Marfil'], MLI: ['af', 'Malí'],
    NGA: ['ng', 'Nigeria'], GHA: ['ng', 'Ghana'], MAR: ['ar', 'Marruecos'], ALG: ['ar', 'Argelia'], NED: ['nl', 'Países Bajos'],
    BEL: ['nl', 'Bélgica'], CRO: ['sl', 'Croacia'], SRB: ['sl', 'Serbia'], POL: ['sl', 'Polonia'], DEN: ['no', 'Dinamarca'],
    SWE: ['no', 'Suecia'], NOR: ['no', 'Noruega'], JPN: ['jp', 'Japón'],
  };

  // Extranjeros habituales por liga (ponderación aproximada)
  const FOREIGN = ['ARG', 'BRA', 'FRA', 'POR', 'URU', 'COL', 'NED', 'BEL', 'GER', 'ITA', 'ESP', 'ENG', 'SEN', 'CIV', 'MAR', 'NGA', 'CRO', 'SRB', 'POL', 'DEN', 'SWE', 'NOR', 'JPN', 'USA', 'MLI', 'GHA', 'ALG', 'SUI', 'AUT', 'SCO', 'MEX'];

  MCM.DATA.namePools = POOLS;
  MCM.DATA.nations = NATIONS;
  MCM.DATA.foreignNations = FOREIGN;
  MCM.DATA.nationName = (code) => (NATIONS[code] ? NATIONS[code][1] : code);
})(globalThis.MCM = globalThis.MCM || {});
