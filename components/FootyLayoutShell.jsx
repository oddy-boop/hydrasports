'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import FootySidebar from './HydraSidebar';
import FootyTopbar from './HydraTopbar';
import HydraSportsActivityRail from './FriendsActivityRail';

export default function FootyLayoutShell({ children }) {
  const pathname = usePathname() || '/';

  // Watch Match Page & Multi-stream page take the FULL UI!
  // No sidebar, no right activity rail.
  const isFullScreenView = pathname.startsWith('/watch/') || pathname === '/multistream';

  if (isFullScreenView) {
    return (
      <div className="min-h-screen w-full bg-[#0d0c15] text-white flex flex-col">
        {children}
      </div>
    );
  }

  // Dashboard pages (home `/`, `/schedule`, `/multistream`, etc.) get the 3-column platform layout
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
    </>
  );
}
