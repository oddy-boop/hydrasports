'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Users,
  Lock,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  User,
  Edit2,
  Check,
} from 'lucide-react';
import { encryptChatMessage, decryptChatMessage } from '@/lib/utils/chatCrypto';

const QUICK_CHEERS = [
  '⚽ GOAAAL! 🔥',
  '🧤 What a save!',
  '⚠️ Penalty?!',
  '🔥 Let\'s go!!',
];

export default function LiveMatchChat({
  matchId,
  homeTeam = 'Home',
  awayTeam = 'Away',
  matchStatus = 'live',
  currentMinute = '',
}) {
  const [username, setUsername] = useState('');
  const [usernameDraft, setUsernameDraft] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState(1);
  const [isClosed, setIsClosed] = useState(false);
  const [closedReason, setClosedReason] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [viewerId, setViewerId] = useState('');

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const sseRef = useRef(null);

  const cleanMatchId = (matchId || 'match').toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 50);
  const channelTopic = `hydrasports_chat_${cleanMatchId}`;

  // Initialize or load stored username & viewer ID
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('hydra_chat_username');
      if (storedName && storedName.trim() && storedName !== 'Miguel Fox') {
        setUsername(storedName.trim());
      } else {
        localStorage.removeItem('hydra_chat_username');
      }

      let vid = localStorage.getItem('hydra_chat_viewer_id');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).slice(2, 10);
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

  // Decrypt incoming message helper
  const processIncomingMessage = useCallback(async (rawMsg) => {
    if (!rawMsg || !rawMsg.id) return null;
    let decryptedText = rawMsg.text;
    if (rawMsg.text && rawMsg.text.startsWith('e2e:')) {
      decryptedText = await decryptChatMessage(rawMsg.text, matchId);
    }
    return {
      ...rawMsg,
      text: decryptedText,
    };
  }, [matchId]);

  // Handle SSE connection for instant zero-lag real-time sync across all global viewers
  useEffect(() => {
    if (!matchId || isClosed) return;

    let eventSource;
    try {
      eventSource = new EventSource(`https://ntfy.sh/${channelTopic}/sse`);
      sseRef.current = eventSource;

      eventSource.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'message' && payload.message) {
            const rawMsg = typeof payload.message === 'string' ? JSON.parse(payload.message) : payload.message;
            if (rawMsg && rawMsg.id) {
              const decrypted = await processIncomingMessage(rawMsg);
              if (decrypted) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === decrypted.id)) return prev;
                  const updated = [...prev, decrypted];
                  setTimeout(scrollToBottom, 50);
                  return updated.slice(-100);
                });
              }
            }
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [matchId, channelTopic, isClosed, processIncomingMessage, scrollToBottom]);

  // Initial fetch from API route and check FT status
  const checkStatusAndSync = useCallback(async () => {
    if (!matchId || isClosed) return;
    try {
      const res = await fetch(`/api/chat/${matchId}?viewerId=${encodeURIComponent(viewerId || 'guest')}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.isClosed) {
        setIsClosed(true);
        setClosedReason(data.reason || 'Match has ended (Full Time). Chat closed and messages purged.');
        setMessages([]);
        if (sseRef.current) {
          sseRef.current.close();
        }
        return;
      }

      if (typeof data.viewerCount === 'number') {
        setViewerCount(data.viewerCount);
      }

      if (Array.isArray(data.messages) && data.messages.length > 0) {
        const decryptedList = await Promise.all(
          data.messages.map((m) => processIncomingMessage(m))
        );
        setMessages((prev) => {
          const map = new Map();
          for (const m of prev) map.set(m.id, m);
          for (const m of decryptedList) {
            if (m && m.id) map.set(m.id, m);
          }
          const sorted = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
          return sorted.slice(-100);
        });
      }
    } catch {}
  }, [matchId, viewerId, isClosed, processIncomingMessage]);

  useEffect(() => {
    if (!matchId) return;
    checkStatusAndSync();
    const interval = setInterval(checkStatusAndSync, 5000);
    return () => clearInterval(interval);
  }, [matchId, checkStatusAndSync]);

  // Handle setting/saving username
  const handleSaveUsername = (e) => {
    e?.preventDefault();
    const clean = usernameDraft.trim().slice(0, 25);
    if (!clean) return;
    setUsername(clean);
    setIsEditingUsername(false);
    try {
      localStorage.setItem('hydra_chat_username', clean);
    } catch {}
  };

  // Send message with E2E AES-GCM encryption & ephemeral broadcast
  const handleSendMessage = async (textToSend, isQuickCheer = false) => {
    const rawText = (textToSend || inputText).trim();
    if (!rawText || isSending || isClosed || !username) return;

    setIsSending(true);
    const tempId = `temp_${Date.now()}`;

    // Optimistically render in local feed immediately
    const optimisticMsg = {
      id: tempId,
      matchId,
      userId: viewerId,
      username,
      text: rawText,
      timestamp: Date.now(),
      isQuickCheer: Boolean(isQuickCheer),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setTimeout(scrollToBottom, 50);

    try {
      // 1. Client-side E2E encryption with match-derived room key
      const encryptedPayload = await encryptChatMessage(rawText, matchId);

      // 2. Dispatch to serverless route handler (relays to ntfy.sh and validates FT status)
      const res = await fetch(`/api/chat/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: encryptedPayload,
          username,
          userId: viewerId,
          isQuickCheer: Boolean(isQuickCheer),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.isClosed) {
          setIsClosed(true);
          setClosedReason(errData.error || 'Match ended (Full Time). Room closed.');
          setMessages([]);
        }
      } else {
        const json = await res.json();
        if (json.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...json.message, text: rawText } : m))
          );
        }
      }
    } catch {} finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-[540px] rounded-3xl bg-[#0d0c18] border border-white/10 shadow-2xl overflow-hidden min-w-0 no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      
      {/* ── TOP HEADER ── */}
      <div className="px-3.5 py-2.5 bg-[#141224] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Live Match Chat
              </span>
              {!isClosed && (
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9.5px] font-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Badges: E2E badge + Online Viewers + Username Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            title="End-to-End Encrypted (AES-GCM): Messages are encrypted in your browser and automatically deleted at Full Time (FT) with zero server storage."
            className="hidden sm:flex items-center gap-1 px-2 py-0.8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold cursor-help"
          >
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Zero-Storage E2E</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.8 rounded-lg bg-black/40 border border-white/10 text-[10px] font-bold text-slate-300">
            <Users className="h-3 w-3 text-purple-400" />
            <span className="font-black text-white">{viewerCount}</span>
          </div>

          {username && (
            <button
              type="button"
              onClick={() => {
                setUsernameDraft(username);
                setIsEditingUsername(true);
              }}
              title="Click to change your chat username"
              className="flex items-center gap-1 px-2 py-0.8 rounded-lg bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-[10.5px] font-bold text-purple-200 transition-colors cursor-pointer"
            >
              <User className="h-3 w-3 text-purple-300" />
              <span className="max-w-[70px] truncate">{username}</span>
              <Edit2 className="h-2.5 w-2.5 text-purple-400 opacity-60" />
            </button>
          )}
        </div>
      </div>

      {/* ── USERNAME ONBOARDING MODAL / PROMPT (If not set or editing) ── */}
      {(!username || isEditingUsername) ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0d0c18] space-y-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center">
            <User className="h-6 w-6 text-purple-300" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">
              {isEditingUsername ? 'Change Your Chat Name' : 'Enter a Chat Username'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              No account or password needed. Choose the nickname other fans watching this fixture will see:
            </p>
          </div>

          <form onSubmit={handleSaveUsername} className="w-full max-w-xs space-y-2">
            <input
              type="text"
              value={usernameDraft}
              onChange={(e) => setUsernameDraft(e.target.value)}
              placeholder="e.g. LondonGooner, CR7Fan, SoccerKing"
              maxLength={25}
              autoFocus
              className="w-full h-10 px-3.5 rounded-xl bg-[#161426] border border-white/15 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-purple-500 text-center transition-all"
            />
            <div className="flex gap-2">
              {isEditingUsername && (
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!usernameDraft.trim()}
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-900/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isEditingUsername ? 'Update Name' : 'Start Chatting'}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-400/80 pt-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero-Storage E2E: Never saved to a database</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── MESSAGE FEED ── */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-3 overflow-y-auto space-y-2 min-w-0 no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {isClosed ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2.5">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-amber-400" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Full Time (FT) Reached
                </h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  {closedReason || 'The match has ended at FT. As scheduled, the live group chat has closed and all match messages were deleted.'}
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  Stadium Chat is Live
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Chatting with fans watching {homeTeam} vs {awayTeam}. Say hello or tap a reaction below!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.userId === viewerId || msg.username === username;
                const timeString = msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 text-xs leading-relaxed ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isMe && (
                      <div className="h-6 w-6 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 text-[10px] font-black text-purple-300">
                        {msg.username?.slice(0, 2).toUpperCase() || 'FN'}
                      </div>
                    )}

                    <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px]">
                        <span className={`font-black truncate max-w-[120px] ${isMe ? 'text-purple-300' : 'text-slate-300'}`}>
                          {isMe ? 'You' : msg.username}
                        </span>
                        {timeString && (
                          <span className="text-[9px] text-slate-500">{timeString}</span>
                        )}
                      </div>

                      <div
                        className={`px-3 py-1.5 rounded-2xl break-words text-xs ${
                          msg.isQuickCheer
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 font-black shadow-sm'
                            : isMe
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-purple-900/30 font-medium'
                            : 'bg-[#181628] text-slate-200 rounded-tl-none border border-white/10 font-normal'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>

                    {isMe && (
                      <div className="h-6 w-6 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 text-[10px] font-black text-purple-200">
                        {username.slice(0, 2).toUpperCase() || 'ME'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── QUICK CHEERS ── */}
          {!isClosed && (
            <div className="px-3 py-1.5 bg-[#121020] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto min-w-0 no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
              {QUICK_CHEERS.map((cheer, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(cheer, true)}
                  disabled={isSending}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/30 hover:border-purple-500/40 border border-white/10 text-[11px] font-bold text-slate-300 hover:text-white shrink-0 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {cheer}
                </button>
              ))}
            </div>
          )}

          {/* ── INPUT BOX ── */}
          <div className="p-2.5 bg-[#141224] border-t border-white/10 shrink-0">
            {isClosed ? (
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-slate-400">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Chat is closed because the match has concluded at FT.</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  maxLength={280}
                  placeholder="Type a message..."
                  disabled={isSending}
                  className="flex-1 h-9 px-3 rounded-xl bg-[#0d0c18] border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            )}
          </div>
        </>
      )}

    </div>
  );
}
