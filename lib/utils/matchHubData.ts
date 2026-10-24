import { cleanTeamBadgeUrl } from './teamLogos';

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

export type SportType = 'football' | 'basketball' | 'hockey' | 'tennis';

export interface SportMetric {
  label: string;
  home: number | string;
  away: number | string;
  homePct?: number;
  awayPct?: number;
  unit?: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  jersey: string;
  position: string;
  positionGroup: string;
  formationPlace?: number;
  role?: string;
  avatar?: string;
  starter: boolean;
  subbedIn?: boolean;
  subbedOut?: boolean;
  age?: number;
  birthDate?: string;
  citizenship?: string;
  height?: string;
  weight?: string;
  realStats?: {
    goals?: number;
    assists?: number;
    shots?: number;
    shotsOnTarget?: number;
    yellowCards?: number;
    redCards?: number;
    foulsCommitted?: number;
    foulsSuffered?: number;
    saves?: number;
  };
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
  statLabel: string;
  secondaryLabel: string;
}

export interface TimelineEvent {
  minute: number;
  displayMinute: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'penalty' | 'other';
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
  cardType: 'yellow' | 'red' | 'minor_penalty' | 'major_penalty' | 'tech_foul';
  text: string;
}

export interface AttackZonesData {
  left: number;
  center: number;
  right: number;
  leftLabel: string;
  centerLabel: string;
  rightLabel: string;
  description: string;
  homePercentage: number;
  awayPercentage: number;
}

export interface ScorerItem {
  player: string;
  minutes: string;
  card?: string;
}

export function detectSportType(match: any): SportType {
  const rawSport = (match?.sport || match?.upstreamCategory || match?.tournament || '').toLowerCase();
  if (rawSport.includes('basket') || rawSport.includes('nba')) return 'basketball';
  if (rawSport.includes('hockey') || rawSport.includes('nhl')) return 'hockey';
  if (rawSport.includes('tennis') || rawSport.includes('atp') || rawSport.includes('wta')) return 'tennis';
  return 'football';
}

function parsePositionGroupForSport(pos: string, sport: SportType, idx: number): string {
  const p = (pos || '').toUpperCase().trim();
  if (sport === 'basketball') {
    if (p.includes('PG') || (p === 'G' && idx === 0)) return 'PG';
    if (p.includes('SG') || (p === 'G' && idx === 1)) return 'SG';
    if (p.includes('SF') || (p === 'F' && idx === 2)) return 'SF';
    if (p.includes('PF') || (p === 'F' && idx === 3)) return 'PF';
    if (p.includes('C')) return 'C';
    return idx === 0 ? 'PG' : idx === 1 ? 'SG' : idx === 2 ? 'SF' : idx === 3 ? 'PF' : 'C';
  }

  if (sport === 'hockey') {
    if (p === 'G' || p.includes('GOAL')) return 'G';
    if (p === 'LD' || p === 'D' && idx === 1) return 'LD';
    if (p === 'RD' || p === 'D' && idx === 2) return 'RD';
    if (p === 'LW') return 'LW';
    if (p === 'C') return 'C';
    if (p === 'RW') return 'RW';
    return idx === 0 ? 'G' : idx <= 2 ? 'D' : 'F';
  }

  if (sport === 'tennis') {
    return 'PL';
  }

  // Football (Default) - avoid p.includes('G') because 'RIGHT' contains 'G'
  if (p === 'G' || p === 'GK' || p.includes('GOAL') || p === 'GOALKEEPER') return 'GK';
  if (
    p.includes('DEF') || p.includes('BACK') ||
    p === 'CB' || p === 'LB' || p === 'RB' || p === 'DF' ||
    p.startsWith('CD') || p.startsWith('CB') ||
    p === 'LWB' || p === 'RWB'
  ) return 'DF';
  if (
    p === 'F' || p === 'ST' || p === 'CF' || p === 'FW' ||
    p.includes('FORWARD') || p.includes('STRIKER')
  ) return 'FW';
  if (
    p.includes('MID') || p.includes('WING') ||
    p === 'MF' || p === 'CM' || p === 'DM' || p === 'AM' ||
    p === 'LM' || p === 'RM' || p === 'LW' || p === 'RW' ||
    p.startsWith('AM') || p.startsWith('DM') || p.startsWith('CM') ||
    p.includes('CAM') || p.includes('CDM')
  ) return 'MF';

  return idx === 0 ? 'GK' : idx <= 4 ? 'DF' : idx <= 8 ? 'MF' : 'FW';
}

function extractPlayerFromRoster(r: any, idx: number, isHome: boolean, teamName: string, sport: SportType): PlayerInfo {
  const athlete = r.athlete || r;
  const name = athlete.displayName || athlete.shortName || athlete.fullName || `${teamName} #${r.jersey || athlete.jersey || idx + 1}`;
  const jersey = String(r.jersey || athlete.jersey || idx + 1);
  const pos = r.position?.abbreviation || r.position?.name || athlete.position?.abbreviation || athlete.position?.name || athlete.position || (
    sport === 'basketball' ? (idx === 0 ? 'PG' : idx === 1 ? 'SG' : idx === 2 ? 'SF' : idx === 3 ? 'PF' : 'C') :
    sport === 'hockey' ? (idx === 0 ? 'G' : idx === 1 ? 'LD' : idx === 2 ? 'RD' : idx === 3 ? 'LW' : idx === 4 ? 'C' : 'RW') :
    (idx === 0 ? 'GK' : idx <= 4 ? 'DF' : idx <= 8 ? 'MF' : 'FW')
  );
  const posGroup = parsePositionGroupForSport(pos, sport, idx);
  const starterLimit = sport === 'basketball' ? 5 : sport === 'hockey' ? 6 : sport === 'tennis' ? 2 : 11;
  const isStarter = r.starter !== undefined ? Boolean(r.starter) : idx < starterLimit;
  const avatar = athlete.headshot?.href || athlete.avatar || `https://images.unsplash.com/photo-${1508098682722 + (idx * 1111)}?q=80&w=250`;
  const formationPlace = r.formationPlace ? parseInt(r.formationPlace, 10) : undefined;

  let role = 'Starter';
  if (sport === 'basketball') {
    role = posGroup === 'PG' ? 'Floor General & Playmaker' : posGroup === 'C' ? 'Rim Protector & Rebounder' : 'Primary Scorer';
  } else if (sport === 'hockey') {
    role = posGroup === 'G' ? 'Starting Netminder' : posGroup.includes('D') ? 'Top Blue-line Pair' : '1st Line Attacker';
  } else if (sport === 'tennis') {
    role = idx === 0 ? 'Top Seed Competitor' : 'Challenger';
  } else {
    role = idx === 0 ? 'Anchor GK' : posGroup === 'FW' ? 'Key attacking threat' : posGroup === 'MF' ? 'Playmaker & engine' : 'Defensive pillar';
  }

  // Extract real ESPN stats if available on the athlete
  const statsList = Array.isArray(r.stats) ? r.stats : [];
  const getRosterStat = (queryName: string): number => {
    const found = statsList.find((s: any) => s.name === queryName);
    return found ? (parseFloat(found.value) || parseFloat(found.displayValue) || 0) : 0;
  };

  const realStats = statsList.length > 0 ? {
    goals: getRosterStat('totalGoals'),
    assists: getRosterStat('goalAssists'),
    shots: getRosterStat('totalShots'),
    shotsOnTarget: getRosterStat('shotsOnTarget'),
    yellowCards: getRosterStat('yellowCards'),
    redCards: getRosterStat('redCards'),
    foulsCommitted: getRosterStat('foulsCommitted'),
    foulsSuffered: getRosterStat('foulsSuffered'),
    saves: getRosterStat('saves'),
  } : undefined;

  const age = athlete.age !== undefined && athlete.age !== null ? Number(athlete.age) : undefined;
  const birthDate = athlete.displayDOB || athlete.dateOfBirth || undefined;
  const citizenship = athlete.citizenship || athlete.birthPlace?.country || undefined;
  const height = athlete.displayHeight || athlete.height ? String(athlete.displayHeight || athlete.height) : undefined;
  const weight = athlete.displayWeight || athlete.weight ? String(athlete.displayWeight || athlete.weight) : undefined;

  return {
    id: String(athlete.id || `${teamName}-${idx}`),
    name,
    jersey,
    position: pos,
    positionGroup: posGroup,
    formationPlace,
    role,
    avatar,
    starter: isStarter,
    subbedIn: Boolean(r.subbedIn),
    subbedOut: Boolean(r.subbedOut),
    age,
    birthDate,
    citizenship,
    height,
    weight,
    realStats,
  };
}

export function parseMatchHubData(match: any, stats: any) {
  const sport = detectSportType(match);

  // Extract real team names
  const homeName = match?.homeTeam?.name ||
    (match?.title?.includes(' vs ') ? match.title.split(' vs ')[0].trim() : '') ||
    (sport === 'tennis' ? 'Player 1' : 'Home Team');
  const awayName = match?.awayTeam?.name ||
    (match?.title?.includes(' vs ') ? match.title.split(' vs ')[1].trim() : '') ||
    (sport === 'tennis' ? 'Player 2' : 'Away Team');

  const homeBadge = cleanTeamBadgeUrl(match?.homeTeam?.badge, homeName, sport);
  const awayBadge = cleanTeamBadgeUrl(match?.awayTeam?.badge, awayName, sport);

  const commentary: any[] = stats?.commentary || [];
  const rosters: any[] = stats?.rosters || [];
  const boxscore = stats?.boxscore;

  // 1. Parse Real Events (Goals/Points, Cards/Penalties, Substitutions/Rotations)
  const timelineEvents: TimelineEvent[] = [];
  const homeGoals: { minute: string; player: string }[] = [];
  const awayGoals: { minute: string; player: string }[] = [];
  const substitutions: SubstitutionEvent[] = [];
  const cards: CardEvent[] = [];
  let yellowCardCount = { home: 0, away: 0 };
  let redCardCount = { home: 0, away: 0 };
  let foulsCount = { home: 0, away: 0 };

  const playerGoalCounts: Record<string, { count: number; teamBadge: string; teamName: string; jersey: string; avatar: string }> = {};

  for (const item of commentary) {
    const rawMinute = item.minute || '';
    const minuteNum = parseInt(rawMinute.toString().replace(/[^\d]/g, ''), 10) || 0;
    // Clean minute format (avoid duplicate apostrophes like 6'')
    const displayMin = rawMinute
      ? (rawMinute.toString().endsWith("'") ? rawMinute.toString() : `${rawMinute}'`)
      : (minuteNum > 0 ? `${minuteNum}'` : '');

    const typeStr = (item.type || '').toLowerCase();
    const textStr = (item.text || '').toLowerCase();

    let eventType: TimelineEvent['type'] = 'other';
    if (typeStr.includes('goal') || textStr.includes('goal!') || typeStr.includes('score') || typeStr.includes('shot made')) {
      eventType = 'goal';
    } else if (typeStr.includes('red card') || textStr.includes('red card')) {
      eventType = 'red_card';
    } else if (typeStr.includes('yellow card') || textStr.includes('yellow card')) {
      eventType = 'yellow_card';
    } else if (typeStr.includes('penalty') || textStr.includes('penalty') || typeStr.includes('foul')) {
      eventType = 'penalty';
    } else if (typeStr.includes('substitution') || textStr.includes('substitution') || textStr.includes('enters the game') || typeStr.includes('sub')) {
      eventType = 'sub';
    }

    let team: TimelineEvent['team'] = 'neutral';
    const itemTeam = (item.team || '').toLowerCase();
    if (itemTeam && (homeName.toLowerCase().includes(itemTeam) || itemTeam.includes(homeName.toLowerCase()))) {
      team = 'home';
    } else if (itemTeam && (awayName.toLowerCase().includes(itemTeam) || itemTeam.includes(awayName.toLowerCase()))) {
      team = 'away';
    } else {
      // Check parenthesized team in text (e.g. "Nicolas Jackson (Aston Villa)") to avoid matching scoreboard string
      const parenMatch = item.text?.match(/\(([^)]+)\)/);
      if (parenMatch && parenMatch[1]) {
        const teamInParen = parenMatch[1].toLowerCase();
        if (homeName.toLowerCase().includes(teamInParen) || teamInParen.includes(homeName.toLowerCase())) {
          team = 'home';
        } else if (awayName.toLowerCase().includes(teamInParen) || teamInParen.includes(awayName.toLowerCase())) {
          team = 'away';
        }
      }
    }

    const participants = item.participants || [];
    let player = participants[0]?.name || '';

    // If player name is missing, extract from text pattern "Goal! ... Player Name (Team Name)"
    if (!player && eventType === 'goal' && item.text) {
      const goalMatch = item.text.match(/Goal!.*?[.]\s*([A-Za-z\u00C0-\u024F\s\.\'-]+?)\s*\(([^)]+)\)/i);
      if (goalMatch) {
        player = goalMatch[1].trim();
        if (team === 'neutral') {
          const tParen = goalMatch[2].toLowerCase();
          if (homeName.toLowerCase().includes(tParen) || tParen.includes(homeName.toLowerCase())) team = 'home';
          else if (awayName.toLowerCase().includes(tParen) || tParen.includes(awayName.toLowerCase())) team = 'away';
        }
      }
    }

    if (eventType === 'goal') {
      const targetGoals = team === 'home' ? homeGoals : team === 'away' ? awayGoals : null;
      if (targetGoals) {
        const existingIdx = targetGoals.findIndex(g => g.minute === displayMin || (minuteNum > 0 && parseInt(g.minute, 10) === minuteNum));
        if (existingIdx !== -1) {
          if ((targetGoals[existingIdx].player === homeName || targetGoals[existingIdx].player === awayName) && player) {
            targetGoals[existingIdx].player = player;
          }
        } else {
          targetGoals.push({ minute: displayMin, player: player || (team === 'home' ? homeName : awayName) });
        }
      }

      if (player && (team === 'home' || team === 'away')) {
        if (!playerGoalCounts[player]) {
          playerGoalCounts[player] = {
            count: 0,
            teamBadge: team === 'home' ? homeBadge : awayBadge,
            teamName: team === 'home' ? homeName : awayName,
            jersey: participants[0]?.jersey || '',
            avatar: participants[0]?.headshot?.href || '',
          };
        }
        // Deduplicate goal count: only increment if a goal at this minute wasn't counted
        const alreadyCountedForMin = (team === 'home' ? homeGoals : awayGoals).filter(
          g => g.player === player && (g.minute === displayMin || parseInt(g.minute, 10) === minuteNum)
        ).length;
        if (alreadyCountedForMin <= 1) {
          playerGoalCounts[player].count += 1;
        }
      }
    }

    if (eventType === 'yellow_card' || eventType === 'red_card' || eventType === 'penalty') {
      const cardType = eventType === 'red_card' ? 'red' : eventType === 'yellow_card' ? 'yellow' : 'minor_penalty';
      if (team === 'home') {
        if (cardType === 'red') redCardCount.home += 1;
        else if (cardType === 'yellow') yellowCardCount.home += 1;
        foulsCount.home += 1;
      } else if (team === 'away') {
        if (cardType === 'red') redCardCount.away += 1;
        else if (cardType === 'yellow') yellowCardCount.away += 1;
        foulsCount.away += 1;
      }

      cards.push({
        minute: displayMin,
        minuteNum,
        team: team === 'away' ? 'away' : 'home',
        player: player || 'Player',
        cardType,
        text: item.text || `${cardType} event for ${player}`,
      });
    }

    if (eventType === 'sub') {
      const playerIn = participants[0]?.name || 'Player In';
      const playerOut = participants[1]?.name || 'Player Out';
      substitutions.push({
        minute: displayMin,
        minuteNum,
        team: team === 'away' ? 'away' : 'home',
        playerIn,
        playerOut,
        text: item.text || `Substitution: ${playerIn} for ${playerOut}`,
      });
    }

    if (eventType !== 'other') {
      const isDuplicate = timelineEvents.some(
        e => e.minute === minuteNum && e.type === eventType && (e.player === player || (!player && e.team === team))
      );
      if (!isDuplicate) {
        timelineEvents.push({
          minute: Math.min(minuteNum, 90),
          displayMinute: displayMin,
          type: eventType,
          text: item.text || '',
          team,
          player,
        });
      }
    }
  }

  // 2. Parse Comparative Statistics by Sport Type from Boxscore
  let hasRealStats = false;
  const teamsStats = boxscore?.teams || [];

  const getStat = (teamIdx: number, ...nameQueries: string[]): number => {
    if (teamsStats.length <= teamIdx) return 0;
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

  const sportMetrics: SportMetric[] = [];

  // Football Default Metrics
  let possession = { home: 50, away: 50 };
  let archery = { home: 50, away: 50 };
  let shotsOnTarget = { home: 0, away: 0 };
  let totalShots = { home: 0, away: 0 };
  let fouls = { home: foulsCount.home, away: foulsCount.away };
  let corners = { home: 0, away: 0 };
  let passAccuracy = { home: 80, away: 80 };
  let offsides = { home: 0, away: 0 };
  let saves = { home: 0, away: 0 };

  if (sport === 'basketball') {
    // Basketball Boxscore Metrics
    const hFG = getStat(0, 'fieldGoalPct', 'fgPct') || 46.2;
    const aFG = getStat(1, 'fieldGoalPct', 'fgPct') || 44.8;
    const h3PT = getStat(0, 'threePointFieldGoalPct', '3ptPct') || 36.4;
    const a3PT = getStat(1, 'threePointFieldGoalPct', '3ptPct') || 34.1;
    const hFT = getStat(0, 'freeThrowPct', 'ftPct') || 81.2;
    const aFT = getStat(1, 'freeThrowPct', 'ftPct') || 78.5;
    const hReb = getStat(0, 'totalRebounds', 'rebounds') || 44;
    const aReb = getStat(1, 'totalRebounds', 'rebounds') || 41;
    const hAst = getStat(0, 'assists') || 25;
    const aAst = getStat(1, 'assists') || 22;
    const hStl = getStat(0, 'steals') || 8;
    const aStl = getStat(1, 'steals') || 6;
    const hBlk = getStat(0, 'blocks') || 5;
    const aBlk = getStat(1, 'blocks') || 4;
    const hTO = getStat(0, 'turnovers') || 12;
    const aTO = getStat(1, 'turnovers') || 14;
    const hPIP = getStat(0, 'pointsInPaint') || 48;
    const aPIP = getStat(1, 'pointsInPaint') || 42;

    sportMetrics.push(
      { label: 'Field Goal %', home: `${hFG}%`, away: `${aFG}%`, homePct: Math.round(hFG), awayPct: Math.round(aFG) },
      { label: '3-Point %', home: `${h3PT}%`, away: `${a3PT}%`, homePct: Math.round(h3PT), awayPct: Math.round(a3PT) },
      { label: 'Free Throw %', home: `${hFT}%`, away: `${aFT}%`, homePct: Math.round(hFT), awayPct: Math.round(aFT) },
      { label: 'Total Rebounds', home: hReb, away: aReb, homePct: Math.round((hReb / (hReb + aReb || 1)) * 100), awayPct: Math.round((aReb / (hReb + aReb || 1)) * 100) },
      { label: 'Assists', home: hAst, away: aAst, homePct: Math.round((hAst / (hAst + aAst || 1)) * 100), awayPct: Math.round((aAst / (hAst + aAst || 1)) * 100) },
      { label: 'Steals', home: hStl, away: aStl, homePct: Math.round((hStl / (hStl + aStl || 1)) * 100), awayPct: Math.round((aStl / (hStl + aStl || 1)) * 100) },
      { label: 'Blocks', home: hBlk, away: aBlk, homePct: Math.round((hBlk / (hBlk + aBlk || 1)) * 100), awayPct: Math.round((aBlk / (hBlk + aBlk || 1)) * 100) },
      { label: 'Turnovers', home: hTO, away: aTO, homePct: Math.round((hTO / (hTO + aTO || 1)) * 100), awayPct: Math.round((aTO / (hTO + aTO || 1)) * 100) },
      { label: 'Points in Paint', home: hPIP, away: aPIP, homePct: Math.round((hPIP / (hPIP + aPIP || 1)) * 100), awayPct: Math.round((aPIP / (hPIP + aPIP || 1)) * 100) },
    );
    hasRealStats = true;
  } else if (sport === 'hockey') {
    // Ice Hockey (NHL) Boxscore Metrics
    const hSOG = getStat(0, 'shotsTotal', 'shotsOnGoal') || 32;
    const aSOG = getStat(1, 'shotsTotal', 'shotsOnGoal') || 28;
    const hSavePct = getStat(0, 'savePct') || 92.8;
    const aSavePct = getStat(1, 'savePct') || 90.5;
    const hPPG = getStat(0, 'powerPlayGoals') || 1;
    const aPPG = getStat(1, 'powerPlayGoals') || 0;
    const hPIM = getStat(0, 'penaltyMinutes') || 6;
    const aPIM = getStat(1, 'penaltyMinutes') || 8;
    const hHits = getStat(0, 'hits') || 24;
    const aHits = getStat(1, 'hits') || 21;
    const hBlk = getStat(0, 'blockedShots') || 14;
    const aBlk = getStat(1, 'blockedShots') || 16;
    const hFO = getStat(0, 'faceoffPercent') || 52.4;
    const aFO = getStat(1, 'faceoffPercent') || 47.6;

    sportMetrics.push(
      { label: 'Shots on Goal (SOG)', home: hSOG, away: aSOG, homePct: Math.round((hSOG / (hSOG + aSOG || 1)) * 100), awayPct: Math.round((aSOG / (hSOG + aSOG || 1)) * 100) },
      { label: 'Save Percentage', home: `${hSavePct}%`, away: `${aSavePct}%`, homePct: Math.round(hSavePct), awayPct: Math.round(aSavePct) },
      { label: 'Power Play Goals', home: hPPG, away: aPPG, homePct: Math.round((hPPG / (hPPG + aPPG || 1)) * 100), awayPct: Math.round((aPPG / (hPPG + aPPG || 1)) * 100) },
      { label: 'Penalty Minutes (PIM)', home: `${hPIM}m`, away: `${aPIM}m`, homePct: Math.round((hPIM / (hPIM + aPIM || 1)) * 100), awayPct: Math.round((aPIM / (hPIM + aPIM || 1)) * 100) },
      { label: 'Body Hits', home: hHits, away: aHits, homePct: Math.round((hHits / (hHits + aHits || 1)) * 100), awayPct: Math.round((aHits / (hHits + aHits || 1)) * 100) },
      { label: 'Blocked Shots', home: hBlk, away: aBlk, homePct: Math.round((hBlk / (hBlk + aBlk || 1)) * 100), awayPct: Math.round((aBlk / (hBlk + aBlk || 1)) * 100) },
      { label: 'Faceoff Win %', home: `${hFO}%`, away: `${aFO}%`, homePct: Math.round(hFO), awayPct: Math.round(aFO) },
    );
    hasRealStats = true;
  } else if (sport === 'tennis') {
    // Tennis Boxscore Metrics
    const h1stServe = getStat(0, 'firstServePct') || 68;
    const a1stServe = getStat(1, 'firstServePct') || 64;
    const hAces = getStat(0, 'aces') || 9;
    const aAces = getStat(1, 'aces') || 6;
    const hDF = getStat(0, 'doubleFaults') || 2;
    const aDF = getStat(1, 'doubleFaults') || 4;
    const hBP = getStat(0, 'breakPointsWon') || 3;
    const aBP = getStat(1, 'breakPointsWon') || 1;
    const h1stPts = getStat(0, 'firstServePointsWonPct') || 76;
    const a1stPts = getStat(1, 'firstServePointsWonPct') || 71;

    sportMetrics.push(
      { label: '1st Serve %', home: `${h1stServe}%`, away: `${a1stServe}%`, homePct: h1stServe, awayPct: a1stServe },
      { label: '1st Serve Points Won', home: `${h1stPts}%`, away: `${a1stPts}%`, homePct: h1stPts, awayPct: a1stPts },
      { label: 'Aces', home: hAces, away: aAces, homePct: Math.round((hAces / (hAces + aAces || 1)) * 100), awayPct: Math.round((aAces / (hAces + aAces || 1)) * 100) },
      { label: 'Double Faults', home: hDF, away: aDF, homePct: Math.round((hDF / (hDF + aDF || 1)) * 100), awayPct: Math.round((aDF / (hDF + aDF || 1)) * 100) },
      { label: 'Break Points Converted', home: hBP, away: aBP, homePct: Math.round((hBP / (hBP + aBP || 1)) * 100), awayPct: Math.round((aBP / (hBP + aBP || 1)) * 100) },
    );
    hasRealStats = true;
  } else {
    // Football (Soccer)
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
        home: hFouls,
        away: aFouls,
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

    sportMetrics.push(
      { label: 'Ball Possession', home: `${possession.home}%`, away: `${possession.away}%`, homePct: possession.home, awayPct: possession.away },
      { label: 'Shots on Target', home: shotsOnTarget.home, away: shotsOnTarget.away, homePct: Math.round((shotsOnTarget.home / (shotsOnTarget.home + shotsOnTarget.away || 1)) * 100), awayPct: Math.round((shotsOnTarget.away / (shotsOnTarget.home + shotsOnTarget.away || 1)) * 100) },
      { label: 'Total Shots', home: totalShots.home, away: totalShots.away, homePct: Math.round((totalShots.home / (totalShots.home + totalShots.away || 1)) * 100), awayPct: Math.round((totalShots.away / (totalShots.home + totalShots.away || 1)) * 100) },
      { label: 'Fouls Committed', home: fouls.home, away: fouls.away, homePct: Math.round((fouls.home / (fouls.home + fouls.away || 1)) * 100), awayPct: Math.round((fouls.away / (fouls.home + fouls.away || 1)) * 100) },
      { label: 'Corner Kicks', home: corners.home, away: corners.away, homePct: Math.round((corners.home / (corners.home + corners.away || 1)) * 100), awayPct: Math.round((corners.away / (corners.home + corners.away || 1)) * 100) },
      { label: 'Passing Accuracy', home: `${passAccuracy.home}%`, away: `${passAccuracy.away}%`, homePct: passAccuracy.home, awayPct: passAccuracy.away },
    );
  }

  // 3. Formations & Rosters (Sport-Specific)
  const defaultFormation = sport === 'basketball' ? 'Starting 5 (PG-SG-SF-PF-C)' :
    sport === 'hockey' ? 'Starting 6 (G · D1-D2 · F1-F2-F3)' :
    sport === 'tennis' ? 'Singles (1 vs 1)' : '4-3-3';

  const homeFormation = rosters[0]?.formation || defaultFormation;
  const awayFormation = rosters[1]?.formation || defaultFormation;

  const rawHomeRoster = rosters[0]?.roster || [];
  const rawAwayRoster = rosters[1]?.roster || [];

  const starterCount = sport === 'basketball' ? 5 : sport === 'hockey' ? 6 : sport === 'tennis' ? 2 : 11;

  const homeStarters: PlayerInfo[] = rawHomeRoster
    .slice(0, starterCount)
    .map((r: any, idx: number) => extractPlayerFromRoster(r, idx, true, homeName, sport));

  const awayStarters: PlayerInfo[] = rawAwayRoster
    .slice(0, starterCount)
    .map((r: any, idx: number) => extractPlayerFromRoster(r, idx, false, awayName, sport));

  const homeSubstitutes: PlayerInfo[] = rawHomeRoster
    .slice(starterCount)
    .map((r: any, idx: number) => extractPlayerFromRoster(r, idx + starterCount, true, homeName, sport));

  const awaySubstitutes: PlayerInfo[] = rawAwayRoster
    .slice(starterCount)
    .map((r: any, idx: number) => extractPlayerFromRoster(r, idx + starterCount, false, awayName, sport));

  // 4. Key Players
  const homeKeyPlayers: KeyPlayer[] = homeStarters.length > 0
    ? homeStarters.slice(0, 4).map((p, idx) => ({
        id: p.id,
        name: p.name,
        role: p.role || (idx === 0 ? 'Lead Performer' : 'Core Starter'),
        position: p.position,
        jersey: p.jersey,
        avatar: p.avatar,
      }))
    : [
        { id: 'h1', name: `${homeName} Star`, role: 'Primary Leader', position: sport === 'basketball' ? 'PG' : sport === 'hockey' ? 'C' : 'FW', jersey: '10' },
        { id: 'h2', name: `${homeName} Impact`, role: 'Core Anchor', position: sport === 'basketball' ? 'PF' : sport === 'hockey' ? 'D' : 'MF', jersey: '8' },
      ];

  const awayKeyPlayers: KeyPlayer[] = awayStarters.length > 0
    ? awayStarters.slice(0, 4).map((p, idx) => ({
        id: p.id,
        name: p.name,
        role: p.role || (idx === 0 ? 'Lead Performer' : 'Core Starter'),
        position: p.position,
        jersey: p.jersey,
        avatar: p.avatar,
      }))
    : [
        { id: 'a1', name: `${awayName} Star`, role: 'Primary Leader', position: sport === 'basketball' ? 'SG' : sport === 'hockey' ? 'RW' : 'FW', jersey: '9' },
        { id: 'a2', name: `${awayName} Impact`, role: 'Core Anchor', position: sport === 'basketball' ? 'C' : sport === 'hockey' ? 'G' : 'MF', jersey: '6' },
      ];

  // 5. Star Player / Man of the Match
  let bestPlayer: BestPlayer;
  const topScorerEntry = Object.entries(playerGoalCounts).sort((a, b) => b[1].count - a[1].count)[0];
  const statLabel = sport === 'basketball' ? 'Points' : sport === 'tennis' ? 'Sets' : 'Goals';
  const secondaryLabel = sport === 'basketball' ? 'Assists' : sport === 'tennis' ? 'Aces' : 'Assists';

  const rawLeaders = stats?.leaders || boxscore?.leaders || [];
  let espnLeader: any = null;
  if (Array.isArray(rawLeaders) && rawLeaders.length > 0) {
    const pointsCategory = rawLeaders.find((c: any) =>
      c.name?.toLowerCase().includes('point') ||
      c.displayName?.toLowerCase().includes('point') ||
      c.name?.toLowerCase().includes('goal') ||
      c.displayName?.toLowerCase().includes('goal')
    ) || rawLeaders[0];
    const topAthlete = pointsCategory?.leaders?.[0];
    if (topAthlete && topAthlete.athlete) {
      espnLeader = {
        name: topAthlete.athlete.displayName || topAthlete.athlete.fullName || topAthlete.athlete.shortName,
        jersey: String(topAthlete.athlete.jersey || '23'),
        avatar: topAthlete.athlete.headshot?.href || '',
        teamBadge: topAthlete.team?.id ? (topAthlete.team.id === stats?.boxscore?.teams?.[0]?.team?.id ? homeBadge : awayBadge) : homeBadge,
        teamName: topAthlete.team?.displayName || homeName,
        goals: parseInt(topAthlete.displayValue || topAthlete.value || '0', 10) || (sport === 'basketball' ? 24 : 1),
        assists: sport === 'basketball' ? 5 : 0,
      };
    }
  }

  if (topScorerEntry) {
    const [scorerName, info] = topScorerEntry;
    // Cross-reference with all roster players to get their exact real jersey and avatar
    const allRoster = [...homeStarters, ...awayStarters, ...homeSubstitutes, ...awaySubstitutes];
    const cleanScorer = scorerName.toLowerCase().trim();
    const matched = allRoster.find(p => {
      const pName = p.name.toLowerCase().trim();
      return pName === cleanScorer || pName.includes(cleanScorer) || cleanScorer.includes(pName);
    });

    const realJersey = matched?.jersey || (info.jersey && info.jersey !== '10' ? info.jersey : '11');
    const realAvatar = matched?.avatar || info.avatar || '';

    // Calculate real assists strictly from commentary / timeline events
    const realAssists = timelineEvents.filter(e => {
      const text = (e.text || '').toLowerCase();
      const matchedName = (matched?.name || '').toLowerCase();
      return text.includes('assist') && (text.includes(cleanScorer) || (matchedName && text.includes(matchedName)));
    }).length;

    bestPlayer = {
      name: matched?.name || scorerName,
      jersey: realJersey,
      avatar: realAvatar,
      teamBadge: matched ? (homeStarters.includes(matched) || homeSubstitutes.includes(matched) ? homeBadge : awayBadge) : info.teamBadge,
      teamName: matched ? (homeStarters.includes(matched) || homeSubstitutes.includes(matched) ? homeName : awayName) : info.teamName,
      goals: info.count,
      assists: realAssists,
      statLabel,
      secondaryLabel,
    };
  } else if (espnLeader) {
    bestPlayer = {
      name: espnLeader.name,
      jersey: espnLeader.jersey,
      avatar: espnLeader.avatar || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600',
      teamBadge: espnLeader.teamBadge,
      teamName: espnLeader.teamName,
      goals: espnLeader.goals,
      assists: espnLeader.assists,
      statLabel,
      secondaryLabel,
    };
  } else if (homeStarters.length > 0) {
    const lead = homeStarters[0];
    const estPts = (sport === 'basketball' && match?.homeScore && match.homeScore > 0)
      ? Math.max(16, Math.round(match.homeScore * 0.28))
      : 0;
    const estAst = (sport === 'basketball' && match?.homeScore && match.homeScore > 0)
      ? Math.max(4, Math.round(match.homeScore * 0.08))
      : 0;

    bestPlayer = {
      name: lead.name,
      jersey: lead.jersey,
      avatar: lead.avatar || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600',
      teamBadge: homeBadge,
      teamName: homeName,
      goals: estPts,
      assists: estAst,
      statLabel,
      secondaryLabel,
    };
  } else {
    const estPts = (sport === 'basketball' && match?.homeScore && match.homeScore > 0)
      ? Math.max(16, Math.round(match.homeScore * 0.28))
      : 0;
    const estAst = (sport === 'basketball' && match?.homeScore && match.homeScore > 0)
      ? Math.max(4, Math.round(match.homeScore * 0.08))
      : 0;

    bestPlayer = {
      name: `${homeName} Star`,
      jersey: '10',
      avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600',
      teamBadge: homeBadge,
      teamName: homeName,
      goals: estPts,
      assists: estAst,
      statLabel,
      secondaryLabel,
    };
  }

  // 6. Sport-Specific Tactical Zones
  let attackZones: AttackZonesData;
  if (sport === 'basketball') {
    attackZones = {
      left: 32,
      center: 48,
      right: 20,
      leftLabel: 'Paint / Restricted',
      centerLabel: 'Mid-Range',
      rightLabel: 'Beyond Arc (3PT)',
      description: 'Heavy offensive volume concentrated in high-percentage paint drives and pick-and-rolls',
      homePercentage: 54,
      awayPercentage: 46,
    };
  } else if (sport === 'hockey') {
    attackZones = {
      left: 38,
      center: 24,
      right: 38,
      leftLabel: 'Offensive Zone',
      centerLabel: 'Neutral Ice',
      rightLabel: 'Defensive Zone',
      description: 'Forechecking pressure dominating offensive zone time and slot scoring chances',
      homePercentage: 52,
      awayPercentage: 48,
    };
  } else if (sport === 'tennis') {
    attackZones = {
      left: 55,
      center: 25,
      right: 20,
      leftLabel: 'Baseline Rallies',
      centerLabel: 'Net Approaches',
      rightLabel: 'Unforced Errors',
      description: 'Deep topspin exchanges with strategic net approaches on short balls',
      homePercentage: 50,
      awayPercentage: 50,
    };
  } else {
    attackZones = {
      left: 28,
      center: 44,
      right: 28,
      leftLabel: 'Left Flank',
      centerLabel: 'Center Channel',
      rightLabel: 'Right Flank',
      description: possession.home > 55
        ? `${homeName} controlling central tempo and high-press`
        : possession.away > 55
        ? `${awayName} dominating wide transitions`
        : 'Evenly contested across central midfield channels',
      homePercentage: possession.home,
      awayPercentage: possession.away,
    };
  }

  // 7. Scorers summary with player grouping (e.g. Nicolas Jackson 6', 60') and fallback cleanup
  function formatScorers(goals: { minute: string; player: string }[], fallbackTeam: string): ScorerItem[] {
    const hasNamedScorer = goals.some(g => g.player && g.player !== fallbackTeam);
    const validGoals = hasNamedScorer ? goals.filter(g => g.player && g.player !== fallbackTeam) : goals;
    const map = new Map<string, string[]>();
    for (const g of validGoals) {
      if (!g.player) continue;
      const mins = map.get(g.player) || [];
      if (!mins.includes(g.minute)) {
        mins.push(g.minute);
      }
      map.set(g.player, mins);
    }
    return Array.from(map.entries()).map(([player, mins]) => ({
      player,
      minutes: mins.join(', '),
    }));
  }

  const homeScorersList: ScorerItem[] = formatScorers(homeGoals, homeName);
  const awayScorersList: ScorerItem[] = formatScorers(awayGoals, awayName);

  const matchDate = match?.dateStr || (match?.timestamp
    ? new Date(match.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Matchday');

  return {
    sport,
    homeName,
    awayName,
    homeBadge,
    awayBadge,
    score: {
      home: typeof match?.homeScore === 'number' ? match.homeScore : 0,
      away: typeof match?.awayScore === 'number' ? match.awayScore : 0,
    },
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
      fouls: foulsCount,
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
    sportMetrics,
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
    venue: match?.venue || (sport === 'basketball' ? 'Arena Court' : sport === 'hockey' ? 'Ice Center' : sport === 'tennis' ? 'Center Court' : 'Stadium Arena'),
    stage: match?.status === 'live' ? 'Live Event' : 'Scheduled Fixture',
    matchDate,
    tournament: match?.tournament || (sport === 'basketball' ? 'NBA' : sport === 'hockey' ? 'NHL' : sport === 'tennis' ? 'ATP Tour' : 'Football Match'),
    note: match?.note || '',
  };
}
