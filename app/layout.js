import './globals.css';
import { HydraProvider } from '@/components/HydraContext';
import { MiniPlayerProvider } from '@/components/MiniPlayerProvider';
import { AuthProvider } from '@/components/AuthContext';
import FootyLayoutShell from '@/components/FootyLayoutShell';

export const metadata = {
  title: 'HydraSports — Live Sports & Football Streaming Platform',
  description: 'Watch live football streams with real-time match scores, lineups, stats, and multi-view on HydraSports.',
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
      </head>
      <body className="app-shell bg-[#12111c] text-white" suppressHydrationWarning>
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
