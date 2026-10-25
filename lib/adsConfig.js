/**
 * HydraSports Ad & Monetization Configuration
 * 
 * Active Adsterra Ad Units for hydrasports.selamate.com
 * Account Approved & Verified
 */

const BANNER_728x90_HTML = `
<script type="text/javascript">
  atOptions = {
    'key' : '4ff35ecf8d3578ef837b3dbd2f59223c',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://czernik.org/22/4ff35ecf8d3578ef837b3dbd2f59223c"></script>
`.trim();

const BANNER_300x250_HTML = `
<script type="text/javascript">
  atOptions = {
    'key' : 'fe0148ae66509c8452fa4828de7e5853',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://czernik.org/22/fe0148ae66509c8452fa4828de7e5853"></script>
`.trim();

export const adsConfig = {
  // Global toggle for all advertisements
  enabled: process.env.NEXT_PUBLIC_ENABLE_ADS !== 'false',

  // Social Bar (Adsterra active unit ID 31908374)
  socialBar: {
    enabled: true,
    scriptSrc: 'https://czernik.org/14/7fc4610a681ea128cf26b24f9e2fd337',
  },

  // DirectLink / Smartlink (High CPA/CPM yield offer)
  directLink: {
    enabled: true,
    // Anti-adblock link (bypasses adblockers)
    url: 'https://dozenfourteen.com/d853dqgqwm?key=3b8039ce2893ac7211917e0c8a9b100c',
    primaryUrl: 'https://www.profitableratecpmnetwork.com/d853dqgqwm?key=3b8039ce2893ac7211917e0c8a9b100c',
  },

  // Screen Overlay Gateway on initial load / refresh
  // Overlays the whole screen at first refresh; 1st click redirects, 2nd click closes
  overlayGateway: {
    enabled: true,
  },

  // Configurable Ad Slots across the platform
  slots: {
    // 1. Top Header Banner (728x90 Leaderboard)
    header: {
      enabled: true,
      title: 'Top Leaderboard (728x90)',
      html: BANNER_728x90_HTML,
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'Sponsor HydraSports',
      },
    },

    // 2. Match Hub Banner (Directly under live stream player)
    matchHub: {
      enabled: true,
      title: 'Stream Sponsor Banner (728x90)',
      html: BANNER_728x90_HTML,
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'Live Stream Sponsor',
      },
    },

    // 3. Sidebar / Right Activity Rail (300x250 Rectangle)
    sidebar: {
      enabled: true,
      title: 'Sidebar Rectangle (300x250)',
      html: BANNER_300x250_HTML,
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'HydraSports Sponsor',
      },
    },

    // 4. Homepage In-Content Banner (Between Hero and Match Grid)
    inContent: {
      enabled: true,
      title: 'Feed Banner (728x90)',
      html: BANNER_728x90_HTML,
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'Sponsor Banner',
      },
    },

    // 5. Sticky Bottom Footer Banner (Floating 728x90 with close button)
    stickyFooter: {
      enabled: true,
      title: 'Sticky Footer Banner (728x90)',
      html: BANNER_728x90_HTML,
      imageBanner: {
        imageUrl: '',
        linkUrl: '',
        alt: 'Sticky Footer Sponsor',
      },
    },
  },
};
