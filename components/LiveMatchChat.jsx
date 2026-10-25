'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, ShieldAlert, Lock, Sparkles, MessageSquare, Flame } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

const QUICK_CHEERS = [
  '⚽ GOAAAL! 🔥',
  '🧤 What a save!',
  '⚠️ Penalty?!',
  '📺 VAR Check',
  '👏 Let\'s go!!',
  '🥶 Pure class!',
];

export default function LiveMatchChat({
  matchId,
  homeTeam = 'Home',
  awayTeam = 'Away',
  matchStatus = 'live',
  currentMinute = '',
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('neutral'); // 'neutral' | 'home' | 'away'
  const [viewerCount, setViewerCount] = useState(1);
  const [isClosed, setIsClosed] = useState(false);
  const [closedReason, setClosedReason] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [viewerId, setViewerId] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize persistent anonymous viewer ID
  useEffect(() => {
    try {
      let vid = localStorage.getItem('hydra_chat_viewer_id');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem('hydra_chat_viewer_id', vid);
      }
      setViewerId(vid);
    } catch {
      setViewerId('v_' + Math.random().toString(36).slice(2, 8));
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Poll chat messages and presence
  const fetchChat = useCallback(async () => {
    if (!matchId || isClosed) return;
    try {
      const url = `/api/chat/${matchId}?viewerId=${encodeURIComponent(viewerId || 'guest')}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      if (data.isClosed) {
        setIsClosed(true);
        setClosedReason(data.reason || 'Match has reached Full Time (FT). Chat room closed.');
        setMessages([]);
        setViewerCount(0);
        return;
      }

      if (Array.isArray(data.messages)) {
        setMessages(prev => {
          // Only update if changed
          if (prev.length !== data.messages.length || (prev.length > 0 && prev[prev.length - 1]?.id !== data.messages[data.messages.length - 1]?.id)) {
            setTimeout(scrollToBottom, 50);
            return data.messages;
          }
          return prev;
        });
      }

      if (typeof data.viewerCount === 'number') {
        setViewerCount(data.viewerCount);
      }
    } catch {
      // Background retry
    }
  }, [matchId, viewerId, isClosed, scrollToBottom]);

  // Initial fetch and polling interval
  useEffect(() => {
    if (!matchId) return;
    fetchChat();

    const interval = setInterval(fetchChat, 2500);
    return () => clearInterval(interval);
  }, [matchId, fetchChat]);

  // Handle message submission
  const sendMessage = async (textToSend, isQuickCheer = false) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending || isClosed) return;

    setIsSending(true);
    const chosenUsername = user?.name || (selectedTeam === 'home' ? `${homeTeam} Fan` : selectedTeam === 'away' ? `${awayTeam} Fan` : 'Match Fan');

    // Optimistic UI message
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      matchId,
      userId: viewerId,
      username: chosenUsername,
      team: selectedTeam,
      teamName: selectedTeam === 'home' ? homeTeam : selectedTeam === 'away' ? awayTeam : '',
      avatar: user?.avatar || '/images/hydra/avatar_naufal.png',
      text,
      timestamp: Date.now(),
      isQuickCheer,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInputText('');
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/chat/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          username: chosenUsername,
          team: selectedTeam,
          teamName: selectedTeam === 'home' ? homeTeam : selectedTeam === 'away' ? awayTeam : '',
          avatar: user?.avatar || '/images/hydra/avatar_naufal.png',
          userId: viewerId,
          isQuickCheer,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.isClosed) {
          setIsClosed(true);
          setClosedReason(errorData.error || 'Chat room closed.');
          setMessages([]);
        }
      } else {
        const result = await res.json();
        // Replace temp optimistic message with server message
        if (result.message) {
          setMessages(prev => prev.map(m => (m.id === tempId ? result.message : m)));
        }
      }
    } catch {
      // Keep optimistic message or handle silently
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full flex flex-col h-[520px] rounded-3xl bg-[#0f0e1a] border border-white/10 shadow-2xl overflow-hidden min-w-0">
      
      {/* ── HEADER ── */}
      <div className="px-4 py-3 bg-[#161426] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                Stadium Live Chat
              </h3>
              {!isClosed && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {isClosed ? 'Room closed after FT' : `Auto-clears at FT • ${homeTeam} vs ${awayTeam}`}
            </p>
          </div>
        </div>

        {/* Online Fans Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-slate-300 shrink-0">
          <Users className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-[11px] font-black text-white">{viewerCount}</span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">fans</span>
        </div>
      </div>

      {/* ── FAN TEAM SELECTION FLAIR BAR ── */}
      {!isClosed && (
        <div className="px-3 py-2 bg-[#121020] border-b border-white/5 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Rep Your Team:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTeam('home')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer truncate max-w-[110px] ${
                selectedTeam === 'home'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              💙 {homeTeam}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTeam('away')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer truncate max-w-[110px] ${
                selectedTeam === 'away'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              💜 {awayTeam}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTeam('neutral')}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                selectedTeam === 'neutral'
                  ? 'bg-slate-700 text-white border border-slate-500'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              ⚽ Neutral
            </button>
          </div>
        </div>
      )}

      {/* ── MESSAGE STREAM ── */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-3.5 overflow-y-auto space-y-2.5 custom-vertical-scrollbar min-w-0"
      >
        {isClosed ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-400" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Match Concluded (Full Time)
            </h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {closedReason || 'The live stadium broadcast has ended. As scheduled, the live group chat has closed and all match messages were deleted.'}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2.5">
            <div className="h-10 w-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Flame className="h-5 w-5 text-purple-400" />
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold text-white">
              Stadium Chat is Ready
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Chat live with fans watching {homeTeam} vs {awayTeam}. Tap a reaction or type below!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === viewerId;
            const isHome = msg.team === 'home';
            const isAway = msg.team === 'away';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start text-xs leading-relaxed ${
                  isMe ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className="h-7 w-7 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                  <img
                    src={msg.avatar || '/images/hydra/avatar_naufal.png'}
                    alt={msg.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/hydra/avatar_naufal.png';
                    }}
                  />
                </div>

                {/* Message Body */}
                <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-black text-white truncate max-w-[130px]">
                      {msg.username}
                    </span>
                    {msg.teamName && (
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                          isHome
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : isAway
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {msg.teamName}
                      </span>
                    )}
                  </div>

                  <div
                    className={`p-2.5 rounded-2xl break-words ${
                      msg.isQuickCheer
                        ? 'bg-gradient-to-r from-amber-500/20 to-purple-600/30 border border-amber-500/40 text-amber-200 font-extrabold text-xs shadow-md'
                        : isMe
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-purple-900/30'
                        : 'bg-[#1b1930] text-slate-200 rounded-tl-none border border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── QUICK CHEERS BAR ── */}
      {!isClosed && (
        <div className="px-3 py-1.5 bg-[#141224] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-black text-purple-300 shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Quick:</span>
          </span>
          {QUICK_CHEERS.map((cheer, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(cheer, true)}
              disabled={isSending}
              className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-purple-600/30 hover:border-purple-500/50 border border-white/10 text-[10.5px] font-bold text-slate-300 hover:text-white shrink-0 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {cheer}
            </button>
          ))}
        </div>
      )}

      {/* ── INPUT BOX ── */}
      <div className="p-3 bg-[#161426] border-t border-white/10 shrink-0">
        {isClosed ? (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-slate-400">
            <Lock className="h-4 w-4 text-amber-400" />
            <span>Chat is closed because the match has ended at FT.</span>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={280}
              placeholder={`Cheer for ${selectedTeam === 'home' ? homeTeam : selectedTeam === 'away' ? awayTeam : 'the match'}...`}
              disabled={isSending}
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#0f0e1a] border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
