'use client';

import React, { useEffect } from 'react';
import StreamPlayer from './StreamPlayer';
import { useMiniPlayer } from './MiniPlayerProvider';

export default function WatchMatchPlayer({ matchId, streamUrl, channels, matchTitle, matchStatus }) {
  const { register } = useMiniPlayer();

  useEffect(() => {
    if (register) {
      register({ matchId, streamUrl, channels, matchTitle, matchStatus });
    }
  }, [register, matchId, streamUrl, channels, matchTitle, matchStatus]);

  return (
    <div className="w-full">
      <StreamPlayer
        streamUrl={streamUrl}
        channels={channels}
        matchTitle={matchTitle}
        matchStatus={matchStatus}
      />
    </div>
  );
}
