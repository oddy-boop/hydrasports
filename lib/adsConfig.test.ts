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

  it('should define socialBar configuration', () => {
    expect(adsConfig.socialBar).toBeDefined();
    expect(adsConfig.socialBar.enabled).toBe(true);
    expect(typeof adsConfig.socialBar.scriptSrc).toBe('string');
    expect(adsConfig.socialBar.scriptSrc).toContain('czernik.org');
  });

  it('should define directLink configuration with anti-adblock mirror', () => {
    expect(adsConfig.directLink).toBeDefined();
    expect(adsConfig.directLink.enabled).toBe(true);
    expect(adsConfig.directLink.url).toContain('dozenfourteen.com');
    expect(adsConfig.directLink.monetagUrl).toContain('uplcm.com');
  });

  it('should define monetag configuration', () => {
    expect(adsConfig.monetag).toBeDefined();
    expect(adsConfig.monetag.enabled).toBe(true);
    expect(adsConfig.monetag.scriptSrc).toContain('quge5.com');
    expect(adsConfig.monetag.zone).toBe('301930');
  });

  it('should define overlayGateway configuration', () => {
    expect(adsConfig.overlayGateway).toBeDefined();
    expect(typeof adsConfig.overlayGateway.enabled).toBe('boolean');
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
