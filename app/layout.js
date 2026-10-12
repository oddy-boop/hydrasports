import './globals.css';
import { HydraProvider } from '@/components/HydraContext';
import { MiniPlayerProvider } from '@/components/MiniPlayerProvider';
import FootyLayoutShell from '@/components/FootyLayoutShell';

export const metadata = {
  title: 'HydraSports — Live Sports & Football Streaming Platform',
  description: 'Watch live football streams with real-time match scores, lineups, stats, and multi-view on HydraSports.',
};

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="light" />
        <meta name="theme-color" content="#10b981" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            document.documentElement.classList.remove('dark');
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
      <body className="app-shell" suppressHydrationWarning>
        <HydraProvider>
          <MiniPlayerProvider>
            <FootyLayoutShell>
              {children}
            </FootyLayoutShell>
          </MiniPlayerProvider>
        </HydraProvider>
      </body>
    </html>
  );
}
