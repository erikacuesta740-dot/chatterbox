/* K League 1 2025 — clubes y plantillas según el conocimiento del asistente, NO verificados. Medias y potenciales estimados (no son de EA SPORTS FC). */
(function (MCM) {
  'use strict';
  MCM.DATA.addLeague({
    id: 'KOR1', name: 'K League 1', country: 'Corea del Sur', nat: 'KOR', tier: 1,
    uefa: false, wealth: 0.2,
    clubs: [
      // [name, short, reputation, stadium, color1, color2]
      ['Jeonbuk Hyundai Motors', 'JEO', 67, 'Jeonju World Cup Stadium', '#00843d', '#ffd100'],
      ['Ulsan HD', 'ULS', 66, 'Ulsan Munsu Football Stadium', '#003da5', '#ffd100'],
      ['FC Seoul', 'SEO', 64, 'Seoul World Cup Stadium', '#e30613', '#000000'],
      ['Pohang Steelers', 'POH', 63, 'Pohang Steel Yard', '#e30613', '#000000'],
      ['Daejeon Hana Citizen', 'DAE', 61, 'Daejeon World Cup Stadium', '#6b2c91', '#00a651'],
      ['Gangwon FC', 'GAN', 60, 'Chuncheon Songam Stadium', '#f37021', '#003da5'],
      ['Gimcheon Sangmu', 'GIM', 60, 'Gimcheon Stadium', '#e30613', '#003da5'],
      ['Gwangju FC', 'GWA', 59, 'Gwangju Football Stadium', '#ffd100', '#e30613'],
      ['Suwon FC', 'SUW', 58, 'Suwon Sports Complex', '#003da5', '#e30613'],
      ['Jeju SK', 'JEJ', 58, 'Jeju World Cup Stadium', '#f37021', '#ffffff'],
      ['Daegu FC', 'DGU', 57, 'DGB Daegu Bank Park', '#6cace4', '#ffffff'],
      ['FC Anyang', 'ANY', 56, 'Anyang Stadium', '#5b2d8e', '#ffffff'],
    ],
  }, {
    'jeonbuk-hyundai-motors': [
      'Song Bum-keun|POR|1997|68|70|KOR', 'Kim Tae-hwan|LD|1989|67|67|KOR', 'Hong Jeong-ho|DFC|1989|67|67|KOR',
      'Park Jin-seob|DFC|1995|69|69|KOR', 'Kim Jin-su|LI|1992|68|68|KOR', 'Kim Young-bin|DFC|1991|66|66|KOR',
      'Kim Jin-gyu|MC|1997|69|70|KOR', 'Lee Young-jae|MC|1994|68|68|KOR', 'Lee Seung-woo|MCO|1998|69|69|KOR',
      'Jeon Jin-woo|ED|1999|71|73|KOR', 'Song Min-kyu|EI|1999|69|70|KOR', 'Andrea Compagno|DC|1996|70|70|ITA',
      'Tiago Orobó|DC|1993|68|68|BRA',
    ],
    'ulsan-hd': [
      'Jo Hyeon-woo|POR|1991|71|71|KOR', 'Kim Young-gwon|DFC|1990|68|68|KOR', 'Lee Chung-yong|MC|1988|66|66|KOR',
      'Darijan Bojanić|MC|1994|69|69|SWE', 'Ko Seung-beom|MC|1994|67|67|KOR', 'Lee Jin-hyun|MCO|1997|67|68|KOR',
      'Um Won-sang|ED|1999|70|71|KOR',
    ],
    'fc-seoul': [
      'Kang Hyeon-mu|POR|1995|67|67|KOR', 'Kim Jin-ya|LD|1998|67|68|KOR', 'Yazan Al-Arab|DFC|1996|68|68|JOR',
      'Choi Jun|LD|1999|67|68|KOR', 'Jeong Seung-won|MC|1997|67|67|KOR', 'Jesse Lingard|MCO|1992|72|72|ENG',
      'Moon Seon-min|ED|1992|66|66|KOR', 'Cho Young-wook|DC|1999|68|69|KOR', 'Stanislav Iljutcenko|DC|1990|67|67|GER',
    ],
    'pohang-steelers': [
      'Hwang In-jae|POR|1994|67|67|KOR', 'Lee Ho-jae|DC|2000|67|69|KOR', 'Ki Sung-yueng|MC|1989|67|67|KOR',
    ],
    'daejeon-hana-citizen': ['Lee Chang-geun|POR|1993|67|67|KOR', 'Joo Min-kyu|DC|1990|68|68|KOR'],
    'gangwon-fc': [],
    'gimcheon-sangmu': [],
    'gwangju-fc': [],
    'suwon-fc': [],
    'jeju-sk': [],
    'daegu-fc': ['Cesinha|ED|1989|68|68|BRA'],
    'fc-anyang': [],
  });
})(globalThis.MCM = globalThis.MCM || {});
