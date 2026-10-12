'use client';

import { Activity, Bell, ChevronRight, CircleDot, Radio, Trophy } from 'lucide-react';

const activity = [
  { initials: '⚽', name: 'Live centre', detail: 'Scores and match events update automatically', color: 'bg-emerald-100 text-emerald-700' },
  { initials: '▣', name: 'Lineups', detail: 'Formations and player events are ready', color: 'bg-lime-100 text-lime-700' },
  { initials: '▶', name: 'Streams', detail: 'Switch between available servers', color: 'bg-teal-100 text-teal-700' },
];

export default function SportsActivityRail() {
  return (
    <aside className="activity-rail">
      <div className="activity-heading">
        <span>Live activity</span>
        <Bell className="h-4 w-4" />
      </div>
      <div className="activity-status"><span /><strong>All systems online</strong><small>Streaming network active</small></div>
      <div className="activity-list">
        {activity.map((item) => (
          <div key={item.name} className="activity-item">
            <span className={`activity-avatar ${item.color}`}>{item.initials}</span>
            <div className="min-w-0">
              <strong>{item.name}</strong>
              <small>{item.detail}</small>
            </div>
            <ChevronRight className="activity-arrow" />
          </div>
        ))}
      </div>
      <div className="activity-promo">
        <Radio className="h-5 w-5" />
        <strong>Keep the match close</strong>
        <small>Open Multi-view to watch up to four streams together.</small>
        <a href="/multistream">Open Multi-view <ChevronRight className="h-3 w-3" /></a>
      </div>
      <div className="activity-footer"><Activity className="h-3.5 w-3.5" /> Real-time match data</div>
    </aside>
  );
}
