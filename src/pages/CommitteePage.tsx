import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Hand,
  Play,
  Pause,
  RotateCcw,
  Plus,
  ArrowLeft,
  Users,
  Shield,
  Volume2,
  Trash2,
  Radio,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function CommitteePage() {
  const [speechTime, setSpeechTime] = useState(90);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isRunning, setIsRunning] = useState(false);

  // Dynamic speaker queue
  const [speakersList, setSpeakersList] = useState<string[]>([
    'United States of America',
    'French Republic',
    'United Kingdom of Great Britain and Northern Ireland',
    'People\'s Republic of China',
    'Federal Republic of Germany',
    'Federative Republic of Brazil',
  ]);
  const [newCountry, setNewCountry] = useState('');
  const [queueManager, setQueueManager] = useState<'ADMIN' | 'EXECUTIVE_BOARD'>('EXECUTIVE_BOARD');
  const [placardRaised, setPlacardRaised] = useState(false);
  const [activeMotion, setActiveMotion] = useState('General Speakers List');
  const [quorumCount, setQuorumCount] = useState(15);

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = (newDuration?: number) => {
    setIsRunning(false);
    const target = newDuration ?? speechTime;
    setTimeLeft(target);
  };

  const setPresetDuration = (secs: number) => {
    setSpeechTime(secs);
    resetTimer(secs);
  };

  const nextSpeaker = () => {
    setSpeakersList((prev) => prev.slice(1));
    resetTimer();
  };

  const removeSpeaker = (index: number) => {
    setSpeakersList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addSpeaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountry.trim()) return;
    setSpeakersList([...speakersList, newCountry.trim()]);
    setNewCountry('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const simpleMajority = Math.floor(quorumCount / 2) + 1;
  const twoThirdsMajority = Math.ceil((quorumCount * 2) / 3);

  return (
    <div className="delegate-page min-h-screen text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Floor Bar */}
      <header className="border-b border-white/10 bg-slate-950/80 px-4 sm:px-8 py-3.5 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            to="/"
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900 border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-md">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>LIVE FLOOR</span>
            </span>
            <div className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
              UNSC-2026
            </div>
          </div>
          <h1 className="font-bold text-sm sm:text-base text-white hidden sm:block">
            UN Security Council: Arctic Sovereignty & Polar Navigation
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPlacardRaised(!placardRaised)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg ${
              placardRaised
                ? 'bg-amber-400 text-slate-950 shadow-amber-400/20 ring-2 ring-amber-300 scale-105'
                : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Hand className={`w-4 h-4 ${placardRaised ? 'animate-bounce' : ''}`} />
            <span>{placardRaised ? 'Placard Raised (Recognized)' : 'Raise Placard'}</span>
          </button>
        </div>
      </header>

      {/* Main Committee Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6 items-start">
        {/* Left 2 Cols: Speaker Clock & Floor Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main GSL Clock Container */}
          <div className="delegate-panel rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden text-center">
            {/* Top status indicator */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] uppercase font-mono tracking-widest text-slate-400">
                Current Speaker on Floor
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-6 max-w-xl">
              {speakersList[0] || 'General Speakers List Exhausted'}
            </h2>

            {/* Big Countdown Timer */}
            <div
              className={`my-2 text-7xl sm:text-8xl font-mono font-black tracking-tight transition duration-300 ${
                timeLeft <= 10 && isRunning
                  ? 'text-rose-400 animate-pulse'
                  : timeLeft <= 30
                  ? 'text-amber-300'
                  : 'text-cyan-300'
              }`}
            >
              {formatTime(timeLeft)}
            </div>

            {/* Time presets */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Presets:
              </span>
              {[60, 90, 120].map((t) => (
                <button
                  key={t}
                  onClick={() => setPresetDuration(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                    speechTime === t
                      ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>

            {/* Clock control buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
              <button
                onClick={toggleTimer}
                className="flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-200 hover:scale-105 active:scale-95"
              >
                {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isRunning ? 'Pause Floor' : 'Start Speech'}</span>
              </button>

              <button
                onClick={() => resetTimer()}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full border border-slate-700 transition"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={nextSpeaker}
                disabled={speakersList.length === 0}
                className="px-6 py-3.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-40 text-slate-200 rounded-full text-xs sm:text-sm font-semibold transition hover:border-cyan-400/30"
              >
                Yield Floor / Next Speaker
              </button>
            </div>
          </div>

          {/* Committee Stats Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-medium">Active Motion</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-semibold">
                  Formal
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-2">{activeMotion}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-medium">Active Quorum</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                  Present & Voting
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-2">{quorumCount} Delegations</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-medium">Voting Thresholds</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold">
                  UNSC Rules
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-2">
                Simple: {simpleMajority} · 2/3: {twoThirdsMajority}
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Real-time Speakers Queue (GSL) */}
        <div className="delegate-panel rounded-3xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-300">
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Speakers List (GSL)</h3>
                <p className="text-[11px] text-slate-400">Formal debate queue</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 font-mono font-bold">
              {speakersList.length} Queued
            </span>
          </div>

          {/* Speakers Queue List */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {speakersList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                The speakers list is currently empty.
              </div>
            ) : (
              speakersList.map((country, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs sm:text-sm border transition ${
                    idx === 0
                      ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <span className="font-mono text-xs text-slate-500 shrink-0">{idx + 1}.</span>
                    <span className="truncate font-medium">{country}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {idx === 0 ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-300 text-slate-950">
                        On Floor
                      </span>
                    ) : (
                      <button
                        onClick={() => removeSpeaker(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add delegation form */}
          <form onSubmit={addSpeaker} className="mt-4 space-y-2.5 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="committee-queue-manager" className="text-xs font-semibold text-slate-300">
                Queue Management Authority
              </label>
              <select
                id="committee-queue-manager"
                value={queueManager}
                onChange={(e) => setQueueManager(e.target.value as 'ADMIN' | 'EXECUTIVE_BOARD')}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 outline-none"
              >
                <option value="EXECUTIVE_BOARD">Executive Board (Chair)</option>
                <option value="ADMIN">Secretariat Admin</option>
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter country name (e.g. Japan, Germany)..."
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-cyan-300 px-3.5 py-2.5 text-slate-950 font-bold transition hover:bg-cyan-200"
                title="Add to queue"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
