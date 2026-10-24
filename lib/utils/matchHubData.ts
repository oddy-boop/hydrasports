export interface ParsedStats {
  possession: { home: number; away: number };
  archery: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  totalShots: { home: number; away: number };
  fouls: { home: number; away: number };
  corners: { home: number; away: number };
  passAccuracy: { home: number; away: number };
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

export function parseMatchHubData(match: any, stats: any) {
  const isPortugalMatch = (match?.homeTeam?.name || '').toLowerCase().includes('portugal') ||
    (match?.title || '').toLowerCase().includes('portugal');

  const homeName = match?.homeTeam?.name || (isPortugalMatch ? 'Portugal' : 'Portugal');
  const awayName = match?.awayTeam?.name || (isPortugalMatch ? 'Colombia' : 'Colombia');
  const homeBadge = match?.homeTeam?.badge || 'https://a.espncdn.com/i/teamlogos/countries/500/por.png';
  const awayBadge = match?.awayTeam?.badge || 'https://a.espncdn.com/i/teamlogos/countries/500/col.png';

  const commentary: any[] = stats?.commentary || [];
  const rosters: any[] = stats?.rosters || [];
  const boxscore = stats?.boxscore;

  // 1. Parse Real Timeline Events from feed
  const timelineEvents: TimelineEvent[] = [];
  const homeGoals: { minute: string; player: string }[] = [];
  const awayGoals: { minute: string; player: string }[] = [];

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

    const player = item.participants?.[0]?.name || '';

    if (eventType === 'goal') {
      if (team === 'home') {
        homeGoals.push({ minute: rawMinute ? `${rawMinute}'` : '', player: player || homeName });
      } else if (team === 'away') {
        awayGoals.push({ minute: rawMinute ? `${rawMinute}'` : '', player: player || awayName });
      }
    }

    if (eventType !== 'other') {
      timelineEvents.push({
        minute: Math.min(minuteNum, 90),
        displayMinute: rawMinute ? `${rawMinute}'` : `${minuteNum}'`,
        type: eventType,
        text: item.text,
        team,
        player,
      });
    }
  }

  // 2. Parse Comparative Statistics from Boxscore
  let hasRealStats = false;
  let possession = { home: 58, away: 42 };
  let archery = { home: 48, away: 52 };
  let shotsOnTarget = { home: 8, away: 5 };
  let totalShots = { home: 14, away: 11 };
  let fouls = { home: 32, away: 68 };
  let corners = { home: 6, away: 4 };
  let passAccuracy = { home: 88, away: 82 };

  const teamsStats = boxscore?.teams || [];
  if (teamsStats.length >= 2) {
    const getStat = (teamIdx: number, nameQuery: string): number => {
      const statsList = teamsStats[teamIdx]?.statistics || [];
      const found = statsList.find((s: any) =>
        (s.name || '').toLowerCase() === nameQuery.toLowerCase() ||
        (s.label || '').toLowerCase().includes(nameQuery.toLowerCase())
      );
      if (!found) return 0;
      return parseFloat(found.displayValue) || parseFloat(found.value) || 0;
    };

    const hPoss = getStat(0, 'possessionPct') || getStat(0, 'possession');
    const aPoss = getStat(1, 'possessionPct') || getStat(1, 'possession');
    if (hPoss > 0 || aPoss > 0) {
      possession = { home: Math.round(hPoss), away: Math.round(aPoss) };
      hasRealStats = true;
    }

    const hShotsOnTarget = getStat(0, 'shotsOnTarget');
    const aShotsOnTarget = getStat(1, 'shotsOnTarget');
    if (hShotsOnTarget > 0 || aShotsOnTarget > 0) {
      shotsOnTarget = { home: hShotsOnTarget, away: aShotsOnTarget };
      archery = {
        home: Math.round((hShotsOnTarget / (hShotsOnTarget + aShotsOnTarget || 1)) * 100),
        away: Math.round((aShotsOnTarget / (hShotsOnTarget + aShotsOnTarget || 1)) * 100),
      };
      hasRealStats = true;
    }

    const hFouls = getStat(0, 'foulsCommitted') || getStat(0, 'fouls');
    const aFouls = getStat(1, 'foulsCommitted') || getStat(1, 'fouls');
    if (hFouls > 0 || aFouls > 0) {
      fouls = {
        home: Math.round((hFouls / (hFouls + aFouls || 1)) * 100),
        away: Math.round((aFouls / (hFouls + aFouls || 1)) * 100),
      };
      hasRealStats = true;
    }
  }

  // 3. Key Players (Directly matching Image 3)
  const defaultHomeKeyPlayers: KeyPlayer[] = [
    {
      id: 'cr7',
      name: 'Ronaldo',
      role: 'Greater offensive impact',
      position: 'FW',
      jersey: '7',
      avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250',
    },
    {
      id: 'bf8',
      name: 'Fernandez',
      role: 'Midfield engine',
      position: 'MF',
      jersey: '8',
      avatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=250',
    },
    {
      id: 'rl17',
      name: 'Leão',
      role: 'Key on left side',
      position: 'FW',
      jersey: '17',
      avatar: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=250',
    },
  ];

  const defaultAwayKeyPlayers: KeyPlayer[] = [
    {
      id: 'ld7',
      name: 'Diaz',
      role: 'Direct attacking threat',
      position: 'FW',
      jersey: '7',
      avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250',
    },
    {
      id: 'jr10',
      name: 'Rodriguez',
      role: 'Playmaker & vision',
      position: 'MF',
      jersey: '10',
      avatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=250',
    },
    {
      id: 'ja11',
      name: 'Arias',
      role: 'Transition anchor',
      position: 'MF',
      jersey: '11',
      avatar: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=250',
    },
  ];

  const homeKeyPlayers = rosters[0]?.roster?.length > 0
    ? rosters[0].roster.slice(0, 4).map((r: any, idx: number) => ({
        id: String(r.athlete?.id || idx),
        name: r.athlete?.shortName || r.athlete?.displayName || `Player ${idx + 1}`,
        role: idx === 0 ? 'Greater offensive impact' : idx === 1 ? 'Midfield engine' : 'Key tactical threat',
        position: r.athlete?.position?.abbreviation || 'PL',
        jersey: r.athlete?.jersey || String(idx + 1),
        avatar: r.athlete?.headshot?.href || defaultHomeKeyPlayers[idx % 3]?.avatar,
      }))
    : defaultHomeKeyPlayers;

  const awayKeyPlayers = rosters[1]?.roster?.length > 0
    ? rosters[1].roster.slice(0, 4).map((r: any, idx: number) => ({
        id: String(r.athlete?.id || idx),
        name: r.athlete?.shortName || r.athlete?.displayName || `Player ${idx + 1}`,
        role: idx === 0 ? 'Direct attacking threat' : idx === 1 ? 'Playmaker & vision' : 'Transition anchor',
        position: r.athlete?.position?.abbreviation || 'PL',
        jersey: r.athlete?.jersey || String(idx + 1),
        avatar: r.athlete?.headshot?.href || defaultAwayKeyPlayers[idx % 3]?.avatar,
      }))
    : defaultAwayKeyPlayers;

  // 4. Man of the Match / Best Player (Image 3)
  const bestPlayer: BestPlayer = {
    name: 'Cristiano Ronaldo',
    jersey: '7',
    avatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600',
    teamBadge: homeBadge,
    goals: 2,
    assists: 2,
  };

  // 5. Attack Zones (Image 3)
  const attackZones: AttackZonesData = {
    left: 30,
    center: 45,
    right: 25,
    description: 'The game originates in midfield',
    homePercentage: 60,
    awayPercentage: 40,
  };

  // 6. Scorers summary (Image 3)
  const homeScorersList: ScorerItem[] = homeGoals.length > 0
    ? homeGoals.map(g => ({ player: g.player, minutes: g.minute }))
    : [
        { player: 'Ronaldo', minutes: "58' 60'" },
        { player: 'Felix', minutes: "23' 40'" },
      ];

  const awayScorersList: ScorerItem[] = awayGoals.length > 0
    ? awayGoals.map(g => ({ player: g.player, minutes: g.minute }))
    : [
        { player: 'Diaz', minutes: "25'", card: 'yellow' },
        { player: 'Arias', minutes: "55'" },
      ];

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
    hasRealStats,
    possession,
    archery,
    shotsOnTarget,
    totalShots,
    fouls,
    corners,
    passAccuracy,
    homeKeyPlayers,
    awayKeyPlayers,
    bestPlayer,
    attackZones,
    venue: match?.venue || 'Miami Stadium',
    stage: 'First Stage · Group K',
    matchDate: 'July 27, 2026',
    tournament: match?.tournament || 'FIFA WORLD CUP 2026',
    note: match?.note || '',
  };
}
