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

  it('computes realistic Sofascore-style match ratings with context boosts', () => {
    const base = getPlayerMatchRating({ name: 'Viktor Gyökeres' });
    expect(base.rating).toBeGreaterThanOrEqual(5.8);
    expect(base.rating).toBeLessThanOrEqual(9.7);

    // Goal scorer should receive higher rating
    const scorer = getPlayerMatchRating(
      { name: 'Viktor Gyökeres' },
      { goalScorers: ['Viktor Gyökeres'], homeScore: 2, awayScore: 0, isHome: true }
    );
    expect(scorer.rating).toBeGreaterThan(base.rating);

    // Player with yellow card receives rating adjustment
    const carded = getPlayerMatchRating(
      { name: 'Viktor Gyökeres' },
      { yellowCards: ['Viktor Gyökeres'] }
    );
    expect(carded.rating).toBeLessThan(base.rating);
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
