'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Calendar, ChevronDown, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('Select your gender');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in email and password.');
      return;
    }

    if (isSignUp) {
      if (!name) {
        setError('Please enter your name.');
        return;
      }
      signup({ name, email, gender, password });
    } else {
      login({ email, password });
    }

    router.push('/');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Stadium & Football Ball */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 75% 50%, rgba(10, 15, 30, 0.4) 0%, rgba(3, 4, 10, 0.92) 80%), url('/images/football/hero_ball.png')`,
        }}
      />
      
      {/* Stadium Floodlights & Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container - Responsive Dual Column */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto min-h-[640px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-between">
        
        {/* Left Column: Brand & Hero Value Proposition */}
        <div className="lg:col-span-6 flex flex-col justify-between py-6 lg:py-12 space-y-12">
          {/* Top Logo */}
          <Link href="/" className="inline-flex items-center gap-2 group w-fit">
            <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold tracking-wider text-sm uppercase">HydraSports ID</span>
          </Link>

          {/* Hero Headline and description matching Image 2 */}
          <div className="space-y-5 max-w-lg">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
              Register and watch free
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-md">
              Watch live matches worldwide, revisit legendary FIFA World Cup™ moments, and enjoy more content completely free.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            <span>Official HydraSports Platform &copy; 2026. All rights reserved.</span>
          </div>
        </div>

        {/* Right Column: Signature Futuristic Chamfered Polygon Glass Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end relative">
          
          {/* Decorative geometric notched tabs on outer card edge */}
          <div className="hidden sm:flex flex-col gap-3 absolute -left-4 top-1/4 z-0 pointer-events-none opacity-80">
            <div className="w-2.5 h-7 rounded-sm border border-white/20 bg-white/5 backdrop-blur-md transform -skew-y-12" />
            <div className="w-2.5 h-7 rounded-sm border border-white/20 bg-white/5 backdrop-blur-md transform -skew-y-12" />
            <div className="w-2.5 h-7 rounded-sm border border-white/20 bg-white/5 backdrop-blur-md transform -skew-y-12" />
          </div>

          <div className="hidden sm:flex flex-col gap-3 absolute -right-4 bottom-1/4 z-0 pointer-events-none opacity-80">
            <div className="w-2.5 h-7 rounded-sm border border-white/20 bg-white/5 backdrop-blur-md transform skew-y-12" />
            <div className="w-2.5 h-7 rounded-sm border border-white/20 bg-white/5 backdrop-blur-md transform skew-y-12" />
            <div className="w-2.5 h-7 rounded-sm border border-white/20 bg-white/5 backdrop-blur-md transform skew-y-12" />
          </div>

          {/* Chamfered Card */}
          <div 
            className="w-full max-w-[460px] p-8 sm:p-10 rounded-[32px] border border-white/20 bg-white/[0.08] backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] relative z-10 transition-all duration-300"
            style={{
              clipPath: 'polygon(12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%, 0% 12%)',
            }}
          >
            {/* Inner Brand Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-black tracking-widest text-white/90 uppercase">HydraSports ID</span>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {isSignUp ? 'Sign up' : 'Sign in'}
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 font-medium">
                {isSignUp 
                  ? 'Join free for live matches and World Cup™ moments.'
                  : 'Welcome back! Sign in to continue watching.'
                }
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 ml-1">Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full h-11 px-4 rounded-xl bg-white/[0.08] border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all backdrop-blur-md"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.08] border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.08] border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all backdrop-blur-md"
                  />
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 ml-1">Gender</label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-11 px-4 pr-10 rounded-xl bg-white/[0.08] border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all appearance-none cursor-pointer backdrop-blur-md"
                    >
                      <option value="Male" className="bg-[#121420] text-white">Male</option>
                      <option value="Female" className="bg-[#121420] text-white">Female</option>
                      <option value="Other" className="bg-[#121420] text-white">Prefer not to say</option>
                    </select>
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Action Button - Vibrant Blue Pill from Image 2 */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full h-12 rounded-full bg-[#1964f7] hover:bg-[#1554d4] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_8px_24px_rgba(25,100,247,0.4)] cursor-pointer"
                >
                  {isSignUp ? 'Continue' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Toggle link */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {isSignUp ? (
                  <>Already have an account? <span className="font-bold text-white underline underline-offset-4">Sign in</span></>
                ) : (
                  <>Don't have an account? <span className="font-bold text-white underline underline-offset-4">Sign up</span></>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
