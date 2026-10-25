import './globals.css';
import { HydraProvider } from '@/components/HydraContext';
import { MiniPlayerProvider } from '@/components/MiniPlayerProvider';
import { AuthProvider } from '@/components/AuthContext';
import FootyLayoutShell from '@/components/FootyLayoutShell';
import SocialBarAd from '@/components/SocialBarAd';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hydrasports.selamate.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HydraSports — Live Sports & Football Streaming Platform',
    template: '%s | HydraSports',
  },
  description: 'Watch live football, basketball, tennis, and hockey streams with real-time match scores, tactical lineups, player ratings, stats, and multistream arena on HydraSports.',
  keywords: [
    'live sports streaming',
    'live football stream',
    'watch soccer online',
    'live match scores',
    'football lineups',
    'flashscore live ratings',
    'free sports streams',
    'multistream arena',
    'hydrasports',
    'selamate',
  ],
  authors: [{ name: 'HydraSports' }],
  creator: 'HydraSports',
  publisher: 'HydraSports',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HydraSports — Live Sports & Football Streaming Platform',
    description: 'Watch live sports streams with real-time match scores, verified tactical lineups, player ratings, and multistream view on HydraSports.',
    url: siteUrl,
    siteName: 'HydraSports',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HydraSports — Live Sports & Football Streaming Platform',
    description: 'Watch live sports streams with real-time scores, lineups, player ratings, and multistream on HydraSports.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth bg-[#12111c] text-white" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#12111c" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            document.documentElement.classList.add('dark');
            if (
              window.location.hostname === 'localhost' &&
              'serviceWorker' in navigator
            ) {
              navigator.serviceWorker.getRegistrations().then((registrations) => {
                registrations.forEach((registration) => registration.unregister());
              });
            }
          } catch (_) {}
        ` }} />
        {/* Monetag MultiTag (Zone 301930) */}
        <script
          src="https://quge5.com/88/tag.min.js"
          data-zone="301930"
          async
          data-cfasync="false"
        />
      </head>
      <body className="app-shell bg-[#12111c] text-white" suppressHydrationWarning>
        <SocialBarAd />
        <AuthProvider>
          <HydraProvider>
            <MiniPlayerProvider>
              <FootyLayoutShell>
                {children}
              </FootyLayoutShell>
            </MiniPlayerProvider>
          </HydraProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
