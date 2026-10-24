import { describe, it, expect } from 'vitest';
import {
  getPlayerMarketValue,
  getPlayerMatchRating,
  buildPlayerFullDetails,
  normalizePlayerName,
} from './playerProfiles';

describe('playerProfiles utility', () => {
  it('normalizes player names correctly across accents and spaces', () => {
    expect(normalizePlayerName('Martin Ødegaard')).toBe('martin odegaard');
    expect(normalizePlayerName('Erling Haaland')).toBe('erling haaland');
    expect(normalizePlayerName('Viktor Gyökeres')).toBe('viktor gyokeres');
    expect(normalizePlayerName('Gabriel Magalhães')).toBe('gabriel magalhaes');
  });

  it('retrieves verified market values for star players and estimates for others', () => {
    const haaland = getPlayerMarketValue('Erling Haaland', 'FW', true);
    expect(haaland.valueFormatted).toBe('€200.00M');
    expect(haaland.valueNum).toBe(200);

    const odegaard = getPlayerMarketValue('Martin Ødegaard', 'MF', true);
    expect(odegaard.valueFormatted).toBe('€110.00M');

    const gyokeres = getPlayerMarketValue('Viktor Gyökeres', 'FW', true);
    expect(gyokeres.valueFormatted).toBe('€75.00M');

    // Unknown player should get a reasonable estimated valuation
    const unknown = getPlayerMarketValue('John Unknownson', 'MF', true);
    expect(unknown.valueNum).toBeGreaterThan(0);
    expect(unknown.valueFormatted).toMatch(/^€\d+\.\d{2}M$/);
  });

  it('implements Flashscore Opta model core mechanics: 10-min rule, 6.0 baseline, and 10.0 cap', () => {
    // Core Mechanic 1: Playing time requirement (< 10 mins is unrated)
    const lateSub = getPlayerMatchRating({
      name: 'Endrick',
      starter: false,
      minutesPlayed: 7,
    });
    expect(lateSub.isRated).toBe(false);
    expect(lateSub.ratingFormatted).toBe('–');
    expect(lateSub.tier).toBe('unrated');

    // Core Mechanic 2: Starting Point is strictly baseline 6.0
    const qualifiedStarter = getPlayerMatchRating({
      name: 'Viktor Gyökeres',
      starter: true,
      minutesPlayed: 25,
    });
    expect(qualifiedStarter.isRated).toBe(true);
    expect(qualifiedStarter.rating).toBe(6.0);
    expect(qualifiedStarter.ratingFormatted).toBe('6.0');
    expect(qualifiedStarter.colorClass).toContain('bg-[#ffb800]'); // Flashscore yellow

    // Core Mechanic 3: Real-Time Updates & Goal scorer boosts
    const scorer = getPlayerMatchRating(
      { name: 'Viktor Gyökeres', minutesPlayed: 45, starter: true },
      { goalScorers: ['Viktor Gyökeres'], homeScore: 2, awayScore: 0, isHome: true }
    );
    expect(scorer.rating).toBeGreaterThan(qualifiedStarter.rating);
    expect(scorer.rating).toBeGreaterThanOrEqual(7.0);
    expect(scorer.colorClass).toContain('bg-[#008744]'); // Flashscore green

    // Disciplinary error drops rating below 6.0 into red tier
    const redCarded = getPlayerMatchRating({
      name: 'Viktor Gyökeres',
      starter: true,
      minutesPlayed: 55,
      realStats: { redCards: 1, yellowCards: 0, goals: 0, assists: 0 },
    });
    expect(redCarded.rating).toBeLessThan(6.0);
    expect(redCarded.colorClass).toContain('bg-[#dc2626]'); // Flashscore red

    // Core Mechanic 4: Extraordinary performances cap out at 10.0 (e.g. hat-trick)
    const extraordinary = getPlayerMatchRating({
      name: 'Erling Haaland',
      starter: true,
      minutesPlayed: 85,
      realStats: { goals: 4, assists: 1, shotsOnTarget: 5, yellowCards: 0, redCards: 0 },
    });
    expect(extraordinary.rating).toBe(10.0);
    expect(extraordinary.label).toBe('Exceptional 10.0');
  });

  it('constructs a complete PlayerFullDetails object with valid stats and physical info', () => {
    const details = buildPlayerFullDetails(
      {
        id: '12345',
        name: 'Martin Ødegaard',
        jersey: '8',
        position: 'AM',
        positionGroup: 'MF',
        starter: true,
      },
      'Arsenal',
      'https://example.com/badge.png',
      'https://example.com/face.png',
      { bestPlayerName: 'Martin Ødegaard', isHome: true, homeScore: 2, awayScore: 0 }
    );

    expect(details.name).toBe('Martin Ødegaard');
    expect(details.jersey).toBe('8');
    expect(details.teamName).toBe('Arsenal');
    expect(details.marketValue).toBe('€110.00M');
    expect(details.nationality).toBe('Norway');
    expect(details.rating).toBeGreaterThanOrEqual(8.0);
    expect(details.stats.passAccuracy).toBeDefined();
    expect(details.height).toBeDefined();
    expect(details.contractUntil).toBeDefined();
  });

  it('accurately parses real fixture events for goals, assists, and cards', () => {
    const exposito = buildPlayerFullDetails(
      {
        name: 'Edu Expósito',
        jersey: '8',
        position: 'MF',
        positionGroup: 'MF',
        starter: true,
      },
      'Espanyol',
      'https://example.com/badge.png',
      '',
      {
        bestPlayer: {
          name: 'Edu Expósito',
          goals: 1,
          assists: 0,
        },
        timelineEvents: [
          { minute: 62, displayMinute: "62'", type: 'goal', player: 'Edu Expósito', text: 'Goal! Edu Expósito' },
          { minute: 69, displayMinute: "69'", type: 'goal', player: 'Jeanuël Belocian', text: 'Goal! Jeanuël Belocian' },
          { minute: 90, displayMinute: "90'", type: 'yellow_card', player: 'Edu Expósito', text: 'Yellow Card Edu Expósito' },
        ],
      }
    );

    // Should accurately match fixture events
    expect(exposito.stats.goals).toBe(1);
    expect(exposito.stats.assists).toBe(0);
    expect(exposito.stats.yellowCards).toBe(1);
    expect(exposito.stats.redCards).toBe(0);
    expect(exposito.stats.shotsOnTarget).toBeGreaterThanOrEqual(1);
    expect(exposito.stats.shots).toBeGreaterThanOrEqual(exposito.stats.shotsOnTarget);
    expect(exposito.age).toBe(30);
    expect(exposito.nationality).toBe('Spain');
  });

  it('correctly calculates age in 2026 for players from their real birth date', () => {
    const haaland = buildPlayerFullDetails(
      { name: 'Erling Haaland', jersey: '9', positionGroup: 'FW' },
      'Manchester City',
      '',
      ''
    );
    // Born July 21, 2000 => 26 in October 2026
    expect(haaland.age).toBe(26);

    const saka = buildPlayerFullDetails(
      { name: 'Bukayo Saka', jersey: '7', positionGroup: 'FW' },
      'Arsenal',
      '',
      ''
    );
    // Born September 5, 2001 => 25 in October 2026
    expect(saka.age).toBe(25);
  });
});
