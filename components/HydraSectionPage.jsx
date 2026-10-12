'use client';

import HydraSportsSection from './HydraLiveSection';

export default function HydraSectionPage({ matches = [], section, teamName }) {
  return (
    <div>
      <HydraSportsSection matches={matches} teamFilter={teamName} />
    </div>
  );
}
