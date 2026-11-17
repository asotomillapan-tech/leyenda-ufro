// Pure deterministic & configurable simulation engine for LEYENDAS v0.2.5
import {
  EXTRA_FOOTBALL_CAREERS,
  EXTRA_LOWER_DIV_FOOTBALL_TEAMS,
  BASKETBALL_MALE_CATALOG,
  FOCUS_CARD_POOL,
  KEY_MOMENT_TEMPLATES,
  CAREER_EXCLUSIVE_EVENTS_ALL,
} from './leyendas-data.js';

export {
  EXTRA_FOOTBALL_CAREERS,
  EXTRA_LOWER_DIV_FOOTBALL_TEAMS,
  BASKETBALL_MALE_CATALOG,
  FOCUS_CARD_POOL,
  KEY_MOMENT_TEMPLATES,
  CAREER_EXCLUSIVE_EVENTS_ALL,
};

export const OVR_HARD_CAP = 104;
export const OVR_DISPLAY_MAX = 99;

export const SPORT_CONFIG = {
  FUTBOL: {
    id: 'FUTBOL',
    label: 'Fútbol',
    icon: '⚽',
    positions: ['DEL', 'MED', 'DEF', 'ARQ'],
    defaultPosition: 'MED',
    matchesS1: 11,
    matchesS2: 14,
    ufroMatchesS1: 4,
    ufroMatchesS2: 6,
    supportsFemale: true,
    hasDivisionsForMale: true,
  },
  BASKET: {
    id: 'BASKET',
    label: 'Básquetbol',
    icon: '🏀',
    positions: ['BASE', 'ESC', 'ALE', 'AP', 'PIV'],
    defaultPosition: 'BASE',
    matchesS1: 9,
    matchesS2: 11,
    ufroMatchesS1: 4,
    ufroMatchesS2: 5,
    supportsFemale: false,
    hasDivisionsForMale: false,
  },
};

export const GPA_THRESHOLDS = {
  MIN: 2.8,
  MAX: 7.0,
  FAIL_SAFE: 4.9,
  DANGER: 4.4,
  SCHOLARSHIP: 5.6,
  SCHOLARSHIP_KEEP: 5.1,
  MASTERS: 5.3,
  PHD: 5.6,
};

export function clamp(min, max, val) {
  return Math.max(min, Math.min(max, val));
}

export function getPlayerAge(currentYear) {
  return 17 + Math.max(1, Number(currentYear) || 1);
}

export function getSportPositions(sport = 'FUTBOL') {
  return (SPORT_CONFIG[sport] || SPORT_CONFIG.FUTBOL).positions;
}

// =========================================================================
// 1. MEDIA (OVR) CURVE: EARLY GROWTH, PLATEAU (21-22), BURNOUT DECLINE (23+)
// =========================================================================
export function computeSemesterOvrChange({
  ovr,
  isProdigy = false,
  currentYear = 1,
  avgRating = 7.0,
  playedRatio = 0.8,
  gpa = 5.3,
  focusCard = null,
  isSuspended = false,
  isTrainingOnlyS2 = false,
  hasScholarship = false,
  rng = Math.random,
}) {
  const age = getPlayerAge(currentYear);
  const numRating = Number(avgRating) || 0;

  if (isSuspended) {
    const suspendedDecay = age >= 23 ? -1 : 0;
    const nextOvr = clamp(52, OVR_HARD_CAP, ovr + suspendedDecay);
    return { delta: nextOvr - ovr, nextOvr, age, phaseLabel: 'Baja / Inactivo' };
  }

  let baseDelta = 0;
  let phaseLabel = 'Crecimiento Inicial';

  if (age <= 20) {
    // Años 1 a 3 (18-20 años): etapa de desarrollo natural
    phaseLabel = 'Explosión Juvenil';
    if (isTrainingOnlyS2) {
      baseDelta = isProdigy ? (rng() < 0.45 ? 2 : 1) : (ovr < 72 && rng() < 0.45 ? 2 : 1);
    } else if (isProdigy) {
      baseDelta = numRating >= 7.7 ? 2 : 1;
      if (ovr < 76 && rng() < 0.5) baseDelta += 1;
    } else {
      if (playedRatio >= 0.72 && numRating >= 7.6) baseDelta = 2;
      else if (ovr < 66 && rng() < 0.5) baseDelta = 2;
      else baseDelta = 1;
    }
  } else if (age <= 22) {
    // Años 4 y 5 (21-22 años): meseta / madurez y presión de ramos terminales
    phaseLabel = age === 21 ? 'Madurez (4° Año)' : 'Tope Carga Pregrado (5° Año)';
    if (age === 21) {
      if (isProdigy) {
        baseDelta = numRating >= 8.1 && ovr < 92 ? 2 : 1;
      } else {
        baseDelta = playedRatio >= 0.65 && numRating >= 7.5 ? 1 : 0;
      }
    } else {
      // 22 años: comienza la fricción académica fuerte
      if (gpa < 4.5 && !hasScholarship && rng() < 0.55) {
        baseDelta = -1;
      } else if (isProdigy && numRating >= 8.1 && ovr < 93) {
        baseDelta = 1;
      } else if (hasScholarship && numRating >= 7.8 && rng() < 0.55) {
        baseDelta = 1;
      } else {
        baseDelta = 0;
      }
    }
  } else {
    // 23+ años (Año 6+, prácticas, internados, Magíster, Doctorado): desgaste por carga académica
    phaseLabel = 'Sobrecarga Académica / Declive';
    if (gpa < 4.7 && !hasScholarship && rng() < 0.55) {
      baseDelta = -2;
    } else if (hasScholarship && numRating >= 8.0 && rng() < 0.5) {
      baseDelta = 0;
    } else {
      baseDelta = -1;
    }
  }

  // Aplicar modificador de Carta de Foco del Semestre
  let cardDelta = 0;
  if (focusCard) {
    const rawBonus = Number(focusCard.ovrBonus) || 0;
    if (age <= 20) {
      cardDelta = rawBonus;
    } else if (age <= 22) {
      cardDelta = focusCard.tier === 'ORO'
        ? Math.max(1, rawBonus - 1)
        : Math.max(0, rawBonus - 1);
    } else {
      // A los 23+ años, Descanso o Físico Plata/Oro amortigua el declive
      if (focusCard.category === 'DESCANSO' && focusCard.tier !== 'BRONCE') {
        cardDelta = focusCard.tier === 'ORO' ? 2 : 1;
      } else if (focusCard.category === 'FISICO' && focusCard.tier === 'ORO' && numRating >= 8.2) {
        cardDelta = 2;
      } else if (rawBonus >= 2) {
        cardDelta = 1;
      }
    }
  }

  let totalDelta = baseDelta + cardDelta;

  // Desaceleración cerca de la élite absoluta (OVR >= 92)
  if (ovr >= 94 && totalDelta > 1) totalDelta = 1;
  else if (ovr >= 88 && age >= 21 && totalDelta > 2) totalDelta = 2;

  // Tope máximo por semestre para evitar saltos irreales hacia el 🐐
  if (totalDelta > 4) totalDelta = 4;
  if (age >= 21 && totalDelta > 2 && (!focusCard || focusCard.tier !== 'ORO')) totalDelta = 2;

  const nextOvr = clamp(52, OVR_HARD_CAP, ovr + totalDelta);
  return {
    delta: nextOvr - ovr,
    nextOvr,
    age,
    phaseLabel,
  };
}

// =========================================================================
// 2. PROMEDIO DE NOTAS (OCULTO), BECAS, RIESGO DE REPROBAR Y POSTGRADOS
// =========================================================================
export function createInitialGpa(isProdigy = false, rng = Math.random) {
  const base = isProdigy ? 5.25 + rng() * 0.45 : 5.05 + rng() * 0.5;
  return Number(clamp(GPA_THRESHOLDS.MIN, GPA_THRESHOLDS.MAX, base).toFixed(2));
}

export function updateHiddenGpa(currentGpa, delta = 0, { hasScholarship = false, currentYear = 1 } = {}) {
  const yearLoadDrag = currentYear >= 4 ? -0.05 * Math.min(3, currentYear - 3) : 0;
  const scholarshipBuffer = hasScholarship ? 0.06 : 0;
  const next = Number(currentGpa || 5.3) + Number(delta || 0) + yearLoadDrag + scholarshipBuffer;
  return Number(clamp(GPA_THRESHOLDS.MIN, GPA_THRESHOLDS.MAX, next).toFixed(2));
}

export function checkAcademicFailRisk(gpa, hasScholarship = false, rng = Math.random) {
  let prob = 0;
  if (gpa >= GPA_THRESHOLDS.FAIL_SAFE) prob = 0;
  else if (gpa >= GPA_THRESHOLDS.DANGER) prob = 0.08;
  else if (gpa >= 4.0) prob = 0.28;
  else prob = 0.62;

  if (hasScholarship) prob *= 0.5;
  const failed = prob > 0 && rng() < prob;
  return { atRisk: prob > 0, prob: Number(prob.toFixed(2)), failed };
}

export function evaluateSportsScholarship({ gpa, ovr, currentlyHas = false }) {
  if (!currentlyHas) {
    const unlocked = gpa >= GPA_THRESHOLDS.SCHOLARSHIP && ovr >= 72;
    return { hasScholarship: unlocked, newlyUnlocked: unlocked, lost: false };
  }
  const retained = gpa >= GPA_THRESHOLDS.SCHOLARSHIP_KEEP;
  return { hasScholarship: retained, newlyUnlocked: false, lost: !retained };
}

export function getPostgradEligibility({ gpa, postgradStage = 'UNDERGRAD' }) {
  if (postgradStage === 'UNDERGRAD') {
    const eligible = Number(gpa) >= GPA_THRESHOLDS.MASTERS;
    return {
      stage: 'UNDERGRAD',
      canContinue: eligible,
      nextStage: 'MASTERS',
      yearsToAdd: 2,
      optionTitle: 'Magíster UFRO (+2 años)',
      reason: eligible
        ? 'Tu rendimiento académico en pregrado te abrió cupo y beca para cursar un Magíster de 2 años en la UFRO.'
        : 'Tus notas de pregrado no alcanzaron el corte para postular al Magíster UFRO. Te titulas directamente.',
    };
  }
  if (postgradStage === 'MASTERS') {
    const eligible = Number(gpa) >= GPA_THRESHOLDS.PHD;
    return {
      stage: 'MASTERS',
      canContinue: eligible,
      nextStage: 'PHD',
      yearsToAdd: 3,
      optionTitle: 'Doctorado UFRO (+3 años)',
      reason: eligible
        ? '¡Excelencia académica sostenida! Calificas al Doctorado UFRO (+3 años más de carrera).'
        : 'Completaste tu Magíster, pero el Doctorado exige mantener promedio sobresaliente. Cierras tu etapa aquí.',
    };
  }
  return {
    stage: 'PHD',
    canContinue: false,
    nextStage: null,
    yearsToAdd: 0,
    optionTitle: null,
    reason: 'Completaste el grado máximo de Doctorado en la UFRO. ¡Legado eterno!',
  };
}

export function getAcademicNarrativeHint(gpa, hasScholarship = false) {
  if (hasScholarship && gpa >= 5.7) {
    return 'En Intranet marchas impecable y disfrutas los beneficios de tu Beca Deportiva UFRO.';
  }
  if (hasScholarship) {
    return 'Mantienes tu Beca Deportiva activa, equilibrando exámenes con la camiseta.';
  }
  if (gpa >= 5.7) {
    return 'Tus notas en Intranet van holgadas y hasta suenan opciones de beca o postgrado.';
  }
  if (gpa >= 5.0) {
    return 'Vas al día con los ramos, aunque conviene no descuidar el estudio si quieres optar a postgrado.';
  }
  if (gpa >= 4.45) {
    return 'La carga académica empieza a apretar en Intranet; otro semestre sin estudiar podría pasarte la cuenta.';
  }
  return 'Alerta silenciosa en Intranet: caminas sobre la cuerda floja con un ramo requisito.';
}

// =========================================================================
// 3. CARTAS DINÁMICAS DE FOCO POR SEMESTRE (4 ALEATORIAS · BRONCE / PLATA / ORO)
// =========================================================================
export function pickCardTier({ hasScholarship = false, isProdigy = false, rng = Math.random } = {}) {
  const goldChance = 0.10 + (hasScholarship ? 0.05 : 0) + (isProdigy ? 0.02 : 0);
  const silverChance = 0.30 + (hasScholarship ? 0.03 : 0);
  const roll = rng();
  if (roll < goldChance) return 'ORO';
  if (roll < goldChance + silverChance) return 'PLATA';
  return 'BRONCE';
}

export function drawSemesterFocusCards({ hasScholarship = false, isProdigy = false, rng = Math.random } = {}) {
  const categories = ['FISICO', 'TECNICO', 'ESTUDIO', 'DESCANSO'];
  const shuffledCats = [...categories].sort(() => rng() - 0.5);
  const chosenIds = new Set();
  const drawn = [];

  for (const cat of shuffledCats) {
    const tier = pickCardTier({ hasScholarship, isProdigy, rng });
    let candidates = FOCUS_CARD_POOL.filter((c) => c.category === cat && c.tier === tier && !chosenIds.has(c.id));
    if (candidates.length === 0) {
      candidates = FOCUS_CARD_POOL.filter((c) => c.category === cat && !chosenIds.has(c.id));
    }
    const picked = candidates[Math.floor(rng() * candidates.length)];
    if (picked) {
      chosenIds.add(picked.id);
      drawn.push({ ...picked });
    }
  }
  return drawn.slice(0, 4);
}

// =========================================================================
// 4. MOMENTOS CLAVE DE LA TEMPORADA
// =========================================================================
export function pickContextualKeyMoment({ sport = 'FUTBOL', sem = 1, usedIds = [], rng = Math.random } = {}) {
  const pool = KEY_MOMENT_TEMPLATES[sport] || KEY_MOMENT_TEMPLATES.FUTBOL;
  const matching = pool.filter((m) => (m.semFilter === 0 || m.semFilter === sem) && !usedIds.includes(m.id));
  const fallback = pool.filter((m) => m.semFilter === 0 || m.semFilter === sem);
  const list = matching.length > 0 ? matching : fallback;
  if (list.length === 0) return null;
  const picked = list[Math.floor(rng() * list.length)];
  return { ...picked };
}

export function resolveKeyMomentChoice(moment, takeRisk, { ovr = 65, rng = Math.random } = {}) {
  if (!moment) return null;
  if (!takeRisk) {
    return { risky: false, won: true, ...moment.safeResult };
  }
  const ovrBonusProb = clamp(-0.08, 0.14, (ovr - 70) * 0.008);
  const finalProb = clamp(0.25, 0.85, (moment.riskyWinProb || 0.5) + ovrBonusProb);
  const won = rng() < finalProb;
  return {
    risky: true,
    won,
    ...(won ? moment.riskyWin : moment.riskyLose),
  };
}

// =========================================================================
// 5. EVENTOS EXCLUSIVOS POR CARRERA (42 CARRERAS UFRO)
// =========================================================================
export function findCareerExclusiveEvent(studiedCareer, semester, triggeredIds = [], year = 1) {
  const lower = String(studiedCareer || '').trim().toLowerCase();
  return CAREER_EXCLUSIVE_EVENTS_ALL.filter((ev) => {
    const matchesCareer = ev.careerMatch.some((kw) => lower.includes(kw));
    const matchesSem = !ev.semesterOnly || ev.semesterOnly === semester;
    const notRepeated = !triggeredIds.includes(`${ev.id}_y${year}`);
    return matchesCareer && matchesSem && notRepeated;
  });
}

// =========================================================================
// 6. PRUEBAS MECHONAS (INCLUYE MODO FEMENINO Y BASKETBALL POR MEDIA DE SHEETS)
// =========================================================================
export function getTrialAcceptanceChance(team, gender = 'M', sport = 'FUTBOL') {
  if (!team) return 0.5;
  const teamOvr = Number(team.ovr) || 72;

  if (sport === 'BASKET' || gender === 'F') {
    // Basado directamente en la media del equipo en Google Sheets
    // 83 OVR -> ~19%, 80 OVR -> ~32%, 75 OVR -> ~54%, 70 OVR -> ~76%, <=66 -> 92%
    const prob = 0.94 - Math.max(0, teamOvr - 66) * 0.044;
    return Number(clamp(0.18, 0.92, prob).toFixed(2));
  }

  const div = Number(team.division);
  if (div === 1) return Number(clamp(0.10, 0.22, 0.16 - (teamOvr - 80) * 0.01).toFixed(2));
  if (div === 2) return Number(clamp(0.28, 0.48, 0.38 - (teamOvr - 70) * 0.015).toFixed(2));
  return Number(clamp(0.85, 0.96, 0.94 - Math.max(0, teamOvr - 64) * 0.01).toFixed(2));
}

export function buildFallbackTryoutTeams(allTeamsDb, triedCodes = [], facultyKey = 'OTRAS') {
  const triedSet = new Set(triedCodes);
  const candidates = allTeamsDb.filter((t) => !triedSet.has(t.code));
  const sameFac = candidates
    .filter((t) => t.facultyKey === facultyKey)
    .sort((a, b) => a.ovr - b.ovr);
  const openLower = candidates
    .filter((t) => t.facultyKey !== facultyKey)
    .sort((a, b) => a.ovr - b.ovr);
  return [...sameFac.slice(0, 2), ...openLower.slice(0, 3)].slice(0, 4);
}

// =========================================================================
// 7. RIVAL RECURRENTE Y NARRATIVA ESCRITA POR SEMESTRE
// =========================================================================
export function isDerbyRival(teamA, teamB) {
  if (!teamA || !teamB || teamA.code === teamB.code) return false;
  const codeA = String(teamA.code || '').trim().toUpperCase();
  const codeB = String(teamB.code || '').trim().toUpperCase();
  const derbyA = String(teamA.derby || '').trim().toUpperCase();
  const derbyB = String(teamB.derby || '').trim().toUpperCase();
  return (derbyA !== '' && derbyA === codeB) || (derbyB !== '' && derbyB === codeA);
}

export function initRecurringRival(team, db = []) {
  if (!team || !Array.isArray(db) || db.length < 2) return null;
  const others = db.filter((t) => t.code !== team.code);
  const derbyMatch = others.find((t) => isDerbyRival(team, t));
  if (derbyMatch) {
    return {
      code: derbyMatch.code,
      name: derbyMatch.name,
      career: derbyMatch.career,
      ovr: derbyMatch.ovr,
      isOfficialDerby: true,
      encounters: 0,
      wins: 0,
      ties: 0,
      losses: 0,
    };
  }
  const sameDiv = others.filter((t) => Number(t.division || 1) === Number(team.division || 1));
  const pool = sameDiv.length > 0 ? sameDiv : others;
  const sorted = [...pool].sort((a, b) => {
    const facBoostA = a.facultyKey === team.facultyKey ? -3 : 0;
    const facBoostB = b.facultyKey === team.facultyKey ? -3 : 0;
    return (Math.abs((a.ovr || 70) - (team.ovr || 70)) + facBoostA) - (Math.abs((b.ovr || 70) - (team.ovr || 70)) + facBoostB);
  });
  const picked = sorted[0];
  return picked
    ? {
        code: picked.code,
        name: picked.name,
        career: picked.career,
        ovr: picked.ovr,
        isOfficialDerby: false,
        encounters: 0,
        wins: 0,
        ties: 0,
        losses: 0,
      }
    : null;
}

export function simulateRivalEncounter({
  rival,
  playerTeam,
  playerOvr,
  sport = 'FUTBOL',
  playedRatio = 0.8,
  teamBoost = 0,
  rng = Math.random,
}) {
  if (!rival || !playerTeam) return null;
  const playerTeamPower = (Number(playerTeam.ovr) || 70) + ((playerOvr - (Number(playerTeam.ovr) || 70)) * 0.45 * playedRatio) + teamBoost;
  const rivalPower = Number(rival.ovr) || 72;
  const diff = playerTeamPower - rivalPower + (rng() * 14 - 7);

  rival.encounters = (rival.encounters || 0) + 1;

  let outcome = 'DRAW';
  if (sport === 'BASKET') {
    outcome = diff >= 0 ? 'WIN' : 'LOSS';
  } else {
    if (diff >= 2.2) outcome = 'WIN';
    else if (diff <= -2.2) outcome = 'LOSS';
    else outcome = 'DRAW';
  }

  let text = '';
  if (outcome === 'WIN') {
    rival.wins = (rival.wins || 0) + 1;
    const margin = sport === 'BASKET' ? `${Math.round(72 + rng() * 14)}-${Math.round(64 + rng() * 10)}` : `${1 + Math.floor(rng() * 2)}-${Math.floor(rng() * 1)}`;
    text = `Victoria ${margin} sobre tu rival recurrente ${rival.name} (Historial ${rival.wins}-${rival.ties || 0}-${rival.losses || 0}).`;
  } else if (outcome === 'LOSS') {
    rival.losses = (rival.losses || 0) + 1;
    const margin = sport === 'BASKET' ? `${Math.round(64 + rng() * 10)}-${Math.round(73 + rng() * 14)}` : `${Math.floor(rng() * 2)}-${2 + Math.floor(rng() * 2)}`;
    text = `${rival.name} se quedó con el clásico universitario (${margin}; historial ${rival.wins || 0}-${rival.ties || 0}-${rival.losses}).`;
  } else {
    rival.ties = (rival.ties || 0) + 1;
    text = `Empate caliente 1-1 ante tu rival ${rival.name} (Historial ${rival.wins || 0}-${rival.ties}-${rival.losses || 0}).`;
  }

  return { outcome, text, ratingBonus: outcome === 'WIN' ? 0.25 : 0 };
}

export function buildSemesterNarrative({
  sport = 'FUTBOL',
  year,
  sem,
  teamName,
  focusCard,
  academicHint,
  keyMomentText,
  rivalText,
  leagueSummaryText,
  promoted,
  promotedToDiv,
  heroicDiv3ToDiv1JustCompleted = false,
  scholarshipEventText = '',
  isSuspended = false,
  isTrainingOnlyS2 = false,
}) {
  const parts = [];
  if (isSuspended) {
    parts.push(`Semestre duro viendo los partidos desde la galería con ${teamName}.`);
  } else if (isTrainingOnlyS2) {
    parts.push(`Semestre de preparación silenciosa entrenando en ${teamName} tras quedar fuera de Playoffs.`);
  } else if (focusCard) {
    parts.push(`En Año ${year} S${sem} elegiste "${focusCard.title}" (${focusCard.tier}) defendiendo a ${teamName}.`);
  } else {
    parts.push(`Disputaste el Año ${year} S${sem} con la camiseta de ${teamName}.`);
  }

  if (keyMomentText) parts.push(keyMomentText);
  if (rivalText) parts.push(rivalText);
  if (scholarshipEventText) parts.push(scholarshipEventText);
  if (academicHint) parts.push(academicHint);

  if (heroicDiv3ToDiv1JustCompleted) {
    parts.push(`¡Hazaña histórica completada! Llevaste a ${teamName} desde 3ª División hasta la 1ª División UFRO.`);
  } else if (promoted && promotedToDiv) {
    parts.push(`Coronaste la campaña logrando el ascenso a ${promotedToDiv}ª División.`);
  } else if (leagueSummaryText && !isSuspended && !isTrainingOnlyS2) {
    parts.push(`Cierre deportivo: ${leagueSummaryText}.`);
  }

  return parts.join(' ');
}

// =========================================================================
// 8. ESTADÍSTICAS Y PREMIOS (FÚTBOL + BÁSQUETBOL)
// =========================================================================
export function generateSemesterStats({
  sport = 'FUTBOL',
  position = 'MED',
  ovr = 65,
  playedRatio = 0.8,
  matchesPlayed = 10,
  isSuspended = false,
  isTrainingOnlyS2 = false,
  focusCard = null,
  keyMomentOutcome = null,
  rivalOutcome = null,
  rng = Math.random,
}) {
  if (isSuspended || isTrainingOnlyS2 || matchesPlayed === 0) {
    return {
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      points: 0,
      rebounds: 0,
      stealsBlocks: 0,
      avgRating: isTrainingOnlyS2 ? 'ENTR.' : 'BAJA',
    };
  }

  const focusRating = Number(focusCard?.ratingBonus) || 0;
  const kmRating = Number(keyMomentOutcome?.ratingDelta) || 0;
  const rivRating = Number(rivalOutcome?.ratingBonus) || 0;
  const perfFactor = (ovr / 68) * (0.88 + rng() * 0.42);

  if (sport === 'BASKET') {
    let ppg = 10;
    let apg = 3;
    let rpg = 4;
    let dpg = 1.1;

    if (position === 'BASE') { ppg = 12.2; apg = 6.4; rpg = 3.1; dpg = 1.9; }
    else if (position === 'ESC') { ppg = 16.5; apg = 3.2; rpg = 3.5; dpg = 1.4; }
    else if (position === 'ALE') { ppg = 14.8; apg = 3.4; rpg = 5.6; dpg = 1.6; }
    else if (position === 'AP') { ppg = 12.6; apg = 2.4; rpg = 7.9; dpg = 1.8; }
    else if (position === 'PIV') { ppg = 11.8; apg = 1.8; rpg = 9.8; dpg = 2.2; }

    const points = Math.max(8, Math.round(matchesPlayed * ppg * perfFactor * (0.88 + playedRatio * 0.2)));
    const assists = Math.max(2, Math.round(matchesPlayed * apg * perfFactor * (0.85 + playedRatio * 0.2)));
    const rebounds = Math.max(4, Math.round(matchesPlayed * rpg * perfFactor * (0.85 + playedRatio * 0.2)));
    const stealsBlocks = Math.max(1, Math.round(matchesPlayed * dpg * perfFactor));

    const contribPerGame = ((points * 0.38) + (assists * 0.85) + (rebounds * 0.7) + (stealsBlocks * 1.15)) / Math.max(1, matchesPlayed);
    const rawRating = 6.2 + playedRatio * 1.0 + Math.min(2.1, contribPerGame * 0.14) + focusRating + kmRating + rivRating + (rng() * 0.4 - 0.2);

    return {
      goals: 0,
      assists,
      cleanSheets: 0,
      points,
      rebounds,
      stealsBlocks,
      avgRating: Number(clamp(5.8, 9.8, rawRating).toFixed(1)),
    };
  }

  // FÚTBOL
  let goals = 0;
  let assists = 0;
  let cleanSheets = 0;
  if (position === 'DEL') {
    goals = Math.round(matchesPlayed * 0.56 * perfFactor);
    assists = Math.round(matchesPlayed * 0.24 * perfFactor);
  } else if (position === 'MED') {
    goals = Math.round(matchesPlayed * 0.30 * perfFactor);
    assists = Math.round(matchesPlayed * 0.50 * perfFactor);
  } else if (position === 'DEF') {
    goals = Math.round(matchesPlayed * 0.12 * perfFactor);
    assists = Math.round(matchesPlayed * 0.18 * perfFactor);
    cleanSheets = Math.round(matchesPlayed * 0.38 * (0.9 + ovr / 200));
  } else if (position === 'ARQ') {
    goals = rng() < 0.04 ? 1 : 0;
    assists = rng() < 0.14 ? 1 : 0;
    cleanSheets = Math.round(matchesPlayed * 0.46 * (0.9 + ovr / 200));
  }

  const rawRating = 6.35
    + (playedRatio * 1.05)
    + ((goals * 0.11 + assists * 0.10 + cleanSheets * 0.13) / Math.max(1, matchesPlayed)) * 2.35
    + focusRating
    + kmRating
    + rivRating
    + (rng() * 0.4 - 0.2);

  return {
    goals,
    assists,
    cleanSheets,
    points: 0,
    rebounds: 0,
    stealsBlocks: 0,
    avgRating: Number(clamp(5.8, 9.8, rawRating).toFixed(1)),
  };
}

export function computeIndividualAwards({ sport = 'FUTBOL', position = 'MED', gender = 'M', year, semStats }) {
  const awards = [];
  if (!semStats || !semStats.matches) return awards;
  const isFemale = gender === 'F';
  const divNum = Number(semStats.divisionPlayed) || 1;
  const divSuffix = isFemale ? 'Femenino UFRO' : (sport === 'BASKET' ? 'Básquet UFRO' : `${divNum}ª Div.`);

  if (sport === 'BASKET') {
    const ppg = semStats.points / semStats.matches;
    const apg = semStats.assists / semStats.matches;
    const rpg = semStats.rebounds / semStats.matches;
    const dpg = semStats.stealsBlocks / semStats.matches;

    if (ppg >= 18.5 && Number(semStats.avgRating) >= 7.8) {
      awards.push({ icon: '🏀', title: `Máximo Anotador (${divSuffix})`, detail: `${ppg.toFixed(1)} pts/p`, teamName: semStats.teamName, year });
    }
    if (apg >= 6.8 && Number(semStats.avgRating) >= 7.7) {
      awards.push({ icon: '🎯', title: `Líder en Asistencias (${divSuffix})`, detail: `${apg.toFixed(1)} ast/p`, teamName: semStats.teamName, year });
    }
    if (rpg >= 9.6 && Number(semStats.avgRating) >= 7.7) {
      awards.push({ icon: '💪', title: `Rey de los Tableros (${divSuffix})`, detail: `${rpg.toFixed(1)} reb/p`, teamName: semStats.teamName, year });
    }
    if (dpg >= 2.2 && Number(semStats.avgRating) >= 7.7) {
      awards.push({ icon: '🛡️', title: `Defensor del Año (${divSuffix})`, detail: `${dpg.toFixed(1)} rob/tap`, teamName: semStats.teamName, year });
    }
    if (Number(semStats.avgRating) >= 8.35 && semStats.matches >= 8) {
      awards.push({ icon: '🌟', title: 'MVP Básquetbol UFRO', detail: `Nota ${semStats.avgRating}`, teamName: semStats.teamName, year });
    }
    return awards;
  }

  // FÚTBOL — balanceado por posición
  if ((position === 'DEL' || position === 'MED') && semStats.goals >= 9 && Number(semStats.avgRating) >= 7.8) {
    awards.push({
      icon: '⚽',
      title: isFemale ? 'Goleadora del Torneo UFRO' : `Goleador ${divSuffix}`,
      detail: `${semStats.goals} goles en Playoffs`,
      teamName: semStats.teamName,
      year,
    });
  }
  if ((position === 'MED' || position === 'DEL') && semStats.assists >= 7 && Number(semStats.avgRating) >= 7.7) {
    awards.push({
      icon: '🎯',
      title: isFemale ? 'Mejor Asistidora UFRO' : `Cerebro del Torneo (${divSuffix})`,
      detail: `${semStats.assists} asistencias clave`,
      teamName: semStats.teamName,
      year,
    });
  }
  if (position === 'DEF' && semStats.cleanSheets >= 5 && Number(semStats.avgRating) >= 7.7) {
    awards.push({
      icon: '🧱',
      title: isFemale ? 'Muralla Defensiva UFRO' : `Mejor Defensa (${divSuffix})`,
      detail: `${semStats.cleanSheets} vallas invictas`,
      teamName: semStats.teamName,
      year,
    });
  }
  if (position === 'ARQ' && semStats.cleanSheets >= 6 && Number(semStats.avgRating) >= 7.7) {
    awards.push({
      icon: '🧤',
      title: isFemale ? 'Guante de Oro Femenino UFRO' : `Guante de Oro (${divSuffix})`,
      detail: `${semStats.cleanSheets} vallas invictas`,
      teamName: semStats.teamName,
      year,
    });
  }
  if (Number(semStats.avgRating) >= 8.35 && semStats.matches >= 9) {
    awards.push({
      icon: '🌟',
      title: isFemale ? 'Mejor Jugadora del Año (MVP)' : 'Mejor Jugador del Año (MVP)',
      detail: `Nota media ${semStats.avgRating}`,
      teamName: semStats.teamName,
      year,
    });
  }
  return awards;
}

// =========================================================================
// 9. BALANCE DE PUNTOS PARA RANKING SEMANAL & HAZAÑA 3ª -> 1ª DIVISIÓN
// =========================================================================
export function getTrophyPrestigePoints(trophy) {
  if (!trophy) return 0;
  if (trophy.type === 'HEROIC_ASCENT') return 95;
  if (trophy.type === 'INTERFACULTADES') return 30;
  if (trophy.type === 'FACULTY') return 14;
  if (trophy.type === 'SELECCION') {
    const tl = String(trophy.title || '').toLowerCase();
    if (tl.includes('históric') || tl.includes('historic')) return 45;
    if (tl.includes('ldes') || tl.includes('univerciudad')) return 28;
    return 16;
  }
  if (trophy.type === 'LEAGUE') {
    const div = Number(trophy.division) || 1;
    if (div === 1) return 26;
    if (div === 2) return 18;
    return 13;
  }
  return 14;
}

export const CAREER_MODE_META = {
  FUTBOL_M: { key: 'FUTBOL_M', label: 'Fútbol Masc.', fullLabel: 'Fútbol Hombres', shortTag: '⚽ Masc', icon: '⚽' },
  FUTBOL_F: { key: 'FUTBOL_F', label: 'Fútbol Fem.', fullLabel: 'Fútbol Mujeres', shortTag: '⚽ Fem', icon: '⚽' },
  BASKET_M: { key: 'BASKET_M', label: 'Básquetbol', fullLabel: 'Básquetbol Masc.', shortTag: '🏀 Básquet', icon: '🏀' },
};

export function getCareerModeKey(entry) {
  if (!entry || typeof entry !== 'object') return 'FUTBOL_M';
  if (entry.modeKey && CAREER_MODE_META[entry.modeKey]) return entry.modeKey;
  const teamCode = String(entry.teamCode || '').toUpperCase();
  const pos = String(entry.position || '').toUpperCase();
  const basketPositions = SPORT_CONFIG.BASKET.positions;
  if (entry.sport === 'BASKET' || teamCode.startsWith('BAS-') || basketPositions.includes(pos)) {
    return 'BASKET_M';
  }
  if (entry.gender === 'F' || teamCode.startsWith('FEM-')) {
    return 'FUTBOL_F';
  }
  return 'FUTBOL_M';
}

export function buildWeeklyLeaderboardViews(allDocs = [], weekId, limit = 10) {
  const safeDocs = Array.isArray(allDocs) ? allDocs : [];
  const weekEntries = safeDocs
    .filter((item) => item && item.weekId === weekId && typeof item.score === 'number')
    .map((item) => ({ ...item, modeKey: getCareerModeKey(item) }))
    .sort((a, b) => (b.score - a.score) || ((b.ovr || 0) - (a.ovr || 0)) || ((b.createdAt || 0) - (a.createdAt || 0)));

  const dedupeByUser = (list) => {
    const map = new Map();
    for (const item of list) {
      const userKey = item.uid || item.id;
      if (!map.has(userKey)) {
        map.set(userKey, item);
      }
    }
    return Array.from(map.values()).slice(0, limit);
  };

  return {
    global: dedupeByUser(weekEntries),
    futbolM: dedupeByUser(weekEntries.filter((item) => item.modeKey === 'FUTBOL_M')),
    futbolF: dedupeByUser(weekEntries.filter((item) => item.modeKey === 'FUTBOL_F')),
    basketM: dedupeByUser(weekEntries.filter((item) => item.modeKey === 'BASKET_M')),
  };
}

export function calculateCareerLeaderboardScore(careerState) {
  if (!careerState) return 0;
  const sport = careerState.sport || 'FUTBOL';
  const gender = careerState.gender || 'M';
  const pos = careerState.position || 'MED';
  const trophies = careerState.trophies || [];
  const awards = careerState.awards || [];
  const stats = careerState.stats || {};
  const history = careerState.history || [];

  // 1. Títulos ponderados por jerarquía y división (evitando sumar doble si HEROIC_ASCENT ya está en trophies)
  let titlePoints = 0;
  trophies.forEach((t) => {
    titlePoints += getTrophyPrestigePoints(t);
  });

  // 2. Contexto: Ascensos y Hazaña 3ª -> 1ª División + Momentos Clave + Rival
  const promotionsBonus = (Number(careerState.promotionsCount) || 0) * 18;
  const hasHeroicInTrophies = trophies.some((t) => t.type === 'HEROIC_ASCENT');
  const heroicBonus = (careerState.heroicDiv3ToDiv1 && !hasHeroicInTrophies) ? 95 : 0;
  const clutchBonus = Math.min(110, Number(careerState.clutchPointsTotal) || 0);
  const rivalWinsBonus = Math.min(60, ((careerState.rival?.wins) || 0) * 6);

  // 3. Estadísticas balanceadas por posición y deporte (normalizadas a ~40-60 pts en 10 semestres)
  let statsPoints = 0;
  if (sport === 'BASKET') {
    const pts = stats.points || 0;
    const reb = stats.rebounds || 0;
    const ast = stats.assists || 0;
    const defP = stats.stealsBlocks || 0;
    statsPoints = Math.round((pts * 0.013) + (ast * 0.026) + (reb * 0.022) + (defP * 0.048));
  } else {
    const g = stats.goals || 0;
    const a = stats.assists || 0;
    const cs = stats.cleanSheets || 0;
    if (pos === 'DEL') statsPoints = Math.round(g * 0.62 + a * 0.50);
    else if (pos === 'MED') statsPoints = Math.round(g * 0.58 + a * 0.62 + cs * 0.20);
    else if (pos === 'DEF') statsPoints = Math.round(g * 0.55 + a * 0.55 + cs * 0.78);
    else if (pos === 'ARQ') statsPoints = Math.round(cs * 0.94 + (g + a) * 0.90);
    else statsPoints = Math.round(g * 0.58 + a * 0.55);
  }

  // 4. Paridad inter-modos para modalidades de división única (sin ascensos 3ª->1ª)
  let modeParityBonus = 0;
  if (sport === 'FUTBOL' && gender === 'F') {
    const leagueWins = trophies.filter((t) => t.type === 'LEAGUE').length;
    const interWins = trophies.filter((t) => t.type === 'INTERFACULTADES').length;
    modeParityBonus = Math.min(48, leagueWins * 6 + interWins * 6);
  } else if (sport === 'BASKET') {
    const leagueWins = trophies.filter((t) => t.type === 'LEAGUE').length;
    const interWins = trophies.filter((t) => t.type === 'INTERFACULTADES').length;
    modeParityBonus = Math.min(36, leagueWins * 5 + interWins * 3);
  }

  // 5. Media final + Premios individuales + Regularidad en cancha
  const ovrPoints = Math.round((Number(careerState.ovr) || 60) * 1.25);
  const awardsPoints = awards.length * 16;
  const validRatings = history.map((h) => Number(h.avgRating)).filter((n) => !Number.isNaN(n) && n > 0);
  const meanRating = validRatings.length > 0
    ? validRatings.reduce((acc, n) => acc + n, 0) / validRatings.length
    : 7.0;
  const consistencyBonus = Math.max(0, Math.round((meanRating - 6.8) * 28));

  const total = titlePoints + promotionsBonus + heroicBonus + clutchBonus + rivalWinsBonus + statsPoints + modeParityBonus + ovrPoints + awardsPoints + consistencyBonus;
  return clamp(0, 2500, Math.round(total));
}
