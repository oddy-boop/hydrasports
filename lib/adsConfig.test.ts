import { describe, it, expect } from 'vitest';
import { adsConfig } from './adsConfig';

describe('adsConfig', () => {
  it('should have global ads toggle enabled by default', () => {
    expect(adsConfig.enabled).toBe(true);
  });

  it('should define all standard monetization slots', () => {
    expect(adsConfig.slots).toBeDefined();
    expect(adsConfig.slots.header).toBeDefined();
    expect(adsConfig.slots.matchHub).toBeDefined();
    expect(adsConfig.slots.sidebar).toBeDefined();
    expect(adsConfig.slots.inContent).toBeDefined();
    expect(adsConfig.slots.stickyFooter).toBeDefined();
  });

  it('should have enabled slots with required configuration keys', () => {
    const slots = ['header', 'matchHub', 'sidebar', 'inContent', 'stickyFooter'] as const;
    for (const slotKey of slots) {
      const slot = adsConfig.slots[slotKey];
      expect(slot.enabled).toBe(true);
      expect(typeof slot.html).toBe('string');
      expect(slot.imageBanner).toBeDefined();
      expect(typeof slot.imageBanner.imageUrl).toBe('string');
      expect(typeof slot.imageBanner.linkUrl).toBe('string');
    }
  });
});
