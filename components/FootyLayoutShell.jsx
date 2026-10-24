'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import FootySidebar from './HydraSidebar';
import FootyTopbar from './HydraTopbar';
import HydraSportsActivityRail from './FriendsActivityRail';
import FootyNowBar from './HydraPlayerBar';

export default function FootyLayoutShell({ children }) {
  const pathname = usePathname() || '/';

  // Watch Match Page & Multi-stream page take the FULL UI!
  // No sidebar, no right activity rail, and no bottom floating player bar.
  const isFullScreenView = pathname.startsWith('/watch/') || pathname === '/multistream' || pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isFullScreenView) {
    return (
      <div className="min-h-screen w-full bg-[#0d0c15] text-white flex flex-col">
        {children}
      </div>
    );
  }

  // Dashboard pages (home `/`, `/api-hub`, etc.) get the 3-column platform layout
  return (
    <>
      <FootyTopbar />
      <div className="reference-canvas">
        {/* Left Football Sidebar */}
        <FootySidebar />

        {/* Main Center Column */}
        <div className="dashboard-column">
          {/* Main Content + Right Live Activity Rail */}
          <div className="dashboard-main">
            <main className="dashboard-content">
              {children}
            </main>
            <HydraSportsActivityRail />
          </div>
        </div>
      </div>

      {/* Bottom Persistent Live Match Stream Controller Bar */}
      <FootyNowBar />
    </>
  );
}
