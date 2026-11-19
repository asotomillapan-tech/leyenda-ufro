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

