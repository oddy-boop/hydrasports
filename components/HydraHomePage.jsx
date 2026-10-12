'use client';

import React, { useRef } from 'react';
import FootyHeroBanner from './HydraHeroBanner';
import FootyFeaturedFixtures from './HydraPlaylistGrid';
import HydraSportsSection from './HydraLiveSection';
import { useHydraSports } from './HydraContext';

export default function FootyHomePage({ initialMatches = [] }) {
  const liveSectionRef = useRef(null);

  const scrollToLive = () => {
    if (liveSectionRef.current) {
      liveSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Find top live match or high priority match for the featured hero card
  const topMatch =
    initialMatches.find((m) => m.status === 'live') ||
    initialMatches.find((m) => m.status !== 'finished') ||
    null;

  return (
    <div className="space-y-8">
      {/* 1. Featured Clash Hero Banner */}
      <FootyHeroBanner featuredMatch={topMatch} />

      {/* 2. Trending Fixtures & Top Matches */}
      <FootyFeaturedFixtures matches={initialMatches} onSeeAll={scrollToLive} />

      {/* 3. All Live & Upcoming Fixtures */}
      <div ref={liveSectionRef}>
        <HydraSportsSection matches={initialMatches} />
      </div>
    </div>
  );
}
