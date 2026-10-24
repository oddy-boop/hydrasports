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
});
