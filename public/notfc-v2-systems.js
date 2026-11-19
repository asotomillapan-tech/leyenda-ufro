// =========================================================================
// SISTEMAS v0.2.0 · NOT F.C (MODO CARRERA DT INTERCARRERAS UFRO)
// Módulo puro y desacoplado para tácticas, condición física, charlas,
// certámenes UFRO, capitanía, mechones, préstamos, seguimiento,
// negociación con trueque, estadísticas/7 ideal, historial DT y Copa.
// =========================================================================

import {
  calculatePlayerValueEur,
  createSquadPlayer,
  validateTeamCareerMatch,
  normalizeTextKey,
  MAX_FOREIGN_CAREER_PLAYERS,
} from './notfc-data.js';

const POSITIONS = ['ARQ', 'DEF', 'MED', 'DEL'];

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function formatClp(amount) {
  const n = Math.round(Number(amount) || 0);
  return `$${n.toLocaleString('es-CL')}`;
}

function sanitizePlayer(player) {
  if (!player) return null;
  const copy = { ...player };
  delete copy.potential;
  delete copy.pot;
  return copy;
}

function pickFrom(arr, rng = Math.random) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(rng() * arr.length)];
}

// =========================================================================
// 1. INSTRUCCIONES TÁCTICAS SIMPLES
// =========================================================================

export const TACTICS_OPTIONS = {
  mentality: [
    { id: 'DEFENSIVA', label: 'Defensiva', desc: 'Cierra espacios atrás (-0.9 ataque, +1.5 defensa)' },
    { id: 'EQUILIBRADA', label: 'Equilibrada', desc: 'Balance entre bloque y ataque (+0.2/+0.2)' },
    { id: 'OFENSIVA', label: 'Ofensiva', desc: 'Vuelca el equipo al arco rival (+1.6 ataque, -1.0 defensa)' },
  ],
  pressing: [
    { id: 'BAJA', label: 'Baja', desc: 'Ahorra energía física (-0.4 presión, menor desgaste)' },
    { id: 'MEDIA', label: 'Media', desc: 'Presión tras pérdida moderada (desgaste normal)' },
    { id: 'ALTA', label: 'Alta', desc: 'Ahogo inmediato al rival (+1.1 fuerza, mayor fatiga y tarjetas)' },
  ],
  style: [
    { id: 'TOQUE', label: 'Toque', desc: 'Posesión asociativa en mediocampo (+0.5 ataque, +0.4 defensa)' },
    { id: 'CONTRAGOLPE', label: 'Contragolpe', desc: 'Transición veloz tras recuperar (+0.8 ataque, +0.2 defensa)' },
    { id: 'DIRECTO', label: 'Directo', desc: 'Juego vertical al área rival (+1.0 ataque, -0.3 defensa)' },
  ],
};

export const DEFAULT_TACTICS = {
  mentality: 'EQUILIBRADA',
  pressing: 'MEDIA',
  style: 'TOQUE',
};

export function ensureTeamTactics(team) {
  if (!team) return { ...DEFAULT_TACTICS };
  const validMent = new Set(TACTICS_OPTIONS.mentality.map((x) => x.id));
  const validPress = new Set(TACTICS_OPTIONS.pressing.map((x) => x.id));
  const validStyle = new Set(TACTICS_OPTIONS.style.map((x) => x.id));
  const t = team.tactics || {};
  team.tactics = {
    mentality: validMent.has(t.mentality) ? t.mentality : DEFAULT_TACTICS.mentality,
    pressing: validPress.has(t.pressing) ? t.pressing : DEFAULT_TACTICS.pressing,
    style: validStyle.has(t.style) ? t.style : DEFAULT_TACTICS.style,
  };
  return team.tactics;
}

export function setClubTactics(club, partial = {}) {
  if (!club) return { ok: false, message: 'Club no válido.' };
  const current = ensureTeamTactics(club);
  const validMent = new Set(TACTICS_OPTIONS.mentality.map((x) => x.id));
  const validPress = new Set(TACTICS_OPTIONS.pressing.map((x) => x.id));
  const validStyle = new Set(TACTICS_OPTIONS.style.map((x) => x.id));

  club.tactics = {
    mentality: validMent.has(partial.mentality) ? partial.mentality : current.mentality,
    pressing: validPress.has(partial.pressing) ? partial.pressing : current.pressing,
    style: validStyle.has(partial.style) ? partial.style : current.style,
  };
  return {
    ok: true,
    tactics: club.tactics,
    message: `Instrucciones actualizadas: ${club.tactics.mentality} · Presión ${club.tactics.pressing} · ${club.tactics.style}.`,
  };
}

export function computeTacticsModifiers(team) {
  const t = ensureTeamTactics(team);
  let attackMod = 0;
  let defenseMod = 0;
  let energyDrain = 15;
  let cardRisk = 0.085;

  if (t.mentality === 'DEFENSIVA') {
    attackMod -= 0.9;
    defenseMod += 1.5;
  } else if (t.mentality === 'OFENSIVA') {
    attackMod += 1.6;
    defenseMod -= 1.0;
  } else {
    attackMod += 0.2;
    defenseMod += 0.2;
  }

  if (t.pressing === 'BAJA') {
    attackMod -= 0.2;
    defenseMod -= 0.1;
    energyDrain = 11;
    cardRisk = 0.055;
  } else if (t.pressing === 'ALTA') {
    attackMod += 0.7;
    defenseMod += 0.5;
    energyDrain = 22;
    cardRisk = 0.135;
  }

  if (t.style === 'TOQUE') {
    attackMod += 0.5;
    defenseMod += 0.4;
  } else if (t.style === 'CONTRAGOLPE') {
    attackMod += 0.8;
    defenseMod += 0.2;
  } else if (t.style === 'DIRECTO') {
    attackMod += 1.0;
    defenseMod -= 0.3;
  }

  return {
    attackMod,
    defenseMod,
    overallMod: (attackMod + defenseMod) * 0.55,
    energyDrain,
    cardRisk,
    tactics: t,
  };
}

// =========================================================================
// 2. FATIGA, LESIONES Y SANCIONES POR TARJETAS
// =========================================================================

export function ensurePlayerCondition(player) {
  if (!player) return player;
  if (typeof player.energy !== 'number' || Number.isNaN(player.energy)) player.energy = 100;
  player.energy = clamp(Math.round(player.energy), 10, 100);
  if (typeof player.injuredMatches !== 'number' || Number.isNaN(player.injuredMatches)) player.injuredMatches = 0;
  player.injuredMatches = Math.max(0, Math.round(player.injuredMatches));
  if (typeof player.suspendedMatches !== 'number' || Number.isNaN(player.suspendedMatches)) player.suspendedMatches = 0;
  player.suspendedMatches = Math.max(0, Math.round(player.suspendedMatches));
  if (typeof player.yellowCards !== 'number' || Number.isNaN(player.yellowCards)) player.yellowCards = 0;
  player.yellowCards = Math.max(0, Math.round(player.yellowCards));
  return player;
}

export function isPlayerUnavailable(player) {
  if (!player) return true;
  return (Number(player.injuredMatches) || 0) > 0 || (Number(player.suspendedMatches) || 0) > 0;
}

export function getPlayerUnavailableReason(player) {
  if (!player) return '';
  if ((Number(player.injuredMatches) || 0) > 0) {
    return `Lesionado (${player.injuredMatches} ${player.injuredMatches === 1 ? 'fecha' : 'fechas'})`;
  }
  if ((Number(player.suspendedMatches) || 0) > 0) {
    return `Suspendido (${player.suspendedMatches} ${player.suspendedMatches === 1 ? 'fecha' : 'fechas'})`;
  }
  return '';
}

export function ensureAvailableStarters(club) {
  if (!club || !Array.isArray(club.players)) return [];
  club.players.forEach(ensurePlayerCondition);
  const byId = new Map(club.players.map((p) => [p.id, p]));
  const replaced = [];

  const starterIds = [...(club.starterIds || [])].filter((id) => byId.has(id));
  const starterSet = new Set(starterIds);
  const benchIds = club.players.filter((p) => !starterSet.has(p.id)).map((p) => p.id);

  for (let i = 0; i < starterIds.length; i += 1) {
    const pl = byId.get(starterIds[i]);
    if (!pl || !isPlayerUnavailable(pl)) continue;

    // Buscar mejor reemplazo disponible en la banca (priorizando misma posición)
    const availBench = benchIds
      .map((id) => byId.get(id))
      .filter((p) => p && !isPlayerUnavailable(p));
    if (availBench.length === 0) continue;

    const samePos = availBench
      .filter((p) => p.position === pl.position || Number(p.secondaryPositions?.[pl.position] || 0) >= 60)
      .sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    const fallback = [...availBench].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    const sub = samePos[0] || fallback[0];
    if (!sub) continue;

    const bIdx = benchIds.indexOf(sub.id);
    if (bIdx !== -1) {
      benchIds.splice(bIdx, 1, pl.id);
      starterIds[i] = sub.id;
      replaced.push({ out: pl, in: sub });
    }
  }

  club.starterIds = starterIds;
  club.benchIds = benchIds;
  return replaced;
}

export function applyPostMatchConditionAndCards(team, starterSet, rng = Math.random) {
  if (!team || !Array.isArray(team.players)) {
    return { injuries: [], suspensions: [], yellowCarded: [] };
  }
  const mod = computeTacticsModifiers(team);
  const injuries = [];
  const suspensions = [];
  const yellowCarded = [];

  for (const p of team.players) {
    ensurePlayerCondition(p);
    const played = starterSet.has(p.id);

    if (!played) {
      if (p.injuredMatches > 0) p.injuredMatches = Math.max(0, p.injuredMatches - 1);
      if (p.suspendedMatches > 0) p.suspendedMatches = Math.max(0, p.suspendedMatches - 1);
      p.energy = clamp(p.energy + 18, 15, 100);
      continue;
    }

    // Desgaste por partido según intensidad de presión
    const jitter = Math.round((rng() - 0.5) * 6);
    const drain = Math.max(6, mod.energyDrain + jitter);
    p.energy = clamp(p.energy - drain, 15, 100);

    // Riesgo de sobrecarga muscular si jugó muy fatigado
    const injuryProb = p.energy < 42 ? 0.11 : p.energy < 58 ? 0.045 : 0.018;
    if (rng() < injuryProb && p.position !== 'ARQ') {
      p.injuredMatches = rng() < 0.72 ? 1 : 2;
      injuries.push({ player: p, matches: p.injuredMatches });
    }

    // Riesgo de tarjeta amarilla (3 amarillas -> 1 fecha de suspensión)
    const cardMultiplier = p.position === 'DEF' ? 1.35 : p.position === 'MED' ? 1.15 : p.position === 'ARQ' ? 0.25 : 0.85;
    if (rng() < mod.cardRisk * cardMultiplier) {
      p.yellowCards = (p.yellowCards || 0) + 1;
      yellowCarded.push({ player: p, totalYellows: p.yellowCards });
      if (p.yellowCards >= 3) {
        p.yellowCards = 0;
        p.suspendedMatches = Math.max(p.suspendedMatches, 1);
        suspensions.push({ player: p, matches: p.suspendedMatches });
      }
    }
  }

  // Asegurar titulares habilitados para el próximo partido
  ensureAvailableStarters(team);
  return { injuries, suspensions, yellowCarded };
}

export function recoverTeamEnergy(team, amount = 14) {
  if (!team || !Array.isArray(team.players)) return;
  for (const p of team.players) {
    ensurePlayerCondition(p);
    p.energy = clamp(p.energy + amount, 15, 100);
    if (p.injuredMatches > 0) p.injuredMatches = Math.max(0, p.injuredMatches - 1);
  }
}

// =========================================================================
// 3. CHARLAS DE ENTRETIEMPO EN PARTIDO EN VIVO
// =========================================================================

export const HALFTIME_TALKS = [
  {
    id: 'PRESS_HIGH',
    label: 'Salir a presionar alto',
    desc: 'Más volumen ofensivo en el 2° tiempo, mayor desgaste físico.',
  },
  {
    id: 'STAY_CALM',
    label: 'Orden táctico y calma',
    desc: 'Refuerza la defensa y cuida el balón para cerrar el resultado.',
  },
  {
    id: 'BACK_SQUAD',
    label: 'Respaldar al plantel',
    desc: 'Levanta el ánimo del equipo y mantiene rendimiento parejo.',
  },
  {
    id: 'DEMAND_MORE',
    label: 'Exigir máxima actitud',
    desc: 'Charla fuerte: gran empuje si vas abajo o empatado, arriesgada si ya ganas cómodo.',
  },
];

export function getHalftimeTalkEffect(talkId, scoreDiff = 0) {
  if (talkId === 'PRESS_HIGH') {
    return {
      id: 'PRESS_HIGH',
      label: 'Salir a presionar alto',
      attackDelta: 2.0,
      defenseDelta: -0.6,
      totalDelta: 1.4,
      moraleDelta: 2,
      energyDelta: -6,
      commentary: 'Charla de entretiempo: el DT ordena adelantar líneas y presionar la salida rival.',
    };
  }
  if (talkId === 'STAY_CALM') {
    return {
      id: 'STAY_CALM',
      label: 'Orden táctico y calma',
      attackDelta: 0.3,
      defenseDelta: 1.7,
      totalDelta: 1.3,
      moraleDelta: 3,
      energyDelta: 2,
      commentary: 'Charla de entretiempo: el DT pide calma, líneas juntas y paciencia con el balón.',
    };
  }
  if (talkId === 'DEMAND_MORE') {
    const effective = scoreDiff <= 0;
    return {
      id: 'DEMAND_MORE',
      label: 'Exigir máxima actitud',
      attackDelta: effective ? 2.3 : 0.3,
      defenseDelta: effective ? 0.9 : -0.6,
      totalDelta: effective ? 2.0 : -0.3,
      moraleDelta: effective ? 4 : -2,
      energyDelta: -4,
      commentary: effective
        ? 'Charla fuerte en el camarín: el equipo sale encendido a buscar la remontada.'
        : 'Charla exigente del DT pese a la ventaja; el equipo sale algo tenso al complemento.',
    };
  }
  // BACK_SQUAD
  return {
    id: 'BACK_SQUAD',
    label: 'Respaldar al plantel',
    attackDelta: 1.0,
    defenseDelta: 1.0,
    totalDelta: 1.2,
    moraleDelta: 5,
    energyDelta: 0,
    commentary: 'Charla de respaldo en el camarín: el plantel responde con confianza para el 2° tiempo.',
  };
}

// =========================================================================
// 4. TEMPORADA DE CERTÁMENES / EXÁMENES UFRO
// =========================================================================

export function buildExamWeekDecision(state, eventObj, rng = Math.random) {
  const userTeam = (state?.teams || []).find((t) => t.id === state.userTeamId);
  if (!userTeam) return null;
  const starters = (userTeam.starterIds || [])
    .map((id) => userTeam.players.find((p) => p.id === id))
    .filter((p) => p && !isPlayerUnavailable(p));
  const pool = starters.length >= 2 ? starters : userTeam.players.filter((p) => !isPlayerUnavailable(p));
  const nonGk = pool.filter((p) => p.position !== 'ARQ');
  const sorted = [...(nonGk.length >= 2 ? nonGk : pool)].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
  const affected = sorted.slice(0, Math.min(3, Math.max(2, Math.floor(rng() * 2) + 2)));
  const names = affected.map((p) => `${p.name} (${p.position})`).join(', ');

  return {
    id: `exam_${eventObj.id}`,
    dateLabel: eventObj.dateLabel,
    category: 'CERTÁMENES UFRO',
    title: `Semana de Certámenes en ${userTeam.career}`,
    desc: `${names} rinden evaluaciones clave esta semana y llegan con alta carga académica. ¿Cómo gestionas la convocatoria?`,
    affectedPlayerIds: affected.map((p) => p.id),
    options: [
      {
        id: 'GRANT_EXAM_LEAVE',
        label: 'Dar permiso académico (descansan esta fecha · +12 Ánimo · +15 Energía)',
      },
      {
        id: 'CALL_UP_ANYWAY',
        label: 'Convocarlos igual al partido (-18 Energía · -6 Ánimo por desgaste)',
      },
    ],
  };
}

export function resolveExamWeekDecision(state, optionId) {
  const dec = state?.activeDecision;
  if (!dec || dec.category !== 'CERTÁMENES UFRO') return { ok: false, message: 'No hay evento de certámenes activo.' };
  const userTeam = (state.teams || []).find((t) => t.id === state.userTeamId);
  if (!userTeam) return { ok: false, message: 'Club no encontrado.' };

  const ids = dec.affectedPlayerIds || [];
  const affected = ids.map((id) => userTeam.players.find((p) => p.id === id)).filter(Boolean);
  let summary = '';

  if (optionId === 'GRANT_EXAM_LEAVE') {
    for (const p of affected) {
      ensurePlayerCondition(p);
      p.morale = clamp((p.morale || 70) + 12, 15, 100);
      p.energy = clamp(p.energy + 15, 15, 100);
      // Moverlos a la banca si hay suplentes disponibles para esta fecha
      const sIdx = userTeam.starterIds.indexOf(p.id);
      if (sIdx !== -1 && p.position !== 'ARQ') {
        const subId = userTeam.benchIds.find((bid) => {
          const bp = userTeam.players.find((x) => x.id === bid);
          return bp && !isPlayerUnavailable(bp) && !ids.includes(bid);
        });
        if (subId) {
          const bIdx = userTeam.benchIds.indexOf(subId);
          userTeam.starterIds[sIdx] = subId;
          userTeam.benchIds[bIdx] = p.id;
        }
      }
    }
    summary = `Diste permiso académico a ${affected.map((p) => p.name).join(', ')}. Descansarán esta fecha y el camarín valoró el gesto (+12 Ánimo).`;
  } else {
    for (const p of affected) {
      ensurePlayerCondition(p);
      p.energy = clamp(p.energy - 18, 20, 100);
      p.morale = clamp((p.morale || 70) - 6, 15, 100);
    }
    summary = `Convocaste a ${affected.map((p) => p.name).join(', ')} pese a los certámenes. Jugarán con desgaste físico (-18 Energía).`;
  }

  state.news = [{
    id: `news_exam_${Date.now()}`,
    dateLabel: dec.dateLabel || 'Certámenes',
    category: 'Campus UFRO',
    headline: dec.title,
    body: summary,
  }, ...(state.news || [])].slice(0, 28);

  state.activeDecision = null;
  return { ok: true, message: summary };
}

// =========================================================================
// 5. CAPITÁN Y REFERENTES DEL CAMARÍN
// =========================================================================

export function ensureClubCaptain(club) {
  if (!club || !Array.isArray(club.players) || club.players.length === 0) return null;
  const existing = club.players.find((p) => p.id === club.captainId);
  if (existing) return existing;

  const ranked = [...club.players].sort((a, b) => {
    const scoreA = (a.seasonsAtClub || 1) * 5 + (a.careerMatchValid ? 6 : 0) + (a.ovr || 60) * 0.45 + (a.age || 20) * 0.6;
    const scoreB = (b.seasonsAtClub || 1) * 5 + (b.careerMatchValid ? 6 : 0) + (b.ovr || 60) * 0.45 + (b.age || 20) * 0.6;
    return scoreB - scoreA;
  });
  club.captainId = ranked[0].id;
  return ranked[0];
}

export function setClubCaptain(club, playerId) {
  if (!club || !Array.isArray(club.players)) return { ok: false, message: 'Club no válido.' };
  const target = club.players.find((p) => p.id === playerId);
  if (!target) return { ok: false, message: 'Jugador no encontrado en tu plantel.' };
  if (club.captainId === target.id) {
    return { ok: true, captain: target, message: `${target.name} ya lleva la jineta de capitán.` };
  }
  const prev = club.players.find((p) => p.id === club.captainId);
  if (prev) prev.morale = clamp((prev.morale || 70) - 3, 20, 100);
  club.captainId = target.id;
  target.morale = clamp((target.morale || 70) + 5, 20, 100);
  return {
    ok: true,
    captain: target,
    message: `${target.name} es el nuevo capitán de ${club.name} (+5 Ánimo).`,
  };
}

export function getCaptainImpact(club, isBigMatch = false) {
  const cap = ensureClubCaptain(club);
  if (!cap) return { captain: null, clutchBonus: 0, lossMoraleShield: 0 };
  const isStarter = (club.starterIds || []).includes(cap.id);
  const strongLeader = Boolean(cap.careerMatchValid || (cap.seasonsAtClub || 1) >= 2 || (cap.age || 20) >= 22);
  const clutchBonus = isStarter && isBigMatch ? (strongLeader ? 1.4 : 0.7) : (isStarter && strongLeader ? 0.35 : 0);
  const lossMoraleShield = strongLeader ? 1 : 0;
  return { captain: cap, clutchBonus, lossMoraleShield, strongLeader };
}

// =========================================================================
// 6. PRUEBAS MASIVAS ("CAPTACIÓN DE MECHONES")
// =========================================================================

export function generateFreshmenTryouts(state, rng = Math.random) {
  const userClub = (state?.teams || []).find((t) => t.id === state.userTeamId);
  if (!userClub) return null;
  const div = Number(userClub.division) || 3;
  const baseTarget = div === 1 ? 66 : div === 2 ? 62 : 58;

  const candidates = POSITIONS.map((pos, idx) => {
    const roll = rng();
    // Posibilidad real de joyita oculta (+6 a +10)
    const bonus = roll < 0.22 ? Math.round(6 + rng() * 5) : roll < 0.6 ? Math.round(1 + rng() * 4) : Math.round(-3 + rng() * 3);
    const trueOvr = clamp(baseTarget + bonus, 54, 80);
    const lowSpread = Math.round(2 + rng() * 3);
    const highSpread = Math.round(2 + rng() * 4);
    const estimatedOvrMin = clamp(trueOvr - lowSpread, 50, 82);
    const estimatedOvrMax = clamp(trueOvr + highSpread, estimatedOvrMin + 3, 86);

    const rookie = sanitizePlayer(createSquadPlayer({
      id: `TRYOUT_S${state.season || 1}_${idx}_${Math.floor(rng() * 99999)}`,
      teamId: 'TRYOUT_POOL',
      age: rng() < 0.72 ? 18 : 19,
      academicStage: 'PREGRADO',
      academicYearsCompleted: 0,
      studiedCareer: userClub.career,
      clubCareer: userClub.career,
      position: pos,
      ovr: trueOvr,
      seasonsAtClub: 0,
      jerseyNumber: 30 + idx,
      contractSemesters: 4,
      morale: 84,
      rng,
    }));
    ensurePlayerCondition(rookie);

    return {
      id: rookie.id,
      name: rookie.name,
      age: rookie.age,
      position: rookie.position,
      studiedCareer: rookie.studiedCareer,
      estimatedOvrMin,
      estimatedOvrMax,
      scoutingNote: bonus >= 6
        ? 'Destacó en el partido de prueba: ritmo alto y personalidad.'
        : bonus >= 2
          ? 'Buen manejo en espacios reducidos, proyección interesante.'
          : 'Ordenado tácticamente, opción útil para ampliar rotación.',
      signed: false,
      revealedOvr: null,
      playerData: rookie,
    };
  });

  return {
    season: state.season || 1,
    clubId: userClub.id,
    career: userClub.career,
    maxPicks: 2,
    picksUsed: 0,
    dismissed: false,
    candidates,
  };
}

export function signTryoutCandidate(state, candidateId) {
  if (!state || !state.tryoutSession) return { ok: false, message: 'No hay pruebas masivas activas.' };
  const session = state.tryoutSession;
  if (session.dismissed) return { ok: false, message: 'La jornada de pruebas ya fue cerrada.' };
  if (session.picksUsed >= session.maxPicks) {
    return { ok: false, message: `Ya incorporaste el máximo de ${session.maxPicks} mechones esta temporada.` };
  }
  const userClub = (state.teams || []).find((t) => t.id === state.userTeamId);
  if (!userClub) return { ok: false, message: 'Club no encontrado.' };
  if (userClub.players.length >= 22) {
    return { ok: false, message: 'Plantel lleno (máx. 22 jugadores).' };
  }

  const cand = (session.candidates || []).find((c) => c.id === candidateId);
  if (!cand || cand.signed) return { ok: false, message: 'Postulante no disponible.' };

  const usedJerseys = new Set(userClub.players.map((p) => p.jerseyNumber));
  let jersey = cand.playerData.jerseyNumber || 21;
  while (usedJerseys.has(jersey)) jersey = (jersey % 99) + 1;

  const signedPlayer = sanitizePlayer({
    ...cand.playerData,
    teamId: userClub.id,
    seasonsAtClub: 1,
    jerseyNumber: jersey,
    contractSemesters: 4,
    careerMatchValid: validateTeamCareerMatch(cand.playerData.studiedCareer, userClub.career),
    morale: 85,
  });
  ensurePlayerCondition(signedPlayer);
  signedPlayer.marketValueEur = calculatePlayerValueEur(signedPlayer);

  userClub.players.push(signedPlayer);
  userClub.benchIds.push(signedPlayer.id);
  cand.signed = true;
  cand.revealedOvr = signedPlayer.ovr;
  session.picksUsed += 1;

  state.news = [{
    id: `news_tryout_${signedPlayer.id}`,
    dateLabel: 'Pretemporada',
    category: 'Cantera',
    headline: `Captación de Mechones: ${signedPlayer.name} (${signedPlayer.ovr} OVR) firma gratis en ${userClub.name}`,
    body: `Llegó tras las pruebas masivas de ${userClub.career} como ${signedPlayer.position} (${signedPlayer.age} años, $0 CLP).`,
  }, ...(state.news || [])].slice(0, 28);

  return {
    ok: true,
    player: signedPlayer,
    message: `¡${signedPlayer.name} se sumó gratis! OVR real revelado: ${signedPlayer.ovr} (${signedPlayer.position}).`,
  };
}

export function dismissTryoutSession(state) {
  if (!state?.tryoutSession) return { ok: false };
  state.tryoutSession.dismissed = true;
  return { ok: true, message: 'Jornada de pruebas masivas finalizada.' };
}

// =========================================================================
// 7. PRÉSTAMOS ENTRE CLUBES (1 O 2 SEMESTRES)
// =========================================================================

export function loanOutPlayer(state, playerId, semesters = 2, rng = Math.random) {
  if (!state) return { ok: false, message: 'Estado inválido.' };
  const userClub = (state.teams || []).find((t) => t.id === state.userTeamId);
  if (!userClub) return { ok: false, message: 'Club no encontrado.' };
  if (userClub.players.length <= 9) {
    return { ok: false, message: 'Necesitas al menos 9 jugadores en el plantel para competir.' };
  }

  const pIdx = userClub.players.findIndex((p) => p.id === playerId);
  if (pIdx === -1) return { ok: false, message: 'Jugador no encontrado en tu plantel.' };
  const player = userClub.players[pIdx];
  if (player.loanInfo) return { ok: false, message: `${player.name} ya está a préstamo en tu club.` };

  const isOnlyArq = player.position === 'ARQ' && userClub.players.filter((p) => p.position === 'ARQ').length <= 1;
  if (isOnlyArq) return { ok: false, message: 'No puedes ceder al único arquero del plantel.' };

  const dur = semesters === 1 ? 1 : 2;
  // Buscar destino preferentemente en 2ª o 3ª división donde tenga minutos
  const candidates = state.teams.filter((t) => t.id !== userClub.id && t.players.length < 21 && t.division >= Math.min(3, userClub.division));
  const sameCareerDest = candidates.filter((t) => validateTeamCareerMatch(player.studiedCareer, t.career));
  const dest = pickFrom(sameCareerDest.length > 0 ? sameCareerDest : candidates, rng) || state.teams.find((t) => t.id !== userClub.id);
  if (!dest) return { ok: false, message: 'No hay clubes disponibles para recibir el préstamo.' };

  const baseVal = Number(player.marketValueEur) || calculatePlayerValueEur(player);
  const loanFeeClp = Math.max(4000, Math.round((baseVal * (dur === 2 ? 0.18 : 0.11)) / 1000) * 1000);

  userClub.players.splice(pIdx, 1);
  userClub.starterIds = userClub.starterIds.filter((id) => id !== player.id);
  userClub.benchIds = userClub.benchIds.filter((id) => id !== player.id);
  while (userClub.starterIds.length < 7 && userClub.benchIds.length > 0) {
    userClub.starterIds.push(userClub.benchIds.shift());
  }
  if (userClub.captainId === player.id) ensureClubCaptain(userClub);

  userClub.budgetEur += loanFeeClp;
  player.teamId = dest.id;
  player.transferListed = false;
  player.loanInfo = {
    direction: 'OUT',
    originTeamId: userClub.id,
    originTeamName: userClub.name,
    destTeamId: dest.id,
    destTeamName: dest.name,
    semestersLeft: dur,
    feeClp: loanFeeClp,
  };
  dest.players.push(player);
  dest.benchIds.push(player.id);

  if (!Array.isArray(state.activeLoans)) state.activeLoans = [];
  state.activeLoans.push({
    id: `LOAN_OUT_${player.id}_${Date.now()}`,
    direction: 'OUT',
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    age: player.age,
    ovrAtStart: player.ovr,
    originTeamId: userClub.id,
    originTeamName: userClub.name,
    destTeamId: dest.id,
    destTeamName: dest.name,
    destDivision: dest.division,
    semestersLeft: dur,
    feeClp: loanFeeClp,
  });

  state.news = [{
    id: `news_loanout_${player.id}_${Date.now()}`,
    dateLabel: 'Préstamo',
    category: 'Préstamo',
    headline: `${userClub.name} cede a ${player.name} a ${dest.name} (${dest.division}ª Div)`,
    body: `Cesión por ${dur} ${dur === 1 ? 'semestre' : 'semestres'} (+${formatClp(loanFeeClp)} CLP). Sumará minutos y regresará con mejor OVR.`,
  }, ...(state.news || [])].slice(0, 28);

  return {
    ok: true,
    feeClp: loanFeeClp,
    destName: dest.name,
    message: `${player.name} fue cedido a ${dest.name} (${dur} sem.) por ${formatClp(loanFeeClp)} CLP.`,
  };
}

export function loanInMarketPlayer(state, playerId, semesters = 2, rng = Math.random) {
  if (!state) return { ok: false, message: 'Estado inválido.' };
  const userClub = (state.teams || []).find((t) => t.id === state.userTeamId);
  if (!userClub) return { ok: false, message: 'Club no encontrado.' };
  if (userClub.players.length >= 22) return { ok: false, message: 'Plantel lleno (máx. 22 jugadores).' };

  const dur = semesters === 1 ? 1 : 2;
  let seller = null;
  let pIdx = -1;
  for (const t of state.teams) {
    if (t.id === userClub.id) continue;
    const idx = (t.players || []).findIndex((p) => p.id === playerId);
    if (idx !== -1) {
      seller = t;
      pIdx = idx;
      break;
    }
  }
  if (!seller || pIdx === -1) return { ok: false, message: 'Solo puedes pedir a préstamo jugadores pertenecientes a otros clubes.' };
  if (seller.players.length <= 10) return { ok: false, message: `${seller.name} no tiene suficientes jugadores para ceder.` };

  const target = seller.players[pIdx];
  if (target.loanInfo) return { ok: false, message: `${target.name} ya se encuentra en calidad de préstamo.` };
  if (target.pendingTransferToTeamId) return { ok: false, message: `${target.name} ya tiene un traspaso acordado.` };

  // Reglamento Intercarreras 3/3 jugadores de otra carrera
  const sameCareer = validateTeamCareerMatch(target.studiedCareer, userClub.career);
  const foreignCount = userClub.players.filter((p) => !validateTeamCareerMatch(p.studiedCareer, userClub.career)).length
    + (state.pendingIncomingTransfers || []).filter((pt) => !validateTeamCareerMatch(pt.player?.studiedCareer, userClub.career)).length;
  if (!sameCareer && foreignCount >= MAX_FOREIGN_CAREER_PLAYERS) {
    return {
      ok: false,
      blockedByCareerQuota: true,
      message: `Reglamento Intercarreras: máximo ${MAX_FOREIGN_CAREER_PLAYERS} jugadores de otra carrera (${foreignCount}/${MAX_FOREIGN_CAREER_PLAYERS}).`,
    };
  }

  const baseVal = Number(target.marketValueEur) || calculatePlayerValueEur(target);
  const loanFeeClp = Math.max(6000, Math.round((baseVal * (dur === 2 ? 0.28 : 0.17)) / 1000) * 1000);
  if (userClub.budgetEur < loanFeeClp) {
    return { ok: false, message: `Presupuesto insuficiente (${formatClp(loanFeeClp)} CLP requeridos para el préstamo).` };
  }

  // Titular indiscutido de club superior puede negarse a préstamo
  const isStarterAtSeller = (seller.starterIds || []).includes(target.id);
  const acceptProb = isStarterAtSeller && seller.division <= userClub.division ? 0.55 : 0.85;
  if (rng() > acceptProb) {
    return { ok: false, message: `${seller.name} rechazó ceder a ${target.name} porque lo considera pieza clave.` };
  }

  seller.players.splice(pIdx, 1);
  seller.starterIds = seller.starterIds.filter((id) => id !== target.id);
  seller.benchIds = seller.benchIds.filter((id) => id !== target.id);
  while (seller.starterIds.length < 7 && seller.benchIds.length > 0) {
    seller.starterIds.push(seller.benchIds.shift());
  }

  userClub.budgetEur -= loanFeeClp;
  seller.budgetEur += loanFeeClp;

  const usedJ = new Set(userClub.players.map((p) => p.jerseyNumber));
  let jersey = target.jerseyNumber || 22;
  while (usedJ.has(jersey)) jersey = (jersey % 99) + 1;

  target.teamId = userClub.id;
  target.jerseyNumber = jersey;
  target.careerMatchValid = sameCareer;
  target.morale = clamp((target.morale || 72) + 6, 40, 100);
  target.loanInfo = {
    direction: 'IN',
    originTeamId: seller.id,
    originTeamName: seller.name,
    destTeamId: userClub.id,
    destTeamName: userClub.name,
    semestersLeft: dur,
    feeClp: loanFeeClp,
  };
  ensurePlayerCondition(target);

  userClub.players.push(target);
  userClub.benchIds.push(target.id);

  if (!Array.isArray(state.activeLoans)) state.activeLoans = [];
  state.activeLoans.push({
    id: `LOAN_IN_${target.id}_${Date.now()}`,
    direction: 'IN',
    playerId: target.id,
    playerName: target.name,
    position: target.position,
    age: target.age,
    ovrAtStart: target.ovr,
    originTeamId: seller.id,
    originTeamName: seller.name,
    destTeamId: userClub.id,
    destTeamName: userClub.name,
    destDivision: userClub.division,
    semestersLeft: dur,
    feeClp: loanFeeClp,
  });

  state.news = [{
    id: `news_loanin_${target.id}_${Date.now()}`,
    dateLabel: 'Préstamo',
    category: 'Préstamo',
    headline: `${userClub.name} incorpora a préstamo a ${target.name} (${target.ovr} OVR)`,
    body: `Llega desde ${seller.name} por ${dur} ${dur === 1 ? 'semestre' : 'semestres'} (${formatClp(loanFeeClp)} CLP).`,
  }, ...(state.news || [])].slice(0, 28);

  return {
    ok: true,
    feeClp: loanFeeClp,
    message: `¡${target.name} llegó a préstamo desde ${seller.name} (${dur} sem.) por ${formatClp(loanFeeClp)} CLP!`,
  };
}

export function processActiveLoansStep(state, label = 'Cierre Semestre', rng = Math.random) {
  if (!state || !Array.isArray(state.activeLoans) || state.activeLoans.length === 0) return [];
  const returned = [];
  const remaining = [];
  const byId = new Map((state.teams || []).map((t) => [t.id, t]));

  for (const loan of state.activeLoans) {
    loan.semestersLeft = Math.max(0, (Number(loan.semestersLeft) || 1) - 1);
    const destClub = byId.get(loan.destTeamId);
    const originClub = byId.get(loan.originTeamId);

    if (loan.semestersLeft > 0) {
      const pDest = destClub?.players?.find((p) => p.id === loan.playerId);
      if (pDest?.loanInfo) pDest.loanInfo.semestersLeft = loan.semestersLeft;
      remaining.push(loan);
      continue;
    }

    // Retornar jugador al club de origen
    if (destClub && originClub) {
      const idx = destClub.players.findIndex((p) => p.id === loan.playerId);
      if (idx !== -1) {
        const [player] = destClub.players.splice(idx, 1);
        destClub.starterIds = destClub.starterIds.filter((id) => id !== player.id);
        destClub.benchIds = destClub.benchIds.filter((id) => id !== player.id);
        while (destClub.starterIds.length < 7 && destClub.benchIds.length > 0) {
          destClub.starterIds.push(destClub.benchIds.shift());
        }

        // Progreso acelerado si era cedido joven del usuario
        let ovrGain = 0;
        if (loan.direction === 'OUT') {
          ovrGain = (player.age || 20) <= 21 ? (rng() < 0.55 ? 2 : 1) : (rng() < 0.5 ? 1 : 0);
          player.ovr = clamp((player.ovr || 60) + ovrGain, 52, 92);
          player.marketValueEur = calculatePlayerValueEur(player);
        }

        delete player.loanInfo;
        player.teamId = originClub.id;
        player.careerMatchValid = validateTeamCareerMatch(player.studiedCareer, originClub.career);
        originClub.players.push(player);
        originClub.benchIds.push(player.id);
        returned.push({ ...loan, ovrGain, finalOvr: player.ovr });
      }
    }
  }

  state.activeLoans = remaining;

  if (returned.length > 0) {
    const summary = returned.map((r) =>
      r.direction === 'OUT'
        ? `${r.playerName} volvió a ${r.originTeamName} (${r.finalOvr} OVR${r.ovrGain > 0 ? `, +${r.ovrGain}` : ''})`
        : `${r.playerName} finalizó su préstamo y regresó a ${r.originTeamName}`
    ).join(' · ');

    state.news = [{
      id: `news_loanret_${Date.now()}`,
      dateLabel: label,
      category: 'Préstamos',
      headline: `Fin de préstamos (${label}): ${returned.length} jugador(es) regresan`,
      body: summary,
    }, ...(state.news || [])].slice(0, 28);
  }
  return returned;
}

// =========================================================================
// 8. LISTA DE SEGUIMIENTO (OJEADOR / FAVORITOS)
// =========================================================================

export function toggleWatchlistPlayer(state, playerId) {
  if (!state || !playerId) return { ok: false, watched: false };
  if (!Array.isArray(state.watchlist)) state.watchlist = [];
  const idx = state.watchlist.indexOf(playerId);
  if (idx !== -1) {
    state.watchlist.splice(idx, 1);
    return { ok: true, watched: false, message: 'Jugador quitado de tu lista de seguimiento.' };
  }
  if (state.watchlist.length >= 25) {
    return { ok: false, watched: false, message: 'Lista de seguimiento llena (máx. 25 jugadores).' };
  }
  state.watchlist.unshift(playerId);
  return { ok: true, watched: true, message: 'Jugador añadido a tu lista de seguimiento.' };
}

export function getWatchlistSnapshot(state) {
  if (!state || !Array.isArray(state.watchlist)) return [];
  const userClub = (state.teams || []).find((t) => t.id === state.userTeamId);
  const out = [];

  for (const pid of state.watchlist) {
    const fa = (state.freeAgents || []).find((p) => p.id === pid);
    if (fa) {
      out.push({
        player: sanitizePlayer(fa),
        clubId: 'FREE_AGENT',
        clubName: 'Agente Libre',
        division: null,
        isFreeAgent: true,
        inUserClub: false,
        alerts: ['Agente libre disponible', ...(validateTeamCareerMatch(fa.studiedCareer, userClub?.career || '') ? ['Misma carrera'] : [])],
      });
      continue;
    }

    let found = null;
    for (const t of state.teams || []) {
      const pl = (t.players || []).find((p) => p.id === pid);
      if (pl) {
        found = { player: pl, club: t };
        break;
      }
    }
    if (!found) continue;

    const { player, club } = found;
    const alerts = [];
    if (club.id === state.userTeamId) alerts.push('Ya está en tu plantel');
    if (player.transferListed) alerts.push('En lista de venta');
    if ((player.morale || 70) < 52) alerts.push('Ánimo bajo · busca salida');
    if ((player.contractSemesters || 1) <= 1) alerts.push('Contrato por vencer');
    if (validateTeamCareerMatch(player.studiedCareer, userClub?.career || '')) alerts.push('Misma carrera');

    out.push({
      player: sanitizePlayer(player),
      clubId: club.id,
      clubName: club.name,
      division: club.division,
      isFreeAgent: false,
      inUserClub: club.id === state.userTeamId,
      alerts: alerts.length > 0 ? alerts : ['En seguimiento'],
    });
  }
  return out;
}

// =========================================================================
// 9. NEGOCIACIÓN PERSONALIZADA AL FICHAR (OFERTA CLP + TRUEQUE)
// =========================================================================

export function evaluateCustomTransferOffer(state, playerId, { cashOfferClp = 0, swapPlayerId = '' } = {}, rng = Math.random) {
  const userClub = (state?.teams || []).find((t) => t.id === state.userTeamId);
  if (!userClub) return { ok: false, outcome: 'INVALID', message: 'Club no encontrado.' };

  let seller = null;
  let target = null;
  for (const t of state.teams || []) {
    if (t.id === userClub.id) continue;
    const pl = (t.players || []).find((p) => p.id === playerId);
    if (pl) {
      seller = t;
      target = pl;
      break;
    }
  }
  if (!seller || !target) return { ok: false, outcome: 'INVALID', message: 'Jugador de club no encontrado.' };

  const swapPlayer = swapPlayerId ? userClub.players.find((p) => p.id === swapPlayerId) : null;
  const cash = Math.max(0, Math.round((Number(cashOfferClp) || 0) / 1000) * 1000);
  const targetVal = Number(target.marketValueEur) || calculatePlayerValueEur(target);

  // Valorización del jugador entregado en trueque
  let swapCredit = 0;
  if (swapPlayer) {
    const swapBase = Number(swapPlayer.marketValueEur) || calculatePlayerValueEur(swapPlayer);
    const sameCareerForSeller = validateTeamCareerMatch(swapPlayer.studiedCareer, seller.career);
    const factor = sameCareerForSeller ? 0.95 : 0.78;
    swapCredit = Math.round((swapBase * factor) / 1000) * 1000;
  }

  // Precio objetivo del club vendedor
  const isStarter = (seller.starterIds || []).includes(target.id);
  const unhappy = (target.morale || 70) < 55;
  const listed = Boolean(target.transferListed);
  const multiplier = listed ? 0.88 : unhappy ? 0.95 : isStarter ? 1.12 : 1.02;
  const askingTotal = Math.max(10000, Math.round((targetVal * multiplier) / 1000) * 1000);

  const totalPackage = cash + swapCredit;
  const ratio = totalPackage / Math.max(1, askingTotal);

  // Evaluar aceptación / contraoferta / rechazo
  if (ratio >= 0.96 || (ratio >= 0.88 && rng() < 0.65)) {
    return {
      ok: true,
      outcome: 'ACCEPTED',
      cashClp: cash,
      swapCreditClp: swapCredit,
      totalPackageClp: totalPackage,
      askingTotalClp: askingTotal,
      seller,
      target,
      swapPlayer,
      message: `${seller.name} aceptó la propuesta por ${target.name}${swapPlayer ? ` (incluyendo a ${swapPlayer.name})` : ''}.`,
    };
  }

  if (ratio >= 0.72) {
    const neededCash = Math.max(0, Math.round(((askingTotal * 0.97) - swapCredit) / 1000) * 1000);
    return {
      ok: false,
      outcome: 'COUNTER',
      counterCashClp: neededCash,
      swapCreditClp: swapCredit,
      askingTotalClp: askingTotal,
      message: `${seller.name} considera insuficiente ${formatClp(cash)} CLP${swapPlayer ? ` + ${swapPlayer.name}` : ''}. Contraofertan pidiendo ${formatClp(neededCash)} CLP${swapPlayer ? ` + ${swapPlayer.name}` : ''}.`,
    };
  }

  return {
    ok: false,
    outcome: 'REJECTED',
    askingTotalClp: askingTotal,
    swapCreditClp: swapCredit,
    message: `${seller.name} rechazó la oferta por ser demasiado baja (pretenden cerca de ${formatClp(askingTotal)} CLP en valor total).`,
  };
}

export function submitCustomTransferOffer(state, playerId, { cashOfferClp = 0, swapPlayerId = '' } = {}, rng = Math.random, hooks = {}) {
  const userClub = (state?.teams || []).find((t) => t.id === state.userTeamId);
  if (!userClub) return { ok: false, outcome: 'INVALID', message: 'Club no encontrado.' };

  const evalRes = evaluateCustomTransferOffer(state, playerId, { cashOfferClp, swapPlayerId }, rng);
  if (evalRes.outcome === 'INVALID') return evalRes;

  const cash = Math.max(0, Math.round((Number(cashOfferClp) || 0) / 1000) * 1000);
  if (userClub.budgetEur < cash) {
    return { ok: false, outcome: 'INVALID', message: `Presupuesto insuficiente (${formatClp(cash)} CLP ofertados).` };
  }

  const swapPlayer = swapPlayerId ? userClub.players.find((p) => p.id === swapPlayerId) : null;
  if (swapPlayer) {
    if (swapPlayer.loanInfo) {
      return { ok: false, outcome: 'INVALID', message: 'No puedes incluir en trueque a un jugador que está a préstamo.' };
    }
    const isOnlyArq = swapPlayer.position === 'ARQ' && userClub.players.filter((p) => p.position === 'ARQ').length <= 1;
    if (isOnlyArq) {
      return { ok: false, outcome: 'INVALID', message: 'No puedes incluir al único arquero de tu plantel en un trueque.' };
    }
  }

  // Verificar cuota de 3/3 jugadores de otra carrera (descontando si el swap saliente era foráneo)
  const target = evalRes.target || state.teams.flatMap((t) => t.players).find((p) => p.id === playerId);
  if (target) {
    const incomingIsSameCareer = validateTeamCareerMatch(target.studiedCareer, userClub.career);
    const outgoingIsForeign = swapPlayer ? !validateTeamCareerMatch(swapPlayer.studiedCareer, userClub.career) : false;
    const currentForeign = userClub.players.filter((p) => !validateTeamCareerMatch(p.studiedCareer, userClub.career)).length
      + (state.pendingIncomingTransfers || []).filter((pt) => !validateTeamCareerMatch(pt.player?.studiedCareer, userClub.career)).length;
    const projectedForeign = currentForeign - (outgoingIsForeign ? 1 : 0) + (incomingIsSameCareer ? 0 : 1);
    if (!incomingIsSameCareer && projectedForeign > MAX_FOREIGN_CAREER_PLAYERS) {
      return {
        ok: false,
        outcome: 'BLOCKED',
        blockedByCareerQuota: true,
        message: `Reglamento Intercarreras: máximo ${MAX_FOREIGN_CAREER_PLAYERS} jugadores de otra carrera.`,
      };
    }
  }

  if (!evalRes.ok) return evalRes;

  const { seller } = evalRes;
  const sellerIdx = seller.players.findIndex((p) => p.id === target.id);
  if (sellerIdx === -1) return { ok: false, outcome: 'INVALID', message: 'Jugador ya no disponible.' };
  if (seller.players.length <= 10 && !swapPlayer) {
    return { ok: false, outcome: 'REJECTED', message: `${seller.name} no puede quedar con menos de 10 jugadores sin trueque.` };
  }

  const windowOpen = hooks.isWindowOpen ? hooks.isWindowOpen(state) : Boolean(state.marketOpen);
  const nextWindowLabel = hooks.nextWindowLabel || 'Próxima Ventana';

  userClub.budgetEur -= cash;
  seller.budgetEur += cash;

  // Ejecutar trueque saliente inmediatamente si el jugador fue incluido
  if (swapPlayer) {
    const uIdx = userClub.players.findIndex((p) => p.id === swapPlayer.id);
    if (uIdx !== -1) {
      userClub.players.splice(uIdx, 1);
      userClub.starterIds = userClub.starterIds.filter((id) => id !== swapPlayer.id);
      userClub.benchIds = userClub.benchIds.filter((id) => id !== swapPlayer.id);
      while (userClub.starterIds.length < 7 && userClub.benchIds.length > 0) {
        userClub.starterIds.push(userClub.benchIds.shift());
      }
      if (userClub.captainId === swapPlayer.id) ensureClubCaptain(userClub);
      swapPlayer.teamId = seller.id;
      swapPlayer.transferListed = false;
      swapPlayer.seasonsAtClub = 1;
      swapPlayer.careerMatchValid = validateTeamCareerMatch(swapPlayer.studiedCareer, seller.career);
      seller.players.push(swapPlayer);
      seller.benchIds.push(swapPlayer.id);
    }
  }

  if (windowOpen) {
    seller.players.splice(sellerIdx, 1);
    seller.starterIds = seller.starterIds.filter((id) => id !== target.id);
    seller.benchIds = seller.benchIds.filter((id) => id !== target.id);
    while (seller.starterIds.length < 7 && seller.benchIds.length > 0) {
      seller.starterIds.push(seller.benchIds.shift());
    }
    const usedJ = new Set(userClub.players.map((p) => p.jerseyNumber));
    let j = target.jerseyNumber || 15;
    while (usedJ.has(j)) j = (j % 99) + 1;
    target.teamId = userClub.id;
    target.jerseyNumber = j;
    target.transferListed = false;
    target.seasonsAtClub = 1;
    target.careerMatchValid = validateTeamCareerMatch(target.studiedCareer, userClub.career);
    target.morale = clamp((target.morale || 72) + 8, 45, 100);
    ensurePlayerCondition(target);
    userClub.players.push(target);
    userClub.benchIds.push(target.id);
  } else {
    target.pendingTransferToTeamId = userClub.id;
    if (!Array.isArray(state.pendingIncomingTransfers)) state.pendingIncomingTransfers = [];
    state.pendingIncomingTransfers.push({
      id: `PRE_NEG_${target.id}_${Date.now()}`,
      player: sanitizePlayer(target),
      fromTeamId: seller.id,
      fromTeamName: seller.name,
      fee: cash,
      targetWindow: nextWindowLabel,
    });
  }

  recordLedgerTransfer(state, 'SIGNING', {
    playerName: target.name,
    position: target.position,
    ovr: target.ovr,
    feeClp: cash + (evalRes.swapCreditClp || 0),
    otherClubName: seller.name,
    season: state.season || 1,
  });

  const swapText = swapPlayer ? ` + ${swapPlayer.name}` : '';
  state.news = [{
    id: `news_neg_${target.id}_${Date.now()}`,
    dateLabel: windowOpen ? 'Fichaje' : 'Pre-Acuerdo',
    category: 'Negociación',
    headline: `¡Acuerdo cerrado! ${target.name} llega a ${userClub.name} desde ${seller.name}`,
    body: `Operación negociada por ${formatClp(cash)} CLP${swapText}${windowOpen ? '.' : ` (se suma en ${nextWindowLabel}).`}`,
  }, ...(state.news || [])].slice(0, 28);

  return {
    ok: true,
    outcome: 'ACCEPTED',
    preAgreement: !windowOpen,
    cashClp: cash,
    swapPlayerName: swapPlayer?.name || null,
    message: windowOpen
      ? `¡Fichaje cerrado! ${target.name} se sumó por ${formatClp(cash)} CLP${swapText}.`
      : `¡Pre-acuerdo cerrado! ${target.name} llegará en ${nextWindowLabel} (${formatClp(cash)} CLP${swapText}).`,
  };
}

// =========================================================================
// 10. ESTADÍSTICAS DE LIGA (GOLEADORES, ASISTIDORES, VALLAS Y 7 IDEAL / MVP)
// =========================================================================

export function getDivisionPlayerLeaders(state, divKey = 'ALL') {
  if (!state || !Array.isArray(state.teams)) {
    return { scorers: [], assisters: [], cleanSheets: [] };
  }

  const teams = state.teams.filter((t) => {
    if (divKey === 'ALL') return true;
    if (divKey === 'div1') return t.division === 1;
    if (divKey === 'div2') return t.division === 2;
    if (divKey === 'div3A') return t.division === 3 && t.conf === 'A';
    if (divKey === 'div3B') return t.division === 3 && t.conf === 'B';
    return true;
  });

  const rows = [];
  for (const t of teams) {
    for (const p of t.players || []) {
      const st = p.stats || { matches: 0, goals: 0, assists: 0, cleanSheets: 0, ratingSum: 0 };
      const avgRating = st.matches > 0 ? Number((st.ratingSum / st.matches).toFixed(2)) : 0;
      rows.push({
        id: p.id,
        name: p.name,
        position: p.position,
        ovr: p.ovr,
        teamId: t.id,
        teamName: t.name,
        division: t.division,
        isUserClub: t.id === state.userTeamId,
        matches: st.matches || 0,
        goals: st.goals || 0,
        assists: st.assists || 0,
        cleanSheets: st.cleanSheets || 0,
        avgRating,
      });
    }
  }

  const scorers = [...rows]
    .filter((r) => r.goals > 0)
    .sort((a, b) => (b.goals - a.goals) || (b.assists - a.assists) || (b.ovr - a.ovr))
    .slice(0, 10);

  const assisters = [...rows]
    .filter((r) => r.assists > 0)
    .sort((a, b) => (b.assists - a.assists) || (b.goals - a.goals) || (b.ovr - a.ovr))
    .slice(0, 10);

  const cleanSheets = [...rows]
    .filter((r) => r.position === 'ARQ' && r.cleanSheets > 0)
    .sort((a, b) => (b.cleanSheets - a.cleanSheets) || (b.avgRating - a.avgRating) || (b.ovr - a.ovr))
    .slice(0, 10);

  return { scorers, assisters, cleanSheets };
}

export function buildSeasonBestSeven(state, divKey = 'ALL') {
  if (!state || !Array.isArray(state.teams)) return { bestSeven: [], mvp: null };
  const teams = state.teams.filter((t) => {
    if (divKey === 'ALL') return true;
    if (divKey === 'div1') return t.division === 1;
    if (divKey === 'div2') return t.division === 2;
    if (divKey === 'div3A') return t.division === 3 && t.conf === 'A';
    if (divKey === 'div3B') return t.division === 3 && t.conf === 'B';
    return true;
  });

  const pool = [];
  for (const t of teams) {
    for (const p of t.players || []) {
      const st = p.stats || { matches: 0, goals: 0, assists: 0, cleanSheets: 0, ratingSum: 0 };
      const avgRating = st.matches > 0 ? st.ratingSum / st.matches : 6.0;
      const impact =
        (st.goals || 0) * 5.2 +
        (st.assists || 0) * 3.8 +
        (st.cleanSheets || 0) * (p.position === 'ARQ' ? 5.5 : 1.2) +
        (avgRating - 6.0) * 7 +
        (p.ovr || 60) * 0.35 +
        Math.min(12, st.matches || 0) * 0.4;

      pool.push({
        id: p.id,
        name: p.name,
        position: p.position,
        ovr: p.ovr,
        teamId: t.id,
        teamName: t.name,
        division: t.division,
        isUserClub: t.id === state.userTeamId,
        matches: st.matches || 0,
        goals: st.goals || 0,
        assists: st.assists || 0,
        cleanSheets: st.cleanSheets || 0,
        avgRating: Number(avgRating.toFixed(2)),
        impact: Number(impact.toFixed(1)),
      });
    }
  }

  const pickByPos = (pos, count) =>
    pool.filter((r) => r.position === pos).sort((a, b) => b.impact - a.impact).slice(0, count);

  const bestSeven = [
    ...pickByPos('ARQ', 1),
    ...pickByPos('DEF', 2),
    ...pickByPos('MED', 3),
    ...pickByPos('DEL', 1),
  ];
  const mvp = [...bestSeven].sort((a, b) => b.impact - a.impact)[0] || null;
  return { bestSeven, mvp };
}

// =========================================================================
// 11. HISTORIAL Y VITRINA DEL DT
// =========================================================================

export function ensureDtLedger(state) {
  if (!state) return null;
  const userClub = (state.teams || []).find((t) => t.id === state.userTeamId);
  if (!state.dtLedger) {
    state.dtLedger = {
      stints: [],
      biggestWin: null,
      biggestSigning: null,
      biggestSale: null,
      copaTitles: 0,
      totalGoalsFor: 0,
      totalGoalsAgainst: 0,
    };
  }
  if (!Array.isArray(state.dtLedger.stints)) state.dtLedger.stints = [];
  if (state.dtLedger.stints.length === 0 && userClub) {
    state.dtLedger.stints.push({
      clubId: userClub.id,
      clubName: userClub.name,
      divisionStart: userClub.division,
      divisionCurrent: userClub.division,
      seasonStart: state.season || 1,
      seasonEnd: null,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      trophies: [],
    });
  }
  return state.dtLedger;
}

export function recordLedgerMatchResult(state, home, away, hg, ag, meta = {}) {
  const ledger = ensureDtLedger(state);
  if (!ledger || !home || !away) return;
  const uid = state.userTeamId;
  const isHome = home.id === uid;
  const isAway = away.id === uid;
  if (!isHome && !isAway) return;

  const uf = isHome ? hg : ag;
  const ua = isHome ? ag : hg;
  const opp = isHome ? away : home;

  ledger.totalGoalsFor = (ledger.totalGoalsFor || 0) + uf;
  ledger.totalGoalsAgainst = (ledger.totalGoalsAgainst || 0) + ua;

  const stint = ledger.stints[ledger.stints.length - 1];
  if (stint) {
    stint.matches += 1;
    stint.gf += uf;
    stint.ga += ua;
    if (uf > ua) stint.wins += 1;
    else if (uf === ua) stint.draws += 1;
    else stint.losses += 1;
  }

  const margin = uf - ua;
  if (margin > 0) {
    const prevMargin = ledger.biggestWin ? (ledger.biggestWin.uf - ledger.biggestWin.ua) : -1;
    if (margin > prevMargin || (margin === prevMargin && uf > (ledger.biggestWin?.uf || 0))) {
      ledger.biggestWin = {
        season: state.season || 1,
        clubName: (isHome ? home : away).name,
        opponentName: opp.name,
        score: `${uf}-${ua}`,
        uf,
        ua,
        competition: meta.isCopa ? 'Copa Intercarreras' : 'Liga',
      };
    }
  }
}

export function recordLedgerTransfer(state, type, info = {}) {
  const ledger = ensureDtLedger(state);
  if (!ledger || !info.playerName) return;
  const fee = Number(info.feeClp) || 0;
  if (type === 'SIGNING') {
    if (!ledger.biggestSigning || fee > (ledger.biggestSigning.feeClp || 0)) {
      ledger.biggestSigning = { ...info, feeClp: fee };
    }
  } else if (type === 'SALE') {
    if (!ledger.biggestSale || fee > (ledger.biggestSale.feeClp || 0)) {
      ledger.biggestSale = { ...info, feeClp: fee };
    }
  }
}

export function recordLedgerClubSwitch(state, prevClub, newClub) {
  const ledger = ensureDtLedger(state);
  if (!ledger || !newClub) return;
  const prevStint = ledger.stints[ledger.stints.length - 1];
  if (prevStint && prevStint.seasonEnd == null) {
    prevStint.seasonEnd = state.season || 1;
    if (prevClub) prevStint.divisionCurrent = prevClub.division;
  }
  ledger.stints.push({
    clubId: newClub.id,
    clubName: newClub.name,
    divisionStart: newClub.division,
    divisionCurrent: newClub.division,
    seasonStart: state.season || 1,
    seasonEnd: null,
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    trophies: [],
  });
}

export function recordLedgerTrophy(state, title, { isCopa = false } = {}) {
  const ledger = ensureDtLedger(state);
  if (!ledger || !title) return;
  if (isCopa) ledger.copaTitles = (ledger.copaTitles || 0) + 1;
  const stint = ledger.stints[ledger.stints.length - 1];
  if (stint && !stint.trophies.includes(title)) {
    stint.trophies.push(title);
  }
}

// =========================================================================
// 12. COPA INTERCARRERAS (32 EQUIPOS · ELIMINACIÓN DIRECTA 1ª + 2ª + 3ª)
// =========================================================================

export const COPA_ROUNDS = [
  { key: 'R32', label: 'Dieciseisavos (32)', triggerRound: 3 },
  { key: 'R16', label: 'Octavos de Final', triggerRound: 5 },
  { key: 'QF', label: 'Cuartos de Final', triggerRound: 7 },
  { key: 'SF', label: 'Semifinales', triggerRound: 9 },
  { key: 'FINAL', label: 'Gran Final', triggerRound: 11 },
];

function shuffleWithRng(list, rng = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildCopaRoundMatches(teamIds, roundKey, season) {
  const matches = [];
  for (let i = 0; i + 1 < teamIds.length; i += 2) {
    matches.push({
      id: `COPA_S${season}_${roundKey}_${i / 2 + 1}`,
      roundKey,
      homeId: teamIds[i],
      awayId: teamIds[i + 1],
      homeScore: null,
      awayScore: null,
      penWinner: null,
      winnerId: null,
      played: false,
    });
  }
  return matches;
}

export function initializeCopaIntercarreras(state, rng = Math.random) {
  const teams = state?.teams || [];
  if (teams.length < 32) return null;
  const uid = state.userTeamId;
  const userClub = teams.find((t) => t.id === uid);

  const d1 = shuffleWithRng(teams.filter((t) => t.division === 1 && t.id !== uid), rng);
  const d2 = shuffleWithRng(teams.filter((t) => t.division === 2 && t.id !== uid), rng);
  const d3 = shuffleWithRng(teams.filter((t) => t.division === 3 && t.id !== uid), rng);

  const selected = [];
  if (userClub) selected.push(userClub);
  // Mezclar las 3 divisiones equitativamente hasta completar 32 equipos
  const buckets = [d1, d2, d3];
  let bIdx = 0;
  while (selected.length < 32 && (d1.length > 0 || d2.length > 0 || d3.length > 0)) {
    const bucket = buckets[bIdx % 3];
    if (bucket.length > 0) selected.push(bucket.shift());
    bIdx += 1;
  }

  const seededIds = shuffleWithRng(selected.map((t) => t.id), rng);
  const season = state.season || 1;
  return {
    season,
    activeRoundIndex: 0,
    completed: false,
    championId: null,
    runnerUpId: null,
    userEliminatedRound: null,
    rounds: {
      R32: buildCopaRoundMatches(seededIds, 'R32', season),
      R16: [],
      QF: [],
      SF: [],
      FINAL: [],
    },
  };
}

export function getPendingUserCopaMatch(state) {
  const copa = state?.copa;
  if (!copa || copa.completed) return null;
  const roundMeta = COPA_ROUNDS[copa.activeRoundIndex];
  if (!roundMeta) return null;
  const matches = copa.rounds?.[roundMeta.key] || [];
  const match = matches.find((m) => !m.played && (m.homeId === state.userTeamId || m.awayId === state.userTeamId));
  if (!match) return null;
  return {
    roundIndex: copa.activeRoundIndex,
    roundKey: roundMeta.key,
    roundLabel: roundMeta.label,
    triggerRound: roundMeta.triggerRound,
    match,
  };
}

export function advanceCopaRound(state, rng = Math.random, options = {}) {
  const copa = state?.copa;
  if (!copa || copa.completed) return { ok: false, completed: true };

  const roundMeta = COPA_ROUNDS[copa.activeRoundIndex];
  if (!roundMeta) return { ok: false, completed: true };

  const matches = copa.rounds[roundMeta.key] || [];
  const byId = new Map((state.teams || []).map((t) => [t.id, t]));
  const uid = state.userTeamId;
  const userClub = byId.get(uid);
  const simFn = options.simulateMatchFn;
  const userOverride = options.userMatchOverride || null;

  const winners = [];
  let userResult = null;

  for (const m of matches) {
    if (!m.played) {
      const home = byId.get(m.homeId);
      const away = byId.get(m.awayId);
      let hg = 0;
      let ag = 0;
      let penWinner = null;

      if (userOverride && userOverride.matchId === m.id) {
        hg = userOverride.hg;
        ag = userOverride.ag;
        penWinner = userOverride.penWinner || null;
        if (hg === ag && !penWinner) {
          penWinner = rng() < 0.5 ? m.homeId : m.awayId;
        }
      } else if (simFn && home && away) {
        const res = simFn(home, away, false, rng);
        hg = res.hg;
        ag = res.ag;
        penWinner = res.penWinner;
      } else {
        hg = Math.floor(rng() * 4);
        ag = Math.floor(rng() * 4);
        if (hg === ag) penWinner = rng() < 0.5 ? m.homeId : m.awayId;
      }

      m.homeScore = hg;
      m.awayScore = ag;
      m.penWinner = penWinner;
      m.winnerId = hg > ag ? m.homeId : ag > hg ? m.awayId : (penWinner || m.homeId);
      m.played = true;

      if (home && away && (m.homeId === uid || m.awayId === uid)) {
        const userWon = m.winnerId === uid;
        const opp = m.homeId === uid ? away : home;
        recordLedgerMatchResult(state, home, away, hg, ag, { isCopa: true });
        if (options.onUserMatchFinished) {
          options.onUserMatchFinished({ home, away, hg, ag, userWon, penWinner, roundMeta });
        }
        const prize = userWon ? (roundMeta.key === 'FINAL' ? 95000 : 20000) : 5000;
        if (userClub) userClub.budgetEur += prize;
        userResult = {
          roundLabel: roundMeta.label,
          homeName: home.name,
          awayName: away.name,
          opponentName: opp.name,
          hg,
          ag,
          penWinner,
          userWon,
          prize,
        };
        if (!userWon) copa.userEliminatedRound = roundMeta.label;
      }
    }
    if (m.winnerId) winners.push(m.winnerId);
  }

  if (copa.activeRoundIndex + 1 < COPA_ROUNDS.length) {
    const nextMeta = COPA_ROUNDS[copa.activeRoundIndex + 1];
    copa.rounds[nextMeta.key] = buildCopaRoundMatches(winners, nextMeta.key, copa.season);
    copa.activeRoundIndex += 1;
  } else {
    // Final concluida
    const finalMatch = matches[0];
    copa.completed = true;
    copa.championId = finalMatch?.winnerId || winners[0] || null;
    copa.runnerUpId = finalMatch ? (finalMatch.homeId === copa.championId ? finalMatch.awayId : finalMatch.homeId) : null;

    const champ = byId.get(copa.championId);
    const runner = byId.get(copa.runnerUpId);
    if (copa.championId === uid) {
      const title = `🏆 Campeón Copa Intercarreras (Temp. ${copa.season})`;
      if (!Array.isArray(state.careerAchievements)) state.careerAchievements = [];
      if (!state.careerAchievements.some((a) => a.title === title)) {
        state.careerAchievements.push({ season: copa.season, title, points: 220, division: 0 });
      }
      recordLedgerTrophy(state, title, { isCopa: true });
    }

    state.news = [{
      id: `news_copachamp_s${copa.season}`,
      dateLabel: 'Copa UFRO',
      category: 'Copa Intercarreras',
      headline: `🏆 ¡${champ?.name || 'Campeón'} conquista la Copa Intercarreras Temp. ${copa.season}!`,
      body: `Venció a ${runner?.name || 'finalista'} (${finalMatch?.homeScore ?? 0}-${finalMatch?.awayScore ?? 0}) en el torneo que reunió a las tres divisiones.`,
    }, ...(state.news || [])].slice(0, 28);
  }

  if (userResult) {
    const penNote = userResult.hg === userResult.ag ? ' (penales)' : '';
    state.news = [{
      id: `news_copa_${roundMeta.key}_${Date.now()}`,
      dateLabel: 'Copa UFRO',
      category: 'Copa Intercarreras',
      headline: userResult.userWon
        ? `Copa (${roundMeta.label}): ${userClub?.name} avanza tras vencer a ${userResult.opponentName}`
        : `Copa (${roundMeta.label}): ${userClub?.name} queda eliminado ante ${userResult.opponentName}`,
      body: `Marcador ${userResult.homeName} ${userResult.hg}-${userResult.ag} ${userResult.awayName}${penNote}. Premio de llave: +${formatClp(userResult.prize)} CLP.`,
    }, ...(state.news || [])].slice(0, 28);
  }

  return { ok: true, roundKey: roundMeta.key, roundLabel: roundMeta.label, userResult, completed: copa.completed };
}
