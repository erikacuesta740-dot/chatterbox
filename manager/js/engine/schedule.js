/* Calendario de liga a doble vuelta (método del círculo) y clasificación. */
(function (MCM) {
  'use strict';
  const S = (MCM.schedule = {});

  /* Liga a doble vuelta (o a una sola vuelta si single). */
  S.roundRobin = function (clubIds, rng, single) {
    const teams = rng ? rng.shuffle(clubIds) : clubIds.slice();
    if (teams.length % 2) teams.push(null); // descanso si hay número impar
    const n = teams.length;
    const rounds = n - 1;
    const half = n / 2;
    const firstLeg = [];
    let arr = teams.slice();
    for (let r = 0; r < rounds; r++) {
      const md = [];
      for (let i = 0; i < half; i++) {
        let home = arr[i];
        let away = arr[n - 1 - i];
        // Alternar localía para equilibrar
        if (i === 0 ? r % 2 === 1 : (r + i) % 2 === 1) [home, away] = [away, home];
        if (home && away) md.push([home, away]);
      }
      firstLeg.push(md);
      arr = [arr[0], arr[n - 1]].concat(arr.slice(1, n - 1));
    }
    const fixtures = [];
    let id = 0;
    firstLeg.forEach((md, r) => md.forEach(([h, a]) => fixtures.push({ id: 'f' + id++, md: r + 1, home: h, away: a, played: false })));
    if (single) return { fixtures, totalMd: rounds };
    firstLeg.forEach((md, r) => md.forEach(([h, a]) => fixtures.push({ id: 'f' + id++, md: rounds + r + 1, home: a, away: h, played: false })));
    return { fixtures, totalMd: rounds * 2 };
  };

  S.table = function (league) {
    const rows = {};
    league.clubIds.forEach((id) => {
      rows[id] = { clubId: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] };
    });
    league.fixtures.filter((f) => f.played).sort((a, b) => a.md - b.md).forEach((f) => {
      const h = rows[f.home];
      const a = rows[f.away];
      if (!h || !a) return;
      h.p++; a.p++;
      h.gf += f.hg; h.ga += f.ag; a.gf += f.ag; a.ga += f.hg;
      if (f.hg > f.ag) { h.w++; a.l++; h.pts += 3; h.form.push('V'); a.form.push('D'); }
      else if (f.hg < f.ag) { a.w++; h.l++; a.pts += 3; h.form.push('D'); a.form.push('V'); }
      else { h.d++; a.d++; h.pts++; a.pts++; h.form.push('E'); a.form.push('E'); }
    });
    const list = Object.values(rows);
    list.forEach((r) => { r.gd = r.gf - r.ga; r.form = r.form.slice(-5); });
    list.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.clubId.localeCompare(y.clubId));
    list.forEach((r, i) => { r.pos = i + 1; });
    return list;
  };

  // Zona de cada puesto para colorear la tabla.
  S.PLAYOFF_SIZE = { esp: 4, eng: 4, ita: 6, ger: 1, fra: 3 };
  /* Zona de la tabla. lower: la liga inferior (para saber si el antepenúltimo juega la promoción). */
  S.zone = function (league, pos, lower) {
    const n = league.clubIds.length;
    if (league.tier === 1 && league.uefa !== false) {
      if (pos === 1) return 'champ';
      if (league.ucl && pos <= league.ucl) return 'ucl';
      if (league.euro && pos <= league.euro) return 'euro';
    }
    if (league.upper) {
      if (league.promote && pos <= league.promote) return 'pro';
      if (league.playoff) {
        const from = league.playoffFrom || (league.promote || 2) + 1;
        if (pos >= from && pos < from + S.PLAYOFF_SIZE[league.playoff]) return 'po';
      }
    }
    if (league.relegate && pos > n - league.relegate) return 'rel';
    if (lower && (lower.playoff === 'ger' || lower.playoff === 'fra') && pos === n - (league.relegate || 0)) return 'relpo';
    return '';
  };

})(globalThis.MCM = globalThis.MCM || {});
