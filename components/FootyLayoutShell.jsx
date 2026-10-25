'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import FootySidebar from './HydraSidebar';
import FootyTopbar from './HydraTopbar';
import HydraSportsActivityRail from './FriendsActivityRail';
import AdBanner from './AdBanner';
import StickyAdFooter from './StickyAdFooter';
import AntiAdblockNotice from './AntiAdblockNotice';

export default function FootyLayoutShell({ children }) {
  const pathname = usePathname() || '/';

  // Watch Match Page & Multi-stream page take the FULL UI!
  // No sidebar, no right activity rail.
  const isFullScreenView = pathname.startsWith('/watch/') || pathname === '/multistream';

  if (isFullScreenView) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#0d0c15] text-white flex flex-col pb-32">
        {children}
        <StickyAdFooter />
      </div>
    );
  }

  // Dashboard pages (home `/`, `/schedule`, `/multistream`, etc.) get the 3-column platform layout
  return (
    <>
      <AntiAdblockNotice />
      <FootyTopbar />
      <div className="reference-canvas pb-32">
        {/* Left Football Sidebar */}
        <FootySidebar />

        {/* Main Center Column */}
        <div className="dashboard-column">
          {/* Main Content + Right Live Activity Rail */}
          <div className="dashboard-main flex-col lg:flex-row">
            <main className="dashboard-content">
              <AdBanner slot="header" />
              {children}
            </main>
            <HydraSportsActivityRail />
          </div>
        </div>
      </div>
      <StickyAdFooter />
    </>
  );
}
