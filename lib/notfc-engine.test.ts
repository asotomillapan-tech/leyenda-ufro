import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARRERAS_UFRO,
  SEED_UFRO_TEAMS,
  parseCsvText,
  computeAgeFromBirthDate,
  validateTeamCareerMatch,
  calculateInitialClubBudget,
  buildSeedDatabase,
  buildDatabaseFromSheetsPayload,
} from '../public/notfc-data.js';
import {
  HALF_REAL_SECONDS,
  GAME_MINUTES_PER_HALF,
  buildRegularSchedule,
  generateSeasonCalendar,
  initializeDtCareerState,
  advanceSimulationStep,
  resolveDtDecision,
  commitCompletedLiveMatch,
  resimulateLiveMatchSession,
  setClubFormation,
  swapStarterAndBench,
  toggleTransferListPlayer,
  setPlayerJerseyNumber,
  terminatePlayerContract,
  renewPlayerContract,
  searchMarketPlayers,
  signMarketPlayer,
  startNextSeason,
  getScoreAtMinute,
  formatClp,
  getPlayerEffectiveOvr,
  startPlayerPositionTraining,
  promoteSecondaryToPrimaryPosition,
  advanceUserPositionTraining,
  submitSponsorProposal,
  processSponsorInstallments,
  computeSponsorEvaluationProfile,
  generateCommercialOffers,
  getCommercialAgreementsSummary,
  getTransferWindowState,
  processPendingIncomingTransfers,
  FORMATIONS_F7,
  getFormationLayout,
  getClubBoardExpectations,
  swapStartersOrder,
  matchesPlayerSearchQuery,
  getRecommendedMarketPlayers,
  recordSeasonAchievementsAndStats,
  computeDtCareerScore,
  buildNotFcRankingEntry,
  ACADEMIC_STAGE_LIMITS,
  MAX_FOREIGN_CAREER_PLAYERS,
  sortSquadPlayers,
  getForeignCareerQuotaStatus,
  getPlayerAcademicInfo,
  generateIncomingSaleOffers,
  acceptIncomingSaleOffer,
  counterIncomingSaleOffer,
  rejectIncomingSaleOffer,
  computeAnnualOvrDelta,
  advancePlayerAcademicYear,
  generateAnnualYouthIntake,
  evaluateAndGenerateDtJobOffers,
  acceptDtJobOffer,
  declineDtJobOffer,
  setClubTactics,
  computeTacticsModifiers,
  applyHalftimeTeamTalk,
  setClubCaptain,
  getCaptainImpact,
  signTryoutCandidate,
  dismissTryoutSession,
  loanOutPlayer,
  loanInMarketPlayer,
  processActiveLoansStep,
  toggleWatchlistPlayer,
  getWatchlistSnapshot,
  submitNegotiatedTransferOffer,
  getDivisionPlayerLeaders,
  buildSeasonBestSeven,
  ensureDtLedger,
  getPendingUserCopaMatch,
  prepareUserCopaLiveMatch,
  simulateUserCopaRoundNow,
  ensureAvailableStarters,
} from '../public/notfc-engine.js';

function makeSeededRng(seed = 42) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function assertExactUniqueOpponents(rounds, teamIds, expectedGamesPerTeam, label) {
  const opponentsByTeam = new Map(teamIds.map((id) => [id, new Set()]));
  const gamesCount = new Map(teamIds.map((id) => [id, 0]));

  for (const md of rounds) {
    const seenToday = new Set();
    for (const fx of md.matches) {
      assert.notEqual(fx.homeId, fx.awayId, `${label}: team playing itself`);
      assert.equal(seenToday.has(fx.homeId), false, `${label}: duplicate team in round ${md.round}`);
      assert.equal(seenToday.has(fx.awayId), false, `${label}: duplicate team in round ${md.round}`);
      seenToday.add(fx.homeId);
      seenToday.add(fx.awayId);

      opponentsByTeam.get(fx.homeId).add(fx.awayId);
      opponentsByTeam.get(fx.awayId).add(fx.homeId);
      gamesCount.set(fx.homeId, gamesCount.get(fx.homeId) + 1);
      gamesCount.set(fx.awayId, gamesCount.get(fx.awayId) + 1);
    }
  }

  for (const id of teamIds) {
    assert.equal(gamesCount.get(id), expectedGamesPerTeam, `${label}: ${id} expected ${expectedGamesPerTeam} games`);
    assert.equal(opponentsByTeam.get(id).size, expectedGamesPerTeam, `${label}: ${id} expected ${expectedGamesPerTeam} unique opponents`);
  }
}

test('Google Sheets parser handles F7-EQUIPOS, F7-JUGADORES (blank OVR randomization + career validation), CARRERAS-UFRO and hides potential', () => {
  const rng = makeSeededRng(17);
  const equiposCsv = [
    'ID_Equipo,Nombre_Equipo,Carrera,Facultad,Logros_Anteriores,escudo,derby,Division,OVR',
    ...SEED_UFRO_TEAMS.slice(0, 12).map((t, idx) =>
      `"${t.id}","${t.name}","${t.career}","${t.faculty}","${t.achievements}","${idx === 0 ? 'Real Efineza.jpg' : t.escudo}","${idx === 1 ? 'Real Efineza' : t.derby}",${t.division},${t.baseOvr}`
    ),
  ].join('\n');

  const jugadoresCsv = [
    'ID_Jugador,ID_Equipo,Nombre_Jugador,Apellido_Jugador,Nacimiento,Carrera_Jugador,OVR,Validación_Equipo_Carrera',
    'J1,FECSH-EFI-01,Carlos,Muñoz,15/04/2003,Pedagogía en Educación Física,,Pertenece',
    'J2,FECSH-EFI-01,Bastian,Rojas,2004-08-19,Derecho,77,No Pertenece',
    'J4,FECSH-EFI-01,Emilio,Urra,19/02/2007,Bachillerato en Ciencias Sociales,,Carrera no oficial',
    'J3,FREE_AGENT,Agente,Estrella,10/10/2002,Kinesiología,,No Pertenece',
  ].join('\n');

  const carrerasCsv = 'Carrera,Facultad\nAgronomía,FCAM\nDerecho,FCJE\nIngeniería Civil Informática,FICA\nMedicina,MED\n';

  const parsedRows = parseCsvText(jugadoresCsv);
  assert.equal(parsedRows.length, 5);
  assert.equal(computeAgeFromBirthDate('15/04/2003', 2026), 23);
  assert.equal(computeAgeFromBirthDate('2004-08-19', 2026), 22);
  assert.equal(validateTeamCareerMatch('Derecho', 'Derecho'), true);
  assert.equal(validateTeamCareerMatch('Agronomía', 'Derecho', 'Pertenece'), true);
  assert.equal(validateTeamCareerMatch('Derecho', 'Medicina'), false);
  assert.equal(validateTeamCareerMatch('Derecho', 'Medicina', 'No Pertenece'), false);
  assert.equal(validateTeamCareerMatch('Bachillerato', 'Medicina', 'Carrera no oficial'), false);

  const db = buildDatabaseFromSheetsPayload({
    ok: true,
    sheetUrl: 'https://example.com/sheet',
    equiposTabs: [{ name: 'F7-EQUIPOS-1DIVISION-H', csv: equiposCsv }],
    jugadoresTabs: [{ name: 'F7-JUGADORES-1DIVISION-H', csv: jugadoresCsv }],
    carrerasTabs: [{ name: 'CARRERAS-UFRO', csv: carrerasCsv }],
  }, rng);

  assert.equal(db.source, 'google_sheets_live');
  assert.deepEqual(db.carrerasUfro, ['Agronomía', 'Derecho', 'Ingeniería Civil Informática', 'Medicina']);

  const realEfineza = db.teams.find((t) => t.id === 'FECSH-EFI-01');
  const kineiro = db.teams.find((t) => t.id === 'MED-KIN-01');
  assert.ok(realEfineza && kineiro);
  assert.ok(realEfineza.escudo.startsWith('https://images.ligup2.com/'), 'Filename escudo should fall back to known UFRO HTTPS logo when available');
  assert.equal(kineiro.derby, 'FECSH-EFI-01', 'Derby name in Sheet should resolve to rival team ID');

  const j1 = realEfineza.players.find((p) => p.id === 'J1');
  const j2 = realEfineza.players.find((p) => p.id === 'J2');
  const j4 = realEfineza.players.find((p) => p.id === 'J4');
  assert.ok(j1 && j2 && j4);
  assert.equal(j1.firstName, 'Carlos');
  assert.equal(j1.lastName, 'Muñoz');
  assert.ok(j1.ovr >= 68 && j1.ovr <= 82, `Expected randomized blank OVR for Div 1 in 68..82, got ${j1.ovr}`);
  assert.equal(j1.careerMatchValid, true);
  assert.equal(j2.ovr, 77);
  assert.equal(j2.careerMatchValid, false);
  assert.equal(j4.careerMatchValid, false);
  assert.equal(j1.potential, undefined);
  assert.equal(j2.potential, undefined);

  const j3 = db.freeAgents.find((p) => p.id === 'J3');
  assert.ok(j3);
  assert.ok(j3.ovr >= 58 && j3.ovr <= 76);
  assert.equal(j3.potential, undefined);
});

test('Seed database respects exact Intercarreras counts (19 Div 1, 26 Div 2, 21+21 Div 3) and contextual initial budget', () => {
  const rng = makeSeededRng(101);
  const db = buildSeedDatabase(rng);
  assert.equal(db.carrerasUfro.length, CARRERAS_UFRO.length);

  const d1 = db.teams.filter((t) => t.division === 1);
  const d2 = db.teams.filter((t) => t.division === 2);
  const d3A = db.teams.filter((t) => t.division === 3 && t.conf === 'A');
  const d3B = db.teams.filter((t) => t.division === 3 && t.conf === 'B');

  assert.equal(d1.length, 19);
  assert.equal(d2.length, 26);
  assert.equal(d3A.length, 21);
  assert.equal(d3B.length, 21);

  const medTop = d1.find((t) => t.id === 'MED-MED-01');
  const d3NoTitle = d3B.find((t) => t.division === 3 && t.achievements.includes('Sin títulos'));
  assert.ok(medTop && d3NoTitle);
  assert.ok(calculateInitialClubBudget(medTop) > calculateInitialClubBudget(d3NoTitle));

  const calendar = generateSeasonCalendar(db.teams);
  assertExactUniqueOpponents(calendar.div1, d1.map((t) => t.id), 10, 'Div 1');
  assertExactUniqueOpponents(calendar.div2, d2.map((t) => t.id), 12, 'Div 2');
  assertExactUniqueOpponents(calendar.div3A, d3A.map((t) => t.id), 10, 'Div 3 Conf A');
  assertExactUniqueOpponents(calendar.div3B, d3B.map((t) => t.id), 10, 'Div 3 Conf B');
});

test('Custom club starts in 3ª División with invented squad, while existing club preserves division and original roster', () => {
  const rng = makeSeededRng(202);
  const db = buildSeedDatabase(rng);

  const existingState = initializeDtCareerState({
    database: db,
    dtName: 'DT Profe',
    selectedTeamId: 'MED-MED-01',
    rng,
  });
  const med = existingState.teams.find((t) => t.id === existingState.userTeamId);
  assert.equal(med.division, 1);
  assert.equal(med.players.length, 14);
  assert.equal(med.players.every((p) => p.potential === undefined), true);

  const customState = initializeDtCareerState({
    database: db,
    dtName: 'DT Nuevo',
    customClubInput: {
      name: 'Informática Leyenda FC',
      code: 'ILF',
      career: 'Ingeniería Civil Informática',
      conf: 'B',
    },
    rng,
  });
  const customClub = customState.teams.find((t) => t.id === customState.userTeamId);
  assert.equal(customClub.division, 3);
  assert.equal(customClub.conf, 'B');
  assert.equal(customClub.players.length, 14);
  assert.equal(customState.teams.filter((t) => t.division === 3 && t.conf === 'A').length, 21);
  assert.equal(customState.teams.filter((t) => t.division === 3 && t.conf === 'B').length, 21);
});

test('Táctica, Plantilla (dorsal, venta, contrato, ánimo) y Mercado (sin potencial) funcionan de extremo a extremo', () => {
  const rng = makeSeededRng(303);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Mercado',
    selectedTeamId: 'FECSH-EFI-01',
    rng,
  });
  const club = state.teams.find((t) => t.id === state.userTeamId);

  // Formation change & valid/invalid substitutions
  assert.equal(setClubFormation(club, '1-2-2-2').ok, true);
  assert.equal(club.formation, '1-2-2-2');
  const starterArq = club.starterIds.find((id) => club.players.find((p) => p.id === id)?.position === 'ARQ');
  const benchNonArq = club.benchIds.find((id) => club.players.find((p) => p.id === id)?.position !== 'ARQ');
  const starterNonArq = club.starterIds.find((id) => club.players.find((p) => p.id === id)?.position !== 'ARQ');
  assert.equal(swapStarterAndBench(club, starterArq, benchNonArq).ok, false);
  assert.equal(swapStarterAndBench(club, starterNonArq, benchNonArq).ok, true);
  assert.ok(club.starterIds.includes(benchNonArq));

  // Jersey swap & transfer list
  const pA = club.players[2];
  const pB = club.players[3];
  const oldB = pB.jerseyNumber;
  assert.equal(setPlayerJerseyNumber(club, pA.id, oldB).ok, true);
  assert.equal(pA.jerseyNumber, oldB);
  assert.equal(toggleTransferListPlayer(club, pA.id).transferListed, true);

  // Renew & terminate contract
  const prevSem = pA.contractSemesters;
  assert.equal(renewPlayerContract(state, pA.id).ok, true);
  assert.equal(pA.contractSemesters, prevSem + 2);

  const countBeforeTerm = club.players.length;
  const termRes = terminatePlayerContract(state, pA.id);
  assert.equal(termRes.ok, true);
  assert.equal(club.players.length, countBeforeTerm - 1);
  assert.equal(state.freeAgents[0].id, pA.id);

  // Search players by career + freeAgentsOnly with zero potential exposed
  const medResults = searchMarketPlayers(state, { studiedCareer: 'Medicina', minAge: 17, maxAge: 34, minOvr: 50, maxOvr: 95 });
  assert.ok(medResults.length > 0);
  assert.equal(medResults.every((p) => p.studiedCareer === 'Medicina' && p.potential === undefined), true);

  const faResults = searchMarketPlayers(state, { freeAgentsOnly: true });
  assert.ok(faResults.length > 0);
  assert.equal(faResults.every((p) => p.isFreeAgent && p.potential === undefined), true);

  club.budgetEur = 500000;
  const signRes = signMarketPlayer(state, faResults[0].id);
  assert.equal(signRes.ok, true);
  assert.equal(club.players.some((p) => p.id === faResults[0].id), true);
});

test('Live 2-min-per-half match narration, mid-match pause + sub resimulation, Simular modes, Postseason & Next Season all resolve accurately', () => {
  assert.equal(HALF_REAL_SECONDS, 120);
  assert.equal(GAME_MINUTES_PER_HALF, 25);

  const rng = makeSeededRng(404);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Campeón',
    selectedTeamId: 'FCJE-ICO-01',
    rng,
  });

  // 1) next_event stops first at PRE_SEASON_SPONSORS, then at MARKET_OPEN, then next_match prepares liveMatch
  const step0 = advanceSimulationStep(state, 'next_event', rng);
  assert.equal(step0.status, 'EVENT_STOP');
  assert.equal(step0.event.type, 'PRE_SEASON_SPONSORS');

  const step1 = advanceSimulationStep(state, 'next_event', rng);
  assert.equal(step1.status, 'EVENT_STOP');
  assert.equal(step1.event.type, 'MARKET_OPEN');

  const stepMatch = advanceSimulationStep(state, 'next_match', rng);
  assert.equal(stepMatch.status, 'MATCH_READY');
  assert.ok(state.pendingLiveMatch);
  assert.equal(state.pendingLiveMatch.timeline.events[0].type, 'KICKOFF');

  // Mid-match pause at minute 20: change tactics + sub + resimulate preserving goals up to minute 20
  const userClub = state.teams.find((t) => t.id === state.userTeamId);
  const homeClub = state.teams.find((t) => t.id === state.pendingLiveMatch.homeId);
  const awayClub = state.teams.find((t) => t.id === state.pendingLiveMatch.awayId);
  const scoreAt20 = getScoreAtMinute(state.pendingLiveMatch.timeline.events, 20);

  const sOut = userClub.starterIds.find((id) => userClub.players.find((p) => p.id === id)?.position !== 'ARQ');
  const bIn = userClub.benchIds.find((id) => userClub.players.find((p) => p.id === id)?.position !== 'ARQ');
  swapStarterAndBench(userClub, sOut, bIn);
  setClubFormation(userClub, '1-2-2-2');

  const resim = resimulateLiveMatchSession(state.pendingLiveMatch, 20, homeClub, awayClub, rng);
  const scoreAt20After = getScoreAtMinute(resim.timeline.events, 20);
  assert.deepEqual(scoreAt20After, scoreAt20);

  const commit = commitCompletedLiveMatch(
    state,
    resim.timeline.finalHomeScore,
    resim.timeline.finalAwayScore,
    resim.timeline.events,
    resim.timeline.penWinner,
    rng
  );
  assert.equal(commit.ok, true);
  assert.equal(state.pendingLiveMatch, null);
  assert.ok(state.standings.div1.some((r) => r.pj === 1));

  // 2) Advance to midseason (1st semester -> MIDSEASON_BREAK), then resolve any decision and advance to end of season
  const midRes = advanceSimulationStep(state, 'mid_or_end', rng);
  assert.equal(midRes.status, 'MIDSEASON_REACHED');
  assert.equal(state.semester, 2);

  // Trigger a decision if reached in next_event mode or jump to end
  let guard = 0;
  while (!state.seasonCompleted && guard < 30) {
    guard += 1;
    const res = advanceSimulationStep(state, 'mid_or_end', rng);
    if (res.status === 'DECISION_PENDING' && state.activeDecision) {
      resolveDtDecision(state, state.activeDecision.options[0].id);
    }
  }
  assert.equal(state.seasonCompleted, true);
  assert.ok(state.postseason);
  assert.ok(state.postseason.div1.championId);
  assert.ok(state.postseason.div2.championId);
  assert.ok(state.postseason.div3.championId);
  assert.equal(state.postseason.div1.qf.length, 4);
  assert.equal(state.postseason.div2.qf.length, 4);
  assert.equal(state.postseason.div3.rounds.length, 7);
  assert.equal(state.postseason.liguilla1v2.length, 3);
  assert.equal(state.postseason.liguilla2v3.length, 4);

  // 3) Start season 2 preserving exact division counts (19, 26, 21+21)
  const nextS = startNextSeason(state, rng);
  assert.equal(nextS.ok, true);
  assert.equal(state.season, 2);
  assert.equal(state.teams.filter((t) => t.division === 1).length, 19);
  assert.equal(state.teams.filter((t) => t.division === 2).length, 26);
  assert.equal(state.teams.filter((t) => t.division === 3 && t.conf === 'A').length, 21);
  assert.equal(state.teams.filter((t) => t.division === 3 && t.conf === 'B').length, 21);
});

test('Reconversión posicional y posiciones secundarias reducen OVR temporalmente y permiten promover al alcanzar 85%', () => {
  const rng = makeSeededRng(505);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Táctico',
    selectedTeamId: 'MED-MED-01',
    rng,
  });
  const club = state.teams.find((t) => t.id === state.userTeamId);
  const fieldPlayer = club.players.find((p) => p.position === 'DEL' && club.starterIds.includes(p.id));
  assert.ok(fieldPlayer);

  // Fuera de posición sin entrenamiento tiene penalización significativa
  const unadaptedOvr = getPlayerEffectiveOvr(fieldPlayer, 'DEF');
  assert.ok(unadaptedOvr < fieldPlayer.ovr);

  // Iniciar entrenamiento en DEF comienza en 25% y bloquea promoción anticipada (<85%)
  const startRes = startPlayerPositionTraining(club, fieldPlayer.id, 'DEF');
  assert.equal(startRes.ok, true);
  assert.equal(fieldPlayer.trainingTargetPos, 'DEF');
  assert.equal(fieldPlayer.secondaryPositions.DEF, 25);
  assert.equal(promoteSecondaryToPrimaryPosition(club, fieldPlayer.id, 'DEF').ok, false);

  // Al titular le suma +15% por partido: 25 -> 40 -> 55 -> 70 -> 85
  const starterSet = new Set(club.starterIds);
  for (let i = 0; i < 4; i += 1) {
    advanceUserPositionTraining(state, starterSet);
  }
  assert.equal(fieldPlayer.secondaryPositions.DEF, 85);
  const adaptedOvr = getPlayerEffectiveOvr(fieldPlayer, 'DEF');
  assert.ok(adaptedOvr > unadaptedOvr);

  // Con 85%+ ya puede fijarse DEF como posición principal conservando DEL al 100%
  const promoRes = promoteSecondaryToPrimaryPosition(club, fieldPlayer.id, 'DEF');
  assert.equal(promoRes.ok, true);
  assert.equal(fieldPlayer.position, 'DEF');
  assert.equal(fieldPlayer.secondaryPositions.DEL, 100);
});

test('Patrocinios de pretemporada, moneda CLP, ventanas con pre-acuerdos, resistencia de salida y ranking DT', () => {
  assert.equal(formatClp(145000).includes('$'), true);
  assert.equal(formatClp(145000).includes('€'), false);

  const rng = makeSeededRng(606);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Comercial',
    selectedTeamId: 'FECSH-EFI-01',
    rng,
  });
  const club = state.teams.find((t) => t.id === state.userTeamId);
  const initialBudget = club.budgetEur;

  // 1) Patrocinios: perfil de evaluación (OVR, reputación histórica, rendimiento reciente), rechazo y aceptación con resumen CLP
  const profile = computeSponsorEvaluationProfile(state);
  assert.ok(profile.teamOvr >= 60);
  assert.ok(profile.historicalReputation >= 18 && profile.historicalReputation <= 98);
  assert.ok(profile.recentPerformance >= 16 && profile.recentPerformance <= 98);

  const midOffers = generateCommercialOffers(state, rng, 'MID_SEASON');
  assert.equal(midOffers.offers.length, 6);
  assert.ok(midOffers.offers.some((o) => o.kind === 'MARCA' && o.frequency === 'MENSUAL'));
  assert.ok(midOffers.offers.some((o) => o.kind === 'DIRECCION_CARRERA' && o.frequency === 'SEMESTRAL'));

  const offers = state.sponsorSession.offers;
  const rejectRes = submitSponsorProposal(state, offers[0].id, () => 0.99);
  assert.equal(rejectRes.ok, false);
  assert.equal(state.sponsorSession.proposalsLeft, 2);
  assert.equal(club.budgetEur, initialBudget);

  const mensualOffer = offers.find((o) => o.frequency === 'MENSUAL' && o.status === 'AVAILABLE');
  const acceptRes = submitSponsorProposal(state, mensualOffer.id, () => 0.01);
  assert.equal(acceptRes.ok, true);
  assert.equal(club.budgetEur, initialBudget + mensualOffer.amountPerInstallment);

  const paid = processSponsorInstallments(state, 'MENSUAL', 'Fecha 2');
  assert.equal(paid, mensualOffer.amountPerInstallment);
  assert.equal(club.budgetEur, initialBudget + mensualOffer.amountPerInstallment * 2);

  const summary = getCommercialAgreementsSummary(state);
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.collectedClp, mensualOffer.amountPerInstallment * 2);
  assert.equal(summary.remainingClp, mensualOffer.amountPerInstallment * (mensualOffer.installmentsTotal - 2));

  // 2) Resistencia de salida para jugador de carrera / antigüedad en su club
  const loyalTarget = state.teams
    .filter((t) => t.id !== club.id && t.players.length > 10)
    .flatMap((t) => t.players)
    .find((p) => p.careerMatchValid && p.seasonsAtClub >= 3);
  assert.ok(loyalTarget);
  club.budgetEur = 2000000;

  // Con rng = 0.01 debe rechazar (club o jugador) y permitir contraoferta +25%
  const rejectedTransfer = signMarketPlayer(state, loyalTarget.id, { offerMultiplier: 1 }, () => 0.01);
  assert.equal(rejectedTransfer.ok, false);
  assert.equal(rejectedTransfer.canRetryWithBoost, true);
  assert.ok(rejectedTransfer.rejectedBy === 'CLUB' || rejectedTransfer.rejectedBy === 'PLAYER');

  // Avanzar al campeonato en curso: terminar Pretemporada y jugar Fecha 1 -> ventana CLOSED
  advanceSimulationStep(state, 'next_event', rng); // PRE_SEASON_SPONSORS
  advanceSimulationStep(state, 'next_event', rng); // MARKET_OPEN
  const r1Ready = advanceSimulationStep(state, 'next_match', rng); // Fecha 1 lista
  assert.equal(r1Ready.status, 'MATCH_READY');
  commitCompletedLiveMatch(state, 2, 1, [], null, rng);

  const closedWin = getTransferWindowState(state);
  assert.equal(closedWin.open, false);
  assert.equal(closedWin.code, 'CLOSED');

  const preRes = signMarketPlayer(state, loyalTarget.id, { offerMultiplier: 1.25 }, () => 0.99);
  assert.equal(preRes.ok, true);
  assert.equal(preRes.preAgreement, true);
  assert.equal(state.pendingIncomingTransfers.length, 1);
  assert.equal(club.players.some((p) => p.id === loyalTarget.id), false);

  const arrived = processPendingIncomingTransfers(state, 'Mitad de Temporada');
  assert.equal(arrived.length, 1);
  assert.equal(club.players.some((p) => p.id === loyalTarget.id), true);

  // 3) Logros y Ranking DT
  state.postseason = {
    div1: { championId: club.id, final: [{ loserId: 'X' }] },
    div2: { final: [] },
    div3: {},
    liguilla1v2: [],
    liguilla2v3: [],
  };
  const addedAch = recordSeasonAchievementsAndStats(state);
  assert.ok(addedAch.length >= 1);
  const score = computeDtCareerScore(state);
  assert.ok(score > 0 && score <= 2500);
  const rankEntry = buildNotFcRankingEntry(state, { nickname: 'dtprofe' });
  assert.equal(rankEntry.modeKey, 'NOTFC_DT');
  assert.equal(rankEntry.teamName, club.name);
  assert.equal(rankEntry.dtName, 'DT Comercial');
  assert.equal(rankEntry.score, score);
  assert.ok(rankEntry.trophyList.length >= 1);
});

test('8 esquemas F7 con coordenadas, swap en cancha, exigencias directiva, zonas mapa de calor, búsqueda flexible y recomendaciones', () => {
  const rng = makeSeededRng(707);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Analista',
    selectedTeamId: 'MED-MED-01',
    rng,
  });

  // 1) 8 esquemas F7 con 7 coordenadas normalizadas cada uno
  const formKeys = Object.keys(FORMATIONS_F7);
  assert.equal(formKeys.length, 8);
  for (const key of formKeys) {
    const layout = getFormationLayout(key);
    assert.equal(layout.length, 7, `${key} debe tener 7 titulares`);
    assert.equal(layout[0].role, 'ARQ');
    for (const c of layout) {
      assert.ok(c.x >= 0 && c.x <= 100 && c.y >= 0 && c.y <= 100);
    }
  }

  // 2) Intercambio directo de dos titulares en cancha (swapStartersOrder)
  const club = state.teams.find((t) => t.id === state.userTeamId);
  const s1 = club.starterIds[1];
  const s2 = club.starterIds[2];
  const swapOrder = swapStartersOrder(club, s1, s2);
  assert.equal(swapOrder.ok, true);
  assert.equal(club.starterIds[1], s2);
  assert.equal(club.starterIds[2], s1);

  // 3) Exigencias de la directiva antes de firmar
  const d1Board = getClubBoardExpectations(club);
  assert.ok(d1Board.primary.length > 10);
  assert.ok(Array.isArray(d1Board.secondary) && d1Board.secondary.length >= 1);
  assert.ok(['Alta', 'Media', 'Baja'].includes(d1Board.pressure));

  // 4) Búsqueda flexible con dos nombres y con/sin tilde ("Ángel Francisco Soto")
  const samplePlayer = {
    id: 'P_ANGEL_TEST',
    name: 'Ángel Francisco Soto',
    firstName: 'Ángel Francisco',
    lastName: 'Soto',
    studiedCareer: 'Ingeniería Civil Informática',
    position: 'MED',
    age: 21,
    ovr: 76,
    morale: 42,
    marketValueEur: 120000,
    transferListed: false,
  };
  assert.equal(matchesPlayerSearchQuery(samplePlayer, 'Ángel Soto'), true);
  assert.equal(matchesPlayerSearchQuery(samplePlayer, 'Angel Soto'), true);
  assert.equal(matchesPlayerSearchQuery(samplePlayer, 'soto angel'), true);
  assert.equal(matchesPlayerSearchQuery(samplePlayer, 'Francisco Soto'), true);
  assert.equal(matchesPlayerSearchQuery(samplePlayer, 'Pedro Perez'), false);

  // Inyectar jugador en agente libre para validar searchMarketPlayers end-to-end
  state.freeAgents.unshift(samplePlayer);
  const foundNoAccent = searchMarketPlayers(state, { query: 'Angel Soto' });
  assert.ok(foundNoAccent.some((p) => p.id === 'P_ANGEL_TEST'));
  const foundWithAccent = searchMarketPlayers(state, { query: 'Ángel Soto' });
  assert.ok(foundWithAccent.some((p) => p.id === 'P_ANGEL_TEST'));

  // 5) Jugadores recomendados (sin exponer potencial)
  const recs = getRecommendedMarketPlayers(state, 6);
  assert.ok(recs.length >= 3 && recs.length <= 6);
  for (const r of recs) {
    assert.ok(['Fichaje Bomba', 'Descontento', 'Mejora tu XI'].includes(r.recommendationTag));
    assert.ok(r.recommendationReason && r.recommendationReason.length > 5);
    assert.ok(r.estimatedCostClp > 0);
    assert.equal(r.potential, undefined);
  }

  // 6) Noticias iniciales dinámicas y zonas de mapa de calor en partido en vivo
  assert.ok(Array.isArray(state.news) && state.news.length >= 3);
  assert.ok(state.news.some((n) => n.headline.includes(club.name)));
  advanceSimulationStep(state, 'next_event', rng);
  advanceSimulationStep(state, 'next_event', rng);
  const matchReady = advanceSimulationStep(state, 'next_match', rng);
  assert.equal(matchReady.status, 'MATCH_READY');
  const events = state.pendingLiveMatch.timeline.events;
  assert.ok(events.length >= 5);
  assert.equal(events.every((e) => e.zone && Number.isFinite(e.zone.x) && Number.isFinite(e.zone.y)), true);
});

test('Ordenar plantilla (posición, media, valor), ventas con ofertas/contraoferta y cupo máx. 3 jugadores de otra carrera', () => {
  const rng = makeSeededRng(808);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Reglamento',
    selectedTeamId: 'MED-MED-01',
    rng,
  });
  const club = state.teams.find((t) => t.id === state.userTeamId);
  assert.ok(club);

  // 1) Ordenar plantilla por posición, media y valor
  const byPos = sortSquadPlayers(club.players, 'position', club.starterIds);
  const posRank = { ARQ: 0, DEF: 1, MED: 2, DEL: 3 };
  for (let i = 1; i < byPos.length; i += 1) {
    assert.ok(posRank[byPos[i - 1].position] <= posRank[byPos[i].position]);
  }
  const byOvr = sortSquadPlayers(club.players, 'ovr', club.starterIds);
  for (let i = 1; i < byOvr.length; i += 1) {
    assert.ok(byOvr[i - 1].ovr >= byOvr[i].ovr);
  }
  const byVal = sortSquadPlayers(club.players, 'value', club.starterIds);
  for (let i = 1; i < byVal.length; i += 1) {
    assert.ok(byVal[i - 1].marketValueEur >= byVal[i].marketValueEur);
  }

  // 2) Poner en venta genera oferta -> contraoferta aceptada -> aceptar venta acredita CLP y traspasa jugador
  const sellCandidate = club.players.find((p) => p.position !== 'ARQ');
  assert.ok(sellCandidate);
  const listRes = toggleTransferListPlayer(club, sellCandidate.id, state, rng);
  assert.equal(listRes.ok, true);
  assert.equal(listRes.transferListed, true);
  assert.ok(state.incomingSaleOffers.length >= 1, 'Debe generarse al menos una oferta al poner jugador en venta');

  const offer = state.incomingSaleOffers[0];
  const initialOfferAmount = offer.amountClp;
  const counterTarget = Math.min(offer.maxWillingClp, initialOfferAmount + 4000);
  const counterRes = counterIncomingSaleOffer(state, offer.id, counterTarget);
  assert.equal(counterRes.ok, true);
  assert.equal(counterRes.outcome, 'ACCEPTED_COUNTER');
  assert.equal(offer.amountClp, counterTarget);

  const budgetBeforeSale = club.budgetEur;
  const buyerClub = state.teams.find((t) => t.id === offer.buyerTeamId);
  const saleRes = acceptIncomingSaleOffer(state, offer.id);
  assert.equal(saleRes.ok, true);
  assert.equal(club.budgetEur, budgetBeforeSale + counterTarget);
  assert.equal(club.players.some((p) => p.id === sellCandidate.id), false);
  assert.equal(buyerClub.players.some((p) => p.id === sellCandidate.id), true);

  // 2b) Contraoferta excesiva hace que el comprador se retire, y rechazar quita oferta
  const sell2 = club.players.find((p) => p.position !== 'ARQ');
  toggleTransferListPlayer(club, sell2.id, state, rng);
  const offer2 = state.incomingSaleOffers.find((o) => o.playerId === sell2.id);
  assert.ok(offer2);
  const walkAway = counterIncomingSaleOffer(state, offer2.id, offer2.maxWillingClp * 2);
  assert.equal(walkAway.ok, false);
  assert.equal(walkAway.outcome, 'WITHDRAWN');
  const regen = generateIncomingSaleOffers(state, rng, { triggeredPlayerId: sell2.id });
  assert.ok(regen.length >= 1);
  const rejRes = rejectIncomingSaleOffer(state, regen[0].id);
  assert.equal(rejRes.ok, true);

  // 3) Reglamento: máximo 3 jugadores de otra carrera en el plantel
  assert.equal(MAX_FOREIGN_CAREER_PLAYERS, 3);
  const seedQuota = getForeignCareerQuotaStatus(club);
  assert.ok(seedQuota.currentCount <= 3, `Plantel inicial no debe superar 3 foráneos (actual ${seedQuota.currentCount})`);

  // Llenar exactamente a 3 jugadores de otra carrera
  let foreigns = club.players.filter((p) => p.studiedCareer !== club.career).length;
  for (const p of club.players) {
    if (foreigns >= 3) break;
    if (p.studiedCareer === club.career) {
      p.studiedCareer = 'Derecho';
      p.careerMatchValid = false;
      foreigns += 1;
    }
  }
  const fullQuota = getForeignCareerQuotaStatus(club);
  assert.equal(fullQuota.atLimit, true);
  assert.equal(fullQuota.totalCount, 3);

  club.budgetEur = 2000000;
  // Intentar fichar a un 4° jugador de otra carrera debe ser bloqueado
  const foreignFa = {
    id: 'FA_FOREIGN_BLOCK',
    name: 'Tomás Foráneo',
    firstName: 'Tomás',
    lastName: 'Foráneo',
    age: 20,
    position: 'MED',
    ovr: 74,
    studiedCareer: 'Ingeniería Comercial',
    marketValueEur: 80000,
    academicStage: 'PREGRADO',
    academicYearsCompleted: 1,
  };
  const sameCareerFa = {
    id: 'FA_SAME_ALLOW',
    name: 'Lucas Medicina',
    firstName: 'Lucas',
    lastName: 'Medicina',
    age: 20,
    position: 'DEL',
    ovr: 74,
    studiedCareer: club.career,
    marketValueEur: 80000,
    academicStage: 'PREGRADO',
    academicYearsCompleted: 1,
  };
  state.freeAgents.unshift(foreignFa, sameCareerFa);

  const blockedRes = signMarketPlayer(state, foreignFa.id, {}, rng);
  assert.equal(blockedRes.ok, false);
  assert.equal(blockedRes.blockedByCareerQuota, true);

  // Fichar a uno de la misma carrera SÍ debe estar permitido aunque cupo esté 3/3
  const allowedRes = signMarketPlayer(state, sameCareerFa.id, {}, rng);
  assert.equal(allowedRes.ok, true);
  assert.equal(club.players.some((p) => p.id === sameCareerFa.id), true);
});

test('Topes contractuales académicos (5a/2a/3a), titulación (24+), desarrollo juvenil, camada anual en todas las carreras y ofertas DT', () => {
  const rng = makeSeededRng(909);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Exitoso',
    selectedTeamId: 'MED-KIN-01',
    rng,
  });
  const club = state.teams.find((t) => t.id === state.userTeamId);
  club.budgetEur = 2000000;

  // 1) Topes contractuales por etapa académica: Pregrado 5a (10 sem), Magíster 2a (4 sem), Doctorado 3a (6 sem)
  assert.equal(ACADEMIC_STAGE_LIMITS.PREGRADO.maxSemesters, 10);
  assert.equal(ACADEMIC_STAGE_LIMITS.MAGISTER.maxSemesters, 4);
  assert.equal(ACADEMIC_STAGE_LIMITS.DOCTORADO.maxSemesters, 6);

  const pMag = club.players[1];
  pMag.academicStage = 'MAGISTER';
  pMag.academicYearsCompleted = 0;
  pMag.contractSemesters = 4;
  pMag.morale = 80;
  assert.equal(getPlayerAcademicInfo(pMag).maxContractSemesters, 4);
  const capMagRes = renewPlayerContract(state, pMag.id);
  assert.equal(capMagRes.ok, false, 'Magíster no puede exceder 4 semestres (2 años)');

  const pDoc = club.players[2];
  pDoc.academicStage = 'DOCTORADO';
  pDoc.academicYearsCompleted = 0;
  pDoc.contractSemesters = 5;
  pDoc.morale = 80;
  const renDoc = renewPlayerContract(state, pDoc.id);
  assert.equal(renDoc.ok, true);
  assert.equal(pDoc.contractSemesters, 6, 'Doctorado debe topar en 6 semestres (3 años)');
  assert.equal(renewPlayerContract(state, pDoc.id).ok, false);

  // 2) Progresión OVR juvenil superior a veteranos
  let youngGainSum = 0;
  let vetGainSum = 0;
  const sampleRng = makeSeededRng(1234);
  for (let i = 0; i < 40; i += 1) {
    youngGainSum += computeAnnualOvrDelta({ age: 19, stats: { matches: 8, goals: 3, assists: 2, ratingSum: 59 } }, sampleRng);
    vetGainSum += computeAnnualOvrDelta({ age: 27, stats: { matches: 8, goals: 1, assists: 1, ratingSum: 54 } }, sampleRng);
  }
  assert.ok(youngGainSum > vetGainSum + 40, `Jóvenes deben progresar mucho más rápido (${youngGainSum} vs ${vetGainSum})`);

  // 3) Titulación al superar 24 años / completar etapa
  const seniorGrad = { age: 25, academicStage: 'PREGRADO', academicYearsCompleted: 4, contractSemesters: 2 };
  const gradOutcome = advancePlayerAcademicYear(seniorGrad, () => 0.1);
  assert.equal(gradOutcome.graduated, true);

  const docGrad = { age: 27, academicStage: 'DOCTORADO', academicYearsCompleted: 2, contractSemesters: 2 };
  assert.equal(advancePlayerAcademicYear(docGrad, () => 0.99).graduated, true);

  // 4) Generación anual de nuevos jugadores en todas las carreras (sin exponer potencial)
  const intake = generateAnnualYouthIntake(state, rng);
  assert.ok(intake.totalGenerated >= state.carrerasUfro.length, 'Debe generar al menos 1 nuevo jugador por carrera UFRO');
  assert.ok(intake.toFreeAgents > 0, 'Deben ingresar nuevos jugadores a Agentes Libres');
  assert.ok(intake.toDiv3 > 0, 'Deben ingresar nuevos jugadores a clubes de 3ª División');
  assert.equal(state.freeAgents.every((fa) => fa.potential === undefined), true);

  // 5) Ofertas de otros equipos para el DT cuando hace una buena campaña + aceptar cambia de club conservando stats
  state.careerStats.totalMatches = 8;
  state.careerStats.totalWins = 7;
  const offers = evaluateAndGenerateDtJobOffers(state, rng, 'MID_SEASON');
  assert.ok(offers.length >= 1, 'Buen rendimiento debe generar ofertas de otros clubes para el DT');
  assert.equal(offers.every((o) => o.clubId !== club.id), true);

  if (offers.length >= 2) {
    const decRes = declineDtJobOffer(state, offers[1].id);
    assert.equal(decRes.ok, true);
  }

  const chosenOffer = state.dtJobOffers[0];
  const prevClubId = state.userTeamId;
  const accDt = acceptDtJobOffer(state, chosenOffer.id, rng);
  assert.equal(accDt.ok, true);
  assert.equal(state.userTeamId, chosenOffer.clubId);
  assert.notEqual(state.userTeamId, prevClubId);
  assert.equal(state.careerStats.totalWins, 7, 'Estadísticas del DT deben conservarse al cambiar de club');
  assert.equal(state.dtJobOffers.length, 0);
});

test('v0.2.0: tácticas, fatiga/lesiones/sanciones, charlas de entretiempo, certámenes UFRO y capitanía', () => {
  const rng = makeSeededRng(2020);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT v0.2.0',
    selectedTeamId: 'FECSH-EFI-01',
    rng,
  });
  const club = state.teams.find((t) => t.id === state.userTeamId);

  // 1) Instrucciones tácticas simples
  const tacRes = setClubTactics(club, { mentality: 'OFENSIVA', pressing: 'ALTA', style: 'DIRECTO' });
  assert.equal(tacRes.ok, true);
  const mod = computeTacticsModifiers(club);
  assert.ok(mod.attackMod > 2.5, 'Mentalidad ofensiva + presión alta + directo debe elevar ataque');
  assert.ok(mod.energyDrain >= 20, 'Presión alta debe aumentar desgaste físico');

  // 2) Bloqueo de jugador lesionado/suspendido en swapStarterAndBench y reemplazo automático
  const benchPlayer = club.players.find((p) => club.benchIds.includes(p.id));
  benchPlayer.injuredMatches = 2;
  const starterNonGk = club.players.find((p) => club.starterIds.includes(p.id) && p.position !== 'ARQ');
  const blockedSwap = swapStarterAndBench(club, starterNonGk.id, benchPlayer.id);
  assert.equal(blockedSwap.ok, false, 'No debe permitir alinear a un jugador lesionado');
  benchPlayer.injuredMatches = 0;

  starterNonGk.suspendedMatches = 1;
  const replaced = ensureAvailableStarters(club);
  assert.equal(replaced.length, 1);
  assert.equal(club.starterIds.includes(starterNonGk.id), false);
  starterNonGk.suspendedMatches = 0;

  // 3) Capitanía y liderazgo
  const newCap = club.players.find((p) => p.id !== club.captainId);
  const capRes = setClubCaptain(club, newCap.id);
  assert.equal(capRes.ok, true);
  assert.equal(club.captainId, newCap.id);
  const capImpact = getCaptainImpact(club, true);
  assert.equal(capImpact.captain.id, newCap.id);

  // 4) Charla de entretiempo en partido en vivo
  advanceSimulationStep(state, 'next_event', rng); // PRE_SEASON_SPONSORS
  advanceSimulationStep(state, 'next_event', rng); // MARKET_OPEN
  const matchStep = advanceSimulationStep(state, 'next_match', rng);
  assert.equal(matchStep.status, 'MATCH_READY');
  const pm = state.pendingLiveMatch;
  const home = state.teams.find((t) => t.id === pm.homeId);
  const away = state.teams.find((t) => t.id === pm.awayId);
  const session = {
    matchId: pm.matchId,
    label: pm.label,
    allowDraw: pm.allowDraw,
    timeline: pm.timeline,
    minute: 25,
    halftimePaused: true,
  };
  const talkRes = applyHalftimeTeamTalk(session, 'BACK_SQUAD', state.userTeamId, home, away, rng);
  assert.equal(talkRes.ok, true);
  assert.equal(talkRes.session.halftimeTalkUsed, 'BACK_SQUAD');
  assert.ok(talkRes.session.timeline.events.some((e) => e.type === 'TALK'), 'Debe inyectar comentario de charla en el 2° tiempo');

  // Cerrar el partido y verificar que se aplicó desgaste físico en titulares
  commitCompletedLiveMatch(state, 2, 1, talkRes.session.timeline.events, null, rng);
  const fatiguedStarters = club.starterIds
    .map((id) => club.players.find((p) => p.id === id))
    .filter((p) => p && p.energy < 100);
  assert.ok(fatiguedStarters.length >= 1, 'Los titulares deben registrar desgaste físico tras jugar');

  // 5) Evento de semana de certámenes UFRO en la línea de tiempo
  const examEv = state.timeline.find((e) => e.type === 'EXAM_WEEK');
  assert.ok(examEv, 'La línea de tiempo debe incluir semanas de certámenes UFRO');
  state.timelineIndex = state.timeline.indexOf(examEv);
  const examStep = advanceSimulationStep(state, 'next_event', rng);
  assert.equal(examStep.status, 'DECISION_PENDING');
  assert.equal(state.activeDecision.category, 'CERTÁMENES UFRO');
  const examResolved = resolveDtDecision(state, 'GRANT_EXAM_LEAVE');
  assert.equal(examResolved.ok, true);
  assert.equal(state.activeDecision, null);
});

test('v0.2.0: mechones gratis, préstamos ida/vuelta, seguimiento y negociación con trueque', () => {
  const rng = makeSeededRng(3030);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Mercado',
    selectedTeamId: 'FECSH-EFI-01',
    rng,
  });
  const club = state.teams.find((t) => t.id === state.userTeamId);

  // 1) Captación de Mechones (estimado OVR sin exponer potencial + fichaje $0 CLP)
  assert.ok(state.tryoutSession && state.tryoutSession.candidates.length === 4);
  const firstCand = state.tryoutSession.candidates[0];
  assert.ok(firstCand.estimatedOvrMin < firstCand.estimatedOvrMax);
  assert.equal(firstCand.playerData.potential, undefined);
  const budgetBefore = club.budgetEur;
  const countBefore = club.players.length;
  const tryRes = signTryoutCandidate(state, firstCand.id);
  assert.equal(tryRes.ok, true);
  assert.equal(club.budgetEur, budgetBefore, 'Fichar mechón de pruebas debe ser gratis ($0 CLP)');
  assert.equal(club.players.length, countBefore + 1);
  assert.equal(firstCand.revealedOvr, tryRes.player.ovr);
  dismissTryoutSession(state);
  assert.equal(state.tryoutSession.dismissed, true);

  // 2) Préstamo saliente y retorno automático con posible progreso OVR
  const toLoanOut = club.players.find((p) => p.position !== 'ARQ' && club.benchIds.includes(p.id));
  const loRes = loanOutPlayer(state, toLoanOut.id, 1, rng);
  assert.equal(loRes.ok, true);
  assert.equal(club.players.some((p) => p.id === toLoanOut.id), false);
  assert.equal(state.activeLoans.length, 1);

  const returned = processActiveLoansStep(state, 'Mitad de Temporada', rng);
  assert.equal(returned.length, 1);
  assert.equal(club.players.some((p) => p.id === toLoanOut.id), true);
  assert.equal(state.activeLoans.length, 0);

  // 3) Préstamo entrante respetando cuota de carrera
  const otherClub = state.teams.find((t) => t.id !== club.id && t.players.length > 11);
  const loanTarget = otherClub.players.find((p) => p.position !== 'ARQ');
  club.budgetEur = 900000;
  const liRes = loanInMarketPlayer(state, loanTarget.id, 2, () => 0.1);
  assert.equal(liRes.ok, true);
  assert.equal(club.players.some((p) => p.id === loanTarget.id && p.loanInfo?.direction === 'IN'), true);

  // 4) Lista de seguimiento con alertas vivas
  const watchTarget = state.freeAgents[0];
  const wOn = toggleWatchlistPlayer(state, watchTarget.id);
  assert.equal(wOn.watched, true);
  const snap = getWatchlistSnapshot(state);
  assert.equal(snap.length, 1);
  assert.ok(snap[0].alerts.includes('Agente libre disponible'));
  const wOff = toggleWatchlistPlayer(state, watchTarget.id);
  assert.equal(wOff.watched, false);

  // 5) Negociación personalizada (CLP + trueque de jugador propio)
  const sellerClub = state.teams.find((t) => t.id !== club.id && t.id !== otherClub.id && t.players.length > 11);
  const negTarget = sellerClub.players.find((p) => p.position !== 'ARQ');
  const swapOut = club.players.find((p) => p.position !== 'ARQ' && !p.loanInfo && !p.careerMatchValid)
    || club.players.find((p) => p.position !== 'ARQ' && !p.loanInfo);
  const lowRes = submitNegotiatedTransferOffer(state, negTarget.id, { cashOfferClp: 5000, swapPlayerId: '' }, () => 0.5);
  assert.equal(lowRes.ok, false);
  const fairRes = submitNegotiatedTransferOffer(state, negTarget.id, {
    cashOfferClp: negTarget.marketValueEur,
    swapPlayerId: swapOut.id,
  }, () => 0.2);
  assert.equal(fairRes.ok, true);
  assert.equal(club.players.some((p) => p.id === negTarget.id), true);
  assert.equal(sellerClub.players.some((p) => p.id === swapOut.id), true);
});

test('v0.2.0: Copa Intercarreras (32 clubes), Estadísticas/7 Ideal y Historial DT', () => {
  const rng = makeSeededRng(4040);
  const db = buildSeedDatabase(rng);
  const state = initializeDtCareerState({
    database: db,
    dtName: 'DT Copero',
    selectedTeamId: 'FECSH-EFI-01',
    rng,
  });

  // 1) Copa Intercarreras inicializada con 32 clubes (16 cruces R32) incluyendo al usuario
  assert.ok(state.copa);
  assert.equal(state.copa.rounds.R32.length, 16);
  const pending = getPendingUserCopaMatch(state);
  assert.ok(pending && pending.roundKey === 'R32');

  // Jugar llave R32 de Copa en vivo y ganarla 3-0
  const prep = prepareUserCopaLiveMatch(state, rng);
  assert.equal(prep.ok, true);
  assert.equal(state.pendingLiveMatch.isCopa, true);
  const userIsHome = state.pendingLiveMatch.homeId === state.userTeamId;
  const commit = commitCompletedLiveMatch(state, userIsHome ? 3 : 0, userIsHome ? 0 : 3, [], null, rng);
  assert.equal(commit.ok, true);
  assert.equal(commit.isCopa, true);
  assert.equal(state.copa.activeRoundIndex, 1, 'Debe avanzar a Octavos de Final (R16)');
  assert.equal(state.copa.rounds.R16.length, 8);

  // Simular las rondas restantes de Copa hasta coronar campeón
  let guard = 0;
  while (!state.copa.completed && guard < 6) {
    simulateUserCopaRoundNow(state, rng);
    guard += 1;
  }
  assert.equal(state.copa.completed, true);
  assert.ok(state.copa.championId);

  // 2) Simular mitad de temporada para poblar estadísticas de liga y 7 Ideal
  advanceSimulationStep(state, 'mid_or_end', rng);
  const leaders = getDivisionPlayerLeaders(state, 'ALL');
  assert.ok(leaders.scorers.length > 0, 'Debe haber tabla de goleadores');
  assert.ok(leaders.assisters.length > 0, 'Debe haber tabla de asistidores');
  const { bestSeven, mvp } = buildSeasonBestSeven(state, 'ALL');
  assert.equal(bestSeven.length, 7, 'El 7 Ideal debe contener exactamente 7 jugadores');
  assert.ok(mvp && mvp.name);

  // 3) Historial DT con registro de partidos, mayor goleada y etapa
  const ledger = ensureDtLedger(state);
  assert.ok(ledger.stints.length >= 1);
  assert.ok(ledger.stints[0].matches > 0);
  assert.ok(ledger.biggestWin && ledger.biggestWin.uf >= 3, 'Debe registrar la goleada 3-0 de Copa o una mayor');
});



