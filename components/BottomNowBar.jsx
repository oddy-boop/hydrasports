'use client';

import { BarChart3, ChevronRight, CirclePlay, Radio, Volume2 } from 'lucide-react';

export default function BottomNowBar() {
  return (
    <div className="now-bar">
      <div className="now-track">
        <span className="now-art"><CirclePlay className="h-5 w-5" /></span>
        <span><strong>Hydra Sport Live Centre</strong><small>Scores · streams · match events</small></span>
      </div>
      <div className="now-controls">
        <BarChart3 className="h-4 w-4" />
        <span className="now-live-dot" />
        <strong>Live updates enabled</strong>
        <span className="now-line"><i /></span>
      </div>
      <div className="now-actions">
        <Volume2 className="h-4 w-4" />
        <a href="/multistream">Open Multi-view <ChevronRight className="h-3 w-3" /></a>
      </div>
    </div>
  );
}
