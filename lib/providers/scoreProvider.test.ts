import { describe, it, expect } from 'vitest';
import { getScoreForMatch } from './scoreProvider';

describe('Champions League Score Provider', () => {
  it('should resolve scores for Champions League match with apostrophe in tournament name', async () => {
    // Manchester United at Como is an event on UEFA Champions League ESPN scoreboard
    const score = await getScoreForMatch(
      'Manchester United vs Como',
      Date.now(),
      "Champion's League",
      undefined,
      'football'
    );
    expect(score).not.toBeNull();
    if (score) {
      expect(typeof score.home).toBe('number');
      expect(typeof score.away).toBe('number');
    }
  }, 20000);

  it('should resolve scores for UEFA Champions League format', async () => {
    const score = await getScoreForMatch(
      'Como vs Manchester United',
      Date.now(),
      'UEFA Champions League',
      undefined,
      'football'
    );
    expect(score).not.toBeNull();
    if (score) {
      expect(score.home).toBe(4);
      expect(score.away).toBe(1);
    }
  }, 20000);
});

describe('Multi-Sport Score Resolution (Basketball, Hockey, Tennis)', () => {
  it('should resolve scores for NBA Basketball match', async () => {
    const score = await getScoreForMatch(
      'Chicago Bulls vs Milwaukee Bucks',
      Date.now(),
      'NBA',
      undefined,
      'basketball'
    );
    expect(score).not.toBeNull();
    if (score) {
      expect(score.home).toBe(132);
      expect(score.away).toBe(125);
    }
  }, 10000);

  it('should resolve scores for NHL Hockey match', async () => {
    const score = await getScoreForMatch(
      'Montreal Canadiens vs Chicago Blackhawks',
      Date.now(),
      'NHL',
      undefined,
      'hockey'
    );
    expect(score).not.toBeNull();
    if (score) {
      expect(score.home).toBe(4);
      expect(score.away).toBe(1);
    }
  }, 10000);

  it('should resolve scores for Tennis match', async () => {
    const score = await getScoreForMatch(
      'Arthur Fils vs Alex Michelsen',
      Date.now(),
      'ATP Tennis',
      undefined,
      'tennis'
    );
    expect(score).not.toBeNull();
    if (score) {
      expect(score.home).toBe(2);
      expect(score.away).toBe(0);
      expect(score.currentMinute).toBeDefined();
    }
  }, 10000);
});
