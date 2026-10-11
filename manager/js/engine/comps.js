/*
 * Competiciones y calendario por fechas.
 * - Ligas: jornadas en fin de semana (+ entre semana si hacen falta), con parones internacionales.
 * - Copas nacionales a partido único (prórroga y penaltis; en España juega en casa el de menor categoría).
 * - Champions, Europa League y Conference League con fase liga de 36 equipos, playoffs,
 *   eliminatorias a doble partido y final a partido único.
 * Los clubes europeos que no están en nuestras ligas son reales (nombres y colores), con plantillas ficticias.
 */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const K = (MCM.comps = {});
  const C = () => MCM.career;

  // ---------- Clubes europeos adicionales: [nombre, abreviatura, país, reputación, color1, color2] ----------
  K.EXTRA_CLUBS = [
    ['SL Benfica', 'SLB', 'POR', 81, '#e2001a', '#ffffff'], ['FC Porto', 'FCP', 'POR', 80, '#00428c', '#ffffff'], ['Sporting CP', 'SCP', 'POR', 80, '#008057', '#ffffff'],
    ['SC Braga', 'SCB', 'POR', 74, '#d71920', '#ffffff'], ['Vitória SC', 'VSC', 'POR', 68, '#ffffff', '#000000'], ['PSV Eindhoven', 'PSV', 'NED', 79, '#ed1c24', '#ffffff'],
    ['Ajax', 'AJA', 'NED', 77, '#ffffff', '#d2122e'], ['Feyenoord', 'FEY', 'NED', 77, '#ff0000', '#ffffff'], ['AZ Alkmaar', 'AZ', 'NED', 72, '#e30613', '#ffffff'],
    ['FC Twente', 'TWE', 'NED', 70, '#e30613', '#ffffff'], ['Celtic', 'CEL', 'SCO', 74, '#018749', '#ffffff'], ['Rangers', 'RAN', 'SCO', 72, '#1b458f', '#ffffff'],
    ['Hearts', 'HEA', 'SCO', 63, '#7a1f3d', '#ffffff'], ['Club Brugge', 'BRU', 'BEL', 76, '#0071b9', '#000000'], ['Anderlecht', 'AND', 'BEL', 70, '#4b2b83', '#ffffff'],
    ['Union Saint-Gilloise', 'USG', 'BEL', 72, '#ffd100', '#1e3a8a'], ['KRC Genk', 'GNK', 'BEL', 69, '#004b93', '#ffffff'], ['KAA Gent', 'GNT', 'BEL', 67, '#0033a0', '#ffffff'],
    ['Galatasaray', 'GAL', 'TUR', 78, '#a90432', '#fdb912'], ['Fenerbahçe', 'FEN', 'TUR', 77, '#163962', '#ffed00'], ['Beşiktaş', 'BJK', 'TUR', 73, '#000000', '#ffffff'],
    ['Trabzonspor', 'TRA', 'TUR', 68, '#7b1e3c', '#61b5e7'], ['Olympiacos', 'OLY', 'GRE', 73, '#e30613', '#ffffff'], ['PAOK', 'PAO', 'GRE', 70, '#000000', '#ffffff'],
    ['AEK Atenas', 'AEK', 'GRE', 68, '#ffd700', '#000000'], ['Panathinaikos', 'PAN', 'GRE', 67, '#007a33', '#ffffff'], ['Red Bull Salzburg', 'RBS', 'AUT', 73, '#ffffff', '#d7172f'],
    ['Sturm Graz', 'STU', 'AUT', 67, '#000000', '#ffffff'], ['Rapid Viena', 'RAP', 'AUT', 64, '#00663c', '#ffffff'], ['Young Boys', 'YB', 'SUI', 69, '#ffd200', '#000000'],
    ['FC Basilea', 'BAS', 'SUI', 68, '#c8102e', '#003da5'], ['FC Lugano', 'LUG', 'SUI', 63, '#000000', '#ffffff'], ['Shakhtar Donetsk', 'SHA', 'UKR', 71, '#f58025', '#000000'],
    ['Dinamo Kiev', 'DYK', 'UKR', 68, '#ffffff', '#003a8c'], ['Dinamo Zagreb', 'DZG', 'CRO', 70, '#003da5', '#ffffff'], ['Hajduk Split', 'HAJ', 'CRO', 62, '#ffffff', '#00539f'],
    ['Estrella Roja', 'CZV', 'SRB', 70, '#e2001a', '#ffffff'], ['Partizán', 'PAR', 'SRB', 63, '#000000', '#ffffff'], ['Slavia Praga', 'SLA', 'CZE', 71, '#e30613', '#ffffff'],
    ['Sparta Praga', 'SPA', 'CZE', 69, '#a6192e', '#ffffff'], ['Viktoria Plzeň', 'PLZ', 'CZE', 66, '#c8102e', '#003da5'], ['Ferencváros', 'FTC', 'HUN', 66, '#007a33', '#ffffff'],
    ['FC Copenhague', 'FCK', 'DEN', 69, '#ffffff', '#002f6c'], ['FC Midtjylland', 'FCM', 'DEN', 67, '#000000', '#e2001a'], ['Brøndby', 'BIF', 'DEN', 62, '#ffd100', '#003da5'],
    ['Bodø/Glimt', 'BOD', 'NOR', 70, '#ffd200', '#000000'], ['Molde', 'MOL', 'NOR', 63, '#003da5', '#ffffff'], ['Malmö FF', 'MFF', 'SWE', 64, '#87ceeb', '#ffffff'],
    ['Legia Varsovia', 'LEG', 'POL', 64, '#ffffff', '#00843d'], ['Lech Poznań', 'LPO', 'POL', 63, '#003da5', '#ffffff'], ['Qarabağ', 'QAR', 'AZE', 65, '#000000', '#ffffff'],
    ['Ludogorets', 'LUD', 'BUL', 64, '#00843d', '#ffffff'], ['Maccabi Tel Aviv', 'MTA', 'ISR', 62, '#ffd100', '#003da5'], ['Slovan Bratislava', 'SBR', 'SVK', 62, '#6cace4', '#ffffff'],
    ['FCSB', 'FCS', 'ROU', 63, '#e30613', '#003da5'], ['Olimpija Liubliana', 'OLI', 'SVN', 59, '#00843d', '#ffffff'], ['Shamrock Rovers', 'SHR', 'IRL', 58, '#00843d', '#ffffff'],
    ['APOEL', 'APO', 'CYP', 60, '#ffd100', '#003da5'], ['Pafos FC', 'PAF', 'CYP', 61, '#003da5', '#ffffff'], ['Rosenborg', 'RBK', 'NOR', 60, '#000000', '#ffffff'],
    ['Djurgården', 'DIF', 'SWE', 61, '#003da5', '#e30613'], ['BK Häcken', 'HAC', 'SWE', 60, '#ffd100', '#000000'], ['Aberdeen', 'ABE', 'SCO', 60, '#e30613', '#ffffff'],
    ['Celje', 'CEJ', 'SVN', 59, '#ffd100', '#003da5'], ['Omonia', 'OMO', 'CYP', 59, '#00843d', '#ffffff'],
    ['FC Utrecht', 'UTR', 'NED', 66, '#e30613', '#ffffff'], ['Royal Antwerp', 'ANT', 'BEL', 65, '#e30613', '#ffffff'], ['Standard Lieja', 'STL', 'BEL', 63, '#e30613', '#ffffff'],
    ['İstanbul Başakşehir', 'IBB', 'TUR', 64, '#f37021', '#002f6c'], ['HNK Rijeka', 'RIJ', 'CRO', 61, '#ffffff', '#003da5'], ['Jagiellonia', 'JAG', 'POL', 62, '#ffd100', '#e30613'],
    ['Raków Częstochowa', 'RAK', 'POL', 61, '#e30613', '#003da5'], ['FC Lausanne-Sport', 'LAU', 'SUI', 60, '#003da5', '#ffffff'], ['Zrinjski Mostar', 'ZRI', 'BIH', 57, '#e30613', '#ffffff'],
    ['Shkëndija', 'SHK', 'MKD', 55, '#e30613', '#000000'], ['Víkingur Reykjavík', 'VIK', 'ISL', 55, '#e30613', '#000000'], ['Lincoln Red Imps', 'LRI', 'GIB', 52, '#e30613', '#ffffff'],
  ];
  K.COUNTRY = { POR: 'Portugal', NED: 'Países Bajos', SCO: 'Escocia', BEL: 'Bélgica', TUR: 'Turquía', GRE: 'Grecia', AUT: 'Austria', SUI: 'Suiza', UKR: 'Ucrania', CRO: 'Croacia', SRB: 'Serbia', CZE: 'Chequia', HUN: 'Hungría', DEN: 'Dinamarca', NOR: 'Noruega', SWE: 'Suecia', POL: 'Polonia', AZE: 'Azerbaiyán', BUL: 'Bulgaria', ISR: 'Israel', SVK: 'Eslovaquia', ROU: 'Rumanía', SVN: 'Eslovenia', IRL: 'Irlanda', CYP: 'Chipre', BIH: 'Bosnia', MKD: 'Macedonia del Norte', ISL: 'Islandia', GIB: 'Gibraltar' };

  K.CUPS = {
    ESP: { id: 'CUP_ESP', name: 'Copa del Rey', short: 'Copa', lowerHosts: true },
    ENG: { id: 'CUP_ENG', name: 'FA Cup', short: 'FA Cup' },
    ITA: { id: 'CUP_ITA', name: 'Coppa Italia', short: 'Coppa' },
    GER: { id: 'CUP_GER', name: 'DFB-Pokal', short: 'Pokal', lowerHosts: true },
    FRA: { id: 'CUP_FRA', name: 'Coupe de France', short: 'Coupe', lowerHosts: true },
  };
  K.EUROS = {
    UCL: { id: 'UCL', name: 'Liga de Campeones', short: 'Champions', games: 8, prize: { part: 18e6, win: 2.1e6, draw: 0.7e6, r16: 11e6, qf: 12.5e6, sf: 15e6, final: 18.5e6, champ: 25e6 } },
    UEL: { id: 'UEL', name: 'Europa League', short: 'Europa', games: 8, prize: { part: 4.3e6, win: 0.45e6, draw: 0.15e6, r16: 1.75e6, qf: 2.5e6, sf: 2.8e6, final: 4.5e6, champ: 6e6 } },
    UECL: { id: 'UECL', name: 'Conference League', short: 'Conference', games: 6, prize: { part: 3.2e6, win: 0.4e6, draw: 0.13e6, r16: 0.8e6, qf: 1.3e6, sf: 2.5e6, final: 3e6, champ: 4e6 } },
  };
  K.ORDER = ['UCL', 'UEL', 'UECL'];

  // ---------- Fechas ----------
  K.dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
  K.seasonStart = function (year) {
    let d = year + '-08-14';
    while (K.dow(d) !== 6) d = U.addDays(d, 1);
    return d;
  };
  // Fecha de la semana w (0 = primer sábado) y día relativo al sábado (Mar +3, Mié +4, Jue +5)
  K.weekDate = (year, w, off) => U.addDays(K.seasonStart(year), w * 7 + (off || 0));
  K.BREAK_WEEKS = [3, 8, 13, 32];
  K.CUP_WEEKS = [10, 15, 19, 21, 25, 31, 35]; // miércoles; la final es el sábado de la semana 41
  K.UCL_WEEKS = [5, 7, 9, 12, 14, 16, 22, 23];
  K.KO_WEEKS = { po: [26, 27], r16: [29, 30], qf: [33, 34], sf: [36, 37] };
  K.FINAL = { UCL: [42, 0], UEL: [40, 4], UECL: [39, 4], CUP: [41, 0] };

  function evenlyPick(list, n) {
    if (n >= list.length) return list.slice();
    const out = [];
    for (let i = 0; i < n; i++) out.push(list[Math.round((i * (list.length - 1)) / Math.max(1, n - 1))]);
    return Array.from(new Set(out));
  }

  /* Asigna fecha a cada jornada de liga. */
  K.leagueDates = function (year, rounds) {
    const weekends = [];
    for (let w = 0; w <= 40; w++) if (!K.BREAK_WEEKS.includes(w)) weekends.push(K.weekDate(year, w, 0));
    let dates;
    if (rounds <= weekends.length) dates = evenlyPick(weekends, rounds);
    else {
      const busy = new Set(K.CUP_WEEKS.concat([K.FINAL.UECL[0], K.FINAL.UEL[0]]));
      const mids = [];
      for (let w = 1; w <= 39; w++) if (!busy.has(w) && !K.BREAK_WEEKS.includes(w)) mids.push(K.weekDate(year, w, 4));
      dates = weekends.concat(evenlyPick(mids, rounds - weekends.length)).sort();
    }
    while (dates.length < rounds) dates.push(U.addDays(dates[dates.length - 1], 3));
    return dates;
  };

  // ---------- Utilidades ----------
  K.all = (s) => Object.values(s.comps || {});
  K.fixtures = function (s) {
    const out = [];
    Object.values(s.leagues).forEach((L) => L.fixtures.forEach((f) => out.push(f)));
    K.all(s).forEach((c) => c.fixtures.forEach((f) => out.push(f)));
    return out;
  };
  K.compName = function (s, id) {
    if (s.leagues[id]) return s.leagues[id].name;
    return s.comps && s.comps[id] ? s.comps[id].name : id;
  };
  K.compShort = function (s, id) {
    if (s.leagues[id]) return 'Liga';
    return s.comps && s.comps[id] ? s.comps[id].short : id;
  };
  K.find = function (s, compId, fid) {
    const list = s.leagues[compId] ? s.leagues[compId].fixtures : s.comps[compId] ? s.comps[compId].fixtures : [];
    return list.find((f) => f.id === fid) || null;
  };
  let seq = 0;
  function fid(prefix) { seq++; return prefix + '_' + Date.now().toString(36).slice(-4) + seq.toString(36); }

  // ---------- Clubes extra ----------
  K.ensureExtraClubs = function (s) {
    if (s.extraClubsReady) return;
    const rng = U.rng(s.seed + ':extra');
    const ctx = { rng, nextId: s.nextId, usedNames: new Set(), players: s.players, startYear: s.season.year };
    const useReal = !!(s.dataset && MCM.DATA.realRostersInfo && s.dataset.id === MCM.DATA.realRostersInfo.id);
    const POS = ['POR', 'POR', 'DFC', 'DFC', 'DFC', 'LD', 'LI', 'LD', 'MCD', 'MC', 'MC', 'MCO', 'MD', 'ED', 'EI', 'DC', 'DC', 'EI', 'MC', 'DFC'];
    K.EXTRA_CLUBS.forEach((row) => {
      const id = U.slug(row[0]);
      if (s.clubs[id]) return;
      const club = {
        id, name: row[0], short: row[1], leagueId: null, country: K.COUNTRY[row[2]] || row[2], nat: row[2], rep: row[3], stadium: '',
        colors: [row[4], row[5]], wealth: 0.4, reserveOf: null, budget: MCM.generator.transferBudget(row[3], 0.4),
        tactics: MCM.lineup.defaultTactics(), lineup: null, squad: [], ext: true,
      };
      // Carrera con plantillas reales: usa la plantilla real del club si existe (huecos con ficticios).
      const real = useReal && MCM.DATA.realRosters[id];
      if (real) {
        const list = real.map((line) => {
          const [name, pos, by, ovr, pot, nat] = line.split('|');
          return { id: 'mc:' + U.slug(name) + '-' + by, name, pos, nat, age: s.season.year - Number(by), ovr: Number(ovr), pot: Math.max(Number(ovr), Number(pot)), src: 'knowledge' };
        });
        const lg = { nat: MCM.DATA.nations[row[2]] ? row[2] : 'ENG' };
        club.squad = MCM.generator.fillSquad(ctx, club, lg, MCM.generator.importSquad(ctx, club, lg, list));
        s.clubs[id] = club;
        return;
      }
      const base = MCM.generator.baseOvr(club.rep);
      POS.forEach((pos, i) => {
        const starter = i < 13 && i !== 1;
        const p = MCM.generator.createPlayer(ctx, {
          pos, clubId: id, leagueNat: rng.chance(0.6) ? (MCM.DATA.nations[row[2]] ? row[2] : 'ENG') : undefined,
          rep: club.rep, wealth: club.wealth, age: starter ? Math.round(U.clamp(rng.normal(26.5, 3.5), 19, 34)) : rng.int(18, 30),
          ovr: starter ? base + rng.normal(2, 2) : base + rng.normal(-4, 3),
        });
        s.players[p.id] = p;
        club.squad.push(p.id);
      });
      s.clubs[id] = club;
    });
    s.nextId = ctx.nextId;
    s.extraClubsReady = true;
  };

  // ---------- Copas nacionales ----------
  const ROUND_NAMES = { 2: 'Final', 4: 'Semifinales', 8: 'Cuartos de final', 16: 'Octavos de final', 32: 'Dieciseisavos', 64: 'Treintaidosavos', 128: 'Primera ronda' };

  function setupCup(s, nat, rng) {
    const def = K.CUPS[nat];
    const clubs = Object.values(s.clubs).filter((c) => c.leagueId && s.leagues[c.leagueId].nat === nat && !c.reserveOf);
    if (clubs.length < 4) return null;
    const cup = { id: def.id, type: 'cup', name: def.name, short: def.short, nat, lowerHosts: !!def.lowerHosts, rounds: [], fixtures: [], participants: clubs.map((c) => c.id), alive: clubs.map((c) => c.id), winner: null };
    s.comps[cup.id] = cup;
    drawCupRound(s, cup, rng);
    return cup;
  }

  function cupDates(s, totalRounds) {
    const y = s.season.year;
    const weeks = K.CUP_WEEKS.slice(-Math.max(0, totalRounds - 1));
    return weeks.map((w) => K.weekDate(y, w, 4)).concat([K.weekDate(y, K.FINAL.CUP[0], K.FINAL.CUP[1])]);
  }

  function drawCupRound(s, cup, rng) {
    const n = cup.alive.length;
    if (n < 2) return;
    let pow = 1;
    while (pow * 2 <= n) pow *= 2;
    const totalRounds = Math.log2(pow) + (n > pow ? 1 : 0) + cup.rounds.length;
    const dates = cupDates(s, cup.rounds.length === 0 ? Math.log2(pow) + (n > pow ? 1 : 0) : cup.totalRounds);
    if (!cup.totalRounds) cup.totalRounds = totalRounds;
    const idx = cup.rounds.length;
    const date = dates[idx] || dates[dates.length - 1];
    let playing;
    let name;
    if (n > pow) {
      // Ronda previa: juegan los peor clasificados para cuadrar el cuadro
      const extra = (n - pow) * 2;
      const sorted = cup.alive.slice().sort((a, b) => s.clubs[a].rep - s.clubs[b].rep);
      playing = sorted.slice(0, extra);
      name = 'Ronda previa';
    } else {
      playing = cup.alive.slice();
      name = ROUND_NAMES[n] || 'Ronda ' + (idx + 1);
    }
    const drawn = rng.shuffle(playing);
    const round = { name, date, ties: [] };
    for (let i = 0; i + 1 < drawn.length; i += 2) {
      let a = drawn[i];
      let b = drawn[i + 1];
      const ta = s.leagues[s.clubs[a].leagueId].tier;
      const tb = s.leagues[s.clubs[b].leagueId].tier;
      if (cup.lowerHosts && ta !== tb && name !== 'Final') { if (ta < tb) [a, b] = [b, a]; }
      const f = { id: fid(cup.id), comp: cup.id, date, home: a, away: b, played: false, round: name, knockout: true, neutral: name === 'Final' };
      cup.fixtures.push(f);
      round.ties.push({ fixtures: [f.id], a, b, winner: null });
    }
    cup.rounds.push(round);
  }

  function tieWinner(s, comp, tie) {
    const fs = tie.fixtures.map((id) => comp.fixtures.find((f) => f.id === id));
    if (!fs.every((f) => f.played)) return null;
    const last = fs[fs.length - 1];
    if (last.winner) return last.winner;
    let ga = 0; let gb = 0;
    fs.forEach((f) => { if (f.home === tie.a) { ga += f.hg; gb += f.ag; } else { ga += f.ag; gb += f.hg; } });
    return ga > gb ? tie.a : tie.b;
  }

  function progressCup(s, cup, rng) {
    const round = cup.rounds[cup.rounds.length - 1];
    if (!round || round.done) return;
    const winners = round.ties.map((t) => (t.winner = tieWinner(s, cup, t)));
    if (winners.some((w) => !w)) return;
    round.done = true;
    const losers = round.ties.map((t) => (t.winner === t.a ? t.b : t.a));
    cup.alive = cup.alive.filter((id) => !losers.includes(id));
    if (round.name === 'Final' || cup.alive.length === 1) {
      cup.winner = cup.alive[0];
      cupWon(s, cup);
      return;
    }
    drawCupRound(s, cup, rng);
    if (cup.alive.includes(s.clubId)) {
      const r = cup.rounds[cup.rounds.length - 1];
      const t = r.ties.find((x) => x.a === s.clubId || x.b === s.clubId);
      if (t) C().news(s, 'cup', cup.name + ': sorteo de ' + r.name.toLowerCase(), 'Tu rival: ' + s.clubs[t.a === s.clubId ? t.b : t.a].name + ' (' + U.dateLabel(r.date) + ').');
    }
  }

  function cupWon(s, cup) {
    const w = s.clubs[cup.winner];
    C().news(s, 'cup', w.name + ' gana la ' + cup.name, w.name + ' se proclama campeón de la ' + cup.name + ' ' + s.season.label + '.');
    if (MCM.career.addTrophy) MCM.career.addTrophy(s, cup.winner, cup.name);
    const prize = cup.nat === 'ENG' ? 4e6 : 3e6;
    w.budget += prize;
    if (cup.winner === s.clubId && s.market) s.market.fin.income.prizes += prize;
  }

  // ---------- Competiciones europeas ----------
  /* Clasificados: posiciones de liga (temporada anterior) + campeones de copa + clubes europeos adicionales. */
  /* Plazas europeas por liga: { UCL, UEL, UECL }. Las cinco grandes, 4/2/2 salvo que la liga diga otra cosa. */
  K.spots = function (L) {
    if (L.tier !== 1 || L.uefa === false) return { UCL: 0, UEL: 0, UECL: 0 };
    return Object.assign({ UCL: 4, UEL: 2, UECL: 2 }, L.spots || {});
  };
  K.qualify = function (s, tables, cupWinners) {
    const q = { UCL: [], UEL: [], UECL: [] };
    const used = new Set();
    const uefa = Object.values(s.leagues).filter((L) => L.tier === 1 && L.uefa !== false && tables[L.id]);
    uefa.forEach((L) => {
      tables[L.id].slice(0, K.spots(L).UCL).forEach((id) => { q.UCL.push(id); used.add(id); });
    });
    uefa.forEach((L) => {
      const n = K.spots(L).UEL;
      if (!n) return;
      const cw = cupWinners && cupWinners[L.nat];
      let need = n;
      if (cw && !used.has(cw) && s.clubs[cw] && s.clubs[cw].leagueId === L.id) { q.UEL.push(cw); used.add(cw); need--; }
      tables[L.id].filter((id) => !used.has(id)).slice(0, need).forEach((id) => { q.UEL.push(id); used.add(id); });
    });
    uefa.forEach((L) => {
      tables[L.id].filter((id) => !used.has(id)).slice(0, K.spots(L).UECL).forEach((id) => { q.UECL.push(id); used.add(id); });
    });
    ['UCL', 'UEL', 'UECL'].forEach((k) => { if (q[k].length > 36) q[k].length = 36; });
    const rng = U.rng(s.seed + ':q:' + s.season.year);
    const extras = Object.values(s.clubs).filter((c) => c.ext).map((c) => ({ id: c.id, k: c.rep + rng.range(-4, 4) })).sort((a, b) => b.k - a.k).map((x) => x.id);
    ['UCL', 'UEL', 'UECL'].forEach((k) => {
      while (q[k].length < 36 && extras.length) q[k].push(extras.shift());
      if (q[k].length % 2) q[k].pop();
    });
    return q;
  };


  function leaguePhase(s, comp, teams, rng) {
    const games = comp.games;
    const country = (id) => s.clubs[id].nat || (s.clubs[id].leagueId && s.leagues[s.clubs[id].leagueId].nat);
    let best = null;
    for (let attempt = 0; attempt < 40 && !best; attempt++) {
      const met = {}; teams.forEach((t) => { met[t] = new Set(); });
      const home = {}; teams.forEach((t) => { home[t] = 0; });
      const rounds = [];
      let ok = true;
      for (let r = 0; r < games && ok; r++) {
        const pool = rng.shuffle(teams);
        const pairs = [];
        const used = new Set();
        for (const t of pool) {
          if (used.has(t)) continue;
          const opp = pool.find((o) => o !== t && !used.has(o) && !met[t].has(o) && country(o) !== country(t)) ||
            pool.find((o) => o !== t && !used.has(o) && !met[t].has(o));
          if (!opp) { ok = false; break; }
          used.add(t); used.add(opp);
          met[t].add(opp); met[opp].add(t);
          let h = t; let a = opp;
          if (home[t] > home[opp]) { h = opp; a = t; }
          home[h]++;
          pairs.push([h, a]);
        }
        rounds.push(pairs);
      }
      if (ok) best = rounds;
    }
    if (best) return best;
    // Alternativa: método del círculo (sin restricción de país), siempre válida con número par de equipos
    const rr = MCM.schedule.roundRobin(teams, rng);
    const rounds = [];
    for (let r = 1; r <= games; r++) rounds.push(rr.fixtures.filter((f) => f.md === r).map((f) => [f.home, f.away]));
    return rounds;
  }

  function setupEuro(s, key, teams, rng) {
    const def = K.EUROS[key];
    const comp = { id: key, type: 'euro', name: def.name, short: def.short, games: def.games, participants: teams.slice(), fixtures: [], stage: 'league', ko: [], winner: null };
    s.comps[key] = comp;
    const y = s.season.year;
    const off = key === 'UCL' ? 3 : 5;
    const rounds = leaguePhase(s, comp, teams, rng);
    rounds.forEach((pairs, r) => {
      const date = K.weekDate(y, K.UCL_WEEKS[r], off);
      pairs.forEach(([h, a]) => comp.fixtures.push({ id: fid(key), comp: key, date, home: h, away: a, played: false, round: 'Fase liga · J' + (r + 1), phase: 'league', md: r + 1 }));
    });
    teams.forEach((id) => prize(s, key, id, 'part'));
    return comp;
  }

  K.euroTable = function (comp) {
    const L = { clubIds: comp.participants, fixtures: comp.fixtures.filter((f) => f.phase === 'league') };
    return MCM.schedule.table(L);
  };

  function koRound(s, comp, name, key, pairs, single) {
    const y = s.season.year;
    const off = comp.id === 'UCL' ? 3 : 5;
    const round = { name, ties: [] };
    pairs.forEach(([a, b]) => {
      const tie = { a, b, fixtures: [], winner: null };
      if (single) {
        const [w, d] = K.FINAL[comp.id];
        const f = { id: fid(comp.id), comp: comp.id, date: K.weekDate(y, w, d), home: a, away: b, played: false, round: name, knockout: true, neutral: true, phase: key };
        comp.fixtures.push(f); tie.fixtures.push(f.id);
      } else {
        const [w1, w2] = K.KO_WEEKS[key];
        const f1 = { id: fid(comp.id), comp: comp.id, date: K.weekDate(y, w1, off), home: b, away: a, played: false, round: name + ' (ida)', phase: key, leg: 1 };
        const f2 = { id: fid(comp.id), comp: comp.id, date: K.weekDate(y, w2, off), home: a, away: b, played: false, round: name + ' (vuelta)', phase: key, leg: 2, knockout: true, firstLeg: f1.id };
        comp.fixtures.push(f1, f2); tie.fixtures.push(f1.id, f2.id);
      }
      round.ties.push(tie);
    });
    comp.ko.push(round);
    if (pairs.some((p) => p.includes(s.clubId))) {
      const p = pairs.find((x) => x.includes(s.clubId));
      C().news(s, 'euro', comp.name + ': ' + name.toLowerCase(), 'Tu rival: ' + s.clubs[p[0] === s.clubId ? p[1] : p[0]].name + '.');
    }
  }

  function prize(s, key, clubId, kind) {
    const amount = K.EUROS[key].prize[kind] || 0;
    const club = s.clubs[clubId];
    if (!amount || !club) return;
    club.budget += amount;
    if (clubId === s.clubId && s.market) s.market.fin.income.prizes += amount;
  }
  K.matchPrize = function (s, f) {
    if (!K.EUROS[f.comp] || f.phase !== 'league') return;
    if (f.hg > f.ag) prize(s, f.comp, f.home, 'win');
    else if (f.hg < f.ag) prize(s, f.comp, f.away, 'win');
    else { prize(s, f.comp, f.home, 'draw'); prize(s, f.comp, f.away, 'draw'); }
  };

  function progressEuro(s, comp, rng) {
    if (comp.winner) return;
    if (comp.stage === 'league') {
      if (!comp.fixtures.filter((f) => f.phase === 'league').every((f) => f.played)) return;
      const t = K.euroTable(comp).map((r) => r.clubId);
      comp.finalTable = t.slice();
      const pos = t.indexOf(s.clubId);
      if (t.length >= 24) {
        comp.direct = t.slice(0, 8);
        const po = [];
        for (let i = 8; i < 16; i++) po.push([t[i], t[31 - i]]);
        comp.stage = 'po';
        koRound(s, comp, 'Playoff', 'po', po, false);
        if (pos >= 0) C().news(s, 'euro', comp.name + ': fin de la fase liga', 'Terminas ' + (pos + 1) + 'º. ' + (pos < 8 ? 'Clasificado directamente para octavos.' : pos < 24 ? 'Jugarás el playoff.' : 'Eliminado de la competición.'));
      } else {
        // Competición reducida (bases de datos pequeñas): cuadro directo con los mejores
        let k = 2;
        while (k * 2 <= Math.min(16, t.length)) k *= 2;
        const stage = { 16: 'r16', 8: 'qf', 4: 'sf', 2: 'final' }[k];
        const names = { r16: 'Octavos de final', qf: 'Cuartos de final', sf: 'Semifinales', final: 'Final' };
        const pairs = [];
        for (let i = 0; i < k / 2; i++) pairs.push([t[i], t[k - 1 - i]]);
        comp.stage = stage;
        koRound(s, comp, names[stage], stage, pairs, stage === 'final');
        if (pos >= 0) C().news(s, 'euro', comp.name + ': fin de la fase liga', 'Terminas ' + (pos + 1) + 'º. ' + (pos < k ? 'Pasas a las eliminatorias.' : 'Eliminado de la competición.'));
      }
      return;
    }
    const round = comp.ko[comp.ko.length - 1];
    const winners = round.ties.map((tie) => (tie.winner = tieWinner(s, comp, tie)));
    if (winners.some((w) => !w)) return;
    if (round.done) return;
    round.done = true;
    const next = { po: 'r16', r16: 'qf', qf: 'sf', sf: 'final' }[comp.stage];
    if (comp.stage === 'final') {
      comp.winner = winners[0];
      const w = s.clubs[comp.winner];
      prize(s, comp.id, comp.winner, 'champ');
      C().news(s, 'euro', w.name + ', campeón de la ' + comp.name, w.name + ' conquista la ' + comp.name + ' ' + s.season.label + '.');
      if (MCM.career.addTrophy) MCM.career.addTrophy(s, comp.winner, comp.name);
      return;
    }
    let pairs;
    if (next === 'r16') {
      const seeds = comp.direct.slice();
      pairs = rng.shuffle(winners).map((w, i) => [seeds[i], w]);
    } else {
      const sh = rng.shuffle(winners);
      pairs = [];
      for (let i = 0; i + 1 < sh.length; i += 2) pairs.push([sh[i], sh[i + 1]]);
    }
    const prizeKey = { r16: 'r16', qf: 'qf', sf: 'sf', final: 'final' }[next];
    pairs.forEach((p) => p.forEach((id) => prize(s, comp.id, id, prizeKey)));
    comp.stage = next;
    const names = { r16: 'Octavos de final', qf: 'Cuartos de final', sf: 'Semifinales', final: 'Final' };
    koRound(s, comp, names[next], next, pairs, next === 'final');
  }

  // ---------- Playoffs de ascenso ----------
  /*
   * Formatos (L.playoff):
   *  esp: 3º-6º. Semifinales y final a ida y vuelta; con empate en el global, prórroga y, si sigue, pasa el mejor clasificado.
   *  eng: 3º-6º (o L.playoffFrom-…). Semifinales a ida y vuelta (prórroga y penaltis) y final a partido único en campo neutral.
   *  ita: 3º-8º. Ronda previa a partido único en casa del mejor (5º-8º, 6º-7º), semifinales y final a ida y vuelta; con empate, pasa el mejor clasificado.
   *  ger: el 3º juega la promoción contra el antepenúltimo de la categoría superior (ida y vuelta, prórroga y penaltis).
   *  fra: 4º-5º a partido único, el ganador contra el 3º y el vencedor juega la promoción contra el antepenúltimo de Ligue 1.
   */
  K.PLAYOFF_INFO = {
    esp: 'Del 3º al 6º. Semifinales y final a ida y vuelta. Con empate en el global hay prórroga y, si persiste, pasa el mejor clasificado.',
    eng: 'Semifinales a ida y vuelta y final a partido único en campo neutral, con prórroga y penaltis.',
    ita: 'Del 3º al 8º. Ronda previa a partido único y semifinales y final a ida y vuelta. Con empate, pasa el mejor clasificado.',
    ger: 'El 3º juega la promoción a ida y vuelta contra el antepenúltimo de la categoría superior (prórroga y penaltis).',
    fra: '4º contra 5º, el ganador contra el 3º y el vencedor juega la promoción a ida y vuelta contra el antepenúltimo de la categoría superior.',
  };

  function leagueDone(L) { return L && L.totalMd > 0 && L.played >= L.totalMd; }
  function lastDate(L) { return L.fixtures.reduce((m, f) => (f.date > m ? f.date : m), ''); }

  /* Clubes con derecho a ascender (un filial no puede subir a la categoría de su primer equipo). */
  function eligibleOrder(s, L) {
    const up = L.upper ? s.leagues[L.upper] : null;
    return MCM.schedule.table(L).map((r) => r.clubId).filter((id) => {
      const c = s.clubs[id];
      return !(c.reserveOf && up && up.clubIds.includes(c.reserveOf));
    });
  }
  K.eligibleOrder = eligibleOrder;

  function poFixture(comp, date, home, away, name, opts) {
    const f = Object.assign({ id: fid(comp.id), comp: comp.id, date, home, away, played: false, round: name }, opts || {});
    comp.fixtures.push(f);
    return f;
  }
  /* Eliminatoria: a = mejor clasificado (o el club de la categoría superior en la promoción). */
  function poTie(comp, name, a, b, date, legs, tb, neutral) {
    const tie = { a, b, fixtures: [], winner: null, tb };
    if (legs === 1) {
      tie.fixtures.push(poFixture(comp, date, a, b, name, { knockout: true, neutral: !!neutral, noShootout: tb === 'better' }).id);
    } else {
      const f1 = poFixture(comp, date, b, a, name + ' (ida)', { leg: 1 });
      const f2 = poFixture(comp, U.addDays(date, 3), a, b, name + ' (vuelta)', { leg: 2, knockout: true, firstLeg: f1.id, noShootout: tb === 'better' });
      tie.fixtures.push(f1.id, f2.id);
    }
    return tie;
  }
  function poTieWinner(comp, tie) {
    const fs = tie.fixtures.map((id) => comp.fixtures.find((f) => f.id === id));
    if (!fs.every((f) => f.played)) return null;
    const last = fs[fs.length - 1];
    if (last.winner) return last.winner;
    let ga = 0; let gb = 0;
    fs.forEach((f) => { if (f.home === tie.a) { ga += f.hg; gb += f.ag; } else { ga += f.ag; gb += f.hg; } });
    if (ga === gb) return tie.a;
    return ga > gb ? tie.a : tie.b;
  }

  /* Pasos de cada formato: devuelve la siguiente ronda a partir de las anteriores (o null si ha terminado). */
  function nextPlayoffRound(s, comp) {
    const r = comp.rounds;
    const seed = comp.seeds;
    const W = (i) => r[i].ties.map((t) => t.winner);
    const better = (x, y) => (seed.indexOf(x) <= seed.indexOf(y) ? [x, y] : [y, x]);
    const fmt = comp.format;
    if (fmt === 'esp' || fmt === 'eng') {
      const tb = fmt === 'esp' ? 'better' : 'pens';
      if (r.length === 0) return { name: 'Semifinales', legs: 2, tb, pairs: [[seed[0], seed[3]], [seed[1], seed[2]]] };
      if (r.length === 1) return { name: 'Final', legs: fmt === 'esp' ? 2 : 1, tb, neutral: fmt === 'eng', pairs: [better(W(0)[0], W(0)[1])] };
      return null;
    }
    if (fmt === 'ita') {
      if (r.length === 0) return { name: 'Ronda previa', legs: 1, tb: 'better', pairs: [[seed[2], seed[5]], [seed[3], seed[4]]] };
      if (r.length === 1) {
        const w = W(0).slice().sort((x, y) => seed.indexOf(x) - seed.indexOf(y));
        return { name: 'Semifinales', legs: 2, tb: 'better', pairs: [[seed[0], w[1]], [seed[1], w[0]]] };
      }
      if (r.length === 2) return { name: 'Final', legs: 2, tb: 'better', pairs: [better(W(1)[0], W(1)[1])] };
      return null;
    }
    if (fmt === 'ger') {
      if (r.length === 0) return { name: 'Promoción', legs: 2, tb: 'pens', pairs: [[comp.upperClub, seed[0]]], barrage: true };
      return null;
    }
    if (fmt === 'fra') {
      if (r.length === 0) return { name: 'Primera ronda', legs: 1, tb: 'pens', pairs: [[seed[1], seed[2]]] };
      if (r.length === 1) return { name: 'Segunda ronda', legs: 1, tb: 'pens', pairs: [[seed[0], W(0)[0]]] };
      if (r.length === 2) return { name: 'Promoción', legs: 2, tb: 'pens', pairs: [[comp.upperClub, W(1)[0]]], barrage: true };
      return null;
    }
    return null;
  }

  function drawPlayoffRound(s, comp, startDate) {
    const spec = nextPlayoffRound(s, comp);
    if (!spec) return false;
    const round = { name: spec.name, date: startDate, barrage: !!spec.barrage, ties: spec.pairs.map(([a, b]) => poTie(comp, spec.name, a, b, startDate, spec.legs, spec.tb, spec.neutral)) };
    comp.rounds.push(round);
    round.ties.forEach((t) => { [t.a, t.b].forEach((id) => { if (!comp.participants.includes(id)) comp.participants.push(id); }); });
    const t = round.ties.find((x) => x.a === s.clubId || x.b === s.clubId);
    if (t) C().news(s, 'cup', comp.name + ': ' + spec.name.toLowerCase(), 'Tu rival: ' + s.clubs[t.a === s.clubId ? t.b : t.a].name + ' (' + U.dateLabel(startDate) + ').');
    return true;
  }

  function setupPlayoff(s, L) {
    const id = 'PO_' + L.id;
    if (s.comps[id] || !L.playoff || !leagueDone(L)) return;
    const up = L.upper ? s.leagues[L.upper] : null;
    const barrage = L.playoff === 'ger' || L.playoff === 'fra';
    if (!up || (barrage && !leagueDone(up))) return;
    const order = eligibleOrder(s, L);
    const from = (L.playoffFrom || (L.promote || 2) + 1) - 1;
    const size = { esp: 4, eng: 4, ita: 6, ger: 1, fra: 3 }[L.playoff];
    const seeds = order.slice(from, from + size);
    if (seeds.length < size) return;
    const comp = {
      id, type: 'playoff', format: L.playoff, name: 'Playoff de ascenso · ' + L.name, short: 'Playoff', leagueId: L.id, upperId: up.id,
      seeds, rounds: [], fixtures: [], participants: [], winner: null, promoted: null, relegated: null, upperClub: null,
    };
    if (barrage) {
      const ut = MCM.schedule.table(up).map((r) => r.clubId);
      comp.upperClub = ut[ut.length - (up.relegate || 0) - 1];
    }
    s.comps[id] = comp;
    const base = [lastDate(L), barrage ? lastDate(up) : ''].sort().pop();
    drawPlayoffRound(s, comp, U.addDays(base, 4));
    if (seeds.includes(s.clubId) || comp.upperClub === s.clubId) {
      C().news(s, 'cup', 'Jugarás el ' + comp.name.toLowerCase(), K.PLAYOFF_INFO[L.playoff]);
    }
  }

  function progressPlayoff(s, comp) {
    if (comp.winner) return;
    const round = comp.rounds[comp.rounds.length - 1];
    const winners = round.ties.map((t) => (t.winner = poTieWinner(comp, t)));
    if (winners.some((w) => !w)) return;
    const end = comp.fixtures.reduce((m, f) => (f.date > m ? f.date : m), '');
    if (drawPlayoffRound(s, comp, U.addDays(end, 4))) return;
    comp.winner = winners[0];
    const L = s.leagues[comp.leagueId];
    const up = s.leagues[comp.upperId];
    const w = s.clubs[comp.winner];
    if (round.barrage) {
      const lowerWon = comp.winner !== comp.upperClub;
      if (lowerWon) { comp.promoted = comp.winner; comp.relegated = comp.upperClub; }
      C().news(s, 'season', round.name + ': ' + w.name,
        lowerWon ? w.name + ' gana la promoción y jugará en ' + up.name + '. ' + s.clubs[comp.upperClub].name + ' desciende.' : w.name + ' gana la promoción y mantiene la categoría.');
    } else {
      comp.promoted = comp.winner;
      C().news(s, 'season', w.name + ' asciende', w.name + ' gana el playoff de ' + L.name + ' y jugará en ' + up.name + '.');
    }
  }

  /* Ascensos por playoff: { up: [clubId], down: [clubId] } para la liga inferior L. */
  K.playoffMoves = function (s, L) {
    const comp = s.comps && s.comps['PO_' + L.id];
    if (!comp || !comp.promoted) return { up: [], down: [] };
    return { up: [comp.promoted], down: comp.relegated ? [comp.relegated] : [] };
  };

  /* Tras cada día de partidos: avanza sorteos y fases. */
  K.progress = function (s) {
    const rng = U.rng(s.seed + ':draw:' + s.season.year + ':' + (s.date || ''));
    Object.values(s.leagues).forEach((L) => setupPlayoff(s, L));
    K.all(s).forEach((c) => (c.type === 'cup' ? progressCup(s, c, rng) : c.type === 'playoff' ? progressPlayoff(s, c) : progressEuro(s, c, rng)));
  };

  /* Monta todas las competiciones de una temporada. tables/cupWinners: de la temporada anterior (o estimados). */
  K.setupSeason = function (s, tables, cupWinners) {
    K.ensureExtraClubs(s);
    s.comps = {};
    const rng = U.rng(s.seed + ':comps:' + s.season.year);
    Object.keys(K.CUPS).forEach((nat) => setupCup(s, nat, rng));
    const q = K.qualify(s, tables, cupWinners);
    s.euroQualified = q;
    K.ORDER.forEach((k) => setupEuro(s, k, q[k], rng));
  };

  /* En qué competiciones juega un club esta temporada. */
  K.clubComps = function (s, clubId) {
    const out = [];
    const club = s.clubs[clubId];
    if (club.leagueId) out.push(club.leagueId);
    K.all(s).forEach((c) => { if (c.participants.includes(clubId)) out.push(c.id); });
    return out;
  };
})(globalThis.MCM = globalThis.MCM || {});
