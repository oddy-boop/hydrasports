/**
 * HydraSports Ad & Monetization Configuration
 * 
 * Configure your ad network banners and monetization slots here.
 * Supported networks: Adsterra, Monetag, Google AdSense, PropellerAds, 
 * custom affiliate banners, or direct HTML/JS snippets.
 * 
 * You can also toggle ads globally with the environment variable:
 * NEXT_PUBLIC_ENABLE_ADS=false
 */

export const adsConfig = {
  // Global toggle for all advertisements
  enabled: process.env.NEXT_PUBLIC_ENABLE_ADS !== 'false',

  // Configurable Ad Slots across the platform
  slots: {
    // 1. Top Header Banner (Desktop: 728x90 / Mobile: 320x50)
    // Displayed above main dashboard content
    header: {
      enabled: true,
      title: 'Top Leaderboard (728x90)',
      // Paste your ad code below (HTML, script tags, or iframe snippet):
      // Example for Adsterra/Monetag/AdSense:
      // html: `<script type="text/javascript">atOptions = { ... };</script><script src="//..."></script>`,
      html: '',
      // Or configure an image banner with an affiliate link:
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'Sponsor HydraSports',
      },
    },

    // 2. Match Hub Banner (Directly under live stream player)
    // High-visibility, prime CPM placement on live game watch pages
    matchHub: {
      enabled: true,
      title: 'Stream Sponsor Banner (728x90 / Responsive)',
      html: '',
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'Live Stream Sponsor',
      },
    },

    // 3. Sidebar / Right Activity Rail (Medium Rectangle: 300x250)
    // Positioned below live standings in the desktop activity rail
    sidebar: {
      enabled: true,
      title: 'Sidebar Rectangle (300x250)',
      html: '',
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'HydraSports Sponsor',
      },
    },

    // 4. Homepage In-Content Banner (Between Hero and Match Grid)
    inContent: {
      enabled: true,
      title: 'Feed Banner (728x90 / Responsive)',
      html: '',
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'Sponsor Banner',
      },
    },

    // 5. Sticky Bottom Footer Banner (Floating 728x90 / 320x50 with close button)
    stickyFooter: {
      enabled: true,
      title: 'Sticky Footer Banner (728x90 / 320x50)',
      html: '',
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'Sticky Footer Sponsor',
      },
    },
  },
};
