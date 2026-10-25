import { describe, it, expect } from 'vitest';
import { resolveLeagueSlug, LEAGUE_DISPLAY_NAMES, getStandingsForLeague } from './standingsProvider';

describe('standingsProvider', () => {
  it('correctly maps all supported league variants to proper slugs', () => {
    expect(resolveLeagueSlug('Ligue 1')).toBe('fra.1');
    expect(resolveLeagueSlug('Ligue 1 (FRA)')).toBe('fra.1');
    expect(resolveLeagueSlug('french ligue 1')).toBe('fra.1');
    expect(resolveLeagueSlug('Premier League')).toBe('eng.1');
    expect(resolveLeagueSlug('Premier League (ENG)')).toBe('eng.1');
    expect(resolveLeagueSlug('La Liga')).toBe('esp.1');
    expect(resolveLeagueSlug('La Liga (ESP)')).toBe('esp.1');
    expect(resolveLeagueSlug('Serie A')).toBe('ita.1');
    expect(resolveLeagueSlug('Serie A (ITA)')).toBe('ita.1');
    expect(resolveLeagueSlug('Bundesliga')).toBe('ger.1');
    expect(resolveLeagueSlug('Bundesliga (GER)')).toBe('ger.1');
    expect(resolveLeagueSlug('Champions League')).toBe('uefa.champions');
  });

  it('returns null for unknown leagues without defaulting to Serie A', () => {
    expect(resolveLeagueSlug('Nonexistent League 99')).toBeNull();
    expect(resolveLeagueSlug('')).toBeNull();
  });

  it('handles unknown leagues gracefully by returning empty entries and original league name', async () => {
    const res = await getStandingsForLeague('Unknown League XYZ', '2026');
    expect(res.leagueName).toBe('Unknown League XYZ');
    expect(res.entries).toEqual([]);
  });

  it('has valid display names for all known league slugs', () => {
    expect(LEAGUE_DISPLAY_NAMES['fra.1']).toBe('Ligue 1');
    expect(LEAGUE_DISPLAY_NAMES['esp.1']).toBe('La Liga');
    expect(LEAGUE_DISPLAY_NAMES['eng.1']).toBe('Premier League');
    expect(LEAGUE_DISPLAY_NAMES['ita.1']).toBe('Serie A');
    expect(LEAGUE_DISPLAY_NAMES['ger.1']).toBe('Bundesliga');
  });
});
