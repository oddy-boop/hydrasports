export interface ParsedStats {
  possession: { home: number; away: number };
  archery: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  totalShots: { home: number; away: number };
  fouls: { home: number; away: number };
  corners: { home: number; away: number };
  passAccuracy: { home: number; away: number };
  offsides: { home: number; away: number };
  saves: { home: number; away: number };
}

export interface PlayerInfo {
  id: string;
  name: string;
  jersey: string;
  position: string;
  positionGroup: 'GK' | 'DF' | 'MF' | 'FW' | 'SUB';
  role?: string;
  avatar?: string;
  starter: boolean;
  subbedIn?: boolean;
  subbedOut?: boolean;
}

export interface KeyPlayer {
  id: string;
  name: string;
  role: string;
  position?: string;
  jersey?: string;
  avatar?: string;
}

export interface BestPlayer {
  name: string;
  jersey: string;
  avatar: string;
  teamBadge: string;
  teamName: string;
  goals: number;
  assists: number;
}

export interface TimelineEvent {
  minute: number;
  displayMinute: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'other';
  text: string;
  team: 'home' | 'away' | 'neutral';
  player?: string;
}

export interface SubstitutionEvent {
  minute: string;
  minuteNum: number;
  team: 'home' | 'away';
  playerIn: string;
  playerOut: string;
  text: string;
}

export interface CardEvent {
  minute: string;
  minuteNum: number;
  team: 'home' | 'away';
  player: string;
  cardType: 'yellow' | 'red';
  text: string;
}

export interface AttackZonesData {
  left: number;
  center: number;
  right: number;
  description: string;
  homePercentage: number;
  awayPercentage: number;
}

export interface ScorerItem {
  player: string;
  minutes: string;
  card?: string;
}

function parsePositionGroup(pos: string): 'GK' | 'DF' | 'MF' | 'FW' | 'SUB' {
  const p = (pos || '').toUpperCase();
  if (p.includes('G') || p === 'GK') return 'GK';
  if (p.includes('D') || p.includes('CB') || p.includes('LB') || p.includes('RB') || p.includes('B')) return 'DF';
  if (p.includes('M') || p.includes('DM') || p.includes('CM') || p.includes('AM') || p.includes('W') || p.includes('LM') || p.includes('RM')) return 'MF';
  if (p.includes('F') || p.includes('ST') || p.includes('CF') || p.includes('RW') || p.includes('LW') || p.includes('A')) return 'FW';
  return 'MF';
}

function extractPlayerFromRoster(r: any, idx: number, isHome: boolean, teamName: string): PlayerInfo {
  const athlete = r.athlete || r;
  const name = athlete.displayName || athlete.shortName || athlete.fullName || `${teamName} #${athlete.jersey || idx + 1}`;
  const jersey = String(athlete.jersey || idx + 1);
  const pos = athlete.position?.abbreviation || athlete.position?.name || athlete.position || (idx === 0 ? 'GK' : idx <= 4 ? 'DF' : idx <= 8 ? 'MF' : 'FW');
  const posGroup = parsePositionGroup(pos);
  const avatar = athlete.headshot?.href || athlete.avatar || `https://images.unsplash.com/photo-${1508098682722 + (idx * 1111)}?q=80&w=250`;

  return {
    id: String(athlete.id || `${teamName}-${idx}`),
    name,
    jersey,
    position: pos,
    positionGroup: posGroup,
    role: idx === 0 ? 'Anchor GK' : posGroup === 'FW' ? 'Key attacking threat' : posGroup === 'MF' ? 'Playmaker & engine' : 'Defensive pillar',
    avatar,
    starter: r.starter !== false && idx < 11,
    subbedIn: Boolean(r.subbedIn),
    subbedOut: Boolean(r.subbedOut),
  };
}

export function parseMatchHubData(match: any, stats: any) {
  // Extract real team names
  const homeName = match?.homeTeam?.name ||
    (match?.title?.includes(' vs ') ? match.title.split(' vs ')[0].trim() : '') ||
    'Home Team';
  const awayName = match?.awayTeam?.name ||
    (match?.title?.includes(' vs ') ? match.title.split(' vs ')[1].trim() : '') ||
    'Away Team';

  const homeBadge = match?.homeTeam?.badge ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(homeName)}&background=7c3aed&color=fff&size=128`;
  const awayBadge = match?.awayTeam?.badge ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(awayName)}&background=2563eb&color=fff&size=128`;

  const commentary: any[] = stats?.commentary || [];
  const rosters: any[] = stats?.rosters || [];
  const boxscore = stats?.boxscore;

  // 1. Parse Real Events (Goals, Cards, Substitutions)
  const timelineEvents: TimelineEvent[] = [];
  const homeGoals: { minute: string; player: string }[] = [];
  const awayGoals: { minute: string; player: string }[] = [];
  const substitutions: SubstitutionEvent[] = [];
  const cards: CardEvent[] = [];
  let yellowCardCount = { home: 0, away: 0 };
  let redCardCount = { home: 0, away: 0 };

  const playerGoalCounts: Record<string, { count: number; teamBadge: string; teamName: string; jersey: string; avatar: string }> = {};

  for (const item of commentary) {
    const rawMinute = item.minute || '';
    const minuteNum = parseInt(rawMinute.toString().replace(/[^\d]/g, ''), 10) || 0;
    const typeStr = (item.type || '').toLowerCase();
    const textStr = (item.text || '').toLowerCase();

    let eventType: TimelineEvent['type'] = 'other';
    if (typeStr.includes('goal') || textStr.includes('goal!')) eventType = 'goal';
    else if (typeStr.includes('red card') || textStr.includes('red card')) eventType = 'red_card';
    else if (typeStr.includes('yellow card') || textStr.includes('yellow card') || typeStr.includes('card')) eventType = 'yellow_card';
    else if (typeStr.includes('substitution') || textStr.includes('substitution')) eventType = 'sub';

    let team: TimelineEvent['team'] = 'neutral';
    const itemTeam = (item.team || '').toLowerCase();
    if (itemTeam && (homeName.toLowerCase().includes(itemTeam) || itemTeam.includes(homeName.toLowerCase()))) {
      team = 'home';
    } else if (itemTeam && (awayName.toLowerCase().includes(itemTeam) || itemTeam.includes(awayName.toLowerCase()))) {
      team = 'away';
    } else if (textStr.includes(homeName.toLowerCase())) {
      team = 'home';
    } else if (textStr.includes(awayName.toLowerCase())) {
      team = 'away';
    }

    const participants = item.participants || [];
    const player = participants[0]?.name || '';

    if (eventType === 'goal') {
      const displayMin = rawMinute ? `${rawMinute}'` : `${minuteNum}'`;
      if (team === 'home') {
        homeGoals.push({ minute: displayMin, player: player || homeName });
      } else if (team === 'away') {
        awayGoals.push({ minute: displayMin, player: player || awayName });
      }

      if (player) {
        if (!playerGoalCounts[player]) {
          playerGoalCounts[player] = {
            count: 0,
            teamBadge: team === 'home' ? homeBadge : awayBadge,
            teamName: team === 'home' ? homeName : awayName,
            jersey: participants[0]?.jersey || '9',
            avatar: participants[0]?.headshot?.href || '',
          };
        }
        playerGoalCounts[player].count += 1;
      }
    }

    if (eventType === 'yellow_card' || eventType === 'red_card') {
      const cardType = eventType === 'red_card' ? 'red' : 'yellow';
      if (team === 'home') {
        if (cardType === 'red') redCardCount.home += 1;
        else yellowCardCount.home += 1;
      } else if (team === 'away') {
        if (cardType === 'red') redCardCount.away += 1;
        else yellowCardCount.away += 1;
      }

      cards.push({
        minute: rawMinute ? `${rawMinute}'` : `${minuteNum}'`,
        minuteNum,
        team: team === 'away' ? 'away' : 'home',
        player: player || 'Player',
        cardType,
        text: item.text || `${cardType === 'red' ? 'Red Card' : 'Yellow Card'} for ${player}`,
      });
    }

    if (eventType === 'sub') {
      const playerIn = participants[0]?.name || 'Player In';
      const playerOut = participants[1]?.name || 'Player Out';
      substitutions.push({
        minute: rawMinute ? `${rawMinute}'` : `${minuteNum}'`,
        minuteNum,
        team: team === 'away' ? 'away' : 'home',
        playerIn,
        playerOut,
        text: item.text || `Substitution: ${playerIn} replaces ${playerOut}`,
      });
    }

    if (eventType !== 'other') {
      timelineEvents.push({
        minute: Math.min(minuteNum, 90),
        displayMinute: rawMinute ? `${rawMinute}'` : `${minuteNum}'`,
        type: eventType,
        text: item.text || '',
        team,
        player,
      });
    }
  }

  // 2. Parse Comparative Statistics from Boxscore
  let hasRealStats = false;
  let possession = { home: 50, away: 50 };
  let archery = { home: 50, away: 50 };
  let shotsOnTarget = { home: 0, away: 0 };
  let totalShots = { home: 0, away: 0 };
  let fouls = { home: 0, away: 0 };
  let corners = { home: 0, away: 0 };
  let passAccuracy = { home: 80, away: 80 };
  let offsides = { home: 0, away: 0 };
  let saves = { home: 0, away: 0 };

  const teamsStats = boxscore?.teams || [];
  if (teamsStats.length >= 2) {
    const getStat = (teamIdx: number, ...nameQueries: string[]): number => {
      const statsList = teamsStats[teamIdx]?.statistics || [];
      for (const q of nameQueries) {
        const found = statsList.find((s: any) =>
          (s.name || '').toLowerCase() === q.toLowerCase() ||
          (s.label || '').toLowerCase().includes(q.toLowerCase())
        );
        if (found) {
          return parseFloat(found.displayValue) || parseFloat(found.value) || 0;
        }
      }
      return 0;
    };

    const hPoss = getStat(0, 'possessionPct', 'possession');
    const aPoss = getStat(1, 'possessionPct', 'possession');
    if (hPoss > 0 || aPoss > 0) {
      possession = { home: Math.round(hPoss), away: Math.round(aPoss) };
      hasRealStats = true;
    }

    const hSOT = getStat(0, 'shotsOnTarget');
    const aSOT = getStat(1, 'shotsOnTarget');
    if (hSOT > 0 || aSOT > 0) {
      shotsOnTarget = { home: hSOT, away: aSOT };
      archery = {
        home: Math.round((hSOT / (hSOT + aSOT || 1)) * 100),
        away: Math.round((aSOT / (hSOT + aSOT || 1)) * 100),
      };
      hasRealStats = true;
    }

    const hTotShots = getStat(0, 'totalShots', 'shots');
    const aTotShots = getStat(1, 'totalShots', 'shots');
    if (hTotShots > 0 || aTotShots > 0) {
      totalShots = { home: hTotShots, away: aTotShots };
      hasRealStats = true;
    }

    const hFouls = getStat(0, 'foulsCommitted', 'fouls');
    const aFouls = getStat(1, 'foulsCommitted', 'fouls');
    if (hFouls > 0 || aFouls > 0) {
      fouls = {
        home: Math.round((hFouls / (hFouls + aFouls || 1)) * 100),
        away: Math.round((aFouls / (hFouls + aFouls || 1)) * 100),
      };
      hasRealStats = true;
    }

    const hCorners = getStat(0, 'wonCorners', 'corners');
    const aCorners = getStat(1, 'wonCorners', 'corners');
    if (hCorners > 0 || aCorners > 0) {
      corners = { home: hCorners, away: aCorners };
      hasRealStats = true;
    }

    const hPass = getStat(0, 'passingPct', 'passAccuracy');
    const aPass = getStat(1, 'passingPct', 'passAccuracy');
    if (hPass > 0 || aPass > 0) {
      passAccuracy = { home: Math.round(hPass), away: Math.round(aPass) };
      hasRealStats = true;
    }

    const hOff = getStat(0, 'offsides');
    const aOff = getStat(1, 'offsides');
    offsides = { home: hOff, away: aOff };

    const hSave = getStat(0, 'saves');
    const aSave = getStat(1, 'saves');
    saves = { home: hSave, away: aSave };
  }

  // 3. Formations & Full Rosters (Starting XI + Substitutes)
  const homeFormation = rosters[0]?.formation || '4-3-3';
  const awayFormation = rosters[1]?.formation || '4-2-3-1';

  const rawHomeRoster = rosters[0]?.roster || [];
  const rawAwayRoster = rosters[1]?.roster || [];

  const homeStarters: PlayerInfo[] = rawHomeRoster
    .slice(0, 11)
    .map((r: any, idx: number) => extractPlayerFromRoster(r, idx, true, homeName));

  const awayStarters: PlayerInfo[] = rawAwayRoster
    .slice(0, 11)
    .map((r: any, idx: number) => extractPlayerFromRoster(r, idx, false, awayName));

  const homeSubstitutes: PlayerInfo[] = rawHomeRoster
    .slice(11)
    .map((r: any, idx: number) => extractPlayerFromRoster(r, idx + 11, true, homeName));

  const awaySubstitutes: PlayerInfo[] = rawAwayRoster
    .slice(11)
    .map((r: any, idx: number) => extractPlayerFromRoster(r, idx + 11, false, awayName));

  // 4. Key Players (Top 4 per team)
  const homeKeyPlayers: KeyPlayer[] = homeStarters.length > 0
    ? homeStarters.slice(0, 4).map((p, idx) => ({
        id: p.id,
        name: p.name,
        role: idx === 0 ? 'Greater offensive impact' : idx === 1 ? 'Midfield engine' : idx === 2 ? 'Defensive anchor' : 'Tactical pivot',
        position: p.position,
        jersey: p.jersey,
        avatar: p.avatar,
      }))
    : [
        { id: 'h1', name: `${homeName} Star`, role: 'Offensive leader', position: 'FW', jersey: '10' },
        { id: 'h2', name: `${homeName} Mid`, role: 'Playmaker', position: 'MF', jersey: '8' },
        { id: 'h3', name: `${homeName} Def`, role: 'Backline leader', position: 'DF', jersey: '4' },
      ];

  const awayKeyPlayers: KeyPlayer[] = awayStarters.length > 0
    ? awayStarters.slice(0, 4).map((p, idx) => ({
        id: p.id,
        name: p.name,
        role: idx === 0 ? 'Direct attacking threat' : idx === 1 ? 'Playmaker & vision' : idx === 2 ? 'Backline commander' : 'Transition engine',
        position: p.position,
        jersey: p.jersey,
        avatar: p.avatar,
      }))
    : [
        { id: 'a1', name: `${awayName} Star`, role: 'Attacking threat', position: 'FW', jersey: '9' },
        { id: 'a2', name: `${awayName} Mid`, role: 'Midfield anchor', position: 'MF', jersey: '6' },
        { id: 'a3', name: `${awayName} Def`, role: 'Defensive wall', position: 'DF', jersey: '5' },
      ];

  // 5. Star Player / Man of the Match (STRICTLY FROM ACTIVE MATCH)
  let bestPlayer: BestPlayer;
  const topScorerEntry = Object.entries(playerGoalCounts).sort((a, b) => b[1].count - a[1].count)[0];
  if (topScorerEntry) {
    const [scorerName, info] = topScorerEntry;
    bestPlayer = {
      name: scorerName,
      jersey: info.jersey || '10',
      avatar: info.avatar || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600',
      teamBadge: info.teamBadge,
      teamName: info.teamName,
      goals: info.count,
      assists: 1,
    };
  } else if (homeStarters.length > 0) {
    const lead = homeStarters.find(p => p.positionGroup === 'FW') || homeStarters[0];
    bestPlayer = {
      name: lead.name,
      jersey: lead.jersey,
      avatar: lead.avatar || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600',
      teamBadge: homeBadge,
      teamName: homeName,
      goals: 0,
      assists: 0,
    };
  } else {
    bestPlayer = {
      name: `${homeName} Captain`,
      jersey: '10',
      avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600',
      teamBadge: homeBadge,
      teamName: homeName,
      goals: 0,
      assists: 0,
    };
  }

  // 6. Attack Zones
  const attackZones: AttackZonesData = {
    left: 28,
    center: 44,
    right: 28,
    description: possession.home > 55
      ? `${homeName} controlling central tempo and high-press`
      : possession.away > 55
      ? `${awayName} dominating wide transitions`
      : 'Evenly contested across central midfield channels',
    homePercentage: possession.home,
    awayPercentage: possession.away,
  };

  // 7. Scorers summary (Strictly real data from match goals)
  const homeScorersList: ScorerItem[] = homeGoals.map(g => ({ player: g.player, minutes: g.minute }));
  const awayScorersList: ScorerItem[] = awayGoals.map(g => ({ player: g.player, minutes: g.minute }));

  // Date and Venue formatting
  const matchDate = match?.dateStr || (match?.timestamp
    ? new Date(match.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Matchday');

  return {
    homeName,
    awayName,
    homeBadge,
    awayBadge,
    homeGoals,
    awayGoals,
    homeScorersList,
    awayScorersList,
    timelineEvents,
    substitutions,
    cards,
    discipline: {
      yellowCards: yellowCardCount,
      redCards: redCardCount,
    },
    formations: {
      home: homeFormation,
      away: awayFormation,
    },
    lineups: {
      home: homeStarters,
      away: awayStarters,
    },
    substitutes: {
      home: homeSubstitutes,
      away: awaySubstitutes,
    },
    hasRealStats,
    possession,
    archery,
    shotsOnTarget,
    totalShots,
    fouls,
    corners,
    passAccuracy,
    offsides,
    saves,
    homeKeyPlayers,
    awayKeyPlayers,
    bestPlayer,
    attackZones,
    venue: match?.venue || 'Stadium Arena',
    stage: match?.status === 'live' ? 'Live Matchday' : 'Fixture Stage',
    matchDate,
    tournament: match?.tournament || 'Match Fixture',
    note: match?.note || '',
  };
}
