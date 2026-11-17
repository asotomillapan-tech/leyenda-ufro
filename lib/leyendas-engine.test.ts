import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OVR_HARD_CAP,
  SPORT_CONFIG,
  GPA_THRESHOLDS,
  EXTRA_FOOTBALL_CAREERS,
  EXTRA_LOWER_DIV_FOOTBALL_TEAMS,
  BASKETBALL_MALE_CATALOG,
  FOCUS_CARD_POOL,
  CAREER_EXCLUSIVE_EVENTS_ALL,
  getPlayerAge,
  getSportPositions,
  computeSemesterOvrChange,
  createInitialGpa,
  updateHiddenGpa,
  checkAcademicFailRisk,
  evaluateSportsScholarship,
  getPostgradEligibility,
  getAcademicNarrativeHint,
  drawSemesterFocusCards,
  pickContextualKeyMoment,
  resolveKeyMomentChoice,
  findCareerExclusiveEvent,
  getTrialAcceptanceChance,
  buildFallbackTryoutTeams,
  isDerbyRival,
  initRecurringRival,
  simulateRivalEncounter,
  buildSemesterNarrative,
  generateSemesterStats,
  computeIndividualAwards,
  getTrophyPrestigePoints,
  calculateCareerLeaderboardScore,
} from '../public/leyendas-engine.js';

function makeSeededRng(seed = 42) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('Realistic OVR progression slows at 21-22 (years 4-5) and declines at 23+ due to academic load', () => {
  const rng = makeSeededRng(10);

  // Early years (Year 2 -> age 19): solid development even as non-prodigy
  const early = computeSemesterOvrChange({
    ovr: 68,
    isProdigy: true,
    currentYear: 2,
    avgRating: 7.9,
    playedRatio: 0.9,
    gpa: 5.5,
    focusCard: FOCUS_CARD_POOL.find((c) => c.id === 'tec_plata_pizarra'),
    rng,
  });
  assert.equal(getPlayerAge(2), 19);
  assert.ok(early.delta >= 2 && early.delta <= 4, `Early prodigy delta should be realistic (2-4), got ${early.delta}`);

  // Even a full prodigy career over 10 semesters shouldn't trivially hit >99 without gold combos
  let prodigyOvr = 69;
  for (let y = 1; y <= 5; y += 1) {
    for (let s = 1; s <= 2; s += 1) {
      const step = computeSemesterOvrChange({
        ovr: prodigyOvr,
        isProdigy: true,
        currentYear: y,
        avgRating: 7.9,
        playedRatio: 0.85,
        gpa: 5.4,
        focusCard: FOCUS_CARD_POOL.find((c) => c.id === 'fis_bronce_trote'),
        rng,
      });
      prodigyOvr = step.nextOvr;
    }
  }
  assert.ok(prodigyOvr <= 96, `Prodigy shouldn't trivially reach 🐐 in 5 years, got ${prodigyOvr}`);
  assert.ok(prodigyOvr <= OVR_HARD_CAP);

  // Year 6+ (age 23+): plateau/decline unless mitigated
  const lateDecline = computeSemesterOvrChange({
    ovr: 86,
    isProdigy: false,
    currentYear: 6,
    avgRating: 7.2,
    playedRatio: 0.75,
    gpa: 4.3,
    focusCard: FOCUS_CARD_POOL.find((c) => c.id === 'est_bronce_apuntes'),
    hasScholarship: false,
    rng,
  });
  assert.equal(lateDecline.age, 23);
  assert.ok(lateDecline.delta < 0, `Expected negative delta at age 23 with low GPA, got ${lateDecline.delta}`);

  // Gold Rest mitigates decline at 23+
  const mitigated = computeSemesterOvrChange({
    ovr: 86,
    isProdigy: false,
    currentYear: 6,
    avgRating: 7.8,
    playedRatio: 0.8,
    gpa: 5.7,
    focusCard: FOCUS_CARD_POOL.find((c) => c.id === 'des_oro_zen'),
    hasScholarship: true,
    rng,
  });
  assert.ok(mitigated.delta >= 0, `Expected Gold Rest + scholarship to cushion decline, got ${mitigated.delta}`);
});

test('Hidden GPA drives fail risk, sports scholarship, and sequential Masters -> PhD eligibility', () => {
  const rng = makeSeededRng(7);
  const initGpa = createInitialGpa(false, rng);
  assert.ok(initGpa >= 4.9 && initGpa <= 5.8);

  // Safe GPA has zero academic fail risk
  const safeCheck = checkAcademicFailRisk(5.2, false, rng);
  assert.equal(safeCheck.atRisk, false);
  assert.equal(safeCheck.prob, 0);
  assert.equal(safeCheck.failed, false);

  // Low GPA has elevated fail risk
  const lowCheck = checkAcademicFailRisk(3.9, false, rng);
  assert.equal(lowCheck.atRisk, true);
  assert.ok(lowCheck.prob >= 0.5);

  // Updating GPA responds to focus & year drag
  const improvedGpa = updateHiddenGpa(5.2, 0.5, { hasScholarship: false, currentYear: 2 });
  assert.ok(improvedGpa >= GPA_THRESHOLDS.SCHOLARSHIP);

  const scholarshipRes = evaluateSportsScholarship({ gpa: improvedGpa, ovr: 74, currentlyHas: false });
  assert.equal(scholarshipRes.hasScholarship, true);
  assert.equal(scholarshipRes.newlyUnlocked, true);

  // Masters eligibility requires GPA >= 5.3, PhD requires Masters + GPA >= 5.6
  assert.equal(getPostgradEligibility({ gpa: 4.9, postgradStage: 'UNDERGRAD' }).canContinue, false);
  const mastersOk = getPostgradEligibility({ gpa: 5.4, postgradStage: 'UNDERGRAD' });
  assert.equal(mastersOk.canContinue, true);
  assert.equal(mastersOk.nextStage, 'MASTERS');
  assert.equal(mastersOk.yearsToAdd, 2);

  assert.equal(getPostgradEligibility({ gpa: 5.4, postgradStage: 'MASTERS' }).canContinue, false);
  const phdOk = getPostgradEligibility({ gpa: 5.8, postgradStage: 'MASTERS' });
  assert.equal(phdOk.canContinue, true);
  assert.equal(phdOk.nextStage, 'PHD');
  assert.equal(phdOk.yearsToAdd, 3);
});

test('Dynamic semester focus cards draw 4 distinct categories with Bronce/Plata/Oro rarities', () => {
  const rng = makeSeededRng(101);
  const cards = drawSemesterFocusCards({ hasScholarship: false, isProdigy: false, rng });
  assert.equal(cards.length, 4);
  const categories = new Set(cards.map((c) => c.category));
  assert.deepEqual(categories, new Set(['FISICO', 'TECNICO', 'ESTUDIO', 'DESCANSO']));
  for (const c of cards) {
    assert.ok(['BRONCE', 'PLATA', 'ORO'].includes(c.tier));
  }
});

test('Key moments resolve safe & risky options cleanly for FUTBOL and BASKET', () => {
  const rng = makeSeededRng(33);
  const futMoment = pickContextualKeyMoment({ sport: 'FUTBOL', sem: 2, usedIds: [], rng });
  assert.ok(futMoment);
  const safeRes = resolveKeyMomentChoice(futMoment, false, { ovr: 72, rng });
  assert.equal(safeRes.risky, false);
  assert.ok(safeRes.teamBoost > 0);

  const basMoment = pickContextualKeyMoment({ sport: 'BASKET', sem: 2, usedIds: [], rng });
  assert.ok(basMoment);
  const riskyRes = resolveKeyMomentChoice(basMoment, true, { ovr: 82, rng });
  assert.equal(riskyRes.risky, true);
  assert.equal(typeof riskyRes.won, 'boolean');
});

test('All 42 UFRO careers (football + basketball catalogs) match an exclusive career event', () => {
  const all42Careers = [
    'Pedagogía en Educación Física, Deportes y Recreación',
    'Psicología',
    'Trabajo Social',
    'Sociología',
    'Periodismo',
    'Pedagogía en Castellano y Comunicación',
    'Pedagogía en Historia, Geografía y Educación Cívica',
    'Pedagogía en Inglés',
    'Pedagogía en Ciencias mención Biología, Química o Física',
    'Pedagogía en Matemática',
    'Ingeniería Civil Industrial',
    'Ingeniería Civil Informática',
    'Ingeniería Civil Mecánica',
    'Ingeniería Civil Electrónica',
    'Ingeniería Civil Eléctrica',
    'Ingeniería Civil Química',
    'Ingeniería Civil Ambiental',
    'Ingeniería Civil Matemática',
    'Ingeniería Civil Física',
    'Ingeniería Civil Telemática',
    'Ingeniería Civil en Biotecnología',
    'Ingeniería Civil (Plan Común)',
    'Ingeniería en Construcción',
    'Bioquímica',
    'Química y Farmacia',
    'Medicina',
    'Enfermería',
    'Kinesiología',
    'Nutrición y Dietética',
    'Obstetricia y Puericultura',
    'Tecnología Médica',
    'Fonoaudiología',
    'Terapia Ocupacional',
    'Agronomía',
    'Ingeniería en Recursos Naturales',
    'Biotecnología',
    'Derecho',
    'Ingeniería Comercial',
    'Contador Público y Auditor',
    'Odontología',
    ...EXTRA_FOOTBALL_CAREERS.map((c) => c.career),
  ];

  assert.equal(all42Careers.length, 42);
  assert.equal(CAREER_EXCLUSIVE_EVENTS_ALL.length, 42);
  assert.equal(EXTRA_LOWER_DIV_FOOTBALL_TEAMS.length, 10);

  for (const careerName of all42Careers) {
    const matchesS1 = findCareerExclusiveEvent(careerName, 1, [], 1);
    const matchesS2 = findCareerExclusiveEvent(careerName, 2, [], 1);
    assert.ok(matchesS1.length > 0 || matchesS2.length > 0, `Missing exclusive event for ${careerName}`);
  }

  for (const team of BASKETBALL_MALE_CATALOG) {
    const matches = findCareerExclusiveEvent(team.career, 1, [], 1);
    assert.ok(matches.length > 0, `Missing exclusive event for basket career ${team.career}`);
  }
});

test('Female & Basketball tryouts compute real rejection odds from team OVR and provide safe fallback teams', () => {
  const eliteFemale = { code: 'FEM-EFI-01', name: 'Efiorentina Fem', ovr: 83, facultyKey: 'FECSH' };
  const midFemale = { code: 'FEM-CIE-01', name: 'Científicas F.C.', ovr: 68, facultyKey: 'FECSH' };
  const eliteChance = getTrialAcceptanceChance(eliteFemale, 'F', 'FUTBOL');
  const midChance = getTrialAcceptanceChance(midFemale, 'F', 'FUTBOL');

  assert.ok(eliteChance < 0.3, `Elite female OVR 83 should reject often, got ${eliteChance}`);
  assert.ok(midChance > 0.75, `Mid female OVR 68 should accept much more often, got ${midChance}`);

  const eliteBasket = BASKETBALL_MALE_CATALOG.find((t) => t.ovr >= 82);
  assert.ok(getTrialAcceptanceChance(eliteBasket, 'M', 'BASKET') < 0.3);

  const fallbacks = buildFallbackTryoutTeams(BASKETBALL_MALE_CATALOG, ['BAS-FECSH-EFI-02'], 'FECSH');
  assert.ok(fallbacks.length >= 2 && fallbacks.length <= 4);
  assert.equal(fallbacks.some((t) => t.code === 'BAS-FECSH-EFI-02'), false);
});

test('Recurring rival uses derby relationship and narrative hides numeric GPA digits', () => {
  const rng = makeSeededRng(19);
  const teamA = { code: 'BAS-FCJE-ICO-01', name: 'Comercial United AB', ovr: 81, facultyKey: 'FCJE', derby: 'BAS-FCJE-ICO-02' };
  const teamB = { code: 'BAS-FCJE-ICO-02', name: 'Golden Kolter Warriors', ovr: 75, facultyKey: 'FCJE', derby: 'BAS-FCJE-ICO-01' };
  assert.equal(isDerbyRival(teamA, teamB), true);

  const rival = initRecurringRival(teamA, BASKETBALL_MALE_CATALOG);
  assert.equal(rival.code, 'BAS-FCJE-ICO-02');
  assert.equal(rival.isOfficialDerby, true);

  const enc = simulateRivalEncounter({ rival, playerTeam: teamA, playerOvr: 80, sport: 'BASKET', rng });
  assert.equal(rival.encounters, 1);
  assert.ok(['WIN', 'LOSS'].includes(enc.outcome));

  const academicHint = getAcademicNarrativeHint(5.65, true);
  assert.equal(/\d\.\d/.test(academicHint), false, 'Academic hint must never leak raw GPA digits');

  const narrative = buildSemesterNarrative({
    sport: 'BASKET',
    year: 3,
    sem: 1,
    teamName: teamA.name,
    focusCard: FOCUS_CARD_POOL[0],
    academicHint,
    rivalText: enc.text,
    leagueSummaryText: 'Semifinales Playoffs',
  });
  assert.ok(narrative.includes(teamA.name));
  assert.ok(narrative.includes(rival.name));
});

test('Basketball positions/stats and balanced Football defender/midfielder leaderboard points work properly', () => {
  const rng = makeSeededRng(55);
  assert.deepEqual(getSportPositions('BASKET'), SPORT_CONFIG.BASKET.positions);
  assert.equal(BASKETBALL_MALE_CATALOG.length, 50);

  const basStats = generateSemesterStats({
    sport: 'BASKET',
    position: 'BASE',
    ovr: 84,
    playedRatio: 0.9,
    matchesPlayed: 11,
    rng,
  });
  assert.ok(basStats.points > 100);
  assert.ok(basStats.assists > 50);

  const basAwards = computeIndividualAwards({
    sport: 'BASKET',
    position: 'BASE',
    gender: 'M',
    year: 2,
    semStats: { ...basStats, matches: 11, divisionPlayed: 1, teamName: 'Industars' },
  });
  assert.ok(Array.isArray(basAwards));

  // Verify 3ra -> 1ra heroic ascent beats normal Div 1 title in prestige & DEF competes fairly with DEL
  assert.ok(getTrophyPrestigePoints({ type: 'HEROIC_ASCENT' }) > getTrophyPrestigePoints({ type: 'LEAGUE', division: 1 }));

  const commonTrophies = [
    { type: 'LEAGUE', division: 1, title: 'Campeón 1ª División UFRO', year: 4 },
    { type: 'INTERFACULTADES', title: 'Campeón Interfacultades', year: 4 },
  ];

  const delScore = calculateCareerLeaderboardScore({
    sport: 'FUTBOL',
    position: 'DEL',
    ovr: 86,
    trophies: commonTrophies,
    awards: [{ title: 'Goleador' }],
    stats: { goals: 62, assists: 26, cleanSheets: 0 },
    history: [{ avgRating: 7.9 }, { avgRating: 8.1 }],
  });

  const defScore = calculateCareerLeaderboardScore({
    sport: 'FUTBOL',
    position: 'DEF',
    ovr: 86,
    trophies: commonTrophies,
    awards: [{ title: 'Mejor Defensa' }],
    stats: { goals: 14, assists: 19, cleanSheets: 34 },
    history: [{ avgRating: 7.9 }, { avgRating: 8.1 }],
  });

  const diff = Math.abs(delScore - defScore);
  assert.ok(diff <= 20, `DEL (${delScore}) and DEF (${defScore}) with comparable careers should be balanced (diff=${diff})`);

  const heroicScore = calculateCareerLeaderboardScore({
    sport: 'FUTBOL',
    position: 'DEF',
    ovr: 86,
    promotionsCount: 2,
    heroicDiv3ToDiv1: true,
    trophies: [...commonTrophies, { type: 'HEROIC_ASCENT', title: 'Hazaña 3ª → 1ª' }],
    awards: [{ title: 'Mejor Defensa' }],
    stats: { goals: 14, assists: 19, cleanSheets: 34 },
    history: [{ avgRating: 7.9 }, { avgRating: 8.1 }],
  });
  assert.ok(heroicScore >= defScore + 120, `Heroic 3ra->1ra ascent (${heroicScore}) should strongly reward (${defScore})`);
});
