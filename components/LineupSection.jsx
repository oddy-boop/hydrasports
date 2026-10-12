'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

function rosterPlayers(roster) {
  return roster?.roster || roster?.athletes || [];
}

function playerName(entry) {
  const athlete = entry.athlete || entry;
  return athlete.displayName || athlete.fullName || 'Unknown player';
}

function playerImage(entry) {
  const athlete = entry.athlete || entry;
  return athlete.jerseyImages?.find(image => image.rel?.includes('default'))?.href
    || athlete.jerseyImages?.[0]?.href
    || '';
}

function statusBadges(entry) {
  const badges = [];
  if (entry.subbedIn) badges.push(['IN', 'bg-emerald-100 text-emerald-800 border border-emerald-300']);
  if (entry.subbedOut) badges.push(['OUT', 'bg-rose-100 text-rose-800 border border-rose-300']);
  const stats = entry.stats || [];
  if (stats.some(stat => stat.name === 'redCards' && Number(stat.value) > 0)) badges.push(['RED', 'bg-red-100 text-red-800 border border-red-300']);
  else if (stats.some(stat => stat.name === 'yellowCards' && Number(stat.value) > 0)) badges.push(['YELLOW', 'bg-amber-100 text-amber-800 border border-amber-300']);
  return badges;
}

function PlayerList({ players, emptyLabel }) {
  if (!players.length) {
    return <p className="text-xs text-slate-400 italic py-2">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-1.5">
      {players.map((entry, index) => {
        const athlete = entry.athlete || entry;
        return (
          <div key={athlete.id || `${athlete.displayName}-${index}`} className="flex items-center gap-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 px-3 py-2 transition-colors">
            {playerImage(entry) ? (
              <img
                src={playerImage(entry)}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full bg-white object-contain border border-slate-200"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="w-6 shrink-0 text-center text-[10px] font-black text-slate-500">
                {entry.jersey || '—'}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">
              {playerName(entry)}
            </span>
            {entry.position?.abbreviation && (
              <span className="text-[10px] font-extrabold uppercase text-slate-400">{entry.position.abbreviation}</span>
            )}
            {statusBadges(entry).map(([label, className]) => (
              <span key={label} className={`rounded px-1.5 py-0.5 text-[9px] font-black ${className}`}>{label}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function formationGroups(team) {
  const starters = team.starters;
  const formation = (team.formation || '').split('-').map(Number);
  if (formation.length < 2 || formation.some(Number.isNaN)) return [starters];

  const goalkeeper = starters.filter(player => /goalkeeper/i.test(player.position?.displayName || ''));
  const defenders = starters.filter(player => /defender|back/i.test(player.position?.displayName || ''));
  const midfielders = starters.filter(player => /midfielder/i.test(player.position?.displayName || ''));
  const forwards = starters.filter(player => /forward|striker|winger/i.test(player.position?.displayName || ''));
  const groups = [goalkeeper, defenders];
  let remainingMidfielders = [...midfielders];

  formation.slice(1, -1).forEach(lineSize => {
    const attacking = remainingMidfielders.filter(player => /attacking/i.test(player.position?.displayName || ''));
    const regular = remainingMidfielders.filter(player => !/attacking/i.test(player.position?.displayName || ''));
    const preferred = lineSize >= 3 && attacking.length >= lineSize ? attacking : regular.length >= lineSize ? regular : [...regular, ...attacking];
    const line = preferred.slice(0, lineSize);
    groups.push(line);
    const used = new Set(line);
    remainingMidfielders = remainingMidfielders.filter(player => !used.has(player));
  });

  const finalLine = [...remainingMidfielders, ...forwards].slice(0, formation[formation.length - 1]);
  if (finalLine.length) groups.push(finalLine);
  return groups.filter(group => group.length);
}

function FormationPitch({ team }) {
  const groups = formationGroups(team);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-600 bg-gradient-to-b from-emerald-800 to-emerald-900 p-3 shadow-inner">
      <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/30">
        <div className="absolute left-1/2 top-0 h-full border-l border-white/30" />
        <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
        <div className="absolute left-[20%] right-[20%] top-0 h-[22%] border-x border-b border-white/30" />
        <div className="absolute left-[35%] right-[35%] top-0 h-[9%] border-x border-b border-white/30" />
        <div className="absolute left-[44%] right-[44%] -top-1 h-1 border-x border-b border-white/50 bg-white/20" />
      </div>
      <div className="relative grid min-h-[280px] grid-rows-[repeat(4,1fr)] items-center gap-2 py-3">
        {groups.map((group, rowIndex) => (
          <div key={rowIndex} className="flex justify-around gap-1">
            {group.map((player, index) => (
              <div key={`${playerName(player)}-${index}`} className="flex max-w-[80px] flex-col items-center text-center">
                {playerImage(player) ? (
                  <img
                    src={playerImage(player)}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-white bg-slate-900 object-contain shadow-md"
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-700 text-[10px] font-black text-white shadow-md">
                    {player.jersey || '—'}
                  </span>
                )}
                <span className="mt-1 truncate text-[9.5px] font-extrabold text-white drop-shadow-sm">{playerName(player)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LineupSection({ rosters, homeTeam, awayTeam, sport = 'football' }) {
  const [open, setOpen] = useState(true);
  if (!Array.isArray(rosters) || !rosters.length) return null;

  const teams = rosters.slice(0, 2).map((roster, index) => {
    const players = rosterPlayers(roster);
    return {
      name: roster.team?.displayName || (index === 0 ? homeTeam?.name : awayTeam?.name) || 'Team',
      formation: roster.formation || '',
      starters: players.filter(player => player.starter),
      substitutes: players.filter(player => !player.starter),
    };
  });

  if (!teams.some(team => team.starters.length || team.substitutes.length)) return null;

  return (
    <section className="rounded-[24px] border border-slate-200/90 bg-white/95 overflow-hidden shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-b border-slate-100 px-6 py-4 text-sm font-black text-slate-800 transition-colors hover:text-emerald-700"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
            <Users className="h-4 w-4 text-emerald-600" />
          </span>
          <span>Official Match Lineups</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          {teams.map(team => (
            <div key={team.name} className="space-y-4">
              <h3 className="border-b border-slate-100 pb-2.5 text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
                <span>{team.name}</span>
                {sport === 'football' && (
                  <span className="text-emerald-600 font-extrabold">{team.formation || 'Formation unavailable'}</span>
                )}
              </h3>
              {sport === 'football' && <FormationPitch team={team} />}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  {sport === 'football' ? 'Starting XI' : 'Players'}
                </p>
                <PlayerList players={team.starters.length ? team.starters : team.substitutes} emptyLabel="Player data unavailable" />
              </div>
              {sport === 'football' && (
                <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Substitutes</p>
                <PlayerList players={team.substitutes} emptyLabel="Substitutes unavailable" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
