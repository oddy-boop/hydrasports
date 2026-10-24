# 💰 HydraSports Monetization & Ad Integration Guide

HydraSports includes a high-converting, modular ad placement system designed to let you monetize your traffic and earn revenue through banner networks, affiliate sponsorships, and ad scripts.

---

## 📍 Configured Ad Slots

| Slot Name | Position | Recommended Size | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **`header`** | Top of Dashboard Pages | 728 × 90 (Leaderboard) / 320 × 50 (Mobile) | High-impression top brand placement |
| **`matchHub`** | Directly under Live Stream Player | 728 × 90 / Responsive | **Highest CPM / Engagement** (viewers stay on this page for 90+ mins) |
| **`sidebar`** | Right Activity Rail (under Standings) | 300 × 250 (Medium Rectangle) | Persistent sidebar display on desktop |
| **`inContent`** | Homepage Feed (under Hero Banner) | 728 × 90 / Responsive | High CTR on incoming visitors |
| **`stickyFooter`** | Floating bottom bar with close button | 728 × 90 / 320 × 50 | Sticky visibility across all pages |

---

## 🚀 Recommended Ad Networks for Sports Streaming Sites

Traditional networks like Google AdSense sometimes have strict policies regarding live sports embeds. The following ad networks are standard, instant-approval industry leaders for sports streaming and scores websites:

1. **[Adsterra](https://adsterra.com/)** *(Highly Recommended)*:
   - Instant approval with no traffic minimums.
   - Formats: 728x90 banners, 300x250 banners, Social Bar, Direct Links.
   - Payouts via PayPal, Bitcoin, Tether (USDT), Wire, WebMoney (bi-weekly).

2. **[Monetag](https://monetag.com/)** (by PropellerAds):
   - Fast approval for worldwide sports audiences.
   - Formats: Banner tags, In-Page Push, MultiTag, Popunder.
   - High fill rates for sports traffic.

3. **[HilltopAds](https://hilltopads.com/)**:
   - Specialized in video and sports traffic.
   - Clean ad quality with CPM/CPC monetization.

4. **[Google AdSense](https://adsense.google.com/)**:
   - Works best if your domain is approved as a sports scores & schedules publisher.

5. **Sports Betting / Affiliate Programs**:
   - Bet365, 1xBet, Stake, Betway affiliates.
   - You can place clickable image banners with your personal referral link to earn high CPA commissions.

---

## 🛠️ How to Add Your Ad Network Codes

All ad settings are centrally managed in:
👉 [`lib/adsConfig.js`](file:///home/oddy/Desktop/HydraSports/lib/adsConfig.js)

### Option A: Using Network Banner Scripts (Adsterra / Monetag / AdSense)

When your ad network generates a banner code snippet (e.g. 728x90 or 300x250), copy the code and paste it inside the `html` field of the matching slot:

```javascript
// Example in lib/adsConfig.js
matchHub: {
  enabled: true,
  title: 'Stream Sponsor Banner',
  html: `
    <script type="text/javascript">
      atOptions = {
        'key' : 'YOUR_ADSTERRA_KEY_HERE',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="//www.topcreativeformat.com/YOUR_ADSTERRA_KEY_HERE/invoke.js"></script>
  `,
},
```

### Option B: Using an Affiliate Image Banner with a Referral Link

If you have an affiliate banner (e.g. Stake, Bet365, or a sponsor) with an image:

```javascript
sidebar: {
  enabled: true,
  title: 'Sidebar Rectangle (300x250)',
  html: '',
  imageBanner: {
    imageUrl: 'https://your-sponsor-image-url.jpg',
    linkUrl: 'https://your-affiliate-referral-link.com',
    alt: 'Join Bet365 with bonus code HYDRA',
  },
},
```

---

## ⚙️ Environment Variables

You can disable all advertisements across the platform at any time (e.g., during testing or for VIP users) by adding this to your `.env.local`:

```bash
NEXT_PUBLIC_ENABLE_ADS=false
```

To re-enable ads, change it to `true` or remove the line (ads are enabled by default).
