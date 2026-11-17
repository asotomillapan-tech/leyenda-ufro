// Pure deterministic game engine for NOT F.C (Fútbol 7 · Modo Carrera con Amigos)

export const POSITIONS = ['ARQ', 'DEF', 'MED', 'DEL'];

export const SUB_ROLES = {
  ARQ: ['Portero Clásico', 'Portero Líbero'],
  DEF: ['Cierre Central', 'Carrilero Derecho', 'Carrilero Izquierdo'],
  MED: ['Volante Mixto', 'Enganche Creativo', 'Contención'],
  DEL: ['Punta de Área', 'Extremo Veloz', 'Segundo Delantero'],
};

export const FORMATIONS_F7 = {
  '1-2-3-1': { label: '1-2-3-1 Equilibrada', counts: { ARQ: 1, DEF: 2, MED: 3, DEL: 1 } },
  '1-3-2-1': { label: '1-3-2-1 Sólida', counts: { ARQ: 1, DEF: 3, MED: 2, DEL: 1 } },
  '1-2-2-2': { label: '1-2-2-2 Ofensiva', counts: { ARQ: 1, DEF: 2, MED: 2, DEL: 2 } },
  '1-3-1-2': { label: '1-3-1-2 Contragolpe', counts: { ARQ: 1, DEF: 3, MED: 1, DEL: 2 } },
};

export const BOOSTER_CATALOG = [
  { id: 'lethal_shot', name: 'Remate Letal', icon: '⚡', role: 'DEL', stat: 'tiro', bonus: 4, desc: '+4 Tiro y mayor probabilidad de gol en el próximo partido.' },
  { id: 'iron_wall', name: 'Muralla F7', icon: '🛡️', role: 'DEF', stat: 'defensa', bonus: 4, desc: '+4 Defensa y quites clave en el próximo partido.' },
  { id: 'steel_reflex', name: 'Guantes de Acero', icon: '🧤', role: 'ARQ', stat: 'reflejos', bonus: 4, desc: '+4 Reflejos bajo los tres palos en el próximo partido.' },
  { id: 'vision_master', name: 'Brújula Total', icon: '🎯', role: 'MED', stat: 'pase', bonus: 4, desc: '+4 Pase y generación de asistencias en el próximo partido.' },
  { id: 'endless_engine', name: 'Pulmón UFRO', icon: '🔥', role: 'ALL', stat: 'fisico', bonus: 3, desc: '+3 Físico y +2 Ritmo para todo el encuentro.' },
];

export const SKILL_UPGRADE_LIST = [
  {
    id: 'aceleracion',
    name: 'Aceleración y Desmarque',
    attribute: 'ritmo',
    icon: '💨',
    boostPerPoint: 2,
    recommendedFor: ['DEL', 'MED'],
    desc: 'Explosividad en espacios reducidos F7 (+2 Ritmo por punto).',
  },
  {
    id: 'definicion',
    name: 'Definición Cruzada',
    attribute: 'tiro',
    icon: '🎯',
    boostPerPoint: 2,
    recommendedFor: ['DEL', 'MED'],
    desc: 'Precisión al ángulo y remate potente (+2 Tiro por punto).',
  },
  {
    id: 'vision_pase',
    name: 'Visión y Pase Filtrado',
    attribute: 'pase',
    icon: '🧠',
    boostPerPoint: 2,
    recommendedFor: ['MED', 'DEF'],
    desc: 'Primer toque y pases clave entre líneas (+2 Pase por punto).',
  },
  {
    id: 'marca_cierre',
    name: 'Marca y Anticipación',
    attribute: 'defensa',
    icon: '🛡️',
    boostPerPoint: 2,
    recommendedFor: ['DEF', 'ARQ'],
    desc: 'Quites limpios y cierre de coberturas (+2 Defensa por punto).',
  },
  {
    id: 'resistencia_duelo',
    name: 'Resistencia y Duelo Físico',
    attribute: 'fisico',
    icon: '💪',
    boostPerPoint: 2,
    recommendedFor: ['DEF', 'MED', 'DEL'],
    desc: 'Aguante los 50 minutos y choque cuerpo a cuerpo (+2 Físico por punto).',
  },
  {
    id: 'reflejos_arco',
    name: 'Reflejos bajo los 3 Palos',
    attribute: 'reflejos',
    icon: '🧤',
    boostPerPoint: 2,
    recommendedFor: ['ARQ'],
    desc: 'Reacción felina y achique en mano a mano (+2 Reflejos por punto).',
  },
];

export const POINTS_PER_LEVEL_UP = 3;

export const DAILY_TASKS_TEMPLATE = [
  {
    id: 'minigame_penalty',
    kind: 'minigame',
    minigameType: 'penalty',
    title: 'Minijuego: Penales de Precisión F7',
    desc: 'Supera al arquero anotando 3 de 5 penales apuntando al ángulo y cronometrando la potencia.',
    xp: 45,
    statFocus: 'tiro',
    targetRoles: ['DEL', 'MED', 'ARQ', 'DEF'],
    euroReward: 45000,
  },
  {
    id: 'minigame_rondo',
    kind: 'minigame',
    minigameType: 'rondo',
    title: 'Minijuego: Rondo de Pases Rápidos',
    desc: 'Completa 6 pases seguidos a tus compañeros antes que el marcador cierre el espacio.',
    xp: 40,
    statFocus: 'pase',
    targetRoles: ['MED', 'DEF', 'DEL', 'ARQ'],
    euroReward: 40000,
  },
  {
    id: 'minigame_gk',
    kind: 'minigame',
    minigameType: 'keeper',
    title: 'Minijuego: Reflejos bajo los 3 Palos',
    desc: 'Ataja o despeja 4 remates rápidos en los 3 carriles del arco UFRO.',
    xp: 45,
    statFocus: 'reflejos',
    targetRoles: ['ARQ', 'DEF', 'MED', 'DEL'],
    euroReward: 38000,
  },
  {
    id: 'leyendas_5',
    kind: 'leyendas_milestone',
    requiredCareers: 5,
    title: 'Misión LEYENDAS: 5 Carreras Completadas',
    desc: 'Completa 5 carreras en el modo LEYENDAS para desbloquear un gran salto de experiencia y presupuesto.',
    xp: 120,
    statFocus: 'fisico',
    targetRoles: ['ARQ', 'DEF', 'MED', 'DEL'],
    euroReward: 95000,
  },
  {
    id: 'leyendas_10',
    kind: 'leyendas_milestone',
    requiredCareers: 10,
    title: 'Misión LEYENDAS: 10 Carreras Completadas',
    desc: 'Alcanza 10 carreras finalizadas en LEYENDAS y potencia a todo tu club para los Playoffs.',
    xp: 240,
    statFocus: 'ritmo',
    targetRoles: ['ARQ', 'DEF', 'MED', 'DEL'],
    euroReward: 185000,
  },
];

const FIRST_NAMES = [
  'Benjamín', 'Matías', 'Vicente', 'Joaquín', 'Sebastián', 'Martín', 'Diego', 'Lucas',
  'Tomás', 'Cristóbal', 'Felipe', 'Nicolás', 'Ignacio', 'Gabriel', 'Alonso', 'Maximiliano',
  'Sofía', 'Valentina', 'Martina', 'Catalina', 'Isidora', 'Antonia', 'Camila', 'Javiera',
];

const LAST_NAMES = [
  'Rojas', 'Soto', 'Muñoz', 'Morales', 'Castro', 'Contreras', 'Valenzuela', 'Sepúlveda',
  'Araya', 'Fuentes', 'Carrasco', 'Vega', 'Alarcón', 'Navarro', 'Flores', 'Riquelme',
  'Paredes', 'Tapia', 'Garrido', 'Mendoza', 'Herrera', 'Saavedra', 'Cáceres', 'Salinas',
];

const FICTITIOUS_CLUBS = [
  ['Efiorentina F7', 'EFI', '#8b5cf6', '#1e1b4b'],
  ['Industrial United F7', 'IND', '#3b82f6', '#172554'],
  ['Atlético Medicina F7', 'MED', '#10b981', '#064e3b'],
  ['Iuris Tantum F7', 'DER', '#f59e0b', '#451a03'],
  ['Real Informática F7', 'INF', '#6366f1', '#1e1b4b'],
  ['Kine Máquina F7', 'KIN', '#14b8a6', '#134e4a'],
  ['Psico United F7', 'PSI', '#a855f7', '#3b0764'],
  ['Real Mercado F7', 'ICO', '#eab308', '#422006'],
  ['Odonto Star F7', 'ODO', '#ec4899', '#500724'],
  ['Agrónomos del Sur F7', 'AGR', '#22c55e', '#14532d'],
  ['Prensa Austral F7', 'PER', '#f97316', '#431407'],
  ['Torno Mecánico F7', 'MEC', '#0ea5e9', '#0c4a6e'],
  ['Cruz Roja Enfermería', 'ENF', '#ef4444', '#450a0a'],
  ['Hormigón Armado F7', 'CON', '#78716c', '#292524'],
  ['Alta Tensión F7', 'ELE', '#facc15', '#422006'],
  ['Voltio Central F7', 'ELC', '#06b6d4', '#164e63'],
  ['Alquimia Química F7', 'QUI', '#84cc16', '#365314'],
  ['Dinamo Sociología F7', 'SOC', '#d946ef', '#4a044e'],
  ['Esparta Histórica F7', 'HIS', '#b91c1c', '#450a0a'],
  ['Infinito Mate F7', 'MAT', '#4f46e5', '#1e1b4b'],
  ['Cambridge UFRO F7', 'ING', '#2563eb', '#172554'],
  ['Bioanálisis Real F7', 'TEC', '#059669', '#064e3b'],
  ['Matronería Real F7', 'OBS', '#fb7185', '#4c0519'],
  ['Botica Real F7', 'QFA', '#10b981', '#022c22'],
  ['Genoma BioTech F7', 'IBI', '#38bdf8', '#082f49'],
  ['Fibra Óptica F7', 'TEL', '#818cf8', '#1e1b4b'],
  ['Bosque Nativo F7', 'IRN', '#16a34a', '#052e16'],
  ['Balance General F7', 'AUD', '#d97706', '#451a03'],
  ['Quantum Ciencias F7', 'CIE', '#7c3aed', '#2e1065'],
  ['Real Comunitario F7', 'TSO', '#e11d48', '#4c0519'],
  ['Semillero Civil F7', 'PLC', '#64748b', '#1e293b'],
  ['Voz y Ritmo F7', 'FON', '#0d9488', '#134e4a'],
];

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function randInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickRandom(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

export function generatePlayerName(rng = Math.random) {
  return `${pickRandom(FIRST_NAMES, rng)} ${pickRandom(LAST_NAMES, rng)}`;
}

export function computeOvrFromStats(position, stats, potential = 99) {
  const s = stats || {};
  let weighted = 64;
  if (position === 'ARQ') {
    weighted = (s.reflejos || 64) * 0.45 + (s.defensa || 60) * 0.20 + (s.fisico || 62) * 0.15 + (s.pase || 58) * 0.12 + (s.ritmo || 58) * 0.08;
  } else if (position === 'DEF') {
    weighted = (s.defensa || 64) * 0.36 + (s.fisico || 64) * 0.24 + (s.ritmo || 62) * 0.18 + (s.pase || 60) * 0.14 + (s.tiro || 52) * 0.08;
  } else if (position === 'MED') {
    weighted = (s.pase || 65) * 0.34 + (s.ritmo || 63) * 0.20 + (s.tiro || 60) * 0.18 + (s.defensa || 58) * 0.14 + (s.fisico || 62) * 0.14;
  } else {
    weighted = (s.tiro || 65) * 0.36 + (s.ritmo || 65) * 0.26 + (s.pase || 60) * 0.18 + (s.fisico || 60) * 0.12 + (s.defensa || 45) * 0.08;
  }
  return clamp(Math.round(weighted), 58, Math.max(60, potential));
}

export function calculatePlayerMarketValueEur(player) {
  const ovr = Number(player.ovr) || 64;
  const pot = Number(player.potential) || 80;
  const st = player.stats || {};
  const matches = Math.max(1, st.matches || 0);
  const avgRating = st.matches > 0 ? st.ratingSum / matches : 6.5;

  const baseValue = Math.pow(Math.max(1, ovr - 52), 2.15) * 1850;
  const potBonus = Math.max(0, pot - ovr) * 7500;
  const perfMultiplier = clamp(0.82 + (avgRating - 6.0) * 0.18, 0.75, 1.55);
  const contributionBonus = (st.goals || 0) * 14000 + (st.assists || 0) * 10000 + (st.cleanSheets || 0) * 16000;

  return Math.round((baseValue + potBonus + contributionBonus) * perfMultiplier / 1000) * 1000;
}

export function getPlayerAverageRating(player) {
  const m = player?.stats?.matches || 0;
  if (m <= 0) return 0;
  return Number(((player.stats.ratingSum || 0) / m).toFixed(2));
}

export function formatEuro(amount) {
  const n = Math.round(Number(amount) || 0);
  return `€${n.toLocaleString('es-CL')}`;
}

export function createNotFcPlayer({
  id,
  name,
  position = 'MED',
  subRole,
  isBot = false,
  isHuman = false,
  ownerUid = '',
  ownerNickname = '',
  leyendasCareer = null,
  ovrHint = null,
  rng = Math.random,
}) {
  const pos = POSITIONS.includes(position) ? position : 'MED';
  const role = subRole || pickRandom(SUB_ROLES[pos], rng);

  let potential;
  let startOvr;
  let originType = 'SCRATCH';
  let originLabel = isBot ? 'Bot Cantera UFRO' : 'Creado desde 0';

  if (leyendasCareer && typeof leyendasCareer.ovr === 'number') {
    // LEYENDAS OVR acts ONLY as development potential, NEVER as starting OVR
    potential = clamp(Math.round(leyendasCareer.ovr), 75, 99);
    const scaled = 60 + Math.round(((potential - 75) / 24) * 12) + randInt(0, 3, rng);
    startOvr = clamp(scaled, 60, 75);
    originType = 'LEYENDAS';
    originLabel = `LEYENDAS · ${leyendasCareer.playerName || 'Leyenda'} (Pot. ${potential})`;
  } else {
    potential = isBot ? randInt(72, 85, rng) : randInt(80, 93, rng);
    const base = ovrHint !== null ? clamp(Math.round(ovrHint), 60, 75) : randInt(61, 72, rng);
    startOvr = clamp(base, 60, 75);
    if (isBot) originType = 'BOT';
  }

  const statBias = {
    ARQ: { ritmo: -6, tiro: -18, pase: -4, defensa: -2, fisico: 0, reflejos: +4 },
    DEF: { ritmo: 0, tiro: -10, pase: -2, defensa: +4, fisico: +3, reflejos: -28 },
    MED: { ritmo: +1, tiro: -2, pase: +4, defensa: -3, fisico: 0, reflejos: -30 },
    DEL: { ritmo: +3, tiro: +4, pase: -2, defensa: -16, fisico: 0, reflejos: -32 },
  }[pos];

  const statsAttrs = {};
  for (const key of ['ritmo', 'tiro', 'pase', 'defensa', 'fisico', 'reflejos']) {
    statsAttrs[key] = clamp(startOvr + (statBias[key] || 0) + randInt(-2, 2, rng), 28, 92);
  }

  // Ensure computed starting OVR strictly lands in 60..75
  const initialComputed = computeOvrFromStats(pos, statsAttrs, potential);
  const delta = startOvr - initialComputed;
  if (delta !== 0) {
    const primaryStat = pos === 'ARQ' ? 'reflejos' : pos === 'DEF' ? 'defensa' : pos === 'MED' ? 'pase' : 'tiro';
    statsAttrs[primaryStat] = clamp(statsAttrs[primaryStat] + delta * 2, 45, 88);
  }
  const finalStartOvr = clamp(computeOvrFromStats(pos, statsAttrs, potential), 60, 75);

  const player = {
    id: id || `pl_${Math.random().toString(36).slice(2, 10)}`,
    name: String(name || generatePlayerName(rng)).slice(0, 32),
    position: pos,
    subRole: role,
    isBot: Boolean(isBot),
    isHuman: Boolean(isHuman),
    ownerUid: ownerUid || '',
    ownerNickname: ownerNickname || '',
    originType,
    originLabel,
    ovr: finalStartOvr,
    startOvr: finalStartOvr,
    potential,
    level: 1,
    skillPoints: 0,
    skillRanks: {
      aceleracion: 0,
      definicion: 0,
      vision_pase: 0,
      marca_cierre: 0,
      resistencia_duelo: 0,
      reflejos_arco: 0,
    },
    xp: 0,
    xpToNext: 100,
    attributes: statsAttrs,
    stats: {
      matches: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      saves: 0,
      tackles: 0,
      keyPasses: 0,
      shotsOnTarget: 0,
      ratingSum: 0,
      goalsConceded: 0,
      yellowCards: 0,
    },
    isLoan: false,
    loanFrom: '',
    marketValueEur: 0,
  };
  player.marketValueEur = calculatePlayerMarketValueEur(player);
  return player;
}

export function ensurePlayerProgressionFields(player) {
  if (!player) return player;
  if (typeof player.level !== 'number' || player.level < 1) player.level = 1;
  if (typeof player.skillPoints !== 'number' || player.skillPoints < 0) player.skillPoints = 0;
  if (!player.skillRanks || typeof player.skillRanks !== 'object') {
    player.skillRanks = {};
  }
  for (const sk of SKILL_UPGRADE_LIST) {
    if (typeof player.skillRanks[sk.id] !== 'number') {
      player.skillRanks[sk.id] = 0;
    }
  }
  return player;
}

export function allocateSkillPoint(player, skillId) {
  if (!player) return { ok: false, error: 'Jugador no encontrado.' };
  ensurePlayerProgressionFields(player);

  const skill = SKILL_UPGRADE_LIST.find((s) => s.id === skillId);
  if (!skill) return { ok: false, error: 'Habilidad no válida.' };
  if ((player.skillPoints || 0) < 1) {
    return { ok: false, error: 'No tienes puntos de habilidad disponibles. Sube de nivel ganando EX.' };
  }

  player.attributes = player.attributes || { ritmo: 60, tiro: 60, pase: 60, defensa: 60, fisico: 60, reflejos: 60 };
  const curAttr = Number(player.attributes[skill.attribute]) || 60;
  if (curAttr >= 99) {
    return { ok: false, error: `${skill.name} ya alcanzó el atributo máximo (99).` };
  }

  const prevOvr = player.ovr;
  player.skillPoints -= 1;
  player.skillRanks[skill.id] = (player.skillRanks[skill.id] || 0) + 1;
  player.attributes[skill.attribute] = clamp(curAttr + skill.boostPerPoint, 30, 99);
  player.ovr = clamp(computeOvrFromStats(player.position, player.attributes, player.potential), 60, player.potential);
  player.marketValueEur = calculatePlayerMarketValueEur(player);

  return {
    ok: true,
    skillId: skill.id,
    attribute: skill.attribute,
    attributeValue: player.attributes[skill.attribute],
    ovrDelta: player.ovr - prevOvr,
    newOvr: player.ovr,
    remainingPoints: player.skillPoints,
  };
}

export function applyXpToPlayer(player, xpGained, statFocus = 'pase', options = {}) {
  if (!player) return { leveledUp: false, levelsGained: 0, skillPointsGranted: 0, ovrDelta: 0 };
  ensurePlayerProgressionFields(player);
  const prevOvr = player.ovr;
  player.xp = (player.xp || 0) + Math.max(0, Math.round(xpGained));
  let leveledUp = false;
  let levelsGained = 0;
  let skillPointsGranted = 0;

  while (player.xp >= (player.xpToNext || 100)) {
    player.xp -= (player.xpToNext || 100);
    player.xpToNext = Math.round((player.xpToNext || 100) * 1.15);
    player.level += 1;
    player.skillPoints += POINTS_PER_LEVEL_UP;
    leveledUp = true;
    levelsGained += 1;
    skillPointsGranted += POINTS_PER_LEVEL_UP;
  }

  // Bots (or explicit autoAllocate) immediately spend skillPoints; human players distribute manually
  const shouldAutoAllocate = options.autoAllocate === true || (options.autoAllocate !== false && player.isBot && !player.isHuman);
  if (shouldAutoAllocate && player.skillPoints > 0) {
    const focusSkill = SKILL_UPGRADE_LIST.find((s) => s.attribute === statFocus) || SKILL_UPGRADE_LIST[2];
    const posSkill = SKILL_UPGRADE_LIST.find((s) => s.recommendedFor.includes(player.position)) || focusSkill;
    let safety = 0;
    while (player.skillPoints > 0 && safety < 30) {
      const targetId = safety % 2 === 0 ? posSkill.id : focusSkill.id;
      const res = allocateSkillPoint(player, targetId);
      if (!res.ok) break;
      safety += 1;
    }
  }

  player.marketValueEur = calculatePlayerMarketValueEur(player);
  return { leveledUp, levelsGained, skillPointsGranted, ovrDelta: player.ovr - prevOvr };
}

export function buildAutoLineup14(players, formationKey = '1-2-3-1') {
  const fmt = FORMATIONS_F7[formationKey] || FORMATIONS_F7['1-2-3-1'];
  const pool = [...players].sort((a, b) => b.ovr - a.ovr);
  const starters = [];
  const used = new Set();

  // Mandatory 1 ARQ first
  const arqList = pool.filter((p) => p.position === 'ARQ');
  const pickedArq = arqList[0] || pool[0];
  if (pickedArq) {
    starters.push(pickedArq.id);
    used.add(pickedArq.id);
  }

  for (const pos of ['DEF', 'MED', 'DEL']) {
    const need = fmt.counts[pos] || 0;
    const candidates = pool.filter((p) => !used.has(p.id) && p.position === pos);
    for (let i = 0; i < need; i += 1) {
      const pick = candidates[i] || pool.find((p) => !used.has(p.id));
      if (pick) {
        starters.push(pick.id);
        used.add(pick.id);
      }
    }
  }

  // Ensure exactly 7 starters if possible
  for (const p of pool) {
    if (starters.length >= 7) break;
    if (!used.has(p.id)) {
      starters.push(p.id);
      used.add(p.id);
    }
  }

  const bench = pool.filter((p) => !used.has(p.id)).map((p) => p.id).slice(0, 7);
  return { starterIds: starters.slice(0, 7), benchIds: bench };
}

export function validateLineupF7(club) {
  const starterIds = club?.starterIds || [];
  const players = club?.players || [];
  if (starterIds.length !== 7) {
    return { valid: false, error: 'La formación titular debe tener exactamente 7 jugadores.' };
  }
  const starters = starterIds.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  if (starters.length !== 7) {
    return { valid: false, error: 'Hay jugadores titulares que ya no pertenecen al plantel.' };
  }
  const gkCount = starters.filter((p) => p.position === 'ARQ').length;
  if (gkCount < 1) {
    return { valid: false, error: 'La alineación titular debe contar obligatoriamente con al menos un Portero (ARQ).' };
  }
  return { valid: true };
}

export function swapStarterAndBench(club, starterId, benchId) {
  if (!club) return { ok: false, error: 'Club inválido.' };
  const sIdx = club.starterIds.indexOf(starterId);
  const bIdx = club.benchIds.indexOf(benchId);
  if (sIdx === -1 || bIdx === -1) {
    return { ok: false, error: 'Selecciona un titular y un suplente válidos.' };
  }
  const nextStarters = [...club.starterIds];
  const nextBench = [...club.benchIds];
  nextStarters[sIdx] = benchId;
  nextBench[bIdx] = starterId;

  const candidateClub = { ...club, starterIds: nextStarters, benchIds: nextBench };
  const check = validateLineupF7(candidateClub);
  if (!check.valid) return { ok: false, error: check.error };

  club.starterIds = nextStarters;
  club.benchIds = nextBench;
  return { ok: true };
}

export function fillClubWithBotsTo14(club, rng = Math.random) {
  const current = [...(club.players || [])];
  const needed = Math.max(0, 14 - current.length);
  if (needed === 0) return club;

  const counts = { ARQ: 0, DEF: 0, MED: 0, DEL: 0 };
  for (const p of current) counts[p.position] = (counts[p.position] || 0) + 1;

  const targetCounts = { ARQ: 2, DEF: 4, MED: 4, DEL: 4 };
  const botQueue = [];
  for (const pos of POSITIONS) {
    const deficit = Math.max(0, targetCounts[pos] - counts[pos]);
    for (let i = 0; i < deficit; i += 1) botQueue.push(pos);
  }
  while (botQueue.length < needed) {
    botQueue.push(pickRandom(['DEF', 'MED', 'DEL'], rng));
  }

  for (let i = 0; i < needed; i += 1) {
    const pos = botQueue[i] || 'MED';
    current.push(createNotFcPlayer({
      id: `${club.id}_bot_${current.length + 1}_${randInt(100, 999, rng)}`,
      name: generatePlayerName(rng),
      position: pos,
      isBot: true,
      isHuman: false,
      ovrHint: randInt(62, 71, rng),
      rng,
    }));
  }

  club.players = current.slice(0, 14);
  const lineup = buildAutoLineup14(club.players, club.formation || '1-2-3-1');
  club.starterIds = lineup.starterIds;
  club.benchIds = lineup.benchIds;
  return club;
}

export function createClub({
  id,
  name,
  shortCode,
  primaryColor = '#717fff',
  secondaryColor = '#1c1c1c',
  crestShape = 'shield',
  motto = 'Fútbol 7 UFRO',
  leaderUid = 'local',
  leaderNickname = 'CapitanUFRO',
  isUserClub = false,
  isCreatedByUser = undefined,
  initialRoster = [],
  formation = '1-2-3-1',
  rng = Math.random,
}) {
  const cleanName = String(name || 'Club UFRO F7').trim().slice(0, 28);
  const code = String(shortCode || cleanName.replace(/[^A-Za-z]/g, '').slice(0, 3) || 'UFC').toUpperCase().slice(0, 4);
  const createdByUser = typeof isCreatedByUser === 'boolean' ? isCreatedByUser : Boolean(isUserClub);

  const club = {
    id: id || `club_${Math.random().toString(36).slice(2, 9)}`,
    name: cleanName,
    shortCode: code,
    primaryColor,
    secondaryColor,
    crestShape,
    motto: String(motto || '').slice(0, 60),
    leaderUid,
    leaderNickname,
    isUserClub,
    isCreatedByUser: createdByUser,
    isFictitious: !createdByUser,
    isFiller: !createdByUser,
    formation: FORMATIONS_F7[formation] ? formation : '1-2-3-1',
    budgetEur: isUserClub ? 650000 : randInt(500000, 900000, rng),
    players: [...initialRoster],
    starterIds: [],
    benchIds: [],
    boosters: [], // { id, boosterId, name, icon, role, stat, bonus, desc, assignedPlayerId? }
    invitedFriends: [], // { uid, nickname, status: 'pending'|'joined', playerId? }
  };

  fillClubWithBotsTo14(club, rng);
  return club;
}

export function generateLeague32Clubs(userClub, communityClubs = [], rng = Math.random) {
  const clubs = [userClub];
  const usedNames = new Set([userClub.name.toLowerCase()]);

  for (const cc of communityClubs) {
    if (clubs.length >= 32) break;
    if (!usedNames.has(cc.name.toLowerCase())) {
      usedNames.add(cc.name.toLowerCase());
      clubs.push(fillClubWithBotsTo14(cc, rng));
    }
  }

  let idx = 0;
  while (clubs.length < 32 && idx < FICTITIOUS_CLUBS.length) {
    const [fName, fCode, pColor, sColor] = FICTITIOUS_CLUBS[idx];
    idx += 1;
    if (usedNames.has(fName.toLowerCase())) continue;
    usedNames.add(fName.toLowerCase());

    const formations = Object.keys(FORMATIONS_F7);
    const fClub = createClub({
      id: `bot_club_${idx}_${fCode}`,
      name: fName,
      shortCode: fCode,
      primaryColor: pColor,
      secondaryColor: sColor,
      crestShape: pickRandom(['shield', 'diamond', 'hexagon', 'banner'], rng),
      motto: 'Equipo de relleno · Fútbol 7',
      leaderUid: `bot_mgr_${idx}`,
      leaderNickname: `DT_${fCode}`,
      isUserClub: false,
      isCreatedByUser: false,
      formation: pickRandom(formations, rng),
      rng,
    });
    fClub.isFictitious = true;
    fClub.isFiller = true;
    clubs.push(fClub);
  }

  return clubs.slice(0, 32);
}

export function generateLeagueCalendar(clubs) {
  // Circle method for 32 teams -> first 8 rounds gives 8 unique opponents for every team
  const ids = clubs.map((c) => c.id);
  const n = ids.length;
  if (n !== 32) {
    throw new Error(`La liga debe tener exactamente 32 equipos (recibidos: ${n}).`);
  }

  const fixed = ids[0];
  let rotating = ids.slice(1);
  const matchdays = [];

  for (let round = 1; round <= 8; round += 1) {
    const order = [fixed, ...rotating];
    const fixtures = [];
    for (let i = 0; i < n / 2; i += 1) {
      const home = i % 2 === 0 ? order[i] : order[n - 1 - i];
      const away = i % 2 === 0 ? order[n - 1 - i] : order[i];
      fixtures.push({
        id: `md${round}_m${i + 1}`,
        matchday: round,
        homeId: home,
        awayId: away,
        played: false,
        homeGoals: 0,
        awayGoals: 0,
        events: [],
      });
    }
    matchdays.push({
      matchday: round,
      label: `Jornada ${round} · 21:00 CL`,
      fixtures,
    });
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, rotating.length - 1)];
  }

  return matchdays;
}

export function createInitialStandings(clubs) {
  return clubs.map((c) => ({
    clubId: c.id,
    name: c.name,
    shortCode: c.shortCode,
    primaryColor: c.primaryColor,
    secondaryColor: c.secondaryColor,
    crestShape: c.crestShape,
    isUserClub: c.isUserClub,
    isFictitious: c.isFictitious,
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    gf: 0,
    gc: 0,
    pts: 0,
  }));
}

export function sortStandings(standings) {
  return [...standings].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.gc;
    const gdB = b.gf - b.gc;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });
}

export function applyMatchResultToStandings(standings, homeId, awayId, homeGoals, awayGoals) {
  const hRow = standings.find((r) => r.clubId === homeId);
  const aRow = standings.find((r) => r.clubId === awayId);
  if (!hRow || !aRow) return standings;

  hRow.pj += 1;
  aRow.pj += 1;
  hRow.gf += homeGoals;
  hRow.gc += awayGoals;
  aRow.gf += awayGoals;
  aRow.gc += homeGoals;

  if (homeGoals > awayGoals) {
    hRow.pg += 1;
    hRow.pts += 3;
    aRow.pp += 1;
  } else if (awayGoals > homeGoals) {
    aRow.pg += 1;
    aRow.pts += 3;
    hRow.pp += 1;
  } else {
    hRow.pe += 1;
    aRow.pe += 1;
    hRow.pts += 1;
    aRow.pts += 1;
  }

  return sortStandings(standings);
}

export function getClubEffectiveStrength(club, activeBoosterMap = {}) {
  const starters = (club.starterIds || [])
    .map((id) => club.players.find((p) => p.id === id))
    .filter(Boolean);
  if (starters.length === 0) return 60;

  let total = 0;
  let hasGk = false;
  for (const p of starters) {
    const b = activeBoosterMap[p.id];
    const bonus = b ? b.bonus : 0;
    if (p.position === 'ARQ') hasGk = true;
    total += p.ovr + bonus;
  }
  const avg = total / starters.length;
  return hasGk ? avg : avg - 8;
}

function createEmptyMatchDelta() {
  return { goals: 0, assists: 0, saves: 0, tackles: 0, keyPasses: 0, shotsOnTarget: 0, yellowCards: 0 };
}

function simulateKeyMinutes({
  homeClub,
  awayClub,
  minutesList,
  initialEvents = [],
  initialHomeGoals = 0,
  initialAwayGoals = 0,
  initialDelta = null,
  activeBoosterMap = {},
  isKnockout = false,
  rng = Math.random,
}) {
  const homeStrength = getClubEffectiveStrength(homeClub, activeBoosterMap);
  const awayStrength = getClubEffectiveStrength(awayClub, activeBoosterMap);

  const homeStarters = homeClub.starterIds.map((id) => homeClub.players.find((p) => p.id === id)).filter(Boolean);
  const awayStarters = awayClub.starterIds.map((id) => awayClub.players.find((p) => p.id === id)).filter(Boolean);

  const events = [...initialEvents];
  let homeGoals = initialHomeGoals;
  let awayGoals = initialAwayGoals;

  const pickAttacker = (starters) => {
    const attackers = starters.filter((p) => p.position === 'DEL' || p.position === 'MED');
    return attackers.length > 0 ? pickRandom(attackers, rng) : pickRandom(starters, rng);
  };
  const pickAssister = (starters, scorerId) => {
    const mids = starters.filter((p) => p.id !== scorerId && (p.position === 'MED' || p.position === 'DEL' || p.position === 'DEF'));
    return mids.length > 0 ? pickRandom(mids, rng) : null;
  };
  const pickDefender = (starters) => {
    const defs = starters.filter((p) => p.position === 'DEF' || p.position === 'MED');
    return defs.length > 0 ? pickRandom(defs, rng) : pickRandom(starters, rng);
  };
  const pickKeeper = (starters) => starters.find((p) => p.position === 'ARQ') || starters[0];

  const matchStatDelta = initialDelta ? new Map(initialDelta) : new Map();
  const touchDelta = (pId) => {
    if (!matchStatDelta.has(pId)) {
      matchStatDelta.set(pId, createEmptyMatchDelta());
    }
    return matchStatDelta.get(pId);
  };

  for (const p of [...homeStarters, ...awayStarters]) touchDelta(p.id);

  for (const min of minutesList) {
    if (min === 28 && !events.some((e) => e.type === 'HALFTIME')) {
      events.push({ minute: 25, type: 'HALFTIME', text: `⏸️ 25' Descanso en el Campus: ${homeClub.shortCode} ${homeGoals} - ${awayGoals} ${awayClub.shortCode}.` });
    }

    const homeAttackProb = clamp(0.5 + (homeStrength - awayStrength) * 0.018, 0.28, 0.72);
    const attackingHome = rng() < homeAttackProb;
    const attClub = attackingHome ? homeClub : awayClub;
    const defClub = attackingHome ? awayClub : homeClub;
    const attStarters = attackingHome ? homeStarters : awayStarters;
    const defStarters = attackingHome ? awayStarters : homeStarters;

    const shooter = pickAttacker(attStarters);
    const assister = pickAssister(attStarters, shooter?.id);
    const defender = pickDefender(defStarters);
    const keeper = pickKeeper(defStarters);

    const shooterBonus = activeBoosterMap[shooter?.id]?.bonus || 0;
    const keeperBonus = activeBoosterMap[keeper?.id]?.bonus || 0;
    const defenderBonus = activeBoosterMap[defender?.id]?.bonus || 0;

    const attackScore = (shooter?.ovr || 65) + shooterBonus + randInt(-10, 14, rng);
    const defenseScore = ((keeper?.ovr || 65) + keeperBonus + (defender?.ovr || 65) + defenderBonus) / 2 + randInt(-8, 14, rng);

    const roll = rng();
    if (attackScore > defenseScore + 3 && roll < 0.56) {
      if (attackingHome) homeGoals += 1;
      else awayGoals += 1;

      if (shooter) touchDelta(shooter.id).goals += 1;
      if (shooter) touchDelta(shooter.id).shotsOnTarget += 1;
      if (assister && rng() < 0.78) {
        touchDelta(assister.id).assists += 1;
        touchDelta(assister.id).keyPasses += 1;
        events.push({
          minute: min,
          type: 'GOAL',
          side: attackingHome ? 'home' : 'away',
          homeGoals,
          awayGoals,
          scorerId: shooter?.id,
          assisterId: assister.id,
          text: `⚽ ${min}' ¡GOOOL de ${attClub.name}! ${shooter?.name || 'Delantero'} define cruzado tras asistencia de ${assister.name}. (${homeClub.shortCode} ${homeGoals}-${awayGoals} ${awayClub.shortCode})`,
        });
      } else {
        events.push({
          minute: min,
          type: 'GOAL',
          side: attackingHome ? 'home' : 'away',
          homeGoals,
          awayGoals,
          scorerId: shooter?.id,
          text: `⚽ ${min}' ¡GOOOL de ${attClub.name}! Gran jugada individual de ${shooter?.name || 'Atacante'}. (${homeClub.shortCode} ${homeGoals}-${awayGoals} ${awayClub.shortCode})`,
        });
      }
    } else if (roll < 0.78) {
      if (shooter) touchDelta(shooter.id).shotsOnTarget += 1;
      if (keeper) touchDelta(keeper.id).saves += 1;
      if (assister) touchDelta(assister.id).keyPasses += 1;
      events.push({
        minute: min,
        type: 'SAVE',
        shooterId: shooter?.id,
        keeperId: keeper?.id,
        assisterId: assister?.id,
        text: `🧤 ${min}' ¡Tapadón de ${keeper?.name || 'Arquero'} (${defClub.shortCode})! Desvió un remate peligroso de ${shooter?.name || 'rival'}.`,
      });
    } else {
      if (defender) touchDelta(defender.id).tackles += 1;
      if (rng() < 0.14 && defender) {
        touchDelta(defender.id).yellowCards += 1;
        events.push({
          minute: min,
          type: 'CARD',
          defenderId: defender.id,
          text: `🟨 ${min}' Tarjeta amarilla para ${defender.name} (${defClub.shortCode}) tras cortar un contragolpe.`,
        });
      } else {
        events.push({
          minute: min,
          type: 'TACKLE',
          defenderId: defender?.id,
          text: `🛡️ ${min}' Cierre providencial de ${defender?.name || 'Defensa'} (${defClub.shortCode}) para apagar el peligro.`,
        });
      }
    }
  }

  let penaltyWinnerId = null;
  let penaltyScore = '';
  if (isKnockout && homeGoals === awayGoals) {
    let hp = randInt(3, 5, rng);
    let ap = randInt(3, 5, rng);
    if (hp === ap) {
      if (homeStrength >= awayStrength ? rng() < 0.6 : rng() < 0.4) hp += 1;
      else ap += 1;
    }
    penaltyWinnerId = hp > ap ? homeClub.id : awayClub.id;
    penaltyScore = `${hp}-${ap}`;
    const winName = penaltyWinnerId === homeClub.id ? homeClub.name : awayClub.name;
    events.push({
      minute: 50,
      type: 'PENALTIES',
      text: `🎯 50' ¡Definición por penales! ${winName} se impone ${penaltyScore} desde los 7 metros.`,
    });
  }

  events.push({
    minute: 50,
    type: 'FULLTIME',
    homeGoals,
    awayGoals,
    text: `🏁 50' Final del partido: ${homeClub.name} ${homeGoals} - ${awayGoals} ${awayClub.name}${penaltyScore ? ` (Pen. ${penaltyScore})` : ''}.`,
  });

  return {
    homeId: homeClub.id,
    awayId: awayClub.id,
    homeGoals,
    awayGoals,
    penaltyWinnerId,
    penaltyScore,
    events,
    matchStatDelta,
  };
}

const ALL_KEY_MINUTES = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48];

export function generateMinuteByMinuteMatch(homeClub, awayClub, activeBoosterMap = {}, isKnockout = false, rng = Math.random) {
  const initialEvents = [
    { minute: 1, type: 'KICKOFF', text: `⏱️ 1' ¡Arranca el partido en cancha sintética UFRO! ${homeClub.name} vs ${awayClub.name}.` },
  ];
  return simulateKeyMinutes({
    homeClub,
    awayClub,
    minutesList: ALL_KEY_MINUTES,
    initialEvents,
    activeBoosterMap,
    isKnockout,
    rng,
  });
}

export function resimulateMatchFromMinute(homeClub, awayClub, playedEvents = [], activeBoosterMap = {}, isKnockout = false, rng = Math.random) {
  let homeGoals = 0;
  let awayGoals = 0;
  let lastMinute = 1;
  const delta = new Map();
  const touch = (id) => {
    if (!id) return null;
    if (!delta.has(id)) delta.set(id, createEmptyMatchDelta());
    return delta.get(id);
  };

  for (const ev of playedEvents) {
    if (typeof ev.minute === 'number' && ev.minute > lastMinute) lastMinute = ev.minute;
    if (ev.type === 'GOAL') {
      if (typeof ev.homeGoals === 'number') homeGoals = ev.homeGoals;
      if (typeof ev.awayGoals === 'number') awayGoals = ev.awayGoals;
      if (ev.scorerId) {
        const d = touch(ev.scorerId);
        d.goals += 1;
        d.shotsOnTarget += 1;
      }
      if (ev.assisterId) {
        const d = touch(ev.assisterId);
        d.assists += 1;
        d.keyPasses += 1;
      }
    } else if (ev.type === 'SAVE') {
      if (ev.shooterId) touch(ev.shooterId).shotsOnTarget += 1;
      if (ev.keeperId) touch(ev.keeperId).saves += 1;
      if (ev.assisterId) touch(ev.assisterId).keyPasses += 1;
    } else if (ev.type === 'CARD' && ev.defenderId) {
      const d = touch(ev.defenderId);
      d.tackles += 1;
      d.yellowCards += 1;
    } else if (ev.type === 'TACKLE' && ev.defenderId) {
      touch(ev.defenderId).tackles += 1;
    }
  }

  const remainingMinutes = ALL_KEY_MINUTES.filter((m) => m > lastMinute);
  return simulateKeyMinutes({
    homeClub,
    awayClub,
    minutesList: remainingMinutes,
    initialEvents: playedEvents,
    initialHomeGoals: homeGoals,
    initialAwayGoals: awayGoals,
    initialDelta: delta,
    activeBoosterMap,
    isKnockout,
    rng,
  });
}

export function commitMatchToClubs(homeClub, awayClub, simResult, rng = Math.random) {
  const awardedBoosters = [];

  const applyClubSide = (club, goalsFor, goalsAgainst) => {
    const won = goalsFor > goalsAgainst;
    const drew = goalsFor === goalsAgainst;
    const starters = club.starterIds.map((id) => club.players.find((p) => p.id === id)).filter(Boolean);

    for (const p of starters) {
      const d = simResult.matchStatDelta.get(p.id) || {
        goals: 0, assists: 0, saves: 0, tackles: 0, keyPasses: 0, shotsOnTarget: 0, yellowCards: 0,
      };
      p.stats.matches += 1;
      p.stats.goals += d.goals;
      p.stats.assists += d.assists;
      p.stats.saves += d.saves;
      p.stats.tackles += d.tackles;
      p.stats.keyPasses += d.keyPasses;
      p.stats.shotsOnTarget += d.shotsOnTarget;
      p.stats.yellowCards += d.yellowCards;
      if (p.position === 'ARQ') {
        p.stats.goalsConceded += goalsAgainst;
        if (goalsAgainst === 0) p.stats.cleanSheets += 1;
      }

      let rating = 6.3 + (won ? 0.5 : drew ? 0.15 : -0.25);
      rating += d.goals * 1.15 + d.assists * 0.75 + d.saves * 0.35 + d.tackles * 0.25 + d.keyPasses * 0.15 - d.yellowCards * 0.25;
      if (p.position === 'ARQ' && goalsAgainst === 0) rating += 0.9;
      rating = clamp(Number(rating.toFixed(1)), 5.0, 10.0);
      p.stats.ratingSum = Number(((p.stats.ratingSum || 0) + rating).toFixed(2));

      // Performance XP & market value
      const xpGain = Math.round(14 + rating * 2.5 + d.goals * 10 + d.assists * 6);
      applyXpToPlayer(p, xpGain, p.position === 'ARQ' ? 'reflejos' : p.position === 'DEF' ? 'defensa' : p.position === 'MED' ? 'pase' : 'tiro');

      // Award booster on standout match performance
      if (club.isUserClub && (rating >= 7.8 || d.goals >= 2 || (p.position === 'ARQ' && goalsAgainst === 0 && d.saves >= 2))) {
        const matchingBoosters = BOOSTER_CATALOG.filter((b) => b.role === p.position || b.role === 'ALL');
        const template = pickRandom(matchingBoosters, rng);
        if ((club.boosters || []).length < 12) {
          const item = {
            id: `bst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            boosterId: template.id,
            name: template.name,
            icon: template.icon,
            role: template.role,
            stat: template.stat,
            bonus: template.bonus,
            desc: template.desc,
            earnedBy: p.name,
            assignedPlayerId: null,
          };
          club.boosters.push(item);
          awardedBoosters.push(item);
        }
      }
    }

    if (club.isUserClub) {
      const prizeEur = won ? 110000 : drew ? 55000 : 25000;
      club.budgetEur = (club.budgetEur || 0) + prizeEur;
    }
  };

  applyClubSide(homeClub, simResult.homeGoals, simResult.awayGoals);
  applyClubSide(awayClub, simResult.awayGoals, simResult.homeGoals);

  return { awardedBoosters };
}

export function generateFreeAgentsPool(count = 16, rng = Math.random) {
  const pool = [];
  const roles = ['ARQ', 'ARQ', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL', 'DEL', 'DEL'];
  for (let i = 0; i < count; i += 1) {
    const pos = roles[i % roles.length];
    const p = createNotFcPlayer({
      id: `fa_${i + 1}_${randInt(1000, 9999, rng)}`,
      name: generatePlayerName(rng),
      position: pos,
      isBot: true,
      isHuman: false,
      ovrHint: randInt(66, 75, rng),
      rng,
    });
    p.originLabel = 'Agente Libre UFRO';
    pool.push(p);
  }
  return pool;
}

export function signFreeAgentToClub(club, freeAgent, feeEur) {
  const cost = Number(feeEur ?? freeAgent.marketValueEur);
  if ((club.budgetEur || 0) < cost) {
    return { ok: false, error: `Presupuesto insuficiente. Necesitas ${formatEuro(cost)}.` };
  }
  if ((club.players || []).length >= 16) {
    return { ok: false, error: 'Plantel lleno (máximo 16). Rescinde un contrato primero.' };
  }
  club.budgetEur -= cost;
  const signed = { ...freeAgent, originLabel: 'Fichaje Agente Libre' };
  club.players.push(signed);
  if (club.benchIds.length < 7) {
    club.benchIds.push(signed.id);
  }
  return { ok: true, cost };
}

export function loanEliminatedPlayerToClub(club, player, fromClubName) {
  const loanFee = Math.round((player.marketValueEur || 120000) * 0.25 / 1000) * 1000;
  if ((club.budgetEur || 0) < loanFee) {
    return { ok: false, error: `Presupuesto insuficiente para cesión (${formatEuro(loanFee)}).` };
  }
  if ((club.players || []).length >= 16) {
    return { ok: false, error: 'Plantel lleno (máximo 16). Rescinde un contrato primero.' };
  }
  club.budgetEur -= loanFee;
  const loaned = {
    ...JSON.parse(JSON.stringify(player)),
    id: `loan_${player.id}_${Math.random().toString(36).slice(2, 6)}`,
    isLoan: true,
    loanFrom: fromClubName,
    originLabel: `Cedido desde ${fromClubName}`,
  };
  club.players.push(loaned);
  if (club.benchIds.length < 7) {
    club.benchIds.push(loaned.id);
  }
  return { ok: true, loanFee, player: loaned };
}

export function terminateContractFromClub(club, playerId) {
  const target = club.players.find((p) => p.id === playerId);
  if (!target) return { ok: false, error: 'Jugador no encontrado.' };
  if (club.players.length <= 7) {
    return { ok: false, error: 'No puedes tener menos de 7 jugadores en el plantel.' };
  }
  if (target.position === 'ARQ') {
    const remainingGk = club.players.filter((p) => p.id !== playerId && p.position === 'ARQ');
    if (remainingGk.length === 0) {
      return { ok: false, error: 'Debes mantener al menos un Portero (ARQ) en el club.' };
    }
  }

  const compensation = Math.round((target.marketValueEur || 80000) * 0.12 / 1000) * 1000;
  club.players = club.players.filter((p) => p.id !== playerId);
  club.starterIds = club.starterIds.filter((id) => id !== playerId);
  club.benchIds = club.benchIds.filter((id) => id !== playerId);

  // Repair starter/bench to maintain 7 starters with 1 ARQ
  if (club.starterIds.length < 7) {
    const lineup = buildAutoLineup14(club.players, club.formation);
    club.starterIds = lineup.starterIds;
    club.benchIds = lineup.benchIds;
  }

  club.budgetEur = Math.max(0, (club.budgetEur || 0) - compensation);
  return { ok: true, compensation };
}

export function createPlayoffBracketFromTop16(sortedStandings) {
  const top16 = sortedStandings.slice(0, 16);
  const octavos = [];
  for (let i = 0; i < 8; i += 1) {
    const highSeed = top16[i];
    const lowSeed = top16[15 - i];
    octavos.push({
      id: `po_r16_${i + 1}`,
      round: 'OCTAVOS',
      seedHome: i + 1,
      seedAway: 16 - i,
      homeId: highSeed.clubId,
      awayId: lowSeed.clubId,
      played: false,
      homeGoals: 0,
      awayGoals: 0,
      penaltyScore: '',
      winnerId: null,
      events: [],
    });
  }
  return {
    currentRound: 'OCTAVOS',
    rounds: {
      OCTAVOS: octavos,
      CUARTOS: [],
      SEMIFINAL: [],
      FINAL: [],
    },
    championId: null,
  };
}

export function advancePlayoffRound(bracket) {
  const order = ['OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL'];
  const curIdx = order.indexOf(bracket.currentRound);
  if (curIdx === -1) return bracket;
  const curMatches = bracket.rounds[bracket.currentRound] || [];
  if (curMatches.some((m) => !m.played || !m.winnerId)) return bracket;

  if (bracket.currentRound === 'FINAL') {
    bracket.championId = curMatches[0]?.winnerId || null;
    bracket.currentRound = 'FINISHED';
    return bracket;
  }

  const nextRound = order[curIdx + 1];
  const nextMatches = [];
  for (let i = 0; i < curMatches.length; i += 2) {
    const mA = curMatches[i];
    const mB = curMatches[i + 1];
    nextMatches.push({
      id: `po_${nextRound.toLowerCase()}_${i / 2 + 1}`,
      round: nextRound,
      homeId: mA.winnerId,
      awayId: mB.winnerId,
      played: false,
      homeGoals: 0,
      awayGoals: 0,
      penaltyScore: '',
      winnerId: null,
      events: [],
    });
  }
  bracket.rounds[nextRound] = nextMatches;
  bracket.currentRound = nextRound;
  return bracket;
}

export function computeChampionshipAwards(clubs, championId = null) {
  const allPlayers = [];
  for (const club of clubs) {
    for (const p of club.players || []) {
      allPlayers.push({
        ...p,
        clubId: club.id,
        clubName: club.name,
        clubShortCode: club.shortCode,
        clubColor: club.primaryColor,
        avgRating: getPlayerAverageRating(p),
      });
    }
  }

  const topScorer = [...allPlayers]
    .sort((a, b) => (b.stats.goals - a.stats.goals) || (b.stats.assists - a.stats.assists) || (b.avgRating - a.avgRating))[0] || null;

  const keepers = allPlayers.filter((p) => p.position === 'ARQ' && p.stats.matches > 0);
  const bestKeeper = [...keepers]
    .sort((a, b) => (b.stats.cleanSheets - a.stats.cleanSheets) || (b.stats.saves - a.stats.saves) || (a.stats.goalsConceded - b.stats.goalsConceded))[0] || null;

  const mvp = [...allPlayers]
    .filter((p) => p.stats.matches > 0)
    .sort((a, b) => {
      const scoreA = a.avgRating * 12 + a.stats.goals * 4 + a.stats.assists * 3 + a.stats.cleanSheets * 4 + (a.clubId === championId ? 8 : 0);
      const scoreB = b.avgRating * 12 + b.stats.goals * 4 + b.stats.assists * 3 + b.stats.cleanSheets * 4 + (b.clubId === championId ? 8 : 0);
      return scoreB - scoreA;
    })[0] || null;

  return { mvp, topScorer, bestKeeper };
}

export function getNextChile9pmInfo(now = new Date()) {
  const chileNowStr = now.toLocaleString('en-US', { timeZone: 'America/Santiago' });
  const chileNow = new Date(chileNowStr);
  const target = new Date(chileNow);
  target.setHours(21, 0, 0, 0);
  if (chileNow.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  const diffMs = Math.max(0, target.getTime() - chileNow.getTime());
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return { hours, minutes, seconds, label: '21:00 CL' };
}

// Periodo de conformación de clubes: 17 nov hasta 18 nov 21:00 Chile (UTC-3)
export const LEAGUE_LAUNCH_ISO_CL = '2026-11-18T21:00:00-03:00';

export function getLeagueFormationWindowInfo(now = new Date()) {
  const launchMs = Date.parse(LEAGUE_LAUNCH_ISO_CL);
  const diffMs = launchMs - now.getTime();
  if (diffMs > 0) {
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return {
      isFormationPeriod: true,
      hours,
      minutes,
      seconds,
      launchLabel: '18 nov · 21:00 CL',
      windowText: 'Conformación de clubes abierta (17 nov – 18 nov 21:00 CL)',
    };
  }
  const daily = getNextChile9pmInfo(now);
  return {
    isFormationPeriod: false,
    hours: daily.hours,
    minutes: daily.minutes,
    seconds: daily.seconds,
    launchLabel: '21:00 CL',
    windowText: 'Liga iniciada · Partidos diarios a las 21:00 CL',
  };
}

export function countCompletedLeyendasCareers(localHof = [], activeCareer = null, cloudCareers = []) {
  const seen = new Set();
  if (Array.isArray(localHof)) {
    localHof.forEach((item, idx) => {
      if (item && item.playerName) {
        seen.add(`hof_${item.id || `${item.playerName}_${item.ovr || 0}_${idx}`}`);
      }
    });
  }
  if (Array.isArray(cloudCareers)) {
    cloudCareers.forEach((item, idx) => {
      if (item && item.playerName && item.finished) {
        seen.add(`cloud_${item.id || idx}`);
      }
    });
  }
  // If an active career explicitly finished its seasons, count it once if not already in HoF
  if (activeCareer && activeCareer.playerName && activeCareer.isRetired) {
    seen.add(`active_${activeCareer.playerName}`);
  }
  return seen.size;
}

export function createFreeAgentListing({
  id,
  name,
  position = 'MED',
  subRole,
  bio = 'Disponible para sumar en Fútbol 7',
  leyendasCareer = null,
  ownerUid = 'local_player',
  ownerNickname = 'JugadorUFRO',
  isUserListing = false,
  rng = Math.random,
}) {
  const player = createNotFcPlayer({
    id,
    name,
    position,
    subRole,
    isBot: !isUserListing,
    isHuman: Boolean(isUserListing),
    ownerUid,
    ownerNickname,
    leyendasCareer,
    rng,
  });
  return {
    id: `fa_pub_${player.id}`,
    player,
    bio: String(bio || 'Disponible para cualquier club F7').slice(0, 70),
    isUserListing: Boolean(isUserListing),
    createdAt: new Date().toISOString(),
  };
}

export function generateSeededFreeAgentsLookingForClub(count = 6, rng = Math.random) {
  const roles = ['DEL', 'MED', 'DEF', 'ARQ', 'MED', 'DEL'];
  const bios = [
    'Busco club competitivo para la liga de las 21:00',
    'Juego de volante mixto, disponible todos los días',
    'Arquero seguro bajo los tres palos F7',
    'Defensa central con buen juego aéreo y salida',
    'Delantero rápido para contragolpes',
    'Disponible para completar plantilla de 14',
  ];
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const pos = roles[i % roles.length];
    list.push(createFreeAgentListing({
      id: `seed_fa_${i + 1}`,
      name: generatePlayerName(rng),
      position: pos,
      bio: bios[i % bios.length],
      leyendasCareer: i % 2 === 0 ? { playerName: 'Ex-Leyenda UFRO', ovr: randInt(79, 91, rng) } : null,
      ownerNickname: `ufro_fa_${i + 1}`,
      isUserListing: false,
      rng,
    }));
  }
  return list;
}

export function generateOpenClubsDirectory(rng = Math.random) {
  const sampleMeta = [
    { name: 'Real Informática F7', code: 'INF', p: '#717fff', s: '#1e1b4b', shape: 'shield', formation: '1-2-3-1', humanCount: 5, leader: '@NicoDev', motto: 'Código y gol en cancha 2' },
    { name: 'Atlético Medicina F7', code: 'MED', p: '#10b981', s: '#064e3b', shape: 'hexagon', formation: '1-3-2-1', humanCount: 6, leader: '@CataMed', motto: 'Pulso firme hasta los Playoffs' },
    { name: 'Iuris Tantum F7', code: 'DER', p: '#f59e0b', s: '#451a03', shape: 'banner', formation: '1-2-2-2', humanCount: 4, leader: '@TomásLex', motto: 'Defensa inapelable' },
    { name: 'Kine Máquina F7', code: 'KIN', p: '#14b8a6', s: '#134e4a', shape: 'diamond', formation: '1-3-1-2', humanCount: 7, leader: '@ValenKine', motto: 'Resistencia 50 minutos' },
    { name: 'Industrial United F7', code: 'IND', p: '#3b82f6', s: '#172554', shape: 'shield', formation: '1-2-3-1', humanCount: 5, leader: '@BenjaIND', motto: 'Precisión táctica UFRO' },
    { name: 'Psico United F7', code: 'PSI', p: '#a855f7', s: '#3b0764', shape: 'hexagon', formation: '1-2-2-2', humanCount: 3, leader: '@SofiPsi', motto: 'Lectura de juego total' },
  ];

  return sampleMeta.map((m, idx) => {
    const initialRoster = [];
    // Ensure at least one ARQ + initial human members
    initialRoster.push(createNotFcPlayer({
      id: `dir_arq_${idx}`,
      name: generatePlayerName(rng),
      position: 'ARQ',
      isHuman: true,
      isBot: false,
      ownerNickname: m.leader.replace('@', ''),
      rng,
    }));
    const positionsPool = ['DEF', 'MED', 'DEL', 'MED', 'DEF', 'DEL'];
    for (let j = 1; j < m.humanCount; j += 1) {
      initialRoster.push(createNotFcPlayer({
        id: `dir_mem_${idx}_${j}`,
        name: generatePlayerName(rng),
        position: positionsPool[j % positionsPool.length],
        isHuman: true,
        isBot: false,
        ownerNickname: `amigo_${m.code.toLowerCase()}_${j}`,
        rng,
      }));
    }
    return {
      id: `open_club_${m.code.toLowerCase()}`,
      name: m.name,
      shortCode: m.code,
      primaryColor: m.p,
      secondaryColor: m.s,
      crestShape: m.shape,
      motto: m.motto,
      formation: m.formation,
      leaderNickname: m.leader.replace('@', ''),
      humanCount: m.humanCount,
      neededPositions: idx % 2 === 0 ? ['DEL', 'MED'] : ['ARQ', 'DEF'],
      initialRoster,
      isCreatedByUser: false,
      isFictitious: true,
      isFiller: true,
    };
  });
}

// Filtra exclusivamente clubes reales creados por usuarios (excluye equipos inventados de relleno)
export function filterEligibleApplicationClubs(clubsList = []) {
  return (clubsList || []).filter((c) => {
    if (!c) return false;
    if (c.isFictitious || c.isFiller) return false;
    if (!c.isCreatedByUser) return false;
    const humans = typeof c.humanCount === 'number'
      ? c.humanCount
      : Array.isArray(c.players)
        ? c.players.filter((p) => !p.isBot).length
        : (c.initialRoster || []).length;
    return humans < 14;
  });
}

export function addConfirmedHumanToClub(club, joiningPlayer) {
  if (!club || !joiningPlayer) return { ok: false, error: 'Club o jugador inválido.' };
  const already = (club.players || []).some((p) => p.id === joiningPlayer.id || (joiningPlayer.ownerNickname && p.ownerNickname && p.ownerNickname.toLowerCase() === joiningPlayer.ownerNickname.toLowerCase() && !p.isBot));
  if (already) return { ok: true, alreadyMember: true, club };

  const botIdx = (club.players || []).findIndex((p) => p.isBot && !p.isHuman);
  if (botIdx === -1 && (club.players || []).length >= 14) {
    return { ok: false, error: 'Los 14 cupos humanos del club ya están completos.' };
  }

  if (botIdx !== -1) {
    const replacedBotId = club.players[botIdx].id;
    club.players[botIdx] = joiningPlayer;
    club.starterIds = (club.starterIds || []).map((id) => (id === replacedBotId ? joiningPlayer.id : id));
    club.benchIds = (club.benchIds || []).map((id) => (id === replacedBotId ? joiningPlayer.id : id));
  } else {
    club.players.push(joiningPlayer);
  }

  if (!validateLineupF7(club).valid) {
    const lineup = buildAutoLineup14(club.players, club.formation);
    club.starterIds = lineup.starterIds;
    club.benchIds = lineup.benchIds;
  }
  return { ok: true, club };
}

// ==================== DECISIÓN EN CONJUNTO: INVITACIONES Y SOLICITUDES ====================
export function createClubInviteRequest({
  id,
  club,
  senderHandle = 'CapitanUFRO',
  targetHandle,
  position = 'MED',
}) {
  const cleanTarget = String(targetHandle || '').trim().replace(/^@+/, '');
  if (!club || !cleanTarget || cleanTarget.length < 2) {
    return { ok: false, error: 'Ingresa un @usuario válido para enviar la invitación.' };
  }
  return {
    ok: true,
    request: {
      id: id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'CLUB_TO_USER',
      status: 'PENDING_USER',
      clubId: club.id,
      clubName: club.name,
      clubShortCode: club.shortCode,
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      crestShape: club.crestShape,
      formation: club.formation || '1-2-3-1',
      senderHandle: String(senderHandle || club.leaderNickname || 'Capitan').replace(/^@+/, ''),
      targetHandle: cleanTarget,
      position: POSITIONS.includes(position) ? position : 'MED',
      createdAt: new Date().toISOString(),
    },
  };
}

export function respondToClubInvite({
  request,
  club,
  accept,
  joiningPlayer = null,
}) {
  if (!request || request.type !== 'CLUB_TO_USER') {
    return { ok: false, error: 'Invitación no válida.' };
  }
  if (request.status !== 'PENDING_USER') {
    return { ok: false, error: 'Esta invitación ya fue respondida.' };
  }
  if (!accept) {
    request.status = 'REJECTED';
    request.respondedAt = new Date().toISOString();
    return { ok: true, added: false, request, club };
  }
  if (!club || !joiningPlayer) {
    return { ok: false, error: 'Se requiere tu ficha de jugador para aceptar e ingresar al club.' };
  }
  const addRes = addConfirmedHumanToClub(club, joiningPlayer);
  if (!addRes.ok) return addRes;

  request.status = 'ACCEPTED';
  request.acceptedPlayerId = joiningPlayer.id;
  request.respondedAt = new Date().toISOString();
  return { ok: true, added: true, request, club };
}

export function createUserJoinRequest({
  id,
  club,
  applicantPlayer,
  applicantHandle,
}) {
  if (!club || club.isFictitious || club.isFiller || !club.isCreatedByUser) {
    return { ok: false, error: 'Los equipos inventados de relleno no admiten solicitudes.' };
  }
  if (!applicantPlayer) {
    return { ok: false, error: 'Debes configurar tu personaje antes de postular.' };
  }
  return {
    ok: true,
    request: {
      id: id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'USER_TO_CLUB',
      status: 'PENDING_LEADER',
      clubId: club.id,
      clubName: club.name,
      clubShortCode: club.shortCode,
      leaderNickname: club.leaderNickname || 'CapitanUFRO',
      applicantHandle: String(applicantHandle || applicantPlayer.ownerNickname || applicantPlayer.name || 'Jugador').replace(/^@+/, ''),
      applicantPlayer,
      createdAt: new Date().toISOString(),
    },
  };
}

export function respondToUserJoinRequest({
  request,
  club,
  accept,
}) {
  if (!request || request.type !== 'USER_TO_CLUB') {
    return { ok: false, error: 'Solicitud no válida.' };
  }
  if (request.status !== 'PENDING_LEADER') {
    return { ok: false, error: 'Esta solicitud ya fue resuelta.' };
  }
  if (!accept) {
    request.status = 'REJECTED';
    request.respondedAt = new Date().toISOString();
    return { ok: true, added: false, request, club };
  }
  if (!club || !request.applicantPlayer) {
    return { ok: false, error: 'Falta el club o la ficha del postulante.' };
  }
  const addRes = addConfirmedHumanToClub(club, request.applicantPlayer);
  if (!addRes.ok) return addRes;

  request.status = 'ACCEPTED';
  request.respondedAt = new Date().toISOString();
  return { ok: true, added: true, request, club };
}

export function joinClubAsPlayerMode({
  clubTemplate,
  player,
  rng = Math.random,
}) {
  const starterRoster = [...(clubTemplate.initialRoster || clubTemplate.players?.filter((p) => !p.isBot) || []), player];
  const club = createClub({
    id: clubTemplate.id || `joined_club_${Date.now()}`,
    name: clubTemplate.name,
    shortCode: clubTemplate.shortCode,
    primaryColor: clubTemplate.primaryColor,
    secondaryColor: clubTemplate.secondaryColor,
    crestShape: clubTemplate.crestShape,
    motto: clubTemplate.motto,
    leaderUid: clubTemplate.leaderUid || `leader_${clubTemplate.shortCode}`,
    leaderNickname: clubTemplate.leaderNickname || 'CapitanClub',
    isUserClub: true,
    isCreatedByUser: true,
    initialRoster: starterRoster,
    formation: clubTemplate.formation || '1-2-3-1',
    rng,
  });

  // Ensure the joining player starts in the 7 starters if space or swap in gracefully if non-ARQ
  if (!club.starterIds.includes(player.id)) {
    if (player.position === 'ARQ') {
      const gkStarterIdx = club.starterIds.findIndex((id) => club.players.find((p) => p.id === id)?.position === 'ARQ');
      if (gkStarterIdx !== -1) {
        const replacedId = club.starterIds[gkStarterIdx];
        club.starterIds[gkStarterIdx] = player.id;
        club.benchIds = club.benchIds.filter((id) => id !== player.id);
        club.benchIds.unshift(replacedId);
      }
    } else {
      const nonGkStarterIdx = club.starterIds.findIndex((id) => {
        const pl = club.players.find((p) => p.id === id);
        return pl && pl.position !== 'ARQ' && pl.isBot;
      });
      const fallbackIdx = club.starterIds.findIndex((id) => club.players.find((p) => p.id === id)?.position !== 'ARQ');
      const targetIdx = nonGkStarterIdx !== -1 ? nonGkStarterIdx : fallbackIdx;
      if (targetIdx !== -1) {
        const replacedId = club.starterIds[targetIdx];
        club.starterIds[targetIdx] = player.id;
        club.benchIds = club.benchIds.filter((id) => id !== player.id);
        club.benchIds.unshift(replacedId);
      }
    }
  }

  return club;
}

