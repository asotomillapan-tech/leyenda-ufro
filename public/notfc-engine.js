// =========================================================================
// MOTOR DE JUEGO · NOT F.C (MODO CARRERA DE DT INTERCARRERAS UFRO)
// =========================================================================

import {
  CARRERAS_UFRO,
  calculateInitialClubBudget,
  calculatePlayerValueEur,
  createSquadPlayer,
  generateSeedSquadForTeam,
  validateTeamCareerMatch,
  normalizeTextKey,
  getTeamColorByFaculty,
} from './notfc-data.js';

export const POSITIONS = ['ARQ', 'DEF', 'MED', 'DEL'];

export const FORMATIONS_F7 = {
  '1-2-3-1': { label: '1-2-3-1 Equilibrada', counts: { ARQ: 1, DEF: 2, MED: 3, DEL: 1 } },
  '1-3-2-1': { label: '1-3-2-1 Sólida', counts: { ARQ: 1, DEF: 3, MED: 2, DEL: 1 } },
  '1-2-2-2': { label: '1-2-2-2 Ofensiva', counts: { ARQ: 1, DEF: 2, MED: 2, DEL: 2 } },
  '1-3-1-2': { label: '1-3-1-2 Contragolpe', counts: { ARQ: 1, DEF: 3, MED: 1, DEL: 2 } },
};

export const HALF_REAL_SECONDS = 120; // Cada tiempo dura exactamente 2 minutos reales (120s)
export const GAME_MINUTES_PER_HALF = 25; // Fútbol 7: 25' + 25' = 50'

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function formatClp(amount) {
  const n = Math.round(Number(amount) || 0);
  return `$${n.toLocaleString('es-CL')}`;
}

export const formatEuro = formatClp;

export function getFormationSlots(formationKey = '1-2-3-1') {
  const counts = (FORMATIONS_F7[formationKey] || FORMATIONS_F7['1-2-3-1']).counts;
  return [
    ...Array(counts.ARQ || 1).fill('ARQ'),
    ...Array(counts.DEF || 2).fill('DEF'),
    ...Array(counts.MED || 3).fill('MED'),
    ...Array(counts.DEL || 1).fill('DEL'),
  ];
}

export function getPlayerEffectiveOvr(player, rolePos = null) {
  if (!player) return 60;
  const baseOvr = Number(player.ovr) || 64;
  if (!rolePos || rolePos === player.position) return baseOvr;

  const pctRaw = player.secondaryPositions?.[rolePos];
  if (typeof pctRaw === 'number') {
    const pct = clamp(pctRaw, 0, 100);
    const penalty = pct >= 100 ? 0 : Math.max(1, Math.round((1 - pct / 100) * 8));
    return clamp(baseOvr - penalty, 45, 95);
  }

  const penalty = (rolePos === 'ARQ' || player.position === 'ARQ') ? 16 : 9;
  return clamp(baseOvr - penalty, 45, 95);
}

export function getMoraleInfo(morale) {
  const m = clamp(Math.round(Number(morale) || 70), 0, 100);
  if (m >= 82) return { value: m, label: 'Muy motivado', tone: 'emerald', wantsOut: false };
  if (m >= 62) return { value: m, label: 'Comprometido', tone: 'sky', wantsOut: false };
  if (m >= 44) return { value: m, label: 'Inquieto', tone: 'amber', wantsOut: false };
  return { value: m, label: 'Quiere irse', tone: 'rose', wantsOut: true };
}

export function sanitizePlayerPublic(player) {
  if (!player) return null;
  const copy = { ...player };
  delete copy.potential;
  delete copy.pot;
  return copy;
}

export function getTeamAverageOvr(team) {
  const starters = (team?.starterIds || [])
    .map((id) => (team?.players || []).find((p) => p.id === id))
    .filter(Boolean);
  const pool = starters.length >= 7 ? starters : (team?.players || []);
  if (pool.length === 0) return Number(team?.baseOvr) || 65;
  const slots = getFormationSlots(team?.formation);
  const sum = pool.reduce((acc, p, idx) => {
    const slotPos = starters.length >= 7 ? slots[idx] : p.position;
    return acc + getPlayerEffectiveOvr(p, slotPos);
  }, 0);
  return Math.round(sum / pool.length);
}

export function getSquadValuationEur(team) {
  return (team?.players || []).reduce((acc, p) => acc + (Number(p.marketValueEur) || calculatePlayerValueEur(p)), 0);
}

// =========================================================================
// 1. CALENDARIO EXACTO POR DIVISIÓN (19 -> 10, 26 -> 12, 21+21 -> 10)
// =========================================================================

export function buildRegularSchedule(teamIds, gamesPerTeam) {
  const ids = [...teamIds];
  const n = ids.length;
  if (n < 2) return [];

  if (n % 2 === 0) {
    const rounds = [];
    const list = [...ids];
    const maxR = Math.min(gamesPerTeam, n - 1);
    for (let r = 0; r < maxR; r += 1) {
      const roundFixtures = [];
      for (let i = 0; i < n / 2; i += 1) {
        const a = list[i];
        const b = list[n - 1 - i];
        roundFixtures.push(r % 2 === 0 ? [a, b] : [b, a]);
      }
      rounds.push(roundFixtures);
      const last = list.pop();
      list.splice(1, 0, last);
    }
    return rounds;
  }

  // N impar (19 o 21), gamesPerTeam par (10): grafo circulante k-regular empacado por fecha sin colisiones
  const k = Math.floor(gamesPerTeam / 2);
  const days = [];
  for (let s = 1; s <= k; s += 1) {
    for (let i = 0; i < n; i += 1) {
      const u = i;
      const v = (i + s) % n;
      let placed = false;
      for (let dIdx = 0; dIdx < days.length; dIdx += 1) {
        const d = days[dIdx];
        if (!d.used.has(u) && !d.used.has(v)) {
          d.used.add(u);
          d.used.add(v);
          d.matches.push((u + v + dIdx) % 2 === 0 ? [ids[u], ids[v]] : [ids[v], ids[u]]);
          placed = true;
          break;
        }
      }
      if (!placed) {
        days.push({ used: new Set([u, v]), matches: [[ids[u], ids[v]]] });
      }
    }
  }
  return days.map((d) => d.matches);
}

export function buildAllPlayAllRounds(teamIds) {
  const ids = [...teamIds];
  if (ids.length % 2 === 1) ids.push('__BYE__');
  const n = ids.length;
  const list = [...ids];
  const rounds = [];
  for (let r = 0; r < n - 1; r += 1) {
    const matches = [];
    for (let i = 0; i < n / 2; i += 1) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a === '__BYE__' || b === '__BYE__') continue;
      matches.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(matches);
    const last = list.pop();
    list.splice(1, 0, last);
  }
  return rounds;
}

export function createStandingsTable(teams) {
  return (teams || []).map((t) => ({
    teamId: t.id,
    teamName: t.name,
    division: t.division,
    conf: t.conf || null,
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    gf: 0,
    gc: 0,
    dg: 0,
    pts: 0,
    form: [],
  }));
}

export function sortStandings(rows) {
  return [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    if (b.pg !== a.pg) return b.pg - a.pg;
    return String(a.teamName || '').localeCompare(String(b.teamName || ''));
  });
}

export function applyMatchToStandings(table, homeId, awayId, hg, ag) {
  const next = table.map((r) => ({ ...r, form: [...(r.form || [])] }));
  const home = next.find((r) => r.teamId === homeId);
  const away = next.find((r) => r.teamId === awayId);
  if (home && away) {
    home.pj += 1;
    away.pj += 1;
    home.gf += hg;
    home.gc += ag;
    away.gf += ag;
    away.gc += hg;
    home.dg = home.gf - home.gc;
    away.dg = away.gf - away.gc;
    if (hg > ag) {
      home.pg += 1;
      home.pts += 3;
      away.pp += 1;
      home.form.push('G');
      away.form.push('P');
    } else if (ag > hg) {
      away.pg += 1;
      away.pts += 3;
      home.pp += 1;
      away.form.push('G');
      home.form.push('P');
    } else {
      home.pe += 1;
      away.pe += 1;
      home.pts += 1;
      away.pts += 1;
      home.form.push('E');
      away.form.push('E');
    }
    home.form = home.form.slice(-5);
    away.form = away.form.slice(-5);
  }
  return sortStandings(next);
}

const SEASON_ROUND_DATES = [
  '23 Mar', '06 Abr', '20 Abr', '04 May', '18 May', '01 Jun',
  '10 Ago', '24 Ago', '07 Sep', '21 Sep', '05 Oct', '19 Oct',
];

export function generateSeasonCalendar(teams) {
  const d1 = teams.filter((t) => t.division === 1).map((t) => t.id);
  const d2 = teams.filter((t) => t.division === 2).map((t) => t.id);
  const d3A = teams.filter((t) => t.division === 3 && t.conf === 'A').map((t) => t.id);
  const d3B = teams.filter((t) => t.division === 3 && t.conf === 'B').map((t) => t.id);

  const raw1 = buildRegularSchedule(d1, 10);
  const raw2 = buildRegularSchedule(d2, 12);
  const raw3A = buildRegularSchedule(d3A, 10);
  const raw3B = buildRegularSchedule(d3B, 10);

  const maxRounds = Math.max(raw1.length, raw2.length, raw3A.length, raw3B.length, 12);

  const mapRounds = (raw, divKey, conf = null) =>
    Array.from({ length: maxRounds }, (_, idx) => {
      const roundNum = idx + 1;
      const fixtures = (raw[idx] || []).map(([homeId, awayId], mIdx) => ({
        id: `${divKey}_R${roundNum}_M${mIdx + 1}`,
        round: roundNum,
        dateLabel: SEASON_ROUND_DATES[idx] || `Fecha ${roundNum}`,
        division: divKey === 'D1' ? 1 : divKey === 'D2' ? 2 : 3,
        conf,
        homeId,
        awayId,
        homeScore: null,
        awayScore: null,
        played: false,
      }));
      return { round: roundNum, dateLabel: SEASON_ROUND_DATES[idx] || `Fecha ${roundNum}`, matches: fixtures };
    });

  return {
    div1: mapRounds(raw1, 'D1'),
    div2: mapRounds(raw2, 'D2'),
    div3A: mapRounds(raw3A, 'D3A', 'A'),
    div3B: mapRounds(raw3B, 'D3B', 'B'),
  };
}

export function buildLinearTimeline(userTeam, teams, calendar, seasonNumber = 1) {
  const userDiv = userTeam.division;
  const userConf = userTeam.conf;
  const divRounds = userDiv === 1 ? calendar.div1 : userDiv === 2 ? calendar.div2 : (userConf === 'B' ? calendar.div3B : calendar.div3A);

  const getUserMatchForRound = (roundNum) => {
    const r = divRounds.find((x) => x.round === roundNum);
    return r ? r.matches.find((m) => m.homeId === userTeam.id || m.awayId === userTeam.id) || null : null;
  };

  const timeline = [];
  let idx = 0;
  const pushEv = (ev) => {
    timeline.push({ idx: idx++, done: false, ...ev });
  };

  pushEv({
    id: `S${seasonNumber}_PRE_SPONSORS`,
    type: 'PRE_SEASON_SPONSORS',
    semester: 1,
    dateLabel: '02 Mar',
    title: 'Acuerdos Comerciales & Patrocinios de Pretemporada',
    desc: 'Envía propuestas a marcas locales o Dirección de Carrera antes de que arranque el torneo para asegurar ingresos mensuales o semestrales.',
    blocking: true,
    minor: false,
  });

  pushEv({
    id: `S${seasonNumber}_OPEN_MARKET`,
    type: 'MARKET_OPEN',
    semester: 1,
    dateLabel: '09 Mar',
    title: 'Apertura Mercado de Pases Intercarreras',
    desc: 'Se abre la ventana de fichajes de primer semestre. Revisa refuerzos por carrera y agentes libres.',
    blocking: true,
    minor: false,
  });

  // Primer Semestre: Fechas 1 a 6 + cierre mercado + decisión DT
  for (let r = 1; r <= 6; r += 1) {
    const um = getUserMatchForRound(r);
    if (r === 2) {
      pushEv({
        id: `S${seasonNumber}_MARKET_CLOSE_1`,
        type: 'MARKET_CLOSE',
        semester: 1,
        dateLabel: '30 Mar',
        title: 'Cierre de Mercado · 1ª Rueda',
        desc: 'Últimas horas para inscribir jugadores antes del tramo central del semestre.',
        blocking: true,
        minor: false,
      });
    }
    if (r === 4) {
      pushEv({
        id: `S${seasonNumber}_DECISION_1`,
        type: 'DT_DECISION',
        semester: 1,
        dateLabel: '27 Abr',
        title: 'Decisión de Camarín y Directiva',
        desc: 'El Centro de Alumnos y el plantel esperan una definición táctica o institucional.',
        blocking: true,
        minor: false,
      });
    }
    pushEv({
      id: `S${seasonNumber}_ROUND_${r}`,
      type: 'MATCHDAY',
      round: r,
      semester: 1,
      dateLabel: SEASON_ROUND_DATES[r - 1] || `Fecha ${r}`,
      title: um ? `Fecha ${r} · Día de Partido` : `Fecha ${r} · Jornada Libre`,
      desc: um ? 'Tu equipo salta a la cancha del campus UFRO.' : 'Tu club descansa esta fecha según el fixture impar.',
      hasUserMatch: Boolean(um),
      userMatchId: um ? um.id : null,
      blocking: Boolean(um),
      minor: !um,
    });
  }

  pushEv({
    id: `S${seasonNumber}_MIDSEASON`,
    type: 'MIDSEASON_BREAK',
    semester: 1,
    dateLabel: '22 Jun',
    title: 'Mitad de Temporada · Balance de Invierno',
    desc: 'Termina el Primer Semestre. Se reabre el mercado de pases de medio año para corregir el plantel.',
    blocking: true,
    minor: false,
  });

  // Segundo Semestre: Fechas 7 a 12
  for (let r = 7; r <= 12; r += 1) {
    if (r === 9) {
      pushEv({
        id: `S${seasonNumber}_DECISION_2`,
        type: 'DT_DECISION',
        semester: 2,
        dateLabel: '31 Ago',
        title: 'Evaluación Crítica de Plantel',
        desc: 'Los jugadores con poco minutaje evalúan su continuidad y llegan propuestas al club.',
        blocking: true,
        minor: false,
      });
    }
    if (r === 10) {
      pushEv({
        id: `S${seasonNumber}_MARKET_CLOSE_2`,
        type: 'MARKET_CLOSE',
        semester: 2,
        dateLabel: '14 Sep',
        title: 'Cierre Definitivo del Mercado Anual',
        desc: 'Última oportunidad para fichar refuerzos antes del sprint final.',
        blocking: true,
        minor: false,
      });
    }
    const um = getUserMatchForRound(r);
    pushEv({
      id: `S${seasonNumber}_ROUND_${r}`,
      type: 'MATCHDAY',
      round: r,
      semester: 2,
      dateLabel: SEASON_ROUND_DATES[r - 1] || `Fecha ${r}`,
      title: um ? `Fecha ${r} · Recta Final` : `Fecha ${r} · Jornada Libre`,
      desc: um ? 'Puntos clave rumbo a Playoffs, Liguilla o permanencia.' : 'Tu equipo observa a los rivales desde la tribuna.',
      hasUserMatch: Boolean(um),
      userMatchId: um ? um.id : null,
      blocking: Boolean(um),
      minor: !um,
    });
  }

  pushEv({
    id: `S${seasonNumber}_POSTSEASON_START`,
    type: 'POSTSEASON_PHASE',
    phase: 'INIT',
    semester: 2,
    dateLabel: '02 Nov',
    title: 'Definición de Playoffs, Liguilla Final 3ª y Ascensos',
    desc: 'Finalizó la fase regular en las tres divisiones. Comienzan las llaves eliminatorias y Liguillas.',
    blocking: true,
    minor: false,
  });

  pushEv({
    id: `S${seasonNumber}_POSTSEASON_R1`,
    type: 'POSTSEASON_PHASE',
    phase: 'R1',
    semester: 2,
    dateLabel: '09 Nov',
    title: 'Postemporada · 1ª Ronda / Liguilla Final 3ª',
    desc: 'Se disputan los cruces de 1ª Ronda (1ª y 2ª Div) y la Liguilla todos contra todos de 3ª División.',
    blocking: true,
    minor: false,
  });

  pushEv({
    id: `S${seasonNumber}_POSTSEASON_QF`,
    type: 'POSTSEASON_PHASE',
    phase: 'QF',
    semester: 2,
    dateLabel: '16 Nov',
    title: 'Postemporada · Cuartos de Final (con Sorteo 1ª Div)',
    desc: 'Los mejores clasificados entran en escena buscando semifinales.',
    blocking: true,
    minor: false,
  });

  pushEv({
    id: `S${seasonNumber}_POSTSEASON_SF`,
    type: 'POSTSEASON_PHASE',
    phase: 'SF',
    semester: 2,
    dateLabel: '23 Nov',
    title: 'Postemporada · Semifinales y Liguillas de Ascenso',
    desc: 'Semifinales por el título y cruces directos entre divisiones por la categoría.',
    blocking: true,
    minor: false,
  });

  pushEv({
    id: `S${seasonNumber}_POSTSEASON_FINAL`,
    type: 'POSTSEASON_PHASE',
    phase: 'FINAL',
    semester: 2,
    dateLabel: '30 Nov',
    title: 'Finales Intercarreras & Cierre de Temporada',
    desc: 'Se coronan los campeones de 1ª, 2ª y 3ª División y se definen ascensos y descensos.',
    blocking: true,
    minor: false,
  });

  return timeline;
}

// =========================================================================
// 2. SIMULACIÓN RÁPIDA DE PARTIDOS IA + MOTOR EN VIVO (2 MIN/TIEMPO)
// =========================================================================

export function computeTeamMatchStrength(team, opponentId = null) {
  const starters = (team?.starterIds || [])
    .map((id) => (team?.players || []).find((p) => p.id === id))
    .filter(Boolean);
  const active = starters.length >= 5 ? starters : (team?.players || []).slice(0, 7);
  if (active.length === 0) return Number(team?.baseOvr) || 64;

  const slots = getFormationSlots(team?.formation);
  const avgOvr = active.reduce((s, p, idx) => s + getPlayerEffectiveOvr(p, slots[idx] || p.position), 0) / active.length;
  const avgMorale = active.reduce((s, p) => s + (Number(p.morale) || 70), 0) / active.length;
  const formation = FORMATIONS_F7[team?.formation] || FORMATIONS_F7['1-2-3-1'];
  const moraleFactor = (avgMorale - 68) * 0.11;
  const isDerbyMatch = opponentId && (team?.derby === opponentId || (opponentId && team?.derbyName === opponentId));
  const derbyBoost = isDerbyMatch ? 1.8 : 0;
  const formBonus = formation.counts.DEL >= 2 ? 0.8 : 0;
  return avgOvr + moraleFactor + derbyBoost + formBonus;
}

export function simulateMatchQuick(homeTeam, awayTeam, allowDraw = true, rng = Math.random) {
  const hs = computeTeamMatchStrength(homeTeam, awayTeam?.id) + 1.2;
  const as = computeTeamMatchStrength(awayTeam, homeTeam?.id);
  const diff = clamp((hs - as) / 10, -1.8, 1.8);

  const expHome = clamp(1.75 + diff * 0.72, 0.4, 4.4);
  const expAway = clamp(1.55 - diff * 0.65, 0.4, 4.2);

  const sampleGoals = (lambda) => {
    let g = 0;
    const p = Math.exp(-lambda);
    let prod = rng();
    while (prod > p && g < 8) {
      g += 1;
      prod *= rng();
    }
    return g;
  };

  let hg = sampleGoals(expHome);
  let ag = sampleGoals(expAway);
  let penWinner = null;

  if (!allowDraw && hg === ag) {
    const homeWinPen = rng() < clamp(0.5 + diff * 0.08, 0.35, 0.65);
    penWinner = homeWinPen ? homeTeam.id : awayTeam.id;
  }

  return { hg, ag, penWinner };
}

function pickWeightedPlayer(players, weightsFn, rng) {
  if (!players || players.length === 0) return null;
  const weights = players.map((p) => Math.max(1, weightsFn(p)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < players.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return players[i];
  }
  return players[0];
}

export function generateLiveMatchTimeline({
  matchId,
  homeTeam,
  awayTeam,
  label = 'Partido Intercarreras',
  allowDraw = true,
  rng = Math.random,
  fromMinute = 1,
  initialHomeGoals = 0,
  initialAwayGoals = 0,
  existingEvents = [],
}) {
  const hs = computeTeamMatchStrength(homeTeam, awayTeam?.id) + 1.1;
  const as = computeTeamMatchStrength(awayTeam, homeTeam?.id);
  const diff = clamp((hs - as) / 12, -1.4, 1.4);

  const getStarters = (team) => {
    const map = new Map((team?.players || []).map((p) => [p.id, p]));
    const list = (team?.starterIds || []).map((id) => map.get(id)).filter(Boolean);
    return list.length >= 5 ? list : (team?.players || []).slice(0, 7);
  };

  const homeStarters = getStarters(homeTeam);
  const awayStarters = getStarters(awayTeam);

  const events = [...existingEvents.filter((e) => e.minute < fromMinute)];
  let hg = initialHomeGoals;
  let ag = initialAwayGoals;

  const isDerby = Boolean(homeTeam?.derby && homeTeam.derby === awayTeam?.id);

  if (fromMinute === 1) {
    events.push({
      minute: 1,
      half: 1,
      type: 'KICKOFF',
      teamId: homeTeam.id,
      text: isDerby
        ? `¡Pitazo inicial en la cancha UFRO! Clásico universitario caliente entre ${homeTeam.name} y ${awayTeam.name}.`
        : `¡Comienza el partido de Fútbol 7! ${homeTeam.name} mueve el balón ante ${awayTeam.name}.`,
    });
  }

  for (let m = fromMinute; m <= 50; m += 1) {
    const half = m <= GAME_MINUTES_PER_HALF ? 1 : 2;
    if (m === 26 && !events.some((e) => e.minute === 26 && e.type === 'SECOND_HALF')) {
      events.push({
        minute: 26,
        half: 2,
        type: 'SECOND_HALF',
        text: `Arranca el 2° Tiempo (${hg}-${ag}). Todo se define en los últimos 25 minutos.`,
      });
    }

    const roll = rng();
    const homeGoalProb = clamp(0.036 + diff * 0.015, 0.014, 0.075);
    const awayGoalProb = clamp(0.033 - diff * 0.014, 0.014, 0.070);

    if (roll < homeGoalProb) {
      const scorer = pickWeightedPlayer(
        homeStarters,
        (p) => (p.position === 'DEL' ? 6 : p.position === 'MED' ? 4 : p.position === 'DEF' ? 1.5 : 0.2) * (p.ovr / 65),
        rng
      );
      const assister = pickWeightedPlayer(
        homeStarters.filter((p) => !scorer || p.id !== scorer.id),
        (p) => (p.position === 'MED' ? 5 : p.position === 'DEL' ? 3 : 2),
        rng
      );
      hg += 1;
      events.push({
        minute: m,
        half,
        type: 'GOAL',
        teamId: homeTeam.id,
        scorerId: scorer?.id || null,
        assisterId: assister?.id || null,
        scoreAfter: `${hg}-${ag}`,
        text: `⚽ ¡GOOOOL de ${homeTeam.name}! ${scorer?.name || 'Delantero'} define cruzado${assister ? ` tras gran pase de ${assister.name}` : ''} (${hg}-${ag}).`,
      });
    } else if (roll < homeGoalProb + awayGoalProb) {
      const scorer = pickWeightedPlayer(
        awayStarters,
        (p) => (p.position === 'DEL' ? 6 : p.position === 'MED' ? 4 : p.position === 'DEF' ? 1.5 : 0.2) * (p.ovr / 65),
        rng
      );
      const assister = pickWeightedPlayer(
        awayStarters.filter((p) => !scorer || p.id !== scorer.id),
        (p) => (p.position === 'MED' ? 5 : p.position === 'DEL' ? 3 : 2),
        rng
      );
      ag += 1;
      events.push({
        minute: m,
        half,
        type: 'GOAL',
        teamId: awayTeam.id,
        scorerId: scorer?.id || null,
        assisterId: assister?.id || null,
        scoreAfter: `${hg}-${ag}`,
        text: `⚽ Gol de ${awayTeam.name}. ${scorer?.name || 'Atacante'} no perdona frente al arco${assister ? ` (asistencia de ${assister.name})` : ''} (${hg}-${ag}).`,
      });
    } else if (roll < homeGoalProb + awayGoalProb + 0.085) {
      const atkHome = rng() < clamp(0.5 + diff * 0.12, 0.3, 0.7);
      const shooterTeam = atkHome ? homeTeam : awayTeam;
      const gkTeam = atkHome ? awayTeam : homeTeam;
      const shooter = pickWeightedPlayer(atkHome ? homeStarters : awayStarters, (p) => (p.position === 'DEL' ? 5 : 3), rng);
      const gk = (atkHome ? awayStarters : homeStarters).find((p) => p.position === 'ARQ') || (atkHome ? awayStarters : homeStarters)[0];
      events.push({
        minute: m,
        half,
        type: 'SAVE',
        teamId: gkTeam.id,
        text: `🧤 ¡Atajadón! ${shooter?.name || shooterTeam.name} probó al ángulo, pero ${gk?.name || 'el arquero'} voló para salvar a ${gkTeam.name}.`,
      });
    } else if (roll < homeGoalProb + awayGoalProb + 0.125) {
      const cardHome = rng() < 0.5;
      const cTeam = cardHome ? homeTeam : awayTeam;
      const cPlayer = pickWeightedPlayer(cardHome ? homeStarters : awayStarters, (p) => (p.position === 'DEF' ? 4 : 2), rng);
      events.push({
        minute: m,
        half,
        type: 'CARD',
        teamId: cTeam.id,
        text: `🟨 Tarjeta amarilla para ${cPlayer?.name || 'un defensor'} (${cTeam.name}) por cortar un contragolpe.`,
      });
    } else if (m === 12 || m === 38) {
      const dominator = hs >= as ? homeTeam : awayTeam;
      events.push({
        minute: m,
        half,
        type: 'COMMENT',
        text: `📣 Tramo intenso en la cancha sintética UFRO. ${dominator.name} presiona alto buscando espacios.`,
      });
    }
  }

  let penWinner = null;
  if (!allowDraw && hg === ag) {
    const homeWinsPen = rng() < clamp(0.5 + diff * 0.08, 0.35, 0.65);
    penWinner = homeWinsPen ? homeTeam.id : awayTeam.id;
    const penScore = homeWinsPen ? '4-3' : '3-4';
    events.push({
      minute: 50,
      half: 2,
      type: 'PENALTIES',
      teamId: penWinner,
      text: `🎯 ¡Empate ${hg}-${ag} al cierre! En los penales gana ${homeWinsPen ? homeTeam.name : awayTeam.name} (${penScore}).`,
    });
  }

  return {
    matchId,
    label,
    homeId: homeTeam.id,
    awayId: awayTeam.id,
    homeName: homeTeam.name,
    awayName: awayTeam.name,
    allowDraw,
    finalHomeScore: hg,
    finalAwayScore: ag,
    penWinner,
    events,
  };
}

export function getScoreAtMinute(timelineEvents, upToMinute) {
  let hg = 0;
  let ag = 0;
  let homeId = null;
  for (const ev of timelineEvents || []) {
    if (ev.type === 'KICKOFF') homeId = ev.teamId;
    if (ev.minute > upToMinute) continue;
    if (ev.type === 'GOAL') {
      if (homeId && ev.teamId === homeId) hg += 1;
      else ag += 1;
    }
  }
  return { hg, ag };
}

export function resimulateLiveMatchSession(session, currentMinute, homeTeam, awayTeam, rng = Math.random) {
  const kept = (session.timeline?.events || []).filter((e) => e.minute <= currentMinute);
  let hg = 0;
  let ag = 0;
  for (const ev of kept) {
    if (ev.type === 'GOAL') {
      if (ev.teamId === homeTeam.id) hg += 1;
      else ag += 1;
    }
  }

  const rebuilt = generateLiveMatchTimeline({
    matchId: session.matchId,
    homeTeam,
    awayTeam,
    label: session.label,
    allowDraw: session.allowDraw,
    rng,
    fromMinute: Math.min(50, currentMinute + 1),
    initialHomeGoals: hg,
    initialAwayGoals: ag,
    existingEvents: kept,
  });

  return {
    ...session,
    timeline: rebuilt,
  };
}

// =========================================================================
// 3. POSTEMPORADA Y LIGUILLAS (1ª, 2ª Y 3ª DIVISIÓN)
// =========================================================================

function resolvePlayoffMatch(homeTeam, awayTeam, id, roundLabel, rng) {
  const res = simulateMatchQuick(homeTeam, awayTeam, false, rng);
  const winnerId = res.hg > res.ag ? homeTeam.id : res.ag > res.hg ? awayTeam.id : res.penWinner;
  const loserId = winnerId === homeTeam.id ? awayTeam.id : homeTeam.id;
  return {
    id,
    roundLabel,
    homeId: homeTeam.id,
    awayId: awayTeam.id,
    homeName: homeTeam.name,
    awayName: awayTeam.name,
    homeScore: res.hg,
    awayScore: res.ag,
    penWinner: res.penWinner,
    winnerId,
    loserId,
    played: true,
  };
}

export function initializePostseasonStructure(state, rng = Math.random) {
  const byId = new Map(state.teams.map((t) => [t.id, t]));
  const t1 = sortStandings(state.standings.div1);
  const t2 = sortStandings(state.standings.div2);
  const t3A = sortStandings(state.standings.div3A);
  const t3B = sortStandings(state.standings.div3B);

  // 1ª División: 19 equipos. 5° al 12° juegan 1ª Ronda (5v12, 6v11, 7v10, 8v9). 1° al 4° esperan en Cuartos (con sorteo). 19° desciende directo. 16°-18° a Liguilla vs 2°-4° de 2ª.
  const d1R1Pairs = [
    [t1[4], t1[11]],
    [t1[5], t1[10]],
    [t1[6], t1[9]],
    [t1[7], t1[8]],
  ].map(([h, a], idx) => ({
    id: `PO_D1_R1_${idx + 1}`,
    roundLabel: '1ª Ronda (1ª Div)',
    homeId: h.teamId,
    awayId: a.teamId,
    homeName: h.teamName,
    awayName: a.teamName,
    homeScore: null,
    awayScore: null,
    winnerId: null,
    played: false,
  }));

  // 2ª División: 26 equipos. 9° al 18° juegan 1ª Ronda (9v18, 10v17, 11v16, 12v15, 13v14). 1° al 8° esperan para Octavos/Cuartos. 25°-26° descienden directo. 21°-24° a Liguilla vs 3°-6° de 3ª.
  const d2R1Pairs = [
    [t2[8], t2[17]],
    [t2[9], t2[16]],
    [t2[10], t2[15]],
    [t2[11], t2[14]],
    [t2[12], t2[13]],
  ].map(([h, a], idx) => ({
    id: `PO_D2_R1_${idx + 1}`,
    roundLabel: '1ª Ronda (2ª Div)',
    homeId: h.teamId,
    awayId: a.teamId,
    homeName: h.teamName,
    awayName: a.teamName,
    homeScore: null,
    awayScore: null,
    winnerId: null,
    played: false,
  }));

  // 3ª División: Top 4 de Conf A + Top 4 de Conf B (8 equipos) juegan Liguilla Final todos contra todos (7 rondas) para definirse del 1° al 8°.
  const div3FinalIds = [...t3A.slice(0, 4), ...t3B.slice(0, 4)].map((r) => r.teamId);
  const div3FinalTeams = div3FinalIds.map((id) => byId.get(id)).filter(Boolean);
  const div3RoundsRaw = buildAllPlayAllRounds(div3FinalIds);
  const div3FinalRounds = div3RoundsRaw.map((matches, rIdx) => ({
    round: rIdx + 1,
    matches: matches.map(([h, a], mIdx) => ({
      id: `D3_FIN_R${rIdx + 1}_M${mIdx + 1}`,
      homeId: h,
      awayId: a,
      homeName: byId.get(h)?.name || h,
      awayName: byId.get(a)?.name || a,
      homeScore: null,
      awayScore: null,
      played: false,
    })),
  }));

  return {
    div1: {
      top4Ids: t1.slice(0, 4).map((r) => r.teamId),
      directRelegatedId: t1[18]?.teamId || null,
      liguillaZoneIds: [t1[15]?.teamId, t1[16]?.teamId, t1[17]?.teamId].filter(Boolean),
      r1: d1R1Pairs,
      qf: [],
      sf: [],
      final: [],
      championId: null,
    },
    div2: {
      top8Ids: t2.slice(0, 8).map((r) => r.teamId),
      directRelegatedIds: [t2[24]?.teamId, t2[25]?.teamId].filter(Boolean),
      liguillaZoneIds: [t2[20]?.teamId, t2[21]?.teamId, t2[22]?.teamId, t2[23]?.teamId].filter(Boolean),
      r1: d2R1Pairs,
      r2: [],
      qf: [],
      sf: [],
      final: [],
      championId: null,
      runnerUpAndPlayoffIds: [],
    },
    div3: {
      participants: div3FinalIds,
      standings: createStandingsTable(div3FinalTeams),
      rounds: div3FinalRounds,
      championId: null,
      runnerUpId: null,
      liguillaIds: [],
    },
    liguilla1v2: [],
    liguilla2v3: [],
    promotions: [],
    relegations: [],
  };
}

export function advancePostseasonPhase(state, phase, rng = Math.random, userMatchOverride = null) {
  const po = state.postseason;
  if (!po) return state;
  const byId = new Map(state.teams.map((t) => [t.id, t]));

  const runTie = (tie) => {
    if (tie.played) return tie;
    let resolved = tie;
    if (userMatchOverride && userMatchOverride.matchId === tie.id) {
      const hg = userMatchOverride.homeScore;
      const ag = userMatchOverride.awayScore;
      const winnerId = hg > ag ? tie.homeId : ag > hg ? tie.awayId : userMatchOverride.penWinner;
      resolved = {
        ...tie,
        homeScore: hg,
        awayScore: ag,
        penWinner: userMatchOverride.penWinner || null,
        winnerId,
        loserId: winnerId === tie.homeId ? tie.awayId : tie.homeId,
        played: true,
      };
    } else {
      resolved = resolvePlayoffMatch(byId.get(tie.homeId), byId.get(tie.awayId), tie.id, tie.roundLabel, rng);
    }
    const uWon = resolved.winnerId === state.userTeamId;
    const adjH = resolved.homeId === state.userTeamId && uWon && resolved.homeScore === resolved.awayScore ? resolved.homeScore + 1 : resolved.homeScore;
    const adjA = resolved.awayId === state.userTeamId && uWon && resolved.homeScore === resolved.awayScore ? resolved.awayScore + 1 : resolved.awayScore;
    recordUserMatchStats(state, byId.get(resolved.homeId), byId.get(resolved.awayId), adjH, adjA);
    return resolved;
  };

  if (phase === 'R1') {
    po.div1.r1 = po.div1.r1.map(runTie);
    po.div2.r1 = po.div2.r1.map(runTie);

    // 3ª División Liguilla Final todos contra todos (Rondas 1..7)
    for (const r of po.div3.rounds) {
      for (const m of r.matches) {
        if (m.played) continue;
        if (userMatchOverride && userMatchOverride.matchId === m.id) {
          m.homeScore = userMatchOverride.homeScore;
          m.awayScore = userMatchOverride.awayScore;
          m.played = true;
        } else {
          const res = simulateMatchQuick(byId.get(m.homeId), byId.get(m.awayId), true, rng);
          m.homeScore = res.hg;
          m.awayScore = res.ag;
          m.played = true;
        }
        po.div3.standings = applyMatchToStandings(po.div3.standings, m.homeId, m.awayId, m.homeScore, m.awayScore);
        recordUserMatchStats(state, byId.get(m.homeId), byId.get(m.awayId), m.homeScore, m.awayScore);
      }
    }
    const d3Ranked = sortStandings(po.div3.standings);
    po.div3.championId = d3Ranked[0]?.teamId || null;
    po.div3.runnerUpId = d3Ranked[1]?.teamId || null;
    po.div3.liguillaIds = d3Ranked.slice(2, 6).map((x) => x.teamId);

    // Sorteo Cuartos 1ª Div: 1°-4° vs 4 ganadores de 1ª Ronda mezclados aleatoriamente
    const d1Winners = po.div1.r1.map((t) => t.winnerId);
    const shuffledWinners = [...d1Winners].sort(() => rng() - 0.5);
    po.div1.qf = po.div1.top4Ids.map((seedId, i) => {
      const oppId = shuffledWinners[i];
      return {
        id: `PO_D1_QF_${i + 1}`,
        roundLabel: 'Cuartos de Final (1ª Div)',
        homeId: seedId,
        awayId: oppId,
        homeName: byId.get(seedId)?.name || seedId,
        awayName: byId.get(oppId)?.name || oppId,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        played: false,
      };
    });

    // 2ª Div Ronda de ajuste hacia Cuartos: top 1°-3° directo a Cuartos, 4°-8° (5 equipos) enfrentan a los 5 ganadores de 1ª Ronda
    const d2Winners = po.div2.r1.map((t) => t.winnerId);
    const d2Seeded4to8 = po.div2.top8Ids.slice(3, 8);
    po.div2.r2 = d2Seeded4to8.map((seedId, i) => {
      const oppId = d2Winners[d2Winners.length - 1 - i];
      return {
        id: `PO_D2_OCT_${i + 1}`,
        roundLabel: 'Octavos / Reclasificación (2ª Div)',
        homeId: seedId,
        awayId: oppId,
        homeName: byId.get(seedId)?.name || seedId,
        awayName: byId.get(oppId)?.name || oppId,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        played: false,
      };
    });
  } else if (phase === 'QF') {
    po.div1.qf = po.div1.qf.map(runTie);
    po.div2.r2 = po.div2.r2.map(runTie);

    // Semifinales 1ª Div
    const d1QfWin = po.div1.qf.map((t) => t.winnerId);
    po.div1.sf = [
      { id: 'PO_D1_SF_1', roundLabel: 'Semifinal 1 (1ª Div)', homeId: d1QfWin[0], awayId: d1QfWin[3], homeName: byId.get(d1QfWin[0])?.name, awayName: byId.get(d1QfWin[3])?.name, played: false },
      { id: 'PO_D1_SF_2', roundLabel: 'Semifinal 2 (1ª Div)', homeId: d1QfWin[1], awayId: d1QfWin[2], homeName: byId.get(d1QfWin[1])?.name, awayName: byId.get(d1QfWin[2])?.name, played: false },
    ];

    // Cuartos 2ª Div: 1°-3° + 5 ganadores de Octavos = 8 equipos
    const d2Top3 = po.div2.top8Ids.slice(0, 3);
    const d2OctWin = po.div2.r2.map((t) => t.winnerId);
    const qfPool = [...d2Top3, ...d2OctWin];
    po.div2.qf = [
      [qfPool[0], qfPool[7]],
      [qfPool[1], qfPool[6]],
      [qfPool[2], qfPool[5]],
      [qfPool[3], qfPool[4]],
    ].map(([h, a], idx) => ({
      id: `PO_D2_QF_${idx + 1}`,
      roundLabel: 'Cuartos de Final (2ª Div)',
      homeId: h,
      awayId: a,
      homeName: byId.get(h)?.name || h,
      awayName: byId.get(a)?.name || a,
      played: false,
    }));
  } else if (phase === 'SF') {
    po.div1.sf = po.div1.sf.map(runTie);
    po.div2.qf = po.div2.qf.map(runTie);

    const d2QfWin = po.div2.qf.map((t) => t.winnerId);
    po.div2.sf = [
      { id: 'PO_D2_SF_1', roundLabel: 'Semifinal 1 (2ª Div)', homeId: d2QfWin[0], awayId: d2QfWin[3], homeName: byId.get(d2QfWin[0])?.name, awayName: byId.get(d2QfWin[3])?.name, played: false },
      { id: 'PO_D2_SF_2', roundLabel: 'Semifinal 2 (2ª Div)', homeId: d2QfWin[1], awayId: d2QfWin[2], homeName: byId.get(d2QfWin[1])?.name, awayName: byId.get(d2QfWin[2])?.name, played: false },
    ];
    po.div2.sf = po.div2.sf.map(runTie);

    // Finales
    const d1SfWin = po.div1.sf.map((t) => t.winnerId);
    po.div1.final = [{
      id: 'PO_D1_FINAL',
      roundLabel: 'Gran Final 1ª División',
      homeId: d1SfWin[0],
      awayId: d1SfWin[1],
      homeName: byId.get(d1SfWin[0])?.name,
      awayName: byId.get(d1SfWin[1])?.name,
      played: false,
    }];

    const d2SfWin = po.div2.sf.map((t) => t.winnerId);
    po.div2.final = [{
      id: 'PO_D2_FINAL',
      roundLabel: 'Gran Final 2ª División',
      homeId: d2SfWin[0],
      awayId: d2SfWin[1],
      homeName: byId.get(d2SfWin[0])?.name,
      awayName: byId.get(d2SfWin[1])?.name,
      played: false,
    }];

    // Liguilla 2ª/3ª: 21°-24° de 2ª vs 3°-6° de 3ª
    const d2Lig = po.div2.liguillaZoneIds;
    const d3Lig = po.div3.liguillaIds;
    po.liguilla2v3 = d2Lig.map((d2Id, i) => {
      const d3Id = d3Lig[d3Lig.length - 1 - i];
      if (!d2Id || !d3Id) return null;
      return {
        id: `LIG_2V3_${i + 1}`,
        roundLabel: 'Liguilla Ascenso 2ª/3ª',
        homeId: d2Id,
        awayId: d3Id,
        homeName: byId.get(d2Id)?.name,
        awayName: byId.get(d3Id)?.name,
        played: false,
      };
    }).filter(Boolean);
  } else if (phase === 'FINAL') {
    po.div1.final = po.div1.final.map(runTie);
    po.div2.final = po.div2.final.map(runTie);
    po.div1.championId = po.div1.final[0]?.winnerId || null;
    po.div2.championId = po.div2.final[0]?.winnerId || null;

    // Elegir 2°, 3° y 4° mejores de 2ª Div excluyendo al campeón (para Liguilla 1ª/2ª vs 16°,17°,18°)
    const d2SortedIds = sortStandings(state.standings.div2)
      .map((r) => r.teamId)
      .filter((id) => id !== po.div2.championId);
    const d2Top3Challengers = d2SortedIds.slice(0, 3);
    po.div2.runnerUpAndPlayoffIds = d2Top3Challengers;

    po.liguilla1v2 = po.div1.liguillaZoneIds.map((d1Id, i) => {
      const d2Id = d2Top3Challengers[2 - i];
      if (!d1Id || !d2Id) return null;
      return runTie({
        id: `LIG_1V2_${i + 1}`,
        roundLabel: 'Liguilla Ascenso 1ª/2ª',
        homeId: d1Id,
        awayId: d2Id,
        homeName: byId.get(d1Id)?.name,
        awayName: byId.get(d2Id)?.name,
        played: false,
      });
    }).filter(Boolean);

    po.liguilla2v3 = po.liguilla2v3.map(runTie);
  }

  return state;
}

// =========================================================================
// 4. INICIO DE CARRERA DT (EQUIPO EXISTENTE O CREADO DESDE 0)
// =========================================================================

export function createCustomClubFromScratch({
  name,
  code,
  career,
  faculty = 'Universidad de La Frontera',
  escudo = '',
  color,
  formation = '1-2-3-1',
  conf = 'A',
}, rng = Math.random) {
  const clubId = `CUSTOM_${(code || 'DT').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}_${Math.floor(100 + rng() * 899)}`;
  const resolvedColor = color || getTeamColorByFaculty(faculty, career);
  const club = {
    id: clubId,
    code: clubId,
    name: String(name || 'Nuevo Club UFRO').trim(),
    career: String(career || CARRERAS_UFRO[0]).trim(),
    faculty,
    facultyKey: 'CUSTOM',
    color: resolvedColor,
    division: 3, // Siempre inicia desde Tercera División
    conf: conf === 'B' ? 'B' : 'A',
    baseOvr: 60,
    achievements: 'Club fundado desde cero en 3ª División',
    escudo: String(escudo || '').trim(),
    derby: '',
    formation: FORMATIONS_F7[formation] ? formation : '1-2-3-1',
    isUserClub: true,
    players: [],
    starterIds: [],
    benchIds: [],
  };
  club.budgetEur = calculateInitialClubBudget(club);
  club.players = generateSeedSquadForTeam(club, rng, clubId);
  const posBuckets = {
    ARQ: club.players.filter((p) => p.position === 'ARQ'),
    DEF: club.players.filter((p) => p.position === 'DEF'),
    MED: club.players.filter((p) => p.position === 'MED'),
    DEL: club.players.filter((p) => p.position === 'DEL'),
  };
  const starters = [
    posBuckets.ARQ[0],
    ...posBuckets.DEF.slice(0, 2),
    ...posBuckets.MED.slice(0, 3),
    posBuckets.DEL[0],
  ].filter(Boolean);
  club.starterIds = starters.map((p) => p.id);
  const sSet = new Set(club.starterIds);
  club.benchIds = club.players.filter((p) => !sSet.has(p.id)).map((p) => p.id);
  return club;
}

export function initializeDtCareerState({
  database,
  dtName = 'DT Universitario',
  selectedTeamId = null,
  customClubInput = null,
  rng = Math.random,
}) {
  const clonedTeams = database.teams.map((t) => ({
    ...t,
    isUserClub: false,
    players: (t.players || []).map((p) => sanitizePlayerPublic(p)),
    starterIds: [...(t.starterIds || [])],
    benchIds: [...(t.benchIds || [])],
  }));

  let userTeam = null;
  if (customClubInput) {
    const created = createCustomClubFromScratch(customClubInput, rng);
    // Reemplazar al último equipo de esa conferencia en 3ª División para mantener exactos 21+21 equipos
    const conf = created.conf;
    let replaceIdx = -1;
    for (let i = clonedTeams.length - 1; i >= 0; i -= 1) {
      if (clonedTeams[i].division === 3 && clonedTeams[i].conf === conf) {
        replaceIdx = i;
        break;
      }
    }
    if (replaceIdx !== -1) {
      clonedTeams.splice(replaceIdx, 1, created);
    } else {
      clonedTeams.push(created);
    }
    userTeam = created;
  } else {
    userTeam = clonedTeams.find((t) => t.id === selectedTeamId) || clonedTeams[0];
    userTeam.isUserClub = true;
  }

  const freeAgents = (database.freeAgents || []).map((p) => sanitizePlayerPublic(p));
  const calendar = generateSeasonCalendar(clonedTeams);
  const standings = {
    div1: createStandingsTable(clonedTeams.filter((t) => t.division === 1)),
    div2: createStandingsTable(clonedTeams.filter((t) => t.division === 2)),
    div3A: createStandingsTable(clonedTeams.filter((t) => t.division === 3 && t.conf === 'A')),
    div3B: createStandingsTable(clonedTeams.filter((t) => t.division === 3 && t.conf === 'B')),
  };

  const timeline = buildLinearTimeline(userTeam, clonedTeams, calendar, 1);

  const news = generateSeedNewsFeed(userTeam, clonedTeams, 1, rng);

  const careerState = {
    version: 2,
    dtName: String(dtName || 'DT Universitario').trim(),
    userTeamId: userTeam.id,
    season: 1,
    semester: 1,
    timelineIndex: 0,
    marketOpen: true,
    seasonCompleted: false,
    seasonAchievementsRecorded: false,
    sourceMeta: {
      source: database.source,
      sheetUrl: database.sheetUrl,
      sheetError: database.sheetError || '',
    },
    carrerasUfro: [...(database.carrerasUfro || CARRERAS_UFRO)],
    teams: clonedTeams,
    freeAgents,
    calendar,
    standings,
    timeline,
    postseason: null,
    activeDecision: null,
    pendingLiveMatch: null,
    pendingIncomingTransfers: [],
    activeSponsors: [],
    sponsorSession: null,
    careerAchievements: [],
    careerStats: {
      seasonsPlayed: 0,
      totalMatches: 0,
      totalWins: 0,
      derbyWins: 0,
      titlesDiv1: 0,
      titlesDiv2: 0,
      titlesDiv3: 0,
      promotions: 0,
      runnerUps: 0,
    },
    news,
    careerHistory: [],
  };
  careerState.sponsorSession = generatePreseasonSponsorOffers(careerState, rng);
  return careerState;
}

// =========================================================================
// 5. NOTICIAS FICTICIAS Y EVENTOS INTERACTIVOS DE DT
// =========================================================================

function pickFrom(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateSeedNewsFeed(userTeam, teams, season = 1, rng = Math.random) {
  const rivals = teams.filter((t) => t.division === userTeam.division && t.id !== userTeam.id);
  const r1 = rivals[0] || userTeam;
  const r2 = rivals[1] || userTeam;
  const star = [...(userTeam.players || [])].sort((a, b) => b.ovr - a.ovr)[0];

  return [
    {
      id: `news_init_1_${season}`,
      dateLabel: '02 Mar',
      category: 'DT',
      headline: `${userTeam.name} oficializa a su nuevo DT para la Temporada ${season}`,
      body: `La directiva de ${userTeam.career} apuesta fuerte con presupuesto de ${formatClp(userTeam.budgetEur)} CLP y busca protagonismo en ${userTeam.division}ª División.`,
    },
    {
      id: `news_init_2_${season}`,
      dateLabel: '09 Mar',
      category: 'MERCADO',
      headline: `Rumores en el campus: ${r1.name} sondea refuerzos de última hora`,
      body: `Varios agentes libres de distintas carreras están siendo observados antes del cierre de listas de la 1ª Rueda.`,
    },
    {
      id: `news_init_3_${season}`,
      dateLabel: '09 Mar',
      category: 'FIGURA',
      headline: `${star?.name || 'El referente'} lidera las prácticas de ${userTeam.name} (OVR ${star?.ovr || 70})`,
      body: `En ${r2.name} ya analizan cómo frenar su juego asociado en Fútbol 7.`,
    },
  ];
}

export function generateRoundNewsAndAiTransfers(state, roundNum, rng = Math.random) {
  const userTeam = state.teams.find((t) => t.id === state.userTeamId);
  const newItems = [];
  const sameDiv = state.teams.filter((t) => t.division === userTeam.division && t.id !== userTeam.id);
  if (sameDiv.length >= 2) {
    const a = pickFrom(sameDiv, rng);
    const b = pickFrom(sameDiv.filter((x) => x.id !== a.id), rng) || a;
    const starA = [...(a.players || [])].sort((x, y) => y.ovr - x.ovr)[0];
    if (rng() < 0.55) {
      newItems.push({
        id: `news_r${roundNum}_mvp_${Date.now()}_${Math.floor(rng() * 999)}`,
        dateLabel: SEASON_ROUND_DATES[roundNum - 1] || `Fecha ${roundNum}`,
        category: 'MVP',
        headline: `${starA?.name || 'Figura'} elegido MVP de la Fecha ${roundNum} tras brillar en ${a.name}`,
        body: `Su actuación dejó hablando a todo el Complejo Andrés Bello; ${b.name} ya sigue su pista para el próximo mercado.`,
      });
    } else {
      newItems.push({
        id: `news_r${roundNum}_rumor_${Date.now()}_${Math.floor(rng() * 999)}`,
        dateLabel: SEASON_ROUND_DATES[roundNum - 1] || `Fecha ${roundNum}`,
        category: 'FICHAJES',
        headline: `Movimiento en los pastos: ${a.name} y ${b.name} preguntan por agentes libres`,
        body: `Con la tabla apretada, los DTs buscan subir el promedio OVR sin descuidar la química de carrera.`,
      });
    }
  }

  // Pequeña probabilidad de fichaje IA real entre club y agente libre cuando mercado está abierto
  if (state.marketOpen && state.freeAgents.length > 0 && rng() < 0.45 && sameDiv.length > 0) {
    const buyer = pickFrom(sameDiv, rng);
    const targetIdx = Math.floor(rng() * state.freeAgents.length);
    const fa = state.freeAgents[targetIdx];
    if (fa && buyer.budgetEur >= fa.marketValueEur && buyer.players.length < 18) {
      state.freeAgents.splice(targetIdx, 1);
      fa.teamId = buyer.id;
      fa.contractSemesters = 3;
      fa.careerMatchValid = validateTeamCareerMatch(fa.studiedCareer, buyer.career);
      buyer.players.push(fa);
      buyer.benchIds.push(fa.id);
      buyer.budgetEur -= fa.marketValueEur;
      newItems.push({
        id: `news_ai_sign_${roundNum}_${fa.id}`,
        dateLabel: SEASON_ROUND_DATES[roundNum - 1] || `Fecha ${roundNum}`,
        category: 'FICHAJE OFICIAL',
        headline: `¡Oficial! ${fa.name} (${fa.ovr} OVR) ficha por ${buyer.name}`,
        body: `El jugador proveniente de ${fa.studiedCareer} acordó contrato por 3 semestres por ${formatEuro(fa.marketValueEur)}.`,
      });
    }
  }

  state.news = [...newItems, ...(state.news || [])].slice(0, 28);
}

export function buildInteractiveDtDecision(state, eventObj, rng = Math.random) {
  const userTeam = state.teams.find((t) => t.id === state.userTeamId);
  const unhappy = (userTeam.players || []).filter((p) => p.morale < 58);
  const bestTransferListed = (userTeam.players || []).find((p) => p.transferListed) || [...(userTeam.players || [])].sort((a, b) => b.ovr - a.ovr)[1];

  if (unhappy.length > 0) {
    const p = unhappy[0];
    return {
      id: `dec_${eventObj.id}`,
      dateLabel: eventObj.dateLabel,
      category: 'ÁNIMO DE PLANTEL',
      title: `${p.name} (${p.position} · ${p.ovr} OVR) pide una reunión urgente`,
      desc: `Su estado de ánimo cayó a ${p.morale}/100 por pocos minutos y evalúa pedir su salida de ${userTeam.name}. ¿Cómo respondes como DT?`,
      options: [
        {
          id: 'PROMISE_MINUTES',
          label: 'Prometerle protagonismo y charla privada (+16 Ánimo · -$10.000 CLP)',
          costEur: 10000,
        },
        {
          id: 'LIST_PLAYER',
          label: 'Aceptar su salida y ponerlo en lista de transferibles',
          costEur: 0,
        },
      ],
      playerId: p.id,
    };
  }

  if (rng() < 0.5 && bestTransferListed && state.teams.length > 5) {
    const bidder = state.teams.find((t) => t.id !== userTeam.id && t.budgetEur >= bestTransferListed.marketValueEur) || state.teams[0];
    const offerAmount = Math.round((bestTransferListed.marketValueEur * (1.08 + rng() * 0.16)) / 1000) * 1000;
    return {
      id: `dec_${eventObj.id}`,
      dateLabel: eventObj.dateLabel,
      category: 'OFERTA DE FICHAJE',
      title: `${bidder.name} presenta oferta por ${bestTransferListed.name}`,
      desc: `Ofrecen ${formatClp(offerAmount)} CLP por su pase (valor actual ${formatClp(bestTransferListed.marketValueEur)}, OVR ${bestTransferListed.ovr}).`,
      options: [
        {
          id: 'ACCEPT_OFFER',
          label: `Vender por ${formatClp(offerAmount)} CLP y sumar caja`,
          amountEur: offerAmount,
        },
        {
          id: 'REJECT_OFFER',
          label: 'Rechazar oferta y declararlo intransferible (+5 Ánimo)',
          amountEur: 0,
        },
      ],
      playerId: bestTransferListed.id,
      bidderTeamId: bidder.id,
      offerAmount,
    };
  }

  return {
    id: `dec_${eventObj.id}`,
    dateLabel: eventObj.dateLabel,
    category: 'GESTIÓN INSTITUCIONAL',
    title: 'Propuesta del Centro de Alumnos y Cuerpo Técnico',
    desc: `Tienes presupuesto disponible (${formatClp(userTeam.budgetEur)} CLP) para elegir la prioridad de ${userTeam.name} este tramo.`,
    options: [
      {
        id: 'SPONSOR_EVENT',
        label: 'Organizar clínica F7 con egresados (+$35.000 CLP presupuesto)',
      },
      {
        id: 'MORALE_CAMP',
        label: 'Asado de camaradería del plantel (-$15.000 CLP · +8 Ánimo a todo el equipo)',
      },
    ],
  };
}

export function resolveDtDecision(state, optionId) {
  const dec = state.activeDecision;
  if (!dec) return { ok: false, message: 'No hay decisión pendiente.' };
  const userTeam = state.teams.find((t) => t.id === state.userTeamId);

  let summary = '';
  if (dec.category === 'ÁNIMO DE PLANTEL' && dec.playerId) {
    const p = userTeam.players.find((x) => x.id === dec.playerId);
    if (p) {
      if (optionId === 'PROMISE_MINUTES') {
        userTeam.budgetEur = Math.max(0, userTeam.budgetEur - Math.min(10000, userTeam.budgetEur));
        p.morale = clamp(p.morale + 18, 15, 100);
        summary = `${p.name} agradeció tu respaldo y recuperó ganas de seguir en ${userTeam.name} (Ánimo ${p.morale}/100).`;
      } else {
        p.transferListed = true;
        p.morale = clamp(p.morale - 6, 15, 100);
        summary = `${p.name} quedó oficialmente en venta dentro del plantel.`;
      }
    }
  } else if (dec.category === 'OFERTA DE FICHAJE' && dec.playerId) {
    const pIdx = userTeam.players.findIndex((x) => x.id === dec.playerId);
    if (optionId === 'ACCEPT_OFFER' && pIdx !== -1 && userTeam.players.length > 9) {
      const [sold] = userTeam.players.splice(pIdx, 1);
      userTeam.starterIds = userTeam.starterIds.filter((id) => id !== sold.id);
      userTeam.benchIds = userTeam.benchIds.filter((id) => id !== sold.id);
      refillStarterSlotIfNeeded(userTeam);
      userTeam.budgetEur += dec.offerAmount;
      const buyer = state.teams.find((t) => t.id === dec.bidderTeamId);
      if (buyer) {
        sold.teamId = buyer.id;
        sold.transferListed = false;
        sold.seasonsAtClub = 1;
        sold.careerMatchValid = validateTeamCareerMatch(sold.studiedCareer, buyer.career);
        buyer.players.push(sold);
        buyer.benchIds.push(sold.id);
        buyer.budgetEur = Math.max(0, buyer.budgetEur - dec.offerAmount);
      }
      summary = `¡Traspaso cerrado! Vendiste a ${sold.name} a ${buyer?.name || 'otro club'} por ${formatClp(dec.offerAmount)} CLP.`;
    } else {
      const p = userTeam.players[pIdx];
      if (p) p.morale = clamp(p.morale + 5, 15, 100);
      summary = `Rechazaste la oferta por ${p?.name || 'tu jugador'} y sigue firme en el proyecto.`;
    }
  } else {
    if (optionId === 'SPONSOR_EVENT') {
      userTeam.budgetEur += 35000;
      summary = 'La clínica F7 fue un éxito: ingresaron $35.000 CLP al presupuesto de fichajes.';
    } else {
      const cost = Math.min(15000, userTeam.budgetEur);
      userTeam.budgetEur -= cost;
      userTeam.players.forEach((p) => {
        p.morale = clamp(p.morale + 8, 15, 100);
      });
      summary = '¡Gran ambiente en el camarín! Todo el plantel subió +8 en estado de ánimo.';
    }
  }

  state.news = [{
    id: `news_dec_${Date.now()}`,
    dateLabel: dec.dateLabel,
    category: dec.category,
    headline: dec.title,
    body: summary,
  }, ...(state.news || [])].slice(0, 28);

  state.activeDecision = null;
  return { ok: true, message: summary };
}

// =========================================================================
// 6. AVANCE LINEAL Y BOTONES DE SIMULACIÓN
// =========================================================================

function ensureCareerStats(state) {
  if (!state.careerStats) {
    state.careerStats = {
      seasonsPlayed: 0,
      totalMatches: 0,
      totalWins: 0,
      derbyWins: 0,
      titlesDiv1: 0,
      titlesDiv2: 0,
      titlesDiv3: 0,
      promotions: 0,
      runnerUps: 0,
    };
  }
  if (!Array.isArray(state.careerAchievements)) state.careerAchievements = [];
  if (!Array.isArray(state.pendingIncomingTransfers)) state.pendingIncomingTransfers = [];
  if (!Array.isArray(state.activeSponsors)) state.activeSponsors = [];
  return state.careerStats;
}

function recordUserMatchStats(state, home, away, hg, ag) {
  const stats = ensureCareerStats(state);
  const userTeam = state.teams.find((t) => t.id === state.userTeamId);
  if (!userTeam || (!home && !away)) return;
  const userIsHome = home?.id === userTeam.id;
  const userIsAway = away?.id === userTeam.id;
  if (!userIsHome && !userIsAway) return;

  stats.totalMatches += 1;
  const userWon = (userIsHome && hg > ag) || (userIsAway && ag > hg);
  if (userWon) {
    stats.totalWins += 1;
    const opp = userIsHome ? away : home;
    const isDerby = Boolean(opp && userTeam.derby && (userTeam.derby === opp.id || normalizeTextKey(userTeam.derby) === normalizeTextKey(opp.name)));
    if (isDerby) stats.derbyWins += 1;
  }
  advanceUserPositionTraining(state, new Set(userTeam.starterIds || []));
}

function commitFixtureResult(state, divKey, fixture, hg, ag, rng) {
  fixture.homeScore = hg;
  fixture.awayScore = ag;
  fixture.played = true;
  state.standings[divKey] = applyMatchToStandings(state.standings[divKey], fixture.homeId, fixture.awayId, hg, ag);

  // Actualizar participación básica de jugadores IA para mantener stats y ánimos vivos
  const home = state.teams.find((t) => t.id === fixture.homeId);
  const away = state.teams.find((t) => t.id === fixture.awayId);
  const bumpStats = (team, goals, conceded, won) => {
    if (!team) return;
    const starterSet = new Set(team.starterIds || []);
    (team.players || []).forEach((p) => {
      if (starterSet.has(p.id)) {
        p.stats.matches += 1;
        p.stats.ratingSum += won ? 7.3 : 6.2;
        if (conceded === 0 && p.position === 'ARQ') p.stats.cleanSheets += 1;
        p.morale = clamp(p.morale + (won ? 2 : -1), 15, 100);
      } else {
        p.morale = clamp(p.morale + (p.ovr >= 68 ? -3 : -1), 15, 100);
      }
    });
    if (goals > 0 && team.players.length > 0) {
      const scorerPool = team.players.filter((p) => starterSet.has(p.id) && p.position !== 'ARQ');
      if (scorerPool.length > 0) {
        for (let g = 0; g < goals; g += 1) {
          const sc = pickFrom(scorerPool, rng);
          sc.stats.goals += 1;
          sc.marketValueEur = calculatePlayerValueEur(sc);
        }
      }
    }
  };
  bumpStats(home, hg, ag, hg > ag);
  bumpStats(away, ag, hg, ag > hg);
  recordUserMatchStats(state, home, away, hg, ag);
}

function simulateAiMatchesForRound(state, roundNum, skipMatchId = null, rng = Math.random) {
  const byId = new Map(state.teams.map((t) => [t.id, t]));
  const divGroups = [
    ['div1', state.calendar.div1],
    ['div2', state.calendar.div2],
    ['div3A', state.calendar.div3A],
    ['div3B', state.calendar.div3B],
  ];
  for (const [divKey, rounds] of divGroups) {
    const r = rounds.find((x) => x.round === roundNum);
    if (!r) continue;
    for (const f of r.matches) {
      if (f.played || (skipMatchId && f.id === skipMatchId)) continue;
      const res = simulateMatchQuick(byId.get(f.homeId), byId.get(f.awayId), true, rng);
      commitFixtureResult(state, divKey, f, res.hg, res.ag, rng);
    }
  }
  generateRoundNewsAndAiTransfers(state, roundNum, rng);
}

export function getNextEvent(state) {
  return (state.timeline || [])[state.timelineIndex] || null;
}

export function getNextUserMatchInfo(state) {
  const ev = (state.timeline || []).slice(state.timelineIndex).find((e) => e.type === 'MATCHDAY' && e.hasUserMatch);
  if (ev) {
    const userTeam = state.teams.find((t) => t.id === state.userTeamId);
    const divRounds = userTeam.division === 1 ? state.calendar.div1 : userTeam.division === 2 ? state.calendar.div2 : (userTeam.conf === 'B' ? state.calendar.div3B : state.calendar.div3A);
    for (const r of divRounds) {
      const m = r.matches.find((x) => x.id === ev.userMatchId);
      if (m) {
        const oppId = m.homeId === userTeam.id ? m.awayId : m.homeId;
        const opp = state.teams.find((t) => t.id === oppId);
        return {
          event: ev,
          match: m,
          isHome: m.homeId === userTeam.id,
          opponent: opp,
          dateLabel: ev.dateLabel,
          round: r.round,
          isPostseason: false,
        };
      }
    }
  }
  // Check postseason if active
  if (state.postseason) {
    const poMatch = findUserPostseasonMatch(state);
    if (poMatch) {
      const oppId = poMatch.homeId === state.userTeamId ? poMatch.awayId : poMatch.homeId;
      return {
        match: poMatch,
        isHome: poMatch.homeId === state.userTeamId,
        opponent: state.teams.find((t) => t.id === oppId),
        dateLabel: 'Postemporada',
        round: poMatch.roundLabel,
        isPostseason: true,
      };
    }
  }
  return null;
}

export function findUserPostseasonMatch(state) {
  const po = state.postseason;
  if (!po) return null;
  const uid = state.userTeamId;
  const pools = [
    ...(po.div1?.r1 || []),
    ...(po.div1?.qf || []),
    ...(po.div1?.sf || []),
    ...(po.div1?.final || []),
    ...(po.div2?.r1 || []),
    ...(po.div2?.r2 || []),
    ...(po.div2?.qf || []),
    ...(po.div2?.sf || []),
    ...(po.div2?.final || []),
    ...(po.liguilla1v2 || []),
    ...(po.liguilla2v3 || []),
  ];
  for (const r of po.div3?.rounds || []) {
    pools.push(...r.matches);
  }
  return pools.find((m) => !m.played && (m.homeId === uid || m.awayId === uid)) || null;
}

export function advanceSimulationStep(state, mode = 'next_event', rng = Math.random) {
  // mode: 'next_event' | 'next_match' | 'mid_or_end'
  if (state.activeDecision) {
    return { status: 'DECISION_PENDING', message: 'Responde primero la decisión abierta del club.' };
  }
  if (state.pendingLiveMatch) {
    return { status: 'MATCH_READY', liveMatch: state.pendingLiveMatch };
  }
  if (state.seasonCompleted) {
    return { status: 'SEASON_ENDED', message: 'La temporada concluyó. Inicia la siguiente temporada.' };
  }

  const targetSemester = state.semester;
  let guard = 0;

  while (state.timelineIndex < state.timeline.length && guard < 40) {
    guard += 1;
    const ev = state.timeline[state.timelineIndex];
    state.semester = ev.semester || state.semester;

    if (ev.type === 'PRE_SEASON_SPONSORS') {
      if (!state.sponsorSession) {
        state.sponsorSession = generatePreseasonSponsorOffers(state, rng);
      }
      state.marketOpen = true;
      ev.done = true;
      state.timelineIndex += 1;
      if (mode === 'next_event') {
        return { status: 'EVENT_STOP', event: ev, message: ev.title };
      }
      continue;
    }

    if (ev.type === 'MARKET_OPEN') {
      state.marketOpen = true;
      ev.done = true;
      state.timelineIndex += 1;
      processPendingIncomingTransfers(state, 'Pretemporada');
      if (mode === 'next_event') {
        return { status: 'EVENT_STOP', event: ev, message: ev.title };
      }
      continue;
    }

    if (ev.type === 'MARKET_CLOSE') {
      state.marketOpen = false;
      ev.done = true;
      state.timelineIndex += 1;
      state.news = [{
        id: `news_mclose_${ev.id}`,
        dateLabel: ev.dateLabel,
        category: 'MERCADO',
        headline: ev.title,
        body: ev.desc,
      }, ...(state.news || [])].slice(0, 28);
      if (mode === 'next_event') {
        return { status: 'EVENT_STOP', event: ev, message: ev.title };
      }
      continue;
    }

    if (ev.type === 'MIDSEASON_BREAK') {
      state.semester = 2;
      state.marketOpen = true;
      // Reducir contratos en 1 semestre al completar el Semestre 1
      state.teams.forEach((t) => {
        t.players.forEach((p) => {
          p.contractSemesters = Math.max(0, (p.contractSemesters || 1) - 1);
        });
      });
      processPendingIncomingTransfers(state, 'Mitad de Temporada');
      processSponsorInstallments(state, 'SEMESTRAL', ev.dateLabel);
      processSponsorInstallments(state, 'MENSUAL', ev.dateLabel);
      ev.done = true;
      state.timelineIndex += 1;
      state.news = [{
        id: `news_mid_${state.season}`,
        dateLabel: ev.dateLabel,
        category: 'TEMPORADA',
        headline: `Mitad de Temporada ${state.season}: se abre el mercado de invierno`,
        body: 'Los clubes ajustan sus planteles de cara al segundo semestre.',
      }, ...(state.news || [])].slice(0, 28);

      if (mode === 'next_event' || (mode === 'mid_or_end' && targetSemester === 1)) {
        return { status: 'MIDSEASON_REACHED', event: ev, message: 'Llegaste a mitad de temporada.' };
      }
      continue;
    }

    if (ev.type === 'DT_DECISION') {
      ev.done = true;
      state.timelineIndex += 1;
      if (mode === 'next_event') {
        state.activeDecision = buildInteractiveDtDecision(state, ev, rng);
        return { status: 'DECISION_PENDING', event: ev, decision: state.activeDecision };
      }
      continue;
    }

    if (ev.type === 'MATCHDAY') {
      if ([2, 4, 8, 10].includes(ev.round)) {
        processSponsorInstallments(state, 'MENSUAL', ev.dateLabel);
      }
      if (ev.hasUserMatch && (mode === 'next_event' || mode === 'next_match')) {
        // Prepara partido en vivo para el DT
        const userTeam = state.teams.find((t) => t.id === state.userTeamId);
        const divRounds = userTeam.division === 1 ? state.calendar.div1 : userTeam.division === 2 ? state.calendar.div2 : (userTeam.conf === 'B' ? state.calendar.div3B : state.calendar.div3A);
        const roundObj = divRounds.find((r) => r.round === ev.round);
        const fixture = roundObj?.matches.find((m) => m.id === ev.userMatchId);
        if (fixture && !fixture.played) {
          const home = state.teams.find((t) => t.id === fixture.homeId);
          const away = state.teams.find((t) => t.id === fixture.awayId);
          const timeline = generateLiveMatchTimeline({
            matchId: fixture.id,
            homeTeam: home,
            awayTeam: away,
            label: `Fecha ${ev.round} · ${userTeam.division}ª División`,
            allowDraw: true,
            rng,
          });
          state.pendingLiveMatch = {
            eventId: ev.id,
            round: ev.round,
            matchId: fixture.id,
            homeId: home.id,
            awayId: away.id,
            label: timeline.label,
            allowDraw: true,
            isPostseason: false,
            timeline,
          };
          return { status: 'MATCH_READY', event: ev, liveMatch: state.pendingLiveMatch };
        }
      }
      // Simular toda la fecha (incluido usuario si está en avance masivo mid_or_end)
      simulateAiMatchesForRound(state, ev.round, null, rng);
      ev.done = true;
      state.timelineIndex += 1;
      if (mode === 'next_event' && !ev.hasUserMatch) {
        return { status: 'EVENT_STOP', event: ev, message: `Fecha ${ev.round}: jornada libre para tu club.` };
      }
      continue;
    }

    if (ev.type === 'POSTSEASON_PHASE') {
      if (ev.phase === 'INIT') {
        state.postseason = initializePostseasonStructure(state, rng);
        ev.done = true;
        state.timelineIndex += 1;
        state.news = [{
          id: `news_po_init_${state.season}`,
          dateLabel: ev.dateLabel,
          category: 'PLAYOFFS',
          headline: `¡Definida la Postemporada ${state.season}!`,
          body: 'Arrancan 1ª Ronda de 1ª y 2ª División y la Liguilla todos contra todos de 3ª División.',
        }, ...(state.news || [])].slice(0, 28);
        if (mode === 'next_event') {
          return { status: 'EVENT_STOP', event: ev, message: ev.title };
        }
        continue;
      }

      advancePostseasonPhase(state, ev.phase, rng);
      ev.done = true;
      state.timelineIndex += 1;

      if (ev.phase === 'FINAL') {
        state.seasonCompleted = true;
        state.marketOpen = true;
        processPendingIncomingTransfers(state, 'Postemporada');
        recordSeasonAchievementsAndStats(state);
        const d1Champ = state.teams.find((t) => t.id === state.postseason?.div1?.championId);
        const d2Champ = state.teams.find((t) => t.id === state.postseason?.div2?.championId);
        const d3Champ = state.teams.find((t) => t.id === state.postseason?.div3?.championId);
        state.news = [{
          id: `news_champs_${state.season}`,
          dateLabel: ev.dateLabel,
          category: 'CAMPEONES',
          headline: `Campeones Temp. ${state.season}: ${d1Champ?.name || '1ª'}, ${d2Champ?.name || '2ª'} y ${d3Champ?.name || '3ª'}`,
          body: 'Se cerraron los Playoffs y Liguillas de Ascenso Intercarreras. Se abre la ventana de postemporada.',
        }, ...(state.news || [])].slice(0, 28);
        return { status: 'SEASON_ENDED', event: ev, message: '¡Finalizó la temporada completa!' };
      }

      if (mode === 'next_event' || mode === 'next_match') {
        return { status: 'EVENT_STOP', event: ev, message: ev.title };
      }
    }
  }

  state.seasonCompleted = true;
  state.marketOpen = true;
  processPendingIncomingTransfers(state, 'Postemporada');
  recordSeasonAchievementsAndStats(state);
  return { status: 'SEASON_ENDED', message: 'Temporada completada.' };
}

export function commitCompletedLiveMatch(state, finalHomeScore, finalAwayScore, timelineEvents = [], penWinner = null, rng = Math.random) {
  const pm = state.pendingLiveMatch;
  if (!pm) return { ok: false };

  const userTeam = state.teams.find((t) => t.id === state.userTeamId);
  const divKey = userTeam.division === 1 ? 'div1' : userTeam.division === 2 ? 'div2' : (userTeam.conf === 'B' ? 'div3B' : 'div3A');
  const roundObj = state.calendar[divKey]?.find((r) => r.round === pm.round);
  const fixture = roundObj?.matches.find((m) => m.id === pm.matchId);

  if (fixture) {
    commitFixtureResult(state, divKey, fixture, finalHomeScore, finalAwayScore, rng);
  }
  // Simular el resto de partidos de esa misma fecha
  simulateAiMatchesForRound(state, pm.round, pm.matchId, rng);

  // Aplicar goles, asistencias y ánimo detallado al partido jugado en vivo
  const home = state.teams.find((t) => t.id === pm.homeId);
  const away = state.teams.find((t) => t.id === pm.awayId);
  const scoreMap = new Map();
  const assistMap = new Map();
  for (const ev of timelineEvents || []) {
    if (ev.type === 'GOAL') {
      if (ev.scorerId) scoreMap.set(ev.scorerId, (scoreMap.get(ev.scorerId) || 0) + 1);
      if (ev.assisterId) assistMap.set(ev.assisterId, (assistMap.get(ev.assisterId) || 0) + 1);
    }
  }
  for (const club of [home, away].filter(Boolean)) {
    for (const p of club.players || []) {
      const g = scoreMap.get(p.id) || 0;
      const a = assistMap.get(p.id) || 0;
      if (g > 0) p.stats.goals += g;
      if (a > 0) p.stats.assists += a;
      if (g > 0 || a > 0) p.morale = clamp(p.morale + 3, 15, 100);
      p.marketValueEur = calculatePlayerValueEur(p);
    }
  }

  // Premio económico por recaudación/resultado al usuario
  const userGoals = pm.homeId === userTeam.id ? finalHomeScore : finalAwayScore;
  const oppGoals = pm.homeId === userTeam.id ? finalAwayScore : finalHomeScore;
  const matchBonus = userGoals > oppGoals ? 22000 : userGoals === oppGoals ? 10000 : 4000;
  userTeam.budgetEur += matchBonus;

  // Marcar evento de calendario completado
  const evObj = state.timeline.find((e) => e.id === pm.eventId);
  if (evObj) evObj.done = true;
  if (state.timeline[state.timelineIndex]?.id === pm.eventId) {
    state.timelineIndex += 1;
  }

  state.news = [{
    id: `news_live_${pm.matchId}`,
    dateLabel: evObj?.dateLabel || `Fecha ${pm.round}`,
    category: 'RESULTADO',
    headline: `${home?.name || 'Local'} ${finalHomeScore}-${finalAwayScore} ${away?.name || 'Visita'}`,
    body: `${userTeam.name} sumó ${formatEuro(matchBonus)} en premios de jornada.`,
  }, ...(state.news || [])].slice(0, 28);

  state.pendingLiveMatch = null;
  return { ok: true, matchBonus, penWinner };
}

// =========================================================================
// 7. GESTIÓN DE TÁCTICA, PLANTILLA Y MERCADO (SIN POTENCIAL EXPUESTO)
// =========================================================================

function refillStarterSlotIfNeeded(club) {
  if (club.starterIds.length >= 7) return;
  while (club.starterIds.length < 7 && club.benchIds.length > 0) {
    const nextId = club.benchIds.shift();
    club.starterIds.push(nextId);
  }
}

export function setClubFormation(club, formationKey) {
  if (!FORMATIONS_F7[formationKey]) return { ok: false, message: 'Formación F7 inválida.' };
  club.formation = formationKey;
  return { ok: true, formation: formationKey };
}

export function swapStarterAndBench(club, starterId, benchId) {
  const sIdx = club.starterIds.indexOf(starterId);
  const bIdx = club.benchIds.indexOf(benchId);
  if (sIdx === -1 || bIdx === -1) {
    return { ok: false, message: 'Selecciona un titular y un suplente válidos.' };
  }
  const starterP = club.players.find((p) => p.id === starterId);
  const benchP = club.players.find((p) => p.id === benchId);
  if (!starterP || !benchP) return { ok: false, message: 'Jugador no encontrado.' };

  const newStarters = [...club.starterIds];
  newStarters[sIdx] = benchId;
  const hasArq = newStarters.some((id) => {
    const pl = club.players.find((p) => p.id === id);
    return pl && (pl.position === 'ARQ' || Number(pl.secondaryPositions?.ARQ || 0) >= 60);
  });
  if (!hasArq) {
    return { ok: false, message: 'Debe haber al menos 1 Arquero (natural o con ≥60% de adaptación ARQ) en cancha.' };
  }

  club.starterIds = newStarters;
  const newBench = [...club.benchIds];
  newBench[bIdx] = starterId;
  club.benchIds = newBench;
  return { ok: true, message: `${benchP.name} entra por ${starterP.name}.` };
}

export function startPlayerPositionTraining(club, playerId, targetPos) {
  if (!club || !POSITIONS.includes(targetPos)) {
    return { ok: false, message: 'Posición destino inválida.' };
  }
  const player = club.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, message: 'Jugador no encontrado.' };
  if (player.position === targetPos) {
    return { ok: false, message: `${player.name} ya tiene ${targetPos} como posición principal.` };
  }
  if (!player.secondaryPositions || typeof player.secondaryPositions !== 'object') {
    player.secondaryPositions = {};
  }
  if (typeof player.secondaryPositions[targetPos] !== 'number') {
    player.secondaryPositions[targetPos] = 25;
  }
  player.trainingTargetPos = targetPos;
  return {
    ok: true,
    player,
    message: `${player.name} comenzó entrenamiento en ${targetPos} (adaptación ${player.secondaryPositions[targetPos]}%, OVR efectivo ${getPlayerEffectiveOvr(player, targetPos)}).`,
  };
}

export function cancelPlayerPositionTraining(club, playerId) {
  const player = club?.players?.find((p) => p.id === playerId);
  if (!player) return { ok: false, message: 'Jugador no encontrado.' };
  player.trainingTargetPos = null;
  return { ok: true, message: `Entrenamiento posicional de ${player.name} pausado.` };
}

export function promoteSecondaryToPrimaryPosition(club, playerId, newPrimaryPos) {
  if (!club || !POSITIONS.includes(newPrimaryPos)) {
    return { ok: false, message: 'Posición inválida.' };
  }
  const player = club.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, message: 'Jugador no encontrado.' };
  if (player.position === newPrimaryPos) {
    return { ok: false, message: `${player.name} ya es ${newPrimaryPos} principal.` };
  }
  const pct = Number(player.secondaryPositions?.[newPrimaryPos] || 0);
  if (pct < 85) {
    return { ok: false, message: `${player.name} necesita al menos 85% de adaptación en ${newPrimaryPos} (actual ${pct}%).` };
  }
  const oldPrimary = player.position;
  player.secondaryPositions = { ...(player.secondaryPositions || {}), [oldPrimary]: 100 };
  delete player.secondaryPositions[newPrimaryPos];
  player.position = newPrimaryPos;
  if (player.trainingTargetPos === newPrimaryPos) {
    player.trainingTargetPos = null;
  }
  return {
    ok: true,
    message: `¡Reconversión completada! ${player.name} pasó a ser ${newPrimaryPos} principal (conserva ${oldPrimary} al 100%).`,
  };
}

export function advanceUserPositionTraining(state, starterSet = null) {
  const userClub = state?.teams?.find((t) => t.id === state.userTeamId);
  if (!userClub) return [];
  const starters = starterSet || new Set(userClub.starterIds || []);
  const completed = [];

  for (const p of userClub.players || []) {
    if (!p.trainingTargetPos || p.trainingTargetPos === p.position) continue;
    const pos = p.trainingTargetPos;
    if (!p.secondaryPositions) p.secondaryPositions = {};
    const cur = typeof p.secondaryPositions[pos] === 'number' ? p.secondaryPositions[pos] : 25;
    const gain = starters.has(p.id) ? 15 : 8;
    const next = clamp(cur + gain, 0, 100);
    p.secondaryPositions[pos] = next;
    if (next >= 100) {
      p.trainingTargetPos = null;
      completed.push({ playerId: p.id, playerName: p.name, pos });
    }
  }

  if (completed.length > 0) {
    state.news = [
      ...completed.map((c, i) => ({
        id: `news_pos_${c.playerId}_${Date.now()}_${i}`,
        dateLabel: getNextEvent(state)?.dateLabel || 'Entrenamiento',
        category: 'TÁCTICA',
        headline: `${c.playerName} dominó la posición de ${c.pos} (100%)`,
        body: `Ya rinde sin penalización de OVR en ${c.pos} y puede ser promovido a posición principal.`,
      })),
      ...(state.news || []),
    ].slice(0, 28);
  }
  return completed;
}

export function toggleTransferListPlayer(club, playerId) {
  const p = club.players.find((x) => x.id === playerId);
  if (!p) return { ok: false, message: 'Jugador no encontrado.' };
  p.transferListed = !p.transferListed;
  return {
    ok: true,
    transferListed: p.transferListed,
    message: p.transferListed ? `${p.name} puesto en lista de venta.` : `${p.name} retirado del mercado.`,
  };
}

export function setPlayerJerseyNumber(club, playerId, jerseyNumber) {
  const num = Math.floor(Number(jerseyNumber));
  if (!Number.isFinite(num) || num < 1 || num > 99) {
    return { ok: false, message: 'El dorsal debe estar entre 1 y 99.' };
  }
  const player = club.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, message: 'Jugador no encontrado.' };

  const prev = player.jerseyNumber;
  const occupant = club.players.find((p) => p.id !== playerId && p.jerseyNumber === num);
  if (occupant) {
    occupant.jerseyNumber = prev;
  }
  player.jerseyNumber = num;
  return {
    ok: true,
    message: occupant
      ? `Dorsal #${num} asignado a ${player.name} (intercambiado con ${occupant.name}).`
      : `Dorsal #${num} asignado a ${player.name}.`,
  };
}

export function terminatePlayerContract(state, playerId) {
  const club = state.teams.find((t) => t.id === state.userTeamId);
  if (!club) return { ok: false, message: 'Club no encontrado.' };
  if (club.players.length <= 9) {
    return { ok: false, message: 'Mínimo 9 jugadores requeridos en plantilla para competir en F7.' };
  }
  const idx = club.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return { ok: false, message: 'Jugador no encontrado en tu plantel.' };

  const target = club.players[idx];
  const isOnlyArq = target.position === 'ARQ' && club.players.filter((p) => p.position === 'ARQ').length <= 1;
  if (isOnlyArq) {
    return { ok: false, message: 'No puedes rescindir al único arquero del plantel.' };
  }

  const severance = Math.min(club.budgetEur, Math.round((target.marketValueEur * 0.15) / 1000) * 1000);
  club.budgetEur -= severance;
  club.players.splice(idx, 1);
  club.starterIds = club.starterIds.filter((id) => id !== target.id);
  club.benchIds = club.benchIds.filter((id) => id !== target.id);
  refillStarterSlotIfNeeded(club);

  target.teamId = 'FREE_AGENT';
  target.transferListed = false;
  target.contractSemesters = 0;
  target.seasonsAtClub = 0;
  target.careerMatchValid = false;
  target.morale = 70;
  state.freeAgents.unshift(sanitizePlayerPublic(target));

  return {
    ok: true,
    severance,
    message: `Contrato de ${target.name} rescindido (indemnización ${formatClp(severance)} CLP). Pasó a Agentes Libres.`,
  };
}

export function renewPlayerContract(state, playerId) {
  const club = state.teams.find((t) => t.id === state.userTeamId);
  const player = club?.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, message: 'Jugador no encontrado.' };
  if (player.morale < 42) {
    return { ok: false, message: `${player.name} está muy descontento (${player.morale}/100) y rechaza renovar ahora.` };
  }
  const renewalFee = Math.round((player.marketValueEur * 0.12) / 1000) * 1000;
  if (club.budgetEur < renewalFee) {
    return { ok: false, message: `Presupuesto insuficiente (requiere ${formatClp(renewalFee)} CLP).` };
  }
  club.budgetEur -= renewalFee;
  player.contractSemesters = (player.contractSemesters || 1) + 2;
  player.morale = clamp(player.morale + 10, 15, 100);
  return {
    ok: true,
    message: `Contrato de ${player.name} renovado (+2 semestres) por ${formatClp(renewalFee)} CLP.`,
  };
}

// =========================================================================
// 7B. ACUERDOS COMERCIALES / PATROCINIOS (MARCAS Y DIRECCIÓN DE CARRERA)
// =========================================================================

export function getSquadCareerMatchRatio(team) {
  const players = team?.players || [];
  if (players.length === 0) return 0.7;
  const matched = players.filter((p) => Boolean(p.careerMatchValid)).length;
  return matched / players.length;
}

export function generatePreseasonSponsorOffers(state, rng = Math.random) {
  const userTeam = state?.teams?.find((t) => t.id === state.userTeamId);
  if (!userTeam) return { season: state?.season || 1, proposalsLeft: 3, maxProposals: 3, offers: [] };

  const stats = ensureCareerStats(state);
  const avgOvr = getTeamAverageOvr(userTeam);
  const div = Number(userTeam.division) || 3;
  const careerRatio = getSquadCareerMatchRatio(userTeam);
  const winRate = stats.totalMatches > 0 ? (stats.totalWins / stats.totalMatches) : 0.5;
  const trophyBonus = (stats.titlesDiv1 * 18 + stats.titlesDiv2 * 12 + stats.titlesDiv3 * 8 + stats.promotions * 8);

  const scale = div === 1 ? 1.55 : div === 2 ? 1.12 : 0.78;
  const perfBoost = clamp((avgOvr - 62) * 1.4 + (winRate - 0.45) * 35 + trophyBonus, -12, 34);

  const catalog = [
    {
      code: 'DIR_CARRERA',
      sponsorName: `Dirección de Carrera · ${userTeam.career}`,
      kind: 'DIRECCION_CARRERA',
      frequency: 'SEMESTRAL',
      baseInstallment: Math.round((52000 * scale + careerRatio * 18000) / 1000) * 1000,
      installmentsTotal: 2,
      baseChance: 58 + (careerRatio * 24) + (perfBoost * 0.45),
      requirementLabel: `Valora identidad (${Math.round(careerRatio * 100)}% alumnos de la carrera)`,
    },
    {
      code: 'FACULTAD_CEE',
      sponsorName: `Centro de Estudiantes y Facultad ${userTeam.facultyKey || 'UFRO'}`,
      kind: 'DIRECCION_CARRERA',
      frequency: 'MENSUAL',
      baseInstallment: Math.round((16500 * scale + (avgOvr - 58) * 350) / 500) * 500,
      installmentsTotal: 6,
      baseChance: 62 + (careerRatio * 15) + (perfBoost * 0.5),
      requirementLabel: 'Premia regularidad y proyección estudiantil',
    },
    {
      code: 'MARCA_SPORTLAB',
      sponsorName: 'SportLab Temuco Indumentaria',
      kind: 'MARCA',
      frequency: 'MENSUAL',
      baseInstallment: Math.round((21000 * scale + Math.max(0, avgOvr - 64) * 700) / 500) * 500,
      installmentsTotal: 6,
      baseChance: 44 + ((avgOvr - 65) * 1.8) + (perfBoost * 0.65),
      requirementLabel: `Exige OVR competitivo (actual ${avgOvr})`,
    },
    {
      code: 'MARCA_KINEFIT',
      sponsorName: 'Clínica KineFit & Recuperación',
      kind: 'MARCA',
      frequency: 'SEMESTRAL',
      baseInstallment: Math.round((68000 * scale + trophyBonus * 500) / 1000) * 1000,
      installmentsTotal: 2,
      baseChance: 38 + ((4 - div) * 9) + (perfBoost * 0.75),
      requirementLabel: 'Prioriza división alta, títulos y rendimiento reciente',
    },
    {
      code: 'MARCA_CAMPUS',
      sponsorName: 'Pizzería El Campus & Hidratación',
      kind: 'MARCA',
      frequency: 'MENSUAL',
      baseInstallment: Math.round((13000 * scale + rng() * 2500) / 500) * 500,
      installmentsTotal: 6,
      baseChance: 72 + (perfBoost * 0.3),
      requirementLabel: 'Acuerdo accesible para sumar caja mes a mes',
    },
  ];

  const offers = catalog.map((item, idx) => ({
    id: `SPON_S${state.season}_${item.code}_${idx}`,
    sponsorName: item.sponsorName,
    kind: item.kind,
    frequency: item.frequency,
    amountPerInstallment: Math.max(6000, item.baseInstallment),
    installmentsTotal: item.installmentsTotal,
    totalPotentialClp: Math.max(6000, item.baseInstallment) * item.installmentsTotal,
    acceptanceChance: Math.round(clamp(item.baseChance, 22, 95)),
    requirementLabel: item.requirementLabel,
    status: 'AVAILABLE',
  }));

  return {
    season: state.season,
    proposalsLeft: 3,
    maxProposals: 3,
    offers,
  };
}

export function submitSponsorProposal(state, offerId, rng = Math.random) {
  if (!state) return { ok: false, message: 'Estado inválido.' };
  const userTeam = state.teams.find((t) => t.id === state.userTeamId);
  if (!userTeam) return { ok: false, message: 'Club no encontrado.' };
  if (!state.sponsorSession) {
    state.sponsorSession = generatePreseasonSponsorOffers(state, rng);
  }
  const session = state.sponsorSession;
  if (session.proposalsLeft <= 0) {
    return { ok: false, message: 'Ya utilizaste tus 3 propuestas comerciales de esta pretemporada.' };
  }
  const offer = session.offers.find((o) => o.id === offerId);
  if (!offer) return { ok: false, message: 'Oferta comercial no encontrada.' };
  if (offer.status !== 'AVAILABLE') {
    return { ok: false, message: `Ya enviaste una propuesta a ${offer.sponsorName}.` };
  }

  session.proposalsLeft -= 1;
  const roll = rng() * 100;
  const accepted = roll <= offer.acceptanceChance;

  if (!accepted) {
    offer.status = 'REJECTED';
    return {
      ok: false,
      accepted: false,
      offer,
      message: `${offer.sponsorName} rechazó tu propuesta (prob. ${offer.acceptanceChance}%). Te quedan ${session.proposalsLeft} propuestas.`,
    };
  }

  offer.status = 'ACCEPTED';
  userTeam.budgetEur += offer.amountPerInstallment;
  const contract = {
    id: offer.id,
    season: state.season,
    sponsorName: offer.sponsorName,
    kind: offer.kind,
    frequency: offer.frequency,
    amountPerInstallment: offer.amountPerInstallment,
    installmentsPaid: 1,
    installmentsTotal: offer.installmentsTotal,
  };
  if (!Array.isArray(state.activeSponsors)) state.activeSponsors = [];
  state.activeSponsors.push(contract);

  state.news = [{
    id: `news_sponsor_${offer.id}`,
    dateLabel: 'Pretemporada',
    category: 'PATROCINIO',
    headline: `${userTeam.name} firma acuerdo ${offer.frequency.toLowerCase()} con ${offer.sponsorName}`,
    body: `Ingreso de ${formatClp(offer.amountPerInstallment)} CLP por cuota (${offer.installmentsTotal} cuotas totales).`,
  }, ...(state.news || [])].slice(0, 28);

  return {
    ok: true,
    accepted: true,
    offer,
    contract,
    message: `¡Acuerdo cerrado con ${offer.sponsorName}! +${formatClp(offer.amountPerInstallment)} CLP acreditados (cuota 1/${offer.installmentsTotal}).`,
  };
}

export function processSponsorInstallments(state, frequencyKey, dateLabel = 'Temporada') {
  const userTeam = state?.teams?.find((t) => t.id === state.userTeamId);
  if (!userTeam || !Array.isArray(state.activeSponsors)) return 0;

  let paidTotal = 0;
  for (const sp of state.activeSponsors) {
    if (sp.season !== state.season) continue;
    if (sp.frequency !== frequencyKey) continue;
    if (sp.installmentsPaid >= sp.installmentsTotal) continue;
    sp.installmentsPaid += 1;
    userTeam.budgetEur += sp.amountPerInstallment;
    paidTotal += sp.amountPerInstallment;
  }

  if (paidTotal > 0) {
    state.news = [{
      id: `news_spay_${frequencyKey}_${state.season}_${Date.now()}`,
      dateLabel,
      category: 'FINANZAS',
      headline: `Cobro de acuerdos ${frequencyKey === 'MENSUAL' ? 'mensuales' : 'semestrales'}: +${formatClp(paidTotal)} CLP`,
      body: `Los patrocinadores de ${userTeam.name} depositaron su cuota programada.`,
    }, ...(state.news || [])].slice(0, 28);
  }
  return paidTotal;
}

export function finishPreseasonSponsorsStep(state) {
  if (!state) return false;
  const ev = getNextEvent(state);
  if (ev && ev.type === 'PRE_SEASON_SPONSORS') {
    ev.done = true;
    state.timelineIndex += 1;
    return true;
  }
  return false;
}

// =========================================================================
// 7C. VENTANAS DE TRANSFERENCIA, PRE-ACUERDOS Y RESISTENCIA DE CLUB/JUGADOR
// =========================================================================

export function getTransferWindowState(state) {
  if (!state) return { open: false, code: 'CLOSED', label: 'Cerrada', nextWindowLabel: 'Mitad de Temporada' };
  if (state.seasonCompleted) {
    return { open: true, code: 'POST_SEASON', label: 'Ventana Postemporada (Abierta)', nextWindowLabel: 'Pretemporada' };
  }
  const ev = getNextEvent(state);
  if (ev && (ev.type === 'PRE_SEASON_SPONSORS' || ev.type === 'MARKET_OPEN')) {
    return { open: true, code: 'PRE_SEASON', label: 'Ventana Pretemporada (Abierta)', nextWindowLabel: 'Mitad de Temporada' };
  }
  const hasStartedMatches = (state.timeline || []).some((e) => e.type === 'MATCHDAY' && e.done);
  if (state.marketOpen && !hasStartedMatches) {
    return { open: true, code: 'PRE_SEASON', label: 'Ventana Pretemporada (Abierta)', nextWindowLabel: 'Mitad de Temporada' };
  }
  if (state.marketOpen && state.semester === 2) {
    const midDone = (state.timeline || []).some((e) => e.type === 'MIDSEASON_BREAK' && e.done);
    const round7Done = (state.timeline || []).some((e) => e.type === 'MATCHDAY' && e.round >= 7 && e.done);
    if (midDone && !round7Done) {
      return { open: true, code: 'MID_SEASON', label: 'Ventana Mitad de Temporada (Abierta)', nextWindowLabel: 'Postemporada' };
    }
  }
  return {
    open: false,
    code: 'CLOSED',
    label: 'Campeonato en curso · Solo Pre-Acuerdos',
    nextWindowLabel: state.semester === 1 ? 'Mitad de Temporada' : 'Postemporada',
  };
}

export function evaluateTransferNegotiation(state, player, seller, offerMultiplier = 1, rng = Math.random) {
  if (!seller) {
    const fee = Math.round((player.marketValueEur * 0.45 * offerMultiplier) / 1000) * 1000;
    return { ok: true, fee, boostedFee: Math.round((fee * 1.25) / 1000) * 1000 };
  }

  const fee = Math.round((player.marketValueEur * (player.transferListed ? 1.0 : 1.18) * offerMultiplier) / 1000) * 1000;
  const boostedFee = Math.round((fee * 1.25) / 1000) * 1000;
  const tenure = Number(player.seasonsAtClub || 1);
  const sameCareer = Boolean(player.careerMatchValid);
  const listed = Boolean(player.transferListed);
  const unhappy = Number(player.morale || 70) < 48;

  // 1) Evaluación del Club vendedor
  if (!listed && offerMultiplier < 1.2) {
    const clubReluctance = clamp(
      0.16 + (sameCareer ? 0.14 : 0) + (tenure >= 3 ? 0.14 : 0) + (player.ovr >= 74 ? 0.14 : 0) - ((offerMultiplier - 1) * 0.6),
      0.04,
      0.72
    );
    if (rng() < clubReluctance) {
      return {
        ok: false,
        rejectedBy: 'CLUB',
        fee,
        boostedFee,
        canRetryWithBoost: true,
        message: `${seller.name} rechazó la oferta por ${player.name} (pieza clave en su club). Mejora la oferta (+25%: ${formatClp(boostedFee)} CLP).`,
      };
    }
  }

  // 2) Evaluación del Jugador (su carrera o antigüedad en el club pesan fuerte)
  if (!unhappy && !listed && (sameCareer || tenure >= 3)) {
    const playerReluctance = clamp(
      (sameCareer ? 0.28 : 0.08) + (tenure >= 3 ? (tenure * 0.07) : 0) + ((player.morale || 70) >= 75 ? 0.12 : 0) - ((offerMultiplier - 1) * 1.1),
      0.05,
      0.85
    );
    if (rng() < playerReluctance) {
      const motive = sameCareer && tenure >= 3
        ? `lleva ${tenure} temporadas en ${seller.name} y defiende su propia carrera`
        : sameCareer
          ? `prefiere seguir jugando por su carrera (${player.studiedCareer})`
          : `lleva ${tenure} temporadas consolidado en ${seller.name}`;
      return {
        ok: false,
        rejectedBy: 'PLAYER',
        fee,
        boostedFee,
        canRetryWithBoost: true,
        message: `${player.name} rechazó el traspaso: ${motive}. Puedes intentar convencerlo con una oferta mejorada (${formatClp(boostedFee)} CLP).`,
      };
    }
  }

  return { ok: true, fee, boostedFee };
}

function finalizeIncomingPlayerTransfer(state, incoming, windowLabel = 'Ventana') {
  const userClub = state.teams.find((t) => t.id === state.userTeamId);
  if (!userClub || userClub.players.length >= 22) return false;
  if (userClub.players.some((p) => p.id === incoming.id)) return false;

  const usedJerseys = new Set(userClub.players.map((x) => x.jerseyNumber));
  let jersey = incoming.jerseyNumber || 1;
  while (usedJerseys.has(jersey)) jersey = (jersey % 99) + 1;

  const joined = sanitizePlayerPublic({
    ...incoming,
    teamId: userClub.id,
    jerseyNumber: jersey,
    contractSemesters: 4,
    seasonsAtClub: 1,
    morale: 84,
    transferListed: false,
    pendingTransferToTeamId: null,
    careerMatchValid: validateTeamCareerMatch(incoming.studiedCareer, userClub.career),
  });
  userClub.players.push(joined);
  userClub.benchIds.push(joined.id);

  state.news = [{
    id: `news_arrive_${joined.id}_${Date.now()}`,
    dateLabel: windowLabel,
    category: 'INCORPORACIÓN',
    headline: `¡Se suma ${joined.name} (${joined.ovr} OVR) a ${userClub.name}!`,
    body: `Se concretó su llegada al abrirse la ventana de ${windowLabel}.`,
  }, ...(state.news || [])].slice(0, 28);
  return true;
}

export function processPendingIncomingTransfers(state, windowLabel = 'Ventana de Pases') {
  if (!state || !Array.isArray(state.pendingIncomingTransfers) || state.pendingIncomingTransfers.length === 0) {
    return [];
  }
  const arrived = [];
  const remaining = [];
  for (const item of state.pendingIncomingTransfers) {
    // Remover del club vendedor si aún figuraba ahí
    if (item.fromTeamId && item.fromTeamId !== 'FREE_AGENT') {
      const seller = state.teams.find((t) => t.id === item.fromTeamId);
      if (seller) {
        const sIdx = seller.players.findIndex((p) => p.id === item.player.id);
        if (sIdx !== -1) {
          seller.players.splice(sIdx, 1);
          seller.starterIds = seller.starterIds.filter((id) => id !== item.player.id);
          seller.benchIds = seller.benchIds.filter((id) => id !== item.player.id);
          refillStarterSlotIfNeeded(seller);
        }
      }
    }
    if (finalizeIncomingPlayerTransfer(state, item.player, windowLabel)) {
      arrived.push(item.player);
    } else {
      remaining.push(item);
    }
  }
  state.pendingIncomingTransfers = remaining;
  return arrived;
}

export function searchMarketPlayers(state, filters = {}) {
  const {
    teamId = 'ALL',
    minAge = 17,
    maxAge = 35,
    position = 'ALL',
    minOvr = 50,
    maxOvr = 95,
    studiedCareer = 'ALL',
    freeAgentsOnly = false,
    query = '',
  } = filters;

  const qNorm = normalizeTextKey(query);
  const careerNorm = studiedCareer && studiedCareer !== 'ALL' ? normalizeTextKey(studiedCareer) : '';

  const pool = [];
  if (freeAgentsOnly || teamId === 'FREE_AGENT' || teamId === 'ALL') {
    for (const fa of state.freeAgents || []) {
      pool.push({
        ...sanitizePlayerPublic(fa),
        teamName: 'Agente Libre',
        divisionLabel: 'Libre',
        isFreeAgent: true,
      });
    }
  }
  if (!freeAgentsOnly && teamId !== 'FREE_AGENT') {
    for (const team of state.teams) {
      if (team.id === state.userTeamId) continue;
      if (teamId !== 'ALL' && team.id !== teamId) continue;
      for (const p of team.players || []) {
        if (p.pendingTransferToTeamId) continue;
        pool.push({
          ...sanitizePlayerPublic(p),
          teamName: team.name,
          divisionLabel: `${team.division}ª Div`,
          isFreeAgent: false,
        });
      }
    }
  }

  return pool
    .filter((p) => {
      if (position !== 'ALL' && p.position !== position) return false;
      if (p.age < minAge || p.age > maxAge) return false;
      if (p.ovr < minOvr || p.ovr > maxOvr) return false;
      if (careerNorm && normalizeTextKey(p.studiedCareer) !== careerNorm) return false;
      if (qNorm) {
        const hay = normalizeTextKey(`${p.name} ${p.studiedCareer} ${p.teamName}`);
        if (!hay.includes(qNorm)) return false;
      }
      return true;
    })
    .sort((a, b) => b.ovr - a.ovr || a.marketValueEur - b.marketValueEur);
}

export function signMarketPlayer(state, playerId, optionsOrRng = {}, maybeRng = Math.random) {
  const opts = typeof optionsOrRng === 'function' ? {} : (optionsOrRng || {});
  const rng = typeof optionsOrRng === 'function' ? optionsOrRng : (maybeRng || Math.random);
  const offerMultiplier = Number(opts.offerMultiplier) || 1;

  const userClub = state.teams.find((t) => t.id === state.userTeamId);
  if (!userClub) return { ok: false, message: 'Club no encontrado.' };
  const pendingCount = (state.pendingIncomingTransfers || []).length;
  if (userClub.players.length + pendingCount >= 22) {
    return { ok: false, message: 'Plantel lleno considerando fichajes ya acordados (máx. 22).' };
  }

  const win = getTransferWindowState(state);

  // Buscar en agentes libres
  const faIdx = state.freeAgents.findIndex((p) => p.id === playerId);
  if (faIdx !== -1) {
    const p = state.freeAgents[faIdx];
    const signingFee = Math.round((p.marketValueEur * 0.45 * offerMultiplier) / 1000) * 1000;
    if (userClub.budgetEur < signingFee) {
      return { ok: false, message: `Presupuesto insuficiente (${formatClp(signingFee)} CLP necesarios).` };
    }
    userClub.budgetEur -= signingFee;
    state.freeAgents.splice(faIdx, 1);

    if (win.open) {
      finalizeIncomingPlayerTransfer(state, p, win.label);
      return { ok: true, preAgreement: false, message: `¡${p.name} se sumó inmediatamente al plantel por ${formatClp(signingFee)} CLP!` };
    }

    if (!Array.isArray(state.pendingIncomingTransfers)) state.pendingIncomingTransfers = [];
    state.pendingIncomingTransfers.push({
      id: `PRE_${p.id}_${Date.now()}`,
      player: sanitizePlayerPublic(p),
      fromTeamId: 'FREE_AGENT',
      fromTeamName: 'Agente Libre',
      fee: signingFee,
      targetWindow: win.nextWindowLabel,
    });
    state.news = [{
      id: `news_presign_${p.id}_${Date.now()}`,
      dateLabel: getNextEvent(state)?.dateLabel || 'Pre-Acuerdo',
      category: 'PRE-ACUERDO',
      headline: `Pre-acuerdo cerrado: ${p.name} (${p.ovr} OVR) llegará a ${userClub.name}`,
      body: `Acuerdo por ${formatClp(signingFee)} CLP. Se incorporará oficialmente en ${win.nextWindowLabel}.`,
    }, ...(state.news || [])].slice(0, 28);
    return {
      ok: true,
      preAgreement: true,
      message: `¡Pre-acuerdo cerrado con ${p.name}! Llegará automáticamente en la ventana de ${win.nextWindowLabel}.`,
    };
  }

  // Buscar en otros clubes
  for (const seller of state.teams) {
    if (seller.id === userClub.id) continue;
    const pIdx = seller.players.findIndex((p) => p.id === playerId);
    if (pIdx === -1) continue;
    if (seller.players.length <= 10) {
      return { ok: false, message: `${seller.name} no puede quedar con menos de 10 jugadores.` };
    }
    const p = seller.players[pIdx];
    if (p.pendingTransferToTeamId) {
      return { ok: false, message: `${p.name} ya tiene un pre-acuerdo firmado para la próxima ventana.` };
    }

    const neg = evaluateTransferNegotiation(state, p, seller, offerMultiplier, rng);
    if (userClub.budgetEur < neg.fee) {
      return { ok: false, message: `Presupuesto insuficiente (${formatClp(neg.fee)} CLP necesarios).` };
    }
    if (!neg.ok) {
      return neg;
    }

    userClub.budgetEur -= neg.fee;
    seller.budgetEur += neg.fee;

    if (win.open) {
      seller.players.splice(pIdx, 1);
      seller.starterIds = seller.starterIds.filter((id) => id !== p.id);
      seller.benchIds = seller.benchIds.filter((id) => id !== p.id);
      refillStarterSlotIfNeeded(seller);
      finalizeIncomingPlayerTransfer(state, p, seller.name);
      return { ok: true, preAgreement: false, message: `¡Fichaste a ${p.name} desde ${seller.name} por ${formatClp(neg.fee)} CLP!` };
    }

    // Ventana cerrada durante campeonato: firmar Pre-Acuerdo para próxima ventana
    p.pendingTransferToTeamId = userClub.id;
    if (!Array.isArray(state.pendingIncomingTransfers)) state.pendingIncomingTransfers = [];
    state.pendingIncomingTransfers.push({
      id: `PRE_${p.id}_${Date.now()}`,
      player: sanitizePlayerPublic(p),
      fromTeamId: seller.id,
      fromTeamName: seller.name,
      fee: neg.fee,
      targetWindow: win.nextWindowLabel,
    });
    state.news = [{
      id: `news_prebuy_${p.id}_${Date.now()}`,
      dateLabel: getNextEvent(state)?.dateLabel || 'Pre-Acuerdo',
      category: 'PRE-ACUERDO',
      headline: `Pre-acuerdo: ${p.name} dejará ${seller.name} para llegar a ${userClub.name}`,
      body: `Operación por ${formatClp(neg.fee)} CLP. Terminará el torneo actual en su club y llegará en ${win.nextWindowLabel}.`,
    }, ...(state.news || [])].slice(0, 28);
    return {
      ok: true,
      preAgreement: true,
      message: `¡Pre-acuerdo cerrado por ${p.name} (${formatClp(neg.fee)} CLP)! Llegará en ${win.nextWindowLabel}.`,
    };
  }

  return { ok: false, message: 'Jugador no disponible en el mercado.' };
}

// =========================================================================
// 7D. LOGROS, PUNTAJE Y RANKING DE CARRERAS DT
// =========================================================================

export function recordSeasonAchievementsAndStats(state) {
  if (!state || state.seasonAchievementsRecorded) return [];
  const stats = ensureCareerStats(state);
  const po = state.postseason;
  const uid = state.userTeamId;
  const added = [];
  stats.seasonsPlayed += 1;

  const pushAch = (title, points, division) => {
    const item = { season: state.season, title, points, division };
    state.careerAchievements.push(item);
    added.push(item);
  };

  if (po) {
    if (po.div1?.championId === uid) {
      stats.titlesDiv1 += 1;
      pushAch(`🏆 Campeón 1ª División (Temp. ${state.season})`, 450, 1);
    } else if (po.div1?.final?.[0]?.loserId === uid) {
      stats.runnerUps += 1;
      pushAch(`🥈 Subcampeón 1ª División (Temp. ${state.season})`, 140, 1);
    }

    if (po.div2?.championId === uid) {
      stats.titlesDiv2 += 1;
      stats.promotions += 1;
      pushAch(`🏆 Campeón 2ª División y Ascenso a 1ª (Temp. ${state.season})`, 340, 2);
    } else if (po.div2?.final?.[0]?.loserId === uid) {
      stats.runnerUps += 1;
      pushAch(`🥈 Subcampeón 2ª División (Temp. ${state.season})`, 120, 2);
    }

    if (po.div3?.championId === uid) {
      stats.titlesDiv3 += 1;
      stats.promotions += 1;
      pushAch(`🏆 Campeón 3ª División y Ascenso a 2ª (Temp. ${state.season})`, 260, 3);
    } else if (po.div3?.runnerUpId === uid) {
      stats.runnerUps += 1;
      stats.promotions += 1;
      pushAch(`⬆️ Subcampeón 3ª División y Ascenso a 2ª (Temp. ${state.season})`, 180, 3);
    }

    for (const tie of po.liguilla1v2 || []) {
      if (tie.winnerId === uid) {
        stats.promotions += 1;
        pushAch(`🔥 Ganador Liguilla 1ª/2ª (Temp. ${state.season})`, 170, 1);
      }
    }
    for (const tie of po.liguilla2v3 || []) {
      if (tie.winnerId === uid) {
        stats.promotions += 1;
        pushAch(`🔥 Ganador Liguilla 2ª/3ª (Temp. ${state.season})`, 140, 2);
      }
    }
  }

  state.seasonAchievementsRecorded = true;
  return added;
}

export function computeDtCareerScore(state) {
  if (!state) return 0;
  const stats = ensureCareerStats(state);
  const userTeam = state.teams.find((t) => t.id === state.userTeamId);
  const avgOvr = userTeam ? getTeamAverageOvr(userTeam) : 65;

  const achPts = (state.careerAchievements || []).reduce((s, a) => s + (Number(a.points) || 0), 0);
  const matchPts = (stats.totalWins || 0) * 14 + (stats.derbyWins || 0) * 35 + (stats.seasonsPlayed || 0) * 40;
  const ovrPts = Math.max(0, avgOvr - 64) * 4;
  return clamp(Math.round(achPts + matchPts + ovrPts), 0, 2500);
}

export function buildNotFcRankingEntry(state, cloudMeta = {}) {
  const userTeam = state?.teams?.find((t) => t.id === state.userTeamId);
  const stats = ensureCareerStats(state);
  const score = computeDtCareerScore(state);
  const achTitles = (state.careerAchievements || []).map((a) => a.title);

  return {
    id: cloudMeta.id || `local_${state.userTeamId}`,
    uid: cloudMeta.uid || '',
    nickname: String(cloudMeta.nickname || state.dtName || 'DT UFRO').slice(0, 18),
    dtName: String(state.dtName || 'DT UFRO').slice(0, 32),
    playerName: String(state.dtName || 'DT UFRO').slice(0, 36),
    teamId: userTeam?.id || state.userTeamId,
    teamCode: userTeam?.id || state.userTeamId,
    teamName: userTeam?.name || 'Club UFRO',
    headline: userTeam?.name || 'Club UFRO',
    division: userTeam?.division || 3,
    studiedCareer: String(userTeam?.career || '').slice(0, 60),
    sport: 'FUTBOL',
    modeKey: 'NOTFC_DT',
    game: 'NOTFC_DT',
    weekId: 'NOTFC_ALL_TIME',
    ovr: userTeam ? getTeamAverageOvr(userTeam) : 65,
    season: state.season || 1,
    titles: (state.careerAchievements || []).length,
    trophyList: achTitles,
    achievementsSummary: achTitles.length > 0
      ? achTitles.slice(0, 4).join(' · ')
      : `${stats.totalWins}V · Temp. ${state.season || 1}`,
    score,
    createdAt: Date.now(),
  };
}

// =========================================================================
// 8. CAMBIO DE TEMPORADA (ASCENSOS, DESCENSOS, CONTRATOS Y SALIDAS)
// =========================================================================

export function startNextSeason(state, rng = Math.random) {
  if (!state.seasonCompleted || !state.postseason) {
    return { ok: false, message: 'Aún no termina la temporada actual.' };
  }

  recordSeasonAchievementsAndStats(state);
  processPendingIncomingTransfers(state, 'Pretemporada');

  const po = state.postseason;
  const byId = new Map(state.teams.map((t) => [t.id, t]));
  const userTeam = byId.get(state.userTeamId);

  // Registrar resumen histórico de temporada antes de mover divisiones
  const d1Champ = byId.get(po.div1?.championId)?.name || '-';
  const d2Champ = byId.get(po.div2?.championId)?.name || '-';
  const d3Champ = byId.get(po.div3?.championId)?.name || '-';
  state.careerHistory.push({
    season: state.season,
    division: userTeam.division,
    d1Champion: d1Champ,
    d2Champion: d2Champ,
    d3Champion: d3Champ,
  });

  // Aplicar movimientos de categoría:
  // 1) 1ª <-> 2ª
  if (po.div1.directRelegatedId && byId.has(po.div1.directRelegatedId)) {
    byId.get(po.div1.directRelegatedId).division = 2;
  }
  if (po.div2.championId && byId.has(po.div2.championId)) {
    byId.get(po.div2.championId).division = 1;
  }
  for (const tie of po.liguilla1v2 || []) {
    if (!tie.winnerId || !tie.loserId) continue;
    if (byId.has(tie.winnerId)) byId.get(tie.winnerId).division = 1;
    if (byId.has(tie.loserId)) byId.get(tie.loserId).division = 2;
  }

  // 2) 2ª <-> 3ª
  for (const relId of po.div2.directRelegatedIds || []) {
    if (byId.has(relId)) {
      byId.get(relId).division = 3;
      byId.get(relId).conf = 'A';
    }
  }
  for (const ascId of [po.div3.championId, po.div3.runnerUpId].filter(Boolean)) {
    if (byId.has(ascId)) {
      byId.get(ascId).division = 2;
      byId.get(ascId).conf = null;
    }
  }
  for (const tie of po.liguilla2v3 || []) {
    if (!tie.winnerId || !tie.loserId) continue;
    if (byId.has(tie.winnerId)) {
      byId.get(tie.winnerId).division = 2;
      byId.get(tie.winnerId).conf = null;
    }
    if (byId.has(tie.loserId)) {
      byId.get(tie.loserId).division = 3;
    }
  }

  // Balancear Conferencias A y B de 3ª División exactamente a 21 + 21
  const d3Teams = state.teams.filter((t) => t.division === 3);
  d3Teams.forEach((t, idx) => {
    t.conf = idx < 21 ? 'A' : 'B';
  });

  // Envejecer plantel, incrementar temporadas en club, revisar salidas + premio temporada
  const departures = [];
  for (const team of state.teams) {
    const prize = team.division === 1 ? 110000 : team.division === 2 ? 70000 : 40000;
    team.budgetEur += prize;

    const kept = [];
    for (const p of team.players) {
      p.age = Math.min(34, (p.age || 21) + 1);
      p.seasonsAtClub = (p.seasonsAtClub || 1) + 1;
      p.contractSemesters = Math.max(0, (p.contractSemesters || 1) - 1);
      p.stats = { matches: 0, goals: 0, assists: 0, cleanSheets: 0, mvpCount: 0, ratingSum: 0 };

      const wantsExit = (p.morale < 42 || p.contractSemesters === 0) && kept.length >= 10;
      if (team.isUserClub && wantsExit && rng() < 0.7) {
        p.teamId = 'FREE_AGENT';
        p.seasonsAtClub = 0;
        state.freeAgents.unshift(sanitizePlayerPublic(p));
        departures.push(p.name);
        continue;
      }
      if (!team.isUserClub && p.contractSemesters === 0) {
        p.contractSemesters = 2;
      }
      // Leve progresión natural por edad/ritmo (sin exponer potencial)
      const delta = p.age <= 22 ? (rng() < 0.55 ? 1 : 0) : p.age >= 29 ? (rng() < 0.35 ? -1 : 0) : 0;
      p.ovr = clamp(p.ovr + delta, 52, 92);
      p.marketValueEur = calculatePlayerValueEur(p);
      kept.push(p);
    }

    team.players = kept;
    while (team.players.length < 13) {
      const filler = createSquadPlayer({
        id: `${team.id}_YTH_${state.season + 1}_${team.players.length + 1}`,
        teamId: team.id,
        studiedCareer: team.career,
        clubCareer: team.career,
        position: POSITIONS[team.players.length % 4],
        seasonsAtClub: 1,
        ovr: team.division === 1 ? 66 : team.division === 2 ? 60 : 55,
        jerseyNumber: team.players.length + 1,
        rng,
      });
      team.players.push(filler);
    }
    team.starterIds = team.starterIds.filter((id) => team.players.some((p) => p.id === id));
    team.benchIds = team.players.filter((p) => !team.starterIds.includes(p.id)).map((p) => p.id);
    refillStarterSlotIfNeeded(team);
  }

  state.season += 1;
  state.semester = 1;
  state.timelineIndex = 0;
  state.marketOpen = true;
  state.seasonCompleted = false;
  state.seasonAchievementsRecorded = false;
  state.postseason = null;
  state.activeDecision = null;
  state.pendingLiveMatch = null;
  state.activeSponsors = [];
  state.sponsorSession = generatePreseasonSponsorOffers(state, rng);
  state.calendar = generateSeasonCalendar(state.teams);
  state.standings = {
    div1: createStandingsTable(state.teams.filter((t) => t.division === 1)),
    div2: createStandingsTable(state.teams.filter((t) => t.division === 2)),
    div3A: createStandingsTable(state.teams.filter((t) => t.division === 3 && t.conf === 'A')),
    div3B: createStandingsTable(state.teams.filter((t) => t.division === 3 && t.conf === 'B')),
  };
  state.timeline = buildLinearTimeline(userTeam, state.teams, state.calendar, state.season);

  const depNote = departures.length > 0
    ? `Salidas en ${userTeam.name} por fin de contrato o bajo ánimo: ${departures.join(', ')}.`
    : 'El plantel base renovó compromiso para la nueva campaña.';

  state.news = [{
    id: `news_newseason_${state.season}`,
    dateLabel: '02 Mar',
    category: 'NUEVA TEMPORADA',
    headline: `Arranca la Temporada ${state.season} · ${userTeam.name} en ${userTeam.division}ª División`,
    body: `${depNote} Ya puedes enviar propuestas de patrocinio antes del torneo.`,
  }, ...(state.news || [])].slice(0, 28);

  return { ok: true, season: state.season, departures };
}
