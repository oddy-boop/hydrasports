import { describe, expect, it } from 'vitest';
import { normalizeSport } from './leagueMatcher';

describe('normalizeSport', () => {
  it('normalizes wrestling labels for sport filtering', () => {
    expect(normalizeSport('Wrestling')).toBe('wrestling');
    expect(normalizeSport('Pro Wrestling')).toBe('wrestling');
  });
});
