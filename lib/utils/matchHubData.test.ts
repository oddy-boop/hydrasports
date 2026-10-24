import { describe, it, expect } from 'vitest';
import { parseMatchHubData } from './matchHubData';

describe('matchHubData parser', () => {
  it('correctly parses real match stats, commentary events, and key players', () => {
    const mockMatch = {
      id: 'match-123',
      title: 'Arsenal vs Chelsea',
      homeTeam: { name: 'Arsenal', badge: 'https://example.com/arsenal.png' },
      awayTeam: { name: 'Chelsea', badge: 'https://example.com/chelsea.png' },
      homeScore: 3,
      awayScore: 1,
      currentMinute: '72\'',
      currentMinuteNumber: 72,
      status: 'live',
      tournament: 'Premier League',
    };

    const mockStats = {
      boxscore: {
        teams: [
          {
            team: { displayName: 'Arsenal' },
            statistics: [
              { name: 'possessionPct', displayValue: '58' },
              { name: 'shotsOnTarget', displayValue: '7' },
              { name: 'totalShots', displayValue: '15' },
              { name: 'foulsCommitted', displayValue: '6' },
              { name: 'wonCorners', displayValue: '5' },
              { name: 'passingPct', displayValue: '86' },
            ],
          },
          {
            team: { displayName: 'Chelsea' },
            statistics: [
              { name: 'possessionPct', displayValue: '42' },
              { name: 'shotsOnTarget', displayValue: '3' },
              { name: 'totalShots', displayValue: '8' },
              { name: 'foulsCommitted', displayValue: '12' },
              { name: 'wonCorners', displayValue: '2' },
              { name: 'passingPct', displayValue: '79' },
            ],
          },
        ],
      },
      commentary: [
        {
          type: 'Goal',
          minute: '23',
          text: 'Goal! Arsenal 1, Chelsea 0. Bukayo Saka left footed shot.',
          team: 'Arsenal',
          participants: [{ name: 'Bukayo Saka' }],
        },
        {
          type: 'Goal',
          minute: '41',
          text: 'Goal! Arsenal 2, Chelsea 0. Martin Ødegaard penalty.',
          team: 'Arsenal',
          participants: [{ name: 'Martin Ødegaard' }],
        },
        {
          type: 'Goal',
          minute: '58',
          text: 'Goal! Arsenal 2, Chelsea 1. Cole Palmer converts.',
          team: 'Chelsea',
          participants: [{ name: 'Cole Palmer' }],
        },
        {
          type: 'Yellow Card',
          minute: '65',
          text: 'Yellow card for Enzo Fernández.',
          team: 'Chelsea',
          participants: [{ name: 'Enzo Fernández' }],
        },
      ],
      rosters: [
        {
          roster: [
            {
              athlete: { id: 'saka', displayName: 'Bukayo Saka', jersey: '7', position: { abbreviation: 'FW' } },
            },
            {
              athlete: { id: 'odegaard', displayName: 'Martin Ødegaard', jersey: '8', position: { abbreviation: 'MF' } },
            },
            {
              athlete: { id: 'saliba', displayName: 'William Saliba', jersey: '2', position: { abbreviation: 'DF' } },
            },
            {
              athlete: { id: 'raya', displayName: 'David Raya', jersey: '22', position: { abbreviation: 'GK' } },
            },
          ],
        },
        {
          roster: [
            {
              athlete: { id: 'palmer', displayName: 'Cole Palmer', jersey: '20', position: { abbreviation: 'FW' } },
            },
            {
              athlete: { id: 'enzo', displayName: 'Enzo Fernández', jersey: '8', position: { abbreviation: 'MF' } },
            },
          ],
        },
      ],
    };

    const parsed = parseMatchHubData(mockMatch, mockStats);

    expect(parsed.homeName).toBe('Arsenal');
    expect(parsed.awayName).toBe('Chelsea');
    expect(parsed.possession.home).toBe(58);
    expect(parsed.possession.away).toBe(42);
    expect(parsed.shotsOnTarget.home).toBe(7);
    expect(parsed.shotsOnTarget.away).toBe(3);
    expect(parsed.homeGoals.length).toBe(2);
    expect(parsed.homeGoals[0].player).toBe('Bukayo Saka');
    expect(parsed.awayGoals.length).toBe(1);
    expect(parsed.awayGoals[0].player).toBe('Cole Palmer');
    expect(parsed.homeKeyPlayers.length).toBe(4);
    expect(parsed.homeKeyPlayers[0].name).toBe('Bukayo Saka');
    expect(parsed.hasRealStats).toBe(true);
  });

  it('correctly identifies Own Goals (OG) and attributes score benefit to opponent', () => {
    const mockMatch = {
      id: 'match-og',
      title: 'Napoli vs AS Roma',
      homeTeam: { name: 'Napoli' },
      awayTeam: { name: 'AS Roma' },
      homeScore: 1,
      awayScore: 0,
      status: 'live',
    };

    const mockStats = {
      commentary: [
        {
          type: 'Goal',
          minute: '34',
          text: 'Own Goal by Gianluca Mancini, AS Roma. Napoli 1, AS Roma 0.',
          team: 'AS Roma',
          participants: [{ name: 'Gianluca Mancini' }],
        },
      ],
    };

    const parsed = parseMatchHubData(mockMatch, mockStats);

    // Goal is by Roma player Mancini, but an Own Goal benefits Napoli on the scoreboard!
    expect(parsed.homeGoals.length).toBe(1);
    expect(parsed.homeGoals[0].player).toContain('(OG)');
    expect(parsed.timelineEvents.length).toBe(1);
    expect(parsed.timelineEvents[0].isOwnGoal).toBe(true);
    expect(parsed.timelineEvents[0].type).toBe('goal');
  });
});
