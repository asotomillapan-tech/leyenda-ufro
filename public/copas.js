// =========================================================================
// RESOLUCIÓN GRÁFICA DE COPAS, MEDALLAS Y PREMIOS INDIVIDUALES (SVG)
// =========================================================================

export const TROPHY_ASSETS = {
  LEAGUE_1: {
    key: 'LEAGUE_1',
    src: '/public/copas/intercarreras-1ra.svg',
    shortLabel: '1ª Div.',
    label: 'Intercarreras 1ª División',
    accentColor: '#fbbf24',
  },
  LEAGUE_2: {
    key: 'LEAGUE_2',
    src: '/public/copas/intercarreras-2da.svg',
    shortLabel: '2ª Div.',
    label: 'Intercarreras 2ª División',
    accentColor: '#cbd5e1',
  },
  LEAGUE_3: {
    key: 'LEAGUE_3',
    src: '/public/copas/intercarreras-3ra.svg',
    shortLabel: '3ª Div.',
    label: 'Intercarreras 3ª División',
    accentColor: '#f59e0b',
  },
  FACULTY: {
    key: 'FACULTY',
    src: '/public/copas/copa-facultad.svg',
    shortLabel: 'Facultad',
    label: 'Copa Facultad',
    accentColor: '#8b96ff',
  },
  INTERFACULTADES: {
    key: 'INTERFACULTADES',
    src: '/public/copas/interfacultades.svg',
    shortLabel: 'Interfac.',
    label: 'Torneo Interfacultades',
    accentColor: '#fbbf24',
  },
  CLASIFICATORIO_CNU: {
    key: 'CLASIFICATORIO_CNU',
    src: '/public/copas/clasificatorio-cnu.svg',
    shortLabel: 'CNU',
    label: 'Clasificatorio CNU',
    accentColor: '#60a5fa',
  },
  LDES: {
    key: 'LDES',
    src: '/public/copas/ldes.svg',
    shortLabel: 'LDES',
    label: 'Campeonato LDES',
    accentColor: '#e2e8f0',
  },
  UNIVERCIUDAD: {
    key: 'UNIVERCIUDAD',
    src: '/public/copas/univerciudad.svg',
    shortLabel: 'Univerciudad',
    label: 'Campeonato Univerciudad',
    accentColor: '#22d3ee',
  },
  FENAUDE: {
    key: 'FENAUDE',
    src: '/public/copas/nacional-fenaude.svg',
    shortLabel: 'FENAUDE',
    label: 'Nacional FENAUDE Chile',
    accentColor: '#fbbf24',
  },
  HEROIC_ASCENT: {
    key: 'HEROIC_ASCENT',
    src: '/public/copas/hazana-ascenso.svg',
    shortLabel: '3ª → 1ª',
    label: 'Hazaña 3ª → 1ª División',
    accentColor: '#fbbf24',
  },
  NOTFC: {
    key: 'NOTFC',
    src: '/public/copas/copa-notfc.svg',
    shortLabel: 'NOT F.C',
    label: 'Campeón NOT F.C',
    accentColor: '#717fff',
  },
};

export const AWARD_ASSETS = {
  MVP: {
    key: 'MVP',
    src: '/public/copas/premio-mvp.svg',
    shortLabel: 'MVP',
    label: 'Jugador Más Valioso (MVP)',
    accentColor: '#fbbf24',
  },
  GOLEADOR: {
    key: 'GOLEADOR',
    src: '/public/copas/premio-goleador.svg',
    shortLabel: 'Goleador',
    label: 'Botín de Oro / Goleador',
    accentColor: '#fbbf24',
  },
  GUANTE: {
    key: 'GUANTE',
    src: '/public/copas/premio-guante.svg',
    shortLabel: 'Guante',
    label: 'Guante de Oro / Mejor Arquero',
    accentColor: '#fbbf24',
  },
  ASISTENCIAS: {
    key: 'ASISTENCIAS',
    src: '/public/copas/premio-asistencias.svg',
    shortLabel: 'Asist.',
    label: 'Cerebro / Líder en Asistencias',
    accentColor: '#8b96ff',
  },
  DEFENSA: {
    key: 'DEFENSA',
    src: '/public/copas/premio-defensa.svg',
    shortLabel: 'Defensa',
    label: 'Muralla / Defensor del Año',
    accentColor: '#34d399',
  },
  ANOTADOR_BASKET: {
    key: 'ANOTADOR_BASKET',
    src: '/public/copas/premio-anotador-basket.svg',
    shortLabel: 'Anotador',
    label: 'Máximo Anotador Básquetbol',
    accentColor: '#fb923c',
  },
  REBOTES_BASKET: {
    key: 'REBOTES_BASKET',
    src: '/public/copas/premio-rebotes-basket.svg',
    shortLabel: 'Tableros',
    label: 'Rey de los Tableros',
    accentColor: '#38bdf8',
  },
};

function escAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function resolveTrophyAsset(trophy) {
  if (!trophy) return TROPHY_ASSETS.LEAGUE_1;
  if (typeof trophy === 'string' && TROPHY_ASSETS[trophy]) {
    return TROPHY_ASSETS[trophy];
  }

  const type = String(trophy.type || '').toUpperCase();
  const title = String(trophy.title || '').toLowerCase();

  if (type === 'NOTFC') return TROPHY_ASSETS.NOTFC;
  if (type === 'HEROIC_ASCENT') return TROPHY_ASSETS.HEROIC_ASCENT;
  if (type === 'INTERFACULTADES') return TROPHY_ASSETS.INTERFACULTADES;
  if (type === 'FACULTY') return TROPHY_ASSETS.FACULTY;
  if (type === 'SELECCION') {
    if (title.includes('fenaude') || title.includes('nacional')) return TROPHY_ASSETS.FENAUDE;
    if (title.includes('ldes')) return TROPHY_ASSETS.LDES;
    if (title.includes('univerciudad')) return TROPHY_ASSETS.UNIVERCIUDAD;
    if (title.includes('cnu') || title.includes('clasificatorio')) {
      return TROPHY_ASSETS.CLASIFICATORIO_CNU;
    }
    return TROPHY_ASSETS.LDES;
  }
  if (type === 'LEAGUE') {
    const div = Number(trophy.division);
    if (div === 3 || title.includes('3ª') || title.includes('tercera')) return TROPHY_ASSETS.LEAGUE_3;
    if (div === 2 || title.includes('2ª') || title.includes('segunda')) return TROPHY_ASSETS.LEAGUE_2;
    return TROPHY_ASSETS.LEAGUE_1;
  }

  if (title.includes('not f.c')) return TROPHY_ASSETS.NOTFC;
  if (title.includes('hazaña') || title.includes('3ª → 1ª')) return TROPHY_ASSETS.HEROIC_ASCENT;
  if (title.includes('interfacultades')) return TROPHY_ASSETS.INTERFACULTADES;
  if (title.includes('facultad')) return TROPHY_ASSETS.FACULTY;
  if (title.includes('fenaude')) return TROPHY_ASSETS.FENAUDE;
  if (title.includes('ldes')) return TROPHY_ASSETS.LDES;
  if (title.includes('univerciudad')) return TROPHY_ASSETS.UNIVERCIUDAD;
  if (title.includes('cnu') || title.includes('clasificatorio')) return TROPHY_ASSETS.CLASIFICATORIO_CNU;
  return TROPHY_ASSETS.LEAGUE_1;
}

export function resolveAwardAsset(award) {
  if (!award) return AWARD_ASSETS.MVP;
  if (typeof award === 'string' && AWARD_ASSETS[award]) {
    return AWARD_ASSETS[award];
  }

  const title = String(award.title || award.key || '').toLowerCase();
  const icon = String(award.icon || '');

  if (title.includes('anotador') || icon === '🏀') return AWARD_ASSETS.ANOTADOR_BASKET;
  if (title.includes('tablero') || title.includes('rebote') || icon === '💪') {
    return AWARD_ASSETS.REBOTES_BASKET;
  }
  if (title.includes('goleador') || title.includes('goleadora') || icon === '⚽') {
    return AWARD_ASSETS.GOLEADOR;
  }
  if (title.includes('guante') || title.includes('arquero') || title.includes('arquera') || icon === '🧤') {
    return AWARD_ASSETS.GUANTE;
  }
  if (title.includes('asist') || title.includes('cerebro') || icon === '🎯') {
    return AWARD_ASSETS.ASISTENCIAS;
  }
  if (title.includes('defens') || title.includes('muralla') || icon === '🧱' || icon === '🛡️') {
    return AWARD_ASSETS.DEFENSA;
  }
  if (title.includes('mvp') || title.includes('mejor jugador') || title.includes('mejor jugadora') || icon === '🌟' || icon === '👑') {
    return AWARD_ASSETS.MVP;
  }
  return AWARD_ASSETS.MVP;
}

export function groupTrophiesForVitrina(trophies = []) {
  const order = [
    'FENAUDE',
    'HEROIC_ASCENT',
    'INTERFACULTADES',
    'LDES',
    'UNIVERCIUDAD',
    'LEAGUE_1',
    'LEAGUE_2',
    'LEAGUE_3',
    'FACULTY',
    'CLASIFICATORIO_CNU',
    'NOTFC',
  ];
  const map = new Map();
  for (const t of Array.isArray(trophies) ? trophies : []) {
    const asset = resolveTrophyAsset(t);
    if (!map.has(asset.key)) {
      map.set(asset.key, { asset, count: 0, years: [] });
    }
    const entry = map.get(asset.key);
    entry.count += 1;
    if (t && t.year && !entry.years.includes(t.year)) {
      entry.years.push(t.year);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const ia = order.indexOf(a.asset.key);
    const ib = order.indexOf(b.asset.key);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function renderTrophyImgHTML(trophy, sizeClass = 'w-10 h-10', extraClass = '') {
  const asset = resolveTrophyAsset(trophy);
  const alt = escAttr((trophy && trophy.title) || asset.label);
  return `<img src="${asset.src}" alt="${alt}" title="${alt}" class="${sizeClass} object-contain shrink-0 drop-shadow-md ${extraClass}" loading="lazy">`;
}

export function renderAwardImgHTML(award, sizeClass = 'w-10 h-10', extraClass = '') {
  const asset = resolveAwardAsset(award);
  const alt = escAttr((award && award.title) || asset.label);
  return `<img src="${asset.src}" alt="${alt}" title="${alt}" class="${sizeClass} object-contain shrink-0 drop-shadow-md ${extraClass}" loading="lazy">`;
}
