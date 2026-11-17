import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNotFcPlayer,
  createClub,
  generateLeague32Clubs,
  generateLeagueCalendar,
  createInitialStandings,
  applyMatchResultToStandings,
  validateLineupF7,
  swapStarterAndBench,
  applyXpToPlayer,
  allocateSkillPoint,
  SKILL_UPGRADE_LIST,
  generateMinuteByMinuteMatch,
  resimulateMatchFromMinute,
  commitMatchToClubs,
  generateFreeAgentsPool,
  signFreeAgentToClub,
  loanEliminatedPlayerToClub,
  terminateContractFromClub,
  createPlayoffBracketFromTop16,
  advancePlayoffRound,
  computeChampionshipAwards,
  getLeagueFormationWindowInfo,
  countCompletedLeyendasCareers,
  createFreeAgentListing,
  generateOpenClubsDirectory,
  filterEligibleApplicationClubs,
  createClubInviteRequest,
  respondToClubInvite,
  createUserJoinRequest,
  respondToUserJoinRequest,
  joinClubAsPlayerMode,
} from '../public/notfc-engine.js';

function makeSeededRng(seed = 42) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('LEYENDAS import uses career OVR strictly as potential and initializes OVR between 60 and 75', () => {
  const rng = makeSeededRng(10);
  const p = createNotFcPlayer({
    name: 'Matías Rojas',
    position: 'DEL',
    isHuman: true,
    leyendasCareer: { playerName: 'Matías Leyenda', ovr: 96 },
    rng,
  });

  assert.equal(p.potential, 96);
  assert.ok(p.ovr >= 60 && p.ovr <= 75, `Expected OVR in 60..75, got ${p.ovr}`);
  assert.equal(p.startOvr, p.ovr);
});

test('Club fills remaining slots to 14 with bots and enforces 7 starters (including 1 ARQ) + 7 bench', () => {
  const rng = makeSeededRng(21);
  const captain = createNotFcPlayer({ name: 'Capitan', position: 'MED', isHuman: true, rng });
  const club = createClub({
    name: 'Los Leones F7',
    isUserClub: true,
    initialRoster: [captain],
    formation: '1-2-3-1',
    rng,
  });

  assert.equal(club.players.length, 14);
  assert.equal(club.starterIds.length, 7);
  assert.equal(club.benchIds.length, 7);
  assert.equal(validateLineupF7(club).valid, true);

  // Removing the only ARQ from starters must be rejected
  const starterArqId = club.starterIds.find((id) => club.players.find((p) => p.id === id)?.position === 'ARQ');
  const benchNonArqId = club.benchIds.find((id) => club.players.find((p) => p.id === id)?.position !== 'ARQ');
  assert.ok(starterArqId && benchNonArqId);
  const res = swapStarterAndBench(club, starterArqId, benchNonArqId);
  assert.equal(res.ok, false);
});

test('32-team league generates 8 unique opponents per team and awards 3/1/0 points', () => {
  const rng = makeSeededRng(7);
  const userClub = createClub({ name: 'Mi Club UFRO', isUserClub: true, rng });
  const clubs = generateLeague32Clubs(userClub, [], rng);
  assert.equal(clubs.length, 32);

  const calendar = generateLeagueCalendar(clubs);
  assert.equal(calendar.length, 8);

  const opponentsSeen = new Set();
  for (const md of calendar) {
    assert.equal(md.fixtures.length, 16);
    const matchForUser = md.fixtures.find((f) => f.homeId === userClub.id || f.awayId === userClub.id);
    assert.ok(matchForUser);
    opponentsSeen.add(matchForUser.homeId === userClub.id ? matchForUser.awayId : matchForUser.homeId);
  }
  assert.equal(opponentsSeen.size, 8);

  let standings = createInitialStandings(clubs);
  standings = applyMatchResultToStandings(standings, clubs[0].id, clubs[1].id, 3, 1);
  standings = applyMatchResultToStandings(standings, clubs[2].id, clubs[3].id, 2, 2);

  assert.equal(standings.find((r) => r.clubId === clubs[0].id).pts, 3);
  assert.equal(standings.find((r) => r.clubId === clubs[1].id).pts, 0);
  assert.equal(standings.find((r) => r.clubId === clubs[2].id).pts, 1);
  assert.equal(standings.find((r) => r.clubId === clubs[3].id).pts, 1);
});

test('Leveling up grants skill points and distributing skills upgrades player OVR up to potential', () => {
  const rng = makeSeededRng(99);
  const p = createNotFcPlayer({
    name: 'Prodigio',
    position: 'DEL',
    isHuman: true,
    leyendasCareer: { playerName: 'Prodigio', ovr: 82 },
    rng,
  });

  const beforeOvr = p.ovr;
  const xpRes = applyXpToPlayer(p, 250, 'tiro');
  assert.equal(xpRes.leveledUp, true);
  assert.ok(p.level >= 2);
  assert.ok(p.skillPoints >= 3);
  assert.equal(p.ovr, beforeOvr); // OVR does not jump until player distributes skill points

  const firstSkillRes = allocateSkillPoint(p, 'definicion');
  assert.equal(firstSkillRes.ok, true);
  assert.equal(p.skillRanks.definicion, 1);

  for (let i = 0; i < 20; i += 1) {
    applyXpToPlayer(p, 200, 'tiro');
    while (p.skillPoints > 0) {
      const targetSkill = SKILL_UPGRADE_LIST[i % 2 === 0 ? 1 : 0].id;
      const alloc = allocateSkillPoint(p, targetSkill);
      if (!alloc.ok) break;
    }
  }
  assert.ok(p.ovr > beforeOvr);
  assert.ok(p.ovr <= p.potential);
});

test('Match simulation, transfer market (loan, free agent, terminate), playoffs & awards work end-to-end', () => {
  const rng = makeSeededRng(123);
  const userClub = createClub({ name: 'UFRO Central', isUserClub: true, rng });
  const clubs = generateLeague32Clubs(userClub, [], rng);
  const calendar = generateLeagueCalendar(clubs);
  let standings = createInitialStandings(clubs);

  for (const md of calendar) {
    for (const fx of md.fixtures) {
      const h = clubs.find((c) => c.id === fx.homeId);
      const a = clubs.find((c) => c.id === fx.awayId);
      const sim = generateMinuteByMinuteMatch(h, a, {}, false, rng);
      commitMatchToClubs(h, a, sim, rng);
      standings = applyMatchResultToStandings(standings, h.id, a.id, sim.homeGoals, sim.awayGoals);
    }
  }

  // Transfer market actions
  const freeAgents = generateFreeAgentsPool(6, rng);
  const nonArq = userClub.players.find((p) => p.position !== 'ARQ');
  const termRes = terminateContractFromClub(userClub, nonArq.id);
  assert.equal(termRes.ok, true);

  userClub.budgetEur = 2000000;
  const signRes = signFreeAgentToClub(userClub, freeAgents[0], freeAgents[0].marketValueEur);
  assert.equal(signRes.ok, true);

  const eliminatedClubId = standings[31].clubId;
  const eliminatedClub = clubs.find((c) => c.id === eliminatedClubId);
  const loanRes = loanEliminatedPlayerToClub(userClub, eliminatedClub.players[0], eliminatedClub.name);
  assert.equal(loanRes.ok, true);

  // Playoffs top 16 -> Final -> Champion + Awards
  let bracket = createPlayoffBracketFromTop16(standings);
  assert.equal(bracket.rounds.OCTAVOS.length, 8);

  while (bracket.currentRound !== 'FINISHED') {
    for (const m of bracket.rounds[bracket.currentRound]) {
      const h = clubs.find((c) => c.id === m.homeId);
      const a = clubs.find((c) => c.id === m.awayId);
      const sim = generateMinuteByMinuteMatch(h, a, {}, true, rng);
      commitMatchToClubs(h, a, sim, rng);
      m.played = true;
      m.homeGoals = sim.homeGoals;
      m.awayGoals = sim.awayGoals;
      m.penaltyScore = sim.penaltyScore;
      m.winnerId = sim.homeGoals > sim.awayGoals ? h.id : sim.awayGoals > sim.homeGoals ? a.id : sim.penaltyWinnerId;
    }
    bracket = advancePlayoffRound(bracket);
  }

  assert.ok(bracket.championId);
  const awards = computeChampionshipAwards(clubs, bracket.championId);
  assert.ok(awards.mvp);
  assert.ok(awards.topScorer);
  assert.ok(awards.bestKeeper);
});

test('Live mid-match substitution resimulates remaining minutes with updated starters', () => {
  const rng = makeSeededRng(77);
  const home = createClub({ name: 'Home F7', isUserClub: true, rng });
  const away = createClub({ name: 'Away F7', isUserClub: false, rng });

  const initialSim = generateMinuteByMinuteMatch(home, away, {}, false, rng);
  const playedSlice = initialSim.events.slice(0, 4); // up to ~12'
  const outId = home.starterIds.find((id) => home.players.find((p) => p.id === id)?.position !== 'ARQ');
  const inId = home.benchIds.find((id) => home.players.find((p) => p.id === id)?.position !== 'ARQ');
  assert.ok(outId && inId);

  const subRes = swapStarterAndBench(home, outId, inId);
  assert.equal(subRes.ok, true);

  const resim = resimulateMatchFromMinute(home, away, playedSlice, {}, false, rng);
  assert.ok(resim.events.length > playedSlice.length);
  assert.equal(resim.events[resim.events.length - 1].type, 'FULLTIME');
  assert.ok(resim.matchStatDelta.has(inId));
});

test('Formation window spans Nov 17 until Nov 18 21:00 CL', () => {
  const nov17 = new Date('2026-11-17T15:00:00-03:00');
  const infoBefore = getLeagueFormationWindowInfo(nov17);
  assert.equal(infoBefore.isFormationPeriod, true);
  assert.ok(infoBefore.hours >= 29 && infoBefore.hours <= 31);

  const nov19 = new Date('2026-11-19T12:00:00-03:00');
  const infoAfter = getLeagueFormationWindowInfo(nov19);
  assert.equal(infoAfter.isFormationPeriod, false);
});

test('Filler/invented clubs are excluded from application eligibility while real created clubs work', () => {
  const rng = makeSeededRng(88);
  const listing = createFreeAgentListing({
    name: 'Diego Solis',
    position: 'DEL',
    bio: 'Goleador disponible',
    leyendasCareer: { playerName: 'Diego Leyenda', ovr: 91 },
    isUserListing: true,
    rng,
  });
  assert.equal(listing.player.potential, 91);
  assert.ok(listing.player.ovr >= 60 && listing.player.ovr <= 75);

  const fillerClubs = generateOpenClubsDirectory(rng);
  assert.ok(fillerClubs.length >= 4);
  assert.equal(filterEligibleApplicationClubs(fillerClubs).length, 0);

  const realClub = createClub({
    id: 'real_club_1',
    name: 'Real Comunidad UFRO',
    shortCode: 'RCU',
    isUserClub: false,
    isCreatedByUser: true,
    rng,
  });
  const eligible = filterEligibleApplicationClubs([...fillerClubs, realClub]);
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, 'real_club_1');

  const joinedClub = joinClubAsPlayerMode({
    clubTemplate: realClub,
    player: listing.player,
    rng,
  });
  assert.equal(joinedClub.players.length, 14);
  assert.equal(joinedClub.starterIds.length, 7);
  assert.equal(validateLineupF7(joinedClub).valid, true);
  assert.ok(joinedClub.players.some((p) => p.id === listing.player.id));
});

test('countCompletedLeyendasCareers accurately tracks 5 and 10 career milestones', () => {
  const hof5 = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, playerName: `Jugador ${i}`, ovr: 85 }));
  assert.equal(countCompletedLeyendasCareers(hof5, null, []), 5);

  const hof8 = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, playerName: `Jugador ${i}`, ovr: 85 }));
  const cloud2 = [
    { id: 'cl1', playerName: 'Cloud 1', finished: true },
    { id: 'cl2', playerName: 'Cloud 2', finished: true },
  ];
  assert.equal(countCompletedLeyendasCareers(hof8, null, cloud2), 10);
});

test('Mutual consent club invitations and user join requests require explicit acceptance', () => {
  const rng = makeSeededRng(55);
  const captain = createNotFcPlayer({ name: 'Lider', position: 'MED', isHuman: true, ownerNickname: 'Lider', rng });
  const club = createClub({ name: 'Club Consenso', isUserClub: true, isCreatedByUser: true, initialRoster: [captain], rng });
  const fillerClub = createClub({ name: 'Bot Relleno', isUserClub: false, isCreatedByUser: false, rng });

  // 1. Leader invites friend -> remains PENDING_USER and NOT in roster until user accepts
  const invRes = createClubInviteRequest({ club, senderHandle: 'Lider', targetHandle: 'Amigo9', position: 'DEL' });
  assert.equal(invRes.ok, true);
  assert.equal(invRes.request.status, 'PENDING_USER');
  assert.equal(club.players.some((p) => p.ownerNickname === 'Amigo9'), false);

  const friendPlayer = createNotFcPlayer({ name: 'Amigo9', position: 'DEL', isHuman: true, ownerNickname: 'Amigo9', rng });
  const acceptInv = respondToClubInvite({ request: invRes.request, club, accept: true, joiningPlayer: friendPlayer });
  assert.equal(acceptInv.ok, true);
  assert.equal(acceptInv.added, true);
  assert.equal(invRes.request.status, 'ACCEPTED');
  assert.equal(club.players.some((p) => p.id === friendPlayer.id), true);

  // 2. Rejecting invite leaves roster untouched
  const inv2 = createClubInviteRequest({ club, senderHandle: 'Lider', targetHandle: 'RechazaUser', position: 'DEF' });
  const rejInv = respondToClubInvite({ request: inv2.request, club, accept: false });
  assert.equal(rejInv.ok, true);
  assert.equal(rejInv.added, false);
  assert.equal(inv2.request.status, 'REJECTED');

  // 3. User cannot apply to filler club, can apply to real club and requires leader approval
  const applicant = createNotFcPlayer({ name: 'Postulante', position: 'DEF', isHuman: true, ownerNickname: 'Postu', rng });
  const badReq = createUserJoinRequest({ club: fillerClub, applicantPlayer: applicant, applicantHandle: 'Postu' });
  assert.equal(badReq.ok, false);

  const goodReq = createUserJoinRequest({ club, applicantPlayer: applicant, applicantHandle: 'Postu' });
  assert.equal(goodReq.ok, true);
  assert.equal(goodReq.request.status, 'PENDING_LEADER');
  assert.equal(club.players.some((p) => p.id === applicant.id), false);

  const leaderAccept = respondToUserJoinRequest({ request: goodReq.request, club, accept: true });
  assert.equal(leaderAccept.ok, true);
  assert.equal(leaderAccept.added, true);
  assert.equal(club.players.some((p) => p.id === applicant.id), true);
});
