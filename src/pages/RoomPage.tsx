import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Mic,
  Hand,
  Play,
  Pause,
  RotateCcw,
  Plus,
  ArrowLeft,
  Radio,
  ExternalLink,
  Users,
  Video,
  Clock,
  Trash2,
} from 'lucide-react';

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = id || 'UNSC-2026-X1';

  const [speechTime, setSpeechTime] = useState(90);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isRunning, setIsRunning] = useState(false);

  // Dynamic speaker queue
  const [speakersList, setSpeakersList] = useState<string[]>([
    'French Republic',
    'United States of America',
    'United Kingdom',
    'Federative Republic of Brazil',
  ]);
  const [newCountry, setNewCountry] = useState('');
  const [queueManager, setQueueManager] = useState<'ADMIN' | 'EXECUTIVE_BOARD'>('EXECUTIVE_BOARD');
  const [placardRaised, setPlacardRaised] = useState(false);

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

  const resetTimer = (newTime?: number) => {
    setIsRunning(false);
    setTimeLeft(newTime ?? speechTime);
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

  return (
    <div className="delegate-page min-h-screen text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Session Top Bar */}
      <header className="border-b border-white/10 bg-slate-950/80 px-4 sm:px-8 py-3.5 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900 border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-md">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE</span>
            </span>
            <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300">
              Room: {roomId}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPlacardRaised(!placardRaised)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg ${
              placardRaised
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>{placardRaised ? 'Placard Raised' : 'Raise Placard'}</span>
          </button>
        </div>
      </header>

      {/* Main Committee Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6 items-start">
        {/* Left: Speaker Clock Floor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="delegate-panel rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden text-center">
            <span className="text-[11px] uppercase font-mono tracking-widest text-slate-400 mb-2">
              Current Speaker Floor
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-6 text-center max-w-xl">
              {speakersList[0] || 'General Speakers List Exhausted'}
            </h2>

            <div
              className={`my-2 text-7xl sm:text-8xl font-mono font-black tracking-tight ${
                timeLeft <= 15 && isRunning ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
              }`}
            >
              {formatTime(timeLeft)}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={toggleTimer}
                className="rounded-full bg-cyan-300 p-3.5 text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-200 hover:scale-105"
              >
                {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              <button
                onClick={() => resetTimer()}
                className="p-3.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-full transition"
                title="Reset Timer"
              >
                <RotateCcw className="w-6 h-6" />
              </button>

              <button
                onClick={nextSpeaker}
                disabled={speakersList.length === 0}
                className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-40 text-slate-200 rounded-full text-xs sm:text-sm font-medium transition"
              >
                Yield / Next Speaker
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400 font-medium">Session Status</span>
              <p className="text-sm font-semibold mt-1 text-emerald-400">Formal Debate</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400 font-medium">Active Delegations</span>
              <p className="text-sm font-semibold mt-1 text-white">15 Present</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400 font-medium">Simple Majority</span>
              <p className="text-sm font-semibold mt-1 text-cyan-300">8 Votes</p>
            </div>
          </div>
        </div>

        {/* Right: Real-time Speakers Queue */}
        <div className="delegate-panel rounded-3xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Mic className="h-5 w-5 text-cyan-300" />
              <h3 className="font-semibold text-white text-sm">Speakers List (GSL)</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {speakersList.length} queued
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {speakersList.map((country, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl text-xs sm:text-sm border transition ${
                  idx === 0
                    ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
                    : 'bg-slate-950 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs opacity-50">{idx + 1}.</span>
                  <span>{country}</span>
                </div>
                {idx === 0 ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-300 text-slate-950">
                    On Floor
                  </span>
                ) : (
                  <button
                    onClick={() => removeSpeaker(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={addSpeaker} className="mt-4 space-y-2 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="room-queue-manager" className="text-xs font-semibold text-slate-300">
                Admin / EB queue control
              </label>
              <select
                id="room-queue-manager"
                value={queueManager}
                onChange={(e) => setQueueManager(e.target.value as 'ADMIN' | 'EXECUTIVE_BOARD')}
                className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-slate-300"
              >
                <option value="EXECUTIVE_BOARD">Executive Board</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add Delegation to queue..."
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-300 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-cyan-300 p-2 text-slate-950 transition hover:bg-cyan-200 font-bold"
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
