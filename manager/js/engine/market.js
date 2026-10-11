/*
 * Mercado de fichajes, contratos y finanzas (Etapa 2).
 *
 * Reglas principales:
 * - Ventanas: verano (pretemporada hasta el 1 de septiembre) e invierno (1 de enero – 2 de febrero).
 *   Fuera de ventana solo se pueden fichar agentes libres y renovar.
 * - Valor de referencia: el valor de mercado FC 27 importado si existe; si no, el valor estimado del juego.
 *   El precio que pide el club, ofertas y contraofertas son cantidades aparte: NUNCA modifican el valor FC 27.
 * - Presupuesto único: paga traspasos, primas y salarios. Un contrato nuevo (o la subida de una renovación) reserva
 *   un año de ese salario (1 €/sem = 52 €); cuando un jugador sale vendido o cedido, ese año vuelve al presupuesto.
 *   No se puede cerrar una operación que supere el presupuesto.
 * - Plantilla: máximo 30 jugadores y mínimo 18. Un jugador pertenece a un único club.
 */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const PL = MCM.players;
  const T = (MCM.market = {});
  const C = () => MCM.career;

  T.MAX_SQUAD = 30;
  T.MIN_SQUAD = 18;
  T.WAGE_TO_BUDGET = 52;

  // ---------- Estado ----------
  T.init = function (s) {
    if (!s.market) s.market = {};
    const m = s.market;
    m.offers = m.offers || [];
    m.shortlist = m.shortlist || [];
    m.talks = m.talks || {};
    m.blocked = m.blocked || {};
    m.seq = m.seq || 0;
    m.ledger = m.ledger || [];
    m.fin = m.fin || T.emptyFin(s.season.label);
    m.finHistory = m.finHistory || [];
    m.aiWindows = m.aiWindows || {};
    const club = s.clubs[s.clubId];
    if (!club.wageBudget) club.wageBudget = Math.round((C().wageBill(s, s.clubId) * 1.1) / 1000) * 1000;
    T.pool(s);
    s.transfers = s.transfers || [];
    return m;
  };
  T.emptyFin = (label) => ({ season: label, income: { tickets: 0, tv: 0, prizes: 0, sales: 0 }, expense: { wages: 0, transfers: 0, bonuses: 0, releases: 0 } });

  function ledger(s, concept, amount, kind) {
    const m = s.market;
    m.ledger.unshift({ season: s.season.label, md: s.week || 0, date: s.date || null, concept, amount, kind });
    if (m.ledger.length > 300) m.ledger.length = 300;
  }

  // ---------- Ventana de fichajes ----------
  T.currentDate = (s) => s.date || s.season.year + '-08-01';
  T.window = function (s) {
    const d = T.currentDate(s);
    const y = s.season.year;
    if (C().seasonFinished(s)) return { open: false, label: 'Cerrado: fin de temporada', next: 'Abre al empezar la temporada ' + C().seasonLabel(y + 1) };
    if (d <= y + '-09-01') return { open: true, kind: 'summer', label: 'Mercado de verano abierto', until: 'hasta el 1 de septiembre' };
    if (d >= (y + 1) + '-01-01' && d <= (y + 1) + '-02-02') return { open: true, kind: 'winter', label: 'Mercado de invierno abierto', until: 'hasta el 2 de febrero' };
    return { open: false, label: 'Mercado cerrado', next: d < (y + 1) + '-01-01' ? 'Reabre el 1 de enero' : 'Reabre en verano' };
  };

  // ---------- Valores y precios ----------
  T.reference = function (s, p) {
    const club = p.clubId ? s.clubs[p.clubId] : null;
    const r = MCM.values.lookup(p, club ? club.name : '');
    if (r) return { value: r.entry.value, kind: 'fc27', entry: r.entry };
    return { value: p.value, kind: 'estimate' };
  };

  T.yearsLeft = (s, p) => Math.max(0, p.contractEnd - (s.season.year + 1));

  T.role = function (s, p) {
    if (!p.clubId) return 'libre';
    const sq = C().squad(s, p.clubId).slice().sort((a, b) => b.ovr - a.ovr);
    const i = sq.findIndex((x) => x.id === p.id);
    if (i < 11) return 'clave';
    if (i < 16) return 'rotacion';
    if (p.age <= 21) return 'joven';
    return 'suplente';
  };
  T.ROLE_LABEL = { clave: 'Jugador clave', rotacion: 'Rotación', joven: 'Promesa', suplente: 'Suplente', libre: 'Sin club' };

  function roundMoney(v) {
    if (v >= 1e7) return Math.round(v / 5e5) * 5e5;
    if (v >= 1e6) return Math.round(v / 1e5) * 1e5;
    return Math.max(10000, Math.round(v / 1e4) * 1e4);
  }
  T.roundMoney = roundMoney;

  /* Precio que pide el club propietario. Es una cantidad de negociación, distinta del valor FC 27. */
  T.askingPrice = function (s, p) {
    const ref = T.reference(s, p).value;
    const role = T.role(s, p);
    const roleF = { clave: 1.45, rotacion: 1.15, joven: 1.25, suplente: 0.95 }[role] || 1;
    const yl = T.yearsLeft(s, p);
    const contractF = yl === 0 ? 0.6 : yl === 1 ? 0.85 : yl === 2 ? 1 : 1.1;
    const listedF = p.listed ? 0.85 : 1;
    return roundMoney(ref * roleF * contractF * listedF);
  };

  /* Interés del jugador en fichar por el club del usuario. */
  T.willingness = function (s, p) {
    // La reputación pesa poco: solo un abismo de nivel hace que un jugador diga que no, y el sobresueldo es pequeño.
    const mine = s.clubs[s.clubId];
    const from = p.clubId ? s.clubs[p.clubId] : null;
    const need = p.ovr - 10;
    if (mine.rep < need - 30) return { ok: false, premium: 1, reason: p.name + ' no quiere jugar en un club de tan poco nivel (reputación ' + mine.rep + ').' };
    let premium = 1;
    if (mine.rep < need) premium += Math.min(0.2, (need - mine.rep) * 0.008);
    if (from && from.rep > mine.rep + 10) premium += 0.04;
    return { ok: true, premium: Math.round(premium * 100) / 100, reason: premium > 1.05 ? 'Pide algo más de salario para dar el paso.' : 'Le interesa el proyecto.' };
  };

  T.preferredYears = (p) => (p.age <= 23 ? 5 : p.age <= 27 ? 4 : p.age <= 30 ? 3 : p.age <= 32 ? 2 : 1);

  T.contractDemand = function (s, p, kind) {
    const mine = s.clubs[s.clubId];
    const w = T.willingness(s, p);
    let wage = PL.fairWage(p, mine.wealth) * w.premium;
    if (kind === 'buy' || kind === 'loan') wage = Math.max(wage, p.wage * 1.08);
    if (kind === 'renew') {
      const roleF = { clave: 1.15, rotacion: 1.05, joven: 1.1, suplente: 0.95 }[T.role(s, p)] || 1;
      const moraleF = p.morale >= 70 ? 0.97 : p.morale < 45 ? 1.12 : 1.03;
      wage = Math.max(p.wage * (p.age >= 31 ? 0.9 : 1), PL.fairWage(p, mine.wealth) * roleF * moraleF);
    }
    if (kind === 'free') wage *= 1.05;
    wage = Math.max(750, Math.round(wage / 250) * 250);
    const bonusWeeks = kind === 'free' ? 20 : kind === 'renew' ? 4 : 8;
    return { wage, years: T.preferredYears(p), bonus: roundMoney(wage * bonusWeeks), willing: w };
  };

  /* Puntuación de una oferta de contrato frente a la petición del jugador (1 = la acepta). */
  T.scoreContract = function (demand, offer) {
    const wageR = offer.wage / demand.wage;
    const bonusR = (offer.bonus - demand.bonus) / (demand.wage * 52);
    const yearsP = Math.abs(offer.years - demand.years) * 0.035;
    return wageR + bonusR * 0.8 - yearsP;
  };

  // ---------- Reglas económicas ----------
  T.squadSize = (s) => s.clubs[s.clubId].squad.length;
  T.wageRoom = (s) => s.clubs[s.clubId].wageBudget - C().wageBill(s, s.clubId);

  /* Presupuesto único: el margen salarial no usado pasa al presupuesto (wageBudget queda igual a la masa salarial). */
  T.pool = function (s) {
    const club = s.clubs[s.clubId];
    const room = (club.wageBudget || 0) - C().wageBill(s, s.clubId);
    if (room > 0) club.budget += room * T.WAGE_TO_BUDGET;
    club.wageBudget = Math.max(C().wageBill(s, s.clubId), 0);
  };
  /* Coste total de una operación: dinero + un año del salario que se añade. */
  T.dealCost = (cost, extraWage) => cost + Math.max(0, extraWage) * T.WAGE_TO_BUDGET;

  T.checkDeal = function (s, p, cost, wage, opts) {
    opts = opts || {};
    const club = s.clubs[s.clubId];
    const errs = [];
    if (!opts.renew && T.squadSize(s) >= T.MAX_SQUAD) errs.push('La plantilla ya tiene ' + T.MAX_SQUAD + ' jugadores (máximo). Vende, cede o rescinde a alguien antes.');
    const extraWage = opts.renew ? wage - p.wage : wage;
    const total = T.dealCost(cost, extraWage);
    if (total > club.budget) {
      errs.push('Presupuesto insuficiente: la operación cuesta ' + U.money(total) + (extraWage > 0 ? ' (' + U.money(cost) + ' entre traspaso y prima + ' + U.money(extraWage * T.WAGE_TO_BUDGET) + ' de un año de salario)' : '') + ' y dispones de ' + U.money(club.budget) + '.');
    }
    return errs;
  };

  // ---------- Negociaciones ----------
  T.talkFor = (s, pid) => s.market.talks[pid] || null;

  T.canApproach = function (s, p) {
    if (!p) return 'Jugador no encontrado.';
    if (p.clubId === s.clubId) return 'Ya es jugador de tu club.';
    if (p.loan && p.loan.parent === s.clubId) return 'Es jugador tuyo cedido a otro club.';
    if (s.market.blocked[p.id] === s.season.label + ':' + (T.window(s).kind || 'x')) return 'Las negociaciones con este club se rompieron en esta ventana.';
    if (p.clubId && !T.window(s).open) return T.window(s).label + '. ' + (T.window(s).next || '');
    return null;
  };

  T.start = function (s, pid, kind) {
    const p = s.players[pid];
    if (kind !== 'renew') {
      const err = T.canApproach(s, p);
      if (err) return { error: err };
    }
    if (kind === 'renew' && p.clubId !== s.clubId) return { error: 'Solo puedes renovar a jugadores de tu plantilla.' };
    if (kind === 'renew') {
      if (p.loan) return { error: 'No se puede renovar a un jugador cedido.' };
      if (p.morale < 30) return { error: p.name + ' está descontento y no quiere hablar de renovar ahora.' };
      if (p.renewRefused === s.season.label) return { error: p.name + ' ya rechazó renovar esta temporada.' };
    }
    if (kind === 'free' && p.clubId) return { error: 'No es agente libre.' };
    if ((kind === 'buy' || kind === 'loan' || kind === 'free') && !T.willingness(s, p).ok) return { error: T.willingness(s, p).reason };
    const talk = {
      pid, kind, stage: kind === 'free' || kind === 'renew' ? 'player' : 'club', patience: 3, rounds: [],
      asking: p.clubId && kind !== 'renew' ? T.askingPrice(s, p) : 0, fee: 0, wageShare: kind === 'loan' ? 50 : 0,
      demand: T.contractDemand(s, p, kind), season: s.season.label,
    };
    if (kind === 'loan') {
      const role = T.role(s, p);
      if (role === 'clave') return { error: s.clubs[p.clubId].name + ' no cede a un jugador clave.' };
      // Cesión sin compensación: el club pide que pagues al menos esta parte del salario.
      talk.asking = 0;
      talk.minShare = { rotacion: 75, joven: 50, suplente: 25 }[role] || 50;
    }
    s.market.talks[pid] = talk;
    return { talk };
  };

  T.cancel = function (s, pid) { delete s.market.talks[pid]; };

  function rngFor(s, talk, step) { return U.rng(s.seed + ':talk:' + talk.pid + ':' + talk.kind + ':' + s.season.label + ':' + step); }

  /* Fase 1: oferta al club (traspaso: fee; cesión: fee de cesión y % de salario que pagas). */
  /* Precio mínimo de una opción de compra que acepta el club propietario. */
  T.optionMin = (s, p) => roundMoney(T.askingPrice(s, p) * 1.05);

  T.offerClub = function (s, pid, fee, wageShare, loanOpts) {
    const talk = T.talkFor(s, pid);
    const p = s.players[pid];
    if (!talk || talk.stage !== 'club') return { error: 'No hay una negociación con el club en curso.' };
    const err = T.canApproach(s, p);
    if (err) return { error: err };
    if (talk.kind === 'loan') {
      wageShare = U.clamp(Math.round(wageShare || 0), 0, 100);
      const lo = loanOpts || {};
      const years = lo.years === 2 ? 2 : 1;
      const option = Math.max(0, Math.round(lo.option || 0));
      talk.wageShare = wageShare;
      talk.years = years;
      talk.option = option;
      talk.rounds.push({ by: 'tú', wageShare, loanYears: years, option });
      const min = talk.minShare || 50;
      const optMin = T.optionMin(s, p);
      if (option && option < optMin) {
        talk.patience--;
        if (talk.patience <= 0 || option < optMin * 0.5) {
          talk.stage = 'failed';
          s.market.blocked[pid] = s.season.label + ':' + (T.window(s).kind || 'x');
          talk.rounds.push({ by: 'club', text: 'La opción de compra le parece muy baja. Rompe las negociaciones.' });
          return { status: 'rejected' };
        }
        talk.rounds.push({ by: 'club', text: 'Acepta poner opción de compra, pero de al menos ' + U.money(optMin) + '.' });
        return { status: 'counter', optionMin: optMin };
      }
      if (years === 2 && p.contractEnd < s.season.year + 2) {
        talk.rounds.push({ by: 'club', text: 'Su contrato termina antes: solo puede ser una temporada.' });
        talk.years = 1;
        return { status: 'counter', maxYears: 1 };
      }
      if (wageShare >= min) {
        talk.fee = 0;
        talk.stage = 'player';
        talk.rounds.push({ by: 'club', text: 'Acepta la cesión. Confírmala para cerrarla.' });
        return { status: 'accepted' };
      }
      talk.patience--;
      if (talk.patience <= 0 || wageShare + 50 < min) {
        talk.stage = 'failed';
        s.market.blocked[pid] = s.season.label + ':' + (T.window(s).kind || 'x');
        talk.rounds.push({ by: 'club', text: 'No acepta: quiere que pagues más salario. Rompe las negociaciones.' });
        return { status: 'rejected' };
      }
      talk.rounds.push({ by: 'club', text: 'Pide que pagues al menos el ' + min + '% del salario.' });
      return { status: 'counter', minShare: min };
    }
    fee = Math.max(0, Math.round(fee));
    if (fee > s.clubs[s.clubId].budget) return { error: 'No puedes ofrecer ' + U.money(fee) + ': tu presupuesto es ' + U.money(s.clubs[s.clubId].budget) + '.' };
    const rng = rngFor(s, talk, talk.rounds.length);
    const ask = talk.asking;
    const round = { by: 'tú', fee };
    talk.rounds.push(round);
    if (fee >= ask) {
      talk.fee = fee;
      talk.stage = 'player';
      talk.rounds.push({ by: 'club', text: 'Acepta la oferta. Ahora negocia el contrato con el jugador.' });
      return { status: 'accepted' };
    }
    talk.patience--;
    if (fee < ask * 0.6 || talk.patience <= 0) {
      talk.stage = 'failed';
      s.market.blocked[pid] = s.season.label + ':' + (T.window(s).kind || 'x');
      talk.rounds.push({ by: 'club', text: fee < ask * 0.6 ? 'Considera la oferta insultante y rompe las negociaciones.' : 'Se agota su paciencia y rompe las negociaciones.' });
      return { status: 'rejected' };
    }
    const counter = roundMoney(Math.max(ask * rng.range(0.94, 1), (fee + ask) / 2 + (ask - fee) * 0.25));
    talk.rounds.push({ by: 'club', fee: counter, text: 'Contraoferta del club.' });
    talk.asking = counter;
    return { status: 'counter', counter };
  };

  /* Fase 2: contrato con el jugador. */
  T.offerContract = function (s, pid, offer) {
    const talk = T.talkFor(s, pid);
    const p = s.players[pid];
    if (!talk || talk.stage !== 'player') return { error: 'No hay una negociación de contrato en curso.' };
    offer = { wage: Math.max(0, Math.round(offer.wage)), years: U.clamp(Math.round(offer.years), 1, 5), bonus: Math.max(0, Math.round(offer.bonus || 0)) };
    if (talk.kind === 'loan') offer.years = 1;
    const d = talk.demand;
    const myWage = talk.kind === 'loan' ? Math.round(p.wage * talk.wageShare / 100) : offer.wage;
    const cost = talk.fee + (talk.kind === 'loan' ? 0 : offer.bonus);
    const errs = T.checkDeal(s, p, cost, myWage, { renew: talk.kind === 'renew' });
    if (errs.length) return { error: errs.join(' ') };
    const score = talk.kind === 'loan' ? 1 : T.scoreContract(d, offer);
    talk.rounds.push({ by: 'tú', wage: offer.wage, years: offer.years, bonus: offer.bonus });
    if (score >= 0.98) return complete(s, talk, offer);
    talk.patience--;
    if (score < 0.75 || talk.patience <= 0) {
      talk.stage = 'failed';
      if (talk.kind === 'renew') p.renewRefused = s.season.label;
      talk.rounds.push({ by: 'jugador', text: score < 0.75 ? 'La oferta está muy lejos de lo que pide. Se levanta de la mesa.' : 'No hay acuerdo: el jugador da por terminadas las negociaciones.' });
      return { status: 'rejected' };
    }
    // Contraoferta: se acerca un poco a lo ofrecido
    d.wage = Math.max(Math.round((d.wage * 0.75 + offer.wage * 0.25) / 250) * 250, Math.round(offer.wage / 250) * 250);
    d.bonus = roundMoney(Math.max(offer.bonus, d.bonus * 0.85));
    talk.rounds.push({ by: 'jugador', wage: d.wage, years: d.years, bonus: d.bonus, text: 'Pide ' + U.wage(d.wage) + ', ' + d.years + ' años y ' + U.money(d.bonus) + ' de prima.' });
    return { status: 'counter', counter: Object.assign({}, d) };
  };

  function record(s, type, p, from, to, fee, extra) {
    s.transfers.unshift(Object.assign({
      season: s.season.label, date: T.currentDate(s), type, pid: p.id, name: p.name, pos: p.pos, age: p.age, ovr: p.ovr,
      from: from ? s.clubs[from].name : 'Sin club', to: to ? s.clubs[to].name : 'Sin club', fee: fee || 0,
    }, extra || {}));
    if (s.transfers.length > 400) s.transfers.length = 400;
  }

  function complete(s, talk, offer) {
    const club = s.clubs[s.clubId];
    T.pool(s);
    const before = C().wageBill(s, s.clubId);
    const r = completeDeal(s, talk, offer);
    const delta = C().wageBill(s, s.clubId) - before;
    if (delta > 0) {
      club.budget -= delta * T.WAGE_TO_BUDGET;
      ledger(s, 'Reserva de un año de salario', -delta * T.WAGE_TO_BUDGET, 'wages');
    }
    T.pool(s);
    return r;
  }
  function completeDeal(s, talk, offer) {
    const p = s.players[talk.pid];
    const club = s.clubs[s.clubId];
    const fin = s.market.fin;
    const from = p.clubId;
    if (talk.kind === 'renew') {
      p.wage = offer.wage;
      p.contractEnd = s.season.year + 1 + offer.years;
      club.budget -= offer.bonus;
      fin.expense.bonuses += offer.bonus;
      p.morale = U.clamp(p.morale + 8, 0, 100);
      ledger(s, 'Prima de renovación: ' + p.name, -offer.bonus, 'bonus');
      record(s, 'renew', p, s.clubId, s.clubId, 0, { wage: offer.wage, years: offer.years });
      C().news(s, 'contract', p.name + ' renueva', p.name + ' amplía su contrato hasta junio de ' + p.contractEnd + ' (' + U.wage(offer.wage) + ').', { pid: p.id });
    } else if (talk.kind === 'loan') {
      const parent = from;
      C().movePlayer(s, p, s.clubId);
      p.loan = { parent, until: s.season.year + (talk.years === 2 ? 2 : 1), wageShare: talk.wageShare, fullWage: p.wage, option: talk.option || 0 };
      p.wage = Math.round(p.wage * talk.wageShare / 100);
      club.budget -= talk.fee;
      s.clubs[parent].budget += talk.fee;
      fin.expense.transfers += talk.fee;
      if (talk.fee) ledger(s, 'Cesión de ' + p.name, -talk.fee, 'transfer');
      record(s, 'loan-in', p, parent, s.clubId, talk.fee, { wageShare: talk.wageShare });
      C().news(s, 'transfer', 'Llega cedido ' + p.name, p.name + ' llega cedido desde ' + s.clubs[parent].name + ' hasta junio de ' + p.loan.until + '. Pagas el ' + talk.wageShare + '% de su salario.' +
        (p.loan.option ? ' Opción de compra: ' + U.money(p.loan.option) + '.' : ''), { pid: p.id });
    } else {
      if (from) { s.clubs[from].budget += talk.fee; }
      C().movePlayer(s, p, s.clubId);
      p.loan = null;
      p.wage = offer.wage;
      p.contractEnd = s.season.year + offer.years;
      p.listed = false;
      p.morale = U.clamp(Math.max(p.morale, 72), 0, 100);
      club.budget -= talk.fee + offer.bonus;
      fin.expense.transfers += talk.fee;
      fin.expense.bonuses += offer.bonus;
      if (talk.fee) ledger(s, 'Fichaje de ' + p.name, -talk.fee, 'transfer');
      if (offer.bonus) ledger(s, 'Prima de fichaje: ' + p.name, -offer.bonus, 'bonus');
      record(s, from ? 'buy' : 'free', p, from, s.clubId, talk.fee, { wage: offer.wage, years: offer.years });
      C().news(s, 'transfer', (from ? 'Fichaje: ' : 'Agente libre: ') + p.name,
        p.name + (from ? ' llega desde ' + s.clubs[from].name + ' por ' + U.money(talk.fee) : ' firma como agente libre') + '. Contrato hasta junio de ' + p.contractEnd + ' con ' + U.wage(offer.wage) + '.', { pid: p.id });
    }
    talk.stage = 'done';
    talk.rounds.push({ by: 'jugador', text: 'Acuerdo cerrado.' });
    delete s.market.talks[talk.pid];
    s.market.shortlist = s.market.shortlist.filter((id) => id !== p.id);
    s._tr = {};
    return { status: 'done' };
  }

  /* Ejecutar la opción de compra de un jugador cedido en tu club. */
  T.exerciseOption = function (s, pid) {
    const p = s.players[pid];
    if (!p || p.clubId !== s.clubId || !p.loan || p.loan.parent === s.clubId || !p.loan.option) return { error: 'No hay opción de compra para este jugador.' };
    const club = s.clubs[s.clubId];
    const fee = p.loan.option;
    const full = p.loan.fullWage || p.wage;
    const total = T.dealCost(fee, full - p.wage);
    if (total > club.budget) return { error: 'La opción cuesta ' + U.money(fee) + ' más un año de la parte de salario que aún no pagas (' + U.money(Math.max(0, full - p.wage) * T.WAGE_TO_BUDGET) + '). Dispones de ' + U.money(club.budget) + '.' };
    T.pool(s);
    const before = C().wageBill(s, s.clubId);
    const parent = p.loan.parent;
    club.budget -= fee;
    if (s.clubs[parent]) s.clubs[parent].budget += fee;
    s.market.fin.expense.transfers += fee;
    ledger(s, 'Opción de compra: ' + p.name, -fee, 'transfer');
    p.wage = full;
    p.loan = null;
    p.contractEnd = Math.max(p.contractEnd, s.season.year + 2);
    const delta = C().wageBill(s, s.clubId) - before;
    if (delta > 0) { club.budget -= delta * T.WAGE_TO_BUDGET; ledger(s, 'Reserva de un año de salario', -delta * T.WAGE_TO_BUDGET, 'wages'); }
    T.pool(s);
    record(s, 'buy', p, parent, s.clubId, fee, { option: true });
    C().news(s, 'transfer', 'Opción de compra: ' + p.name, 'Ejecutas la opción de compra de ' + p.name + ' por ' + U.money(fee) + '. Contrato hasta junio de ' + p.contractEnd + '.', { pid: p.id });
    s._tr = {};
    return { status: 'done', fee };
  };

  // ---------- Ventas, cesiones y rescisiones ----------
  T.toggleListed = function (s, pid) {
    const p = s.players[pid];
    if (!p || p.clubId !== s.clubId) return;
    p.listed = !p.listed;
    if (p.listed) p.morale = U.clamp(p.morale - 6, 0, 100);
  };
  T.toggleShortlist = function (s, pid) {
    const l = s.market.shortlist;
    const i = l.indexOf(pid);
    if (i >= 0) l.splice(i, 1); else l.push(pid);
  };

  function sellTo(s, p, buyerId, fee, type) {
    const club = s.clubs[s.clubId];
    const buyer = s.clubs[buyerId];
    if (type === 'loan-out') {
      C().movePlayer(s, p, buyerId);
      p.loan = { parent: s.clubId, until: s.season.year + 1, wageShare: 0, fullWage: p.wage };
      record(s, 'loan-out', p, s.clubId, buyerId, fee);
      club.budget += fee;
      if (fee) { s.market.fin.income.sales += fee; ledger(s, 'Cesión de ' + p.name, fee, 'sale'); }
      C().news(s, 'transfer', p.name + ', cedido', p.name + ' jugará cedido en ' + buyer.name + ' hasta final de temporada.', { pid: p.id });
    } else {
      C().movePlayer(s, p, buyerId);
      p.loan = null;
      p.listed = false;
      p.wage = PL.fairWage(p, buyer.wealth);
      p.contractEnd = s.season.year + T.preferredYears(p);
      club.budget += fee;
      buyer.budget = Math.max(0, buyer.budget - fee);
      s.market.fin.income.sales += fee;
      ledger(s, 'Venta de ' + p.name, fee, 'sale');
      record(s, 'sell', p, s.clubId, buyerId, fee);
      C().news(s, 'transfer', 'Venta: ' + p.name, p.name + ' se marcha a ' + buyer.name + ' por ' + U.money(fee) + '.', { pid: p.id });
    }
    if (club.lineup) MCM.lineup.repair(club.lineup, C().squad(s, s.clubId));
    T.pool(s);
    s._tr = {};
  }

  T.respondOffer = function (s, offerId, action, amount) {
    const o = s.market.offers.find((x) => x.id === offerId);
    if (!o || o.status !== 'pending') return { error: 'La oferta ya no está disponible.' };
    const p = s.players[o.pid];
    if (!p || p.clubId !== s.clubId) { o.status = 'expired'; return { error: 'El jugador ya no está en tu plantilla.' }; }
    if (action === 'reject') {
      o.status = 'rejected';
      if (T.role(s, p) === 'clave' && p.age >= 24 && T.reference(s, p).value > 0) p.morale = U.clamp(p.morale - 4, 0, 100);
      return { status: 'rejected' };
    }
    if (!T.window(s).open) return { error: 'El mercado está cerrado.' };
    if (T.squadSize(s) <= T.MIN_SQUAD) return { error: 'No puedes quedarte con menos de ' + T.MIN_SQUAD + ' jugadores.' };
    if (action === 'accept') {
      o.status = 'accepted';
      sellTo(s, p, o.clubId, o.fee, o.type === 'loan' ? 'loan-out' : 'sell');
      return { status: 'accepted' };
    }
    if (action === 'counter') {
      amount = Math.round(amount);
      if (amount <= o.fee) { o.status = 'accepted'; sellTo(s, p, o.clubId, o.fee, 'sell'); return { status: 'accepted' }; }
      const max = o.maxFee;
      if (amount <= max && amount <= s.clubs[o.clubId].budget) {
        o.status = 'accepted';
        o.fee = amount;
        sellTo(s, p, o.clubId, amount, 'sell');
        return { status: 'accepted', fee: amount };
      }
      if (o.countered) { o.status = 'withdrawn'; return { status: 'withdrawn' }; }
      o.countered = true;
      o.fee = roundMoney(Math.min(max, (o.fee + amount) / 2));
      return { status: 'counter', fee: o.fee };
    }
    return { error: 'Acción no válida.' };
  };

  function loanDestination(s, p) {
    const mine = s.clubs[s.clubId];
    const cands = Object.values(s.clubs).filter((c) => c.id !== s.clubId && c.rep <= mine.rep + 2 && c.squad.length < 29 &&
      p.ovr >= MCM.generator.baseOvr(c.rep) - 6);
    if (!cands.length) return null;
    cands.sort((a, b) => Math.abs(MCM.generator.baseOvr(a.rep) - p.ovr) - Math.abs(MCM.generator.baseOvr(b.rep) - p.ovr));
    return cands[U.rng(s.seed + ':loan:' + p.id + s.season.label).int(0, Math.min(4, cands.length - 1))];
  }
  T.loanOut = function (s, pid) {
    const p = s.players[pid];
    if (!p || p.clubId !== s.clubId) return { error: 'No es jugador de tu plantilla.' };
    if (p.loan) return { error: 'Ya está cedido.' };
    if (!T.window(s).open) return { error: 'El mercado está cerrado.' };
    if (T.squadSize(s) <= T.MIN_SQUAD) return { error: 'No puedes quedarte con menos de ' + T.MIN_SQUAD + ' jugadores.' };
    const dest = loanDestination(s, p);
    if (!dest) return { error: 'Ningún club está interesado en su cesión ahora mismo.' };
    sellTo(s, p, dest.id, 0, 'loan-out');
    return { status: 'done', club: dest.name };
  };

  T.releaseCost = function (s, p) {
    const weeksLeftSeason = Math.max(0, 41 - (s.week || 0));
    const weeks = weeksLeftSeason + T.yearsLeft(s, p) * 46;
    return roundMoney(p.wage * weeks * 0.5);
  };
  T.release = function (s, pid) {
    const p = s.players[pid];
    if (!p || p.clubId !== s.clubId) return { error: 'No es jugador de tu plantilla.' };
    if (p.loan) return { error: 'No puedes rescindir a un jugador cedido.' };
    if (T.squadSize(s) <= T.MIN_SQUAD) return { error: 'No puedes quedarte con menos de ' + T.MIN_SQUAD + ' jugadores.' };
    const cost = T.releaseCost(s, p);
    const club = s.clubs[s.clubId];
    if (cost > club.budget) return { error: 'La rescisión cuesta ' + U.money(cost) + ' y tu presupuesto es ' + U.money(club.budget) + '.' };
    club.budget -= cost;
    s.market.fin.expense.releases += cost;
    ledger(s, 'Rescisión de ' + p.name, -cost, 'release');
    C().movePlayer(s, p, null);
    club.wageBudget = Math.min(club.wageBudget, C().wageBill(s, s.clubId));
    p.listed = false;
    p.contractEnd = s.season.year + 1;
    record(s, 'release', p, s.clubId, null, cost);
    C().news(s, 'contract', 'Rescisión de ' + p.name, 'El club paga ' + U.money(cost) + ' y ' + p.name + ' queda libre.', { pid: p.id });
    if (club.lineup) MCM.lineup.repair(club.lineup, C().squad(s, s.clubId));
    s._tr = {};
    return { status: 'done', cost };
  };

  // ---------- Simulación semanal ----------
  function generateOffers(s, rng) {
    const m = s.market;
    const md = s.week || 0;
    const open = T.window(s).open;
    m.offers.forEach((o) => { if (o.status === 'pending' && (md > o.expiresMd || !open)) o.status = 'expired'; });
    if (!open) return;
    const squad = C().squad(s, s.clubId).filter((p) => !p.loan);
    if (squad.length <= T.MIN_SQUAD) return;
    let made = 0;
    squad.slice().sort((a, b) => (b.listed ? 1 : 0) - (a.listed ? 1 : 0) || b.ovr - a.ovr).forEach((p) => {
      if (made >= 2) return;
      if (m.offers.some((o) => o.pid === p.id && o.status === 'pending')) return;
      const role = T.role(s, p);
      let prob = p.listed ? 0.3 : role === 'clave' ? 0.035 : role === 'joven' && p.pot >= 80 ? 0.03 : 0.012;
      if (!rng.chance(prob)) return;
      const ref = T.reference(s, p).value;
      const buyers = Object.values(s.clubs).filter((c) => c.id !== s.clubId && c.budget >= ref * 0.8 &&
        p.ovr >= MCM.generator.baseOvr(c.rep) - 2 && p.ovr <= MCM.generator.baseOvr(c.rep) + 12);
      if (!buyers.length) return;
      const b = rng.pick(buyers);
      const fee = roundMoney(Math.min(b.budget, ref * rng.range(0.8, 1.15) * (p.listed ? 0.95 : 1.05)));
      const loanish = role !== 'clave' && p.age <= 22 && rng.chance(0.25);
      m.offers.unshift({
        id: 'o' + (++m.seq), pid: p.id, clubId: b.id, type: loanish ? 'loan' : 'buy', fee: loanish ? 0 : fee,
        maxFee: roundMoney(Math.min(b.budget, fee * rng.range(1.1, 1.35))), expiresMd: md + 2, status: 'pending', md,
      });
      made++;
      C().news(s, 'offer', (loanish ? 'Petición de cesión' : 'Oferta') + ' por ' + p.name,
        b.name + (loanish ? ' quiere a ' + p.name + ' cedido hasta final de temporada.' : ' ofrece ' + U.money(fee) + ' por ' + p.name + '.') + ' Tienes dos jornadas para responder.', { pid: p.id });
    });
    if (m.offers.length > 60) m.offers.length = 60;
  }

  /* Fichajes entre clubes de la IA al abrirse cada ventana. */
  function aiWindow(s, rng) {
    const w = T.window(s);
    if (!w.open) return;
    const key = s.season.label + ':' + w.kind;
    if (s.market.aiWindows[key]) return;
    s.market.aiWindows[key] = true;
    // Los clubes dirigidos por personas no compran ni venden por su cuenta.
    const clubs = Object.values(s.clubs).filter((c) => !C().isHuman(s, c.id));
    const moves = [];
    const n = w.kind === 'summer' ? 40 : 15;
    for (let i = 0; i < n * 3 && moves.length < n; i++) {
      const buyer = rng.pick(clubs);
      if (buyer.squad.length >= 28) continue;
      const level = MCM.generator.baseOvr(buyer.rep);
      const sellers = clubs.filter((c) => c.id !== buyer.id && c.rep < buyer.rep);
      if (!sellers.length) continue;
      const seller = rng.pick(sellers);
      const target = C().squad(s, seller.id).filter((p) => !p.loan && !s.market.talks[p.id] && !s.market.shortlist.includes(p.id) && p.ovr >= level - 1 && p.ovr <= level + 6 && p.age <= 30)
        .sort((a, b) => b.ovr - a.ovr)[0];
      if (!target || seller.squad.length <= 20) continue;
      const fee = roundMoney(target.value * rng.range(0.9, 1.3));
      if (fee > buyer.budget) continue;
      buyer.budget -= fee;
      seller.budget += fee;
      C().movePlayer(s, target, buyer.id);
      target.wage = PL.fairWage(target, buyer.wealth);
      target.contractEnd = s.season.year + T.preferredYears(target);
      record(s, 'ai', target, seller.id, buyer.id, fee);
      moves.push({ p: target, from: seller, to: buyer, fee });
    }
    // Agentes libres que encuentran equipo
    s.freeAgents.slice().forEach((id) => {
      const p = s.players[id];
      // Los agentes libres buenos encuentran equipo antes.
      if (!p || !rng.chance(p.ovr >= 80 ? 0.5 : p.ovr >= 75 ? 0.25 : 0.12)) return;
      const c = clubs.filter((x) => x.squad.length < 27 && p.ovr >= MCM.generator.baseOvr(x.rep) - 4 && p.ovr <= MCM.generator.baseOvr(x.rep) + 4);
      if (!c.length) return;
      const club = rng.pick(c);
      C().movePlayer(s, p, club.id);
      p.wage = PL.fairWage(p, club.wealth);
      p.contractEnd = s.season.year + T.preferredYears(p);
      record(s, 'ai', p, null, club.id, 0);
    });
    s._tr = {};
    const top = moves.sort((a, b) => b.fee - a.fee).slice(0, 3);
    if (top.length) {
      C().news(s, 'transfer', w.kind === 'summer' ? 'Movimientos del mercado de verano' : 'Movimientos del mercado de invierno',
        top.map((m) => m.p.name + ' (' + m.from.name + ' → ' + m.to.name + ', ' + U.money(m.fee) + ')').join('; ') + '.');
    }
  }

  // Ingresos por taquilla de un partido en casa
  T.ticketIncome = (club) => roundMoney(1.6e6 * Math.pow(club.rep / 95, 2.8));

  T.weekly = function (s) {
    T.init(s);
    const rng = U.rng(s.seed + ':mk:' + s.season.label + ':' + (s.week || 0));
    s.market.fin.expense.wages += C().wageBill(s, s.clubId);
    aiWindow(s, rng);
    if (s.online) return;
    generateOffers(s, rng);
    // Aviso de cesiones con opción de compra que terminan este verano
    if (s.week === 36) {
      const opt = C().squad(s, s.clubId).filter((p) => p.loan && p.loan.parent !== s.clubId && p.loan.option && p.loan.until <= s.season.year + 1);
      if (opt.length) C().news(s, 'transfer', 'Opciones de compra pendientes', opt.map((p) => p.name + ' (' + U.money(p.loan.option) + ')').join(', ') + '. Si no las ejecutas antes de cerrar la temporada, vuelven a su club.');
    }
    // Aviso de contratos que vencen a mitad de temporada
    if (s.week === 20) {
      const exp = C().squad(s, s.clubId).filter((p) => !p.loan && p.contractEnd <= s.season.year + 1);
      if (exp.length) C().news(s, 'contract', 'Contratos que vencen en junio', exp.map((p) => p.name).join(', ') + '. Si no renuevan, se marcharán libres al final de la temporada.');
    }
  };

  /* Cierre económico de temporada y presupuestos de la siguiente. Se llama antes del cambio de temporada. */
  T.closeSeason = function (s, pos, n, objectiveMet) {
    T.init(s);
    const fin = s.market.fin;
    const club = s.clubs[s.clubId];
    const L = s.leagues[club.leagueId];
    fin.income.tv += roundMoney(L.wealth * 20e6 * (1 - ((pos - 1) / Math.max(1, n - 1)) * 0.45));
    if (pos === 1) fin.income.prizes += roundMoney(L.wealth * 12e6);
    else if (pos <= (L.euro || 3)) fin.income.prizes += roundMoney(L.wealth * 4e6);
    const income = U.sum(Object.values(fin.income));
    const expense = U.sum(Object.values(fin.expense));
    fin.net = income - expense;
    s.market.finHistory.unshift(Object.assign({}, fin));
    if (s.market.finHistory.length > 20) s.market.finHistory.length = 20;
    return { income, expense, net: fin.net };
  };

  T.newSeasonBudgets = function (s, objectiveMet, net) {
    const club = s.clubs[s.clubId];
    const L = s.leagues[club.leagueId];
    const base = MCM.generator.transferBudget(club.rep, L.wealth);
    const prev = club.budget;
    club.budget = roundMoney(Math.max(0, prev) * 0.3 + base * (objectiveMet ? 0.75 : 0.55) + Math.max(0, net || 0) * 0.3);
    const bill = C().wageBill(s, s.clubId);
    club.wageBudget = bill;
    s.market.fin = T.emptyFin(C().seasonLabel(s.season.year + 1));
    s.market.offers = s.market.offers.filter((o) => o.status === 'pending' && false);
    s.market.talks = {};
    s.market.blocked = {};
    C().news(s, 'board', 'Presupuestos ' + C().seasonLabel(s.season.year + 1),
      'Presupuesto: ' + U.money(club.budget) + ' para fichajes, primas y salarios. Masa salarial actual: ' + U.wage(bill) + '.');
  };

  /* Solo las cesiones que terminan (modo online). */
  T.returnLoans = function (s) {
    const year = s.season.year;
    Object.values(s.players).forEach((p) => {
      if (p.loan && p.loan.until <= year + 1) {
        if (s.clubs[p.loan.parent]) { C().movePlayer(s, p, p.loan.parent); p.wage = p.loan.fullWage || p.wage; }
        p.loan = null;
      }
    });
  };

  /* Fin de temporada: cesiones que vuelven y contratos del usuario que expiran. Antes de envejecer. */
  T.endOfSeasonContracts = function (s) {
    const year = s.season.year;
    const leaving = [];
    Object.values(s.players).forEach((p) => {
      if (p.loan && p.loan.until <= year + 1) {
        const parent = p.loan.parent;
        if (s.clubs[parent]) {
          if (p.clubId === s.clubId && parent !== s.clubId) C().news(s, 'transfer', p.name + ' vuelve a ' + s.clubs[parent].name, 'Termina la cesión de ' + p.name + (p.loan.option ? ' sin que ejecutaras la opción de compra.' : '.'), { pid: p.id });
          C().movePlayer(s, p, parent);
          p.wage = p.loan.fullWage || p.wage;
          if (parent === s.clubId) C().news(s, 'transfer', p.name + ' vuelve de su cesión', p.name + ' regresa a la plantilla tras su cesión.', { pid: p.id });
        }
        p.loan = null;
      }
    });
    C().squad(s, s.clubId).forEach((p) => {
      if (p.loan) return;
      if (p.contractEnd <= year + 1) {
        C().movePlayer(s, p, null);
        p.listed = false;
        record(s, 'expired', p, s.clubId, null, 0);
        leaving.push(p.name);
      }
    });
    const club = s.clubs[s.clubId];
    club.wageBudget = Math.min(club.wageBudget, C().wageBill(s, s.clubId));
    if (leaving.length) C().news(s, 'contract', 'Se marchan libres', leaving.join(', ') + (leaving.length > 1 ? ' terminan contrato y se van' : ' termina contrato y se va') + ' como agente libre.');
    return leaving;
  };
})(globalThis.MCM = globalThis.MCM || {});
