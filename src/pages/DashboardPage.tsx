import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Sparkles,
  BookOpen,
  FileText,
  CheckCircle2,
  Video,
  Play,
  Check,
  CalendarDays,
  Mic2,
  FolderOpen,
  Radio,
  Award,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [focusItems, setFocusItems] = useState([true, false, false]);

  const toggleFocus = (index: number) => {
    setFocusItems((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const joinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    navigate(`/room/${encodeURIComponent(roomCode.trim())}`);
  };

  const subjects = [
    ['Country Policy', 'UN Treaties & Foreign Stance', '84%', 'w-[84%] bg-cyan-400', 'text-cyan-300'],
    ['Moderated Caucus', 'Sub-topic Strategy & Points', '65%', 'w-[65%] bg-emerald-400', 'text-emerald-300'],
    ['Resolution Drafting', 'Operative & Preamble Clauses', '40%', 'w-[40%] bg-amber-400', 'text-amber-300'],
    ['Crisis Simulation', 'Directives & Backroom Intel', '25%', 'w-[25%] bg-indigo-400', 'text-indigo-300'],
  ];

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-24 pb-16 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 flex-1 w-full space-y-8">
        {/* Top greeting */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-white/10 pb-6">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Your Delegate Command Center
            </p>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              Welcome back, <span className="text-cyan-300">Delegate</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Prepare your foreign policy stances and Rules of Procedure for the committee floor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/meet"
              className="flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 hover:scale-105"
            >
              <Video className="h-4 w-4" />
              <span>Live Video Meet</span>
            </Link>
            <button
              onClick={() => navigate('/training')}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span>Training</span>
            </button>
            <Link
              to="/committee"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>Live Floor</span>
            </Link>
          </div>
        </div>

        {/* Section 1: Subject Mastery */}
        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <BookOpen className="h-4 w-4 text-cyan-300" />
            <span>Subject Mastery & Syllabus Progress</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map(([subject, detail, progress, bar, color]) => (
              <div
                key={subject}
                className="delegate-panel rounded-2xl p-5 transition hover:-translate-y-1 hover:border-cyan-300/40"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${color}`}>
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className={`rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold ${color}`}>
                    {progress}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base">{subject}</h3>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
                <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${bar}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Syllabus Tracker & Daily Focus Tasks */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Syllabus tracker */}
          <section className="delegate-panel rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <FileText className="h-4 w-4 text-cyan-300" />
                <span>Syllabus Tracker</span>
              </div>

              <div className="space-y-6 border-l-2 border-cyan-400/40 pl-5 ml-2">
                <div className="relative">
                  <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-300 text-slate-950">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <p className="text-sm font-semibold text-white">Country Policy & Treaty Map</p>
                  <p className="mt-0.5 text-xs text-slate-400">Research · Completed</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-cyan-300 bg-slate-950">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  </span>
                  <p className="text-sm font-semibold text-white">Moderated Caucus Formulations</p>
                  <p className="mt-0.5 text-xs text-cyan-300 font-medium">Procedure · In Progress (65%)</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-[65%] rounded-full bg-cyan-300" />
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-950" />
                  <p className="text-sm font-semibold text-slate-300">Draft Resolution Clauses</p>
                  <p className="mt-0.5 text-xs text-slate-500">Negotiation · Up Next</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/training')}
              className="mt-6 w-full rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
            >
              View Full Training Syllabus
            </button>
          </section>

          {/* Daily focus checklist */}
          <section className="delegate-panel rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Daily Focus Tasks</span>
              </div>

              <div className="space-y-3">
                {[
                  'Review foreign policy positions & Arctic treaties',
                  'Practice 90-second GSL speech on floor timer',
                  'Draft 2 operative clauses for maritime security resolution',
                ].map((item, index) => (
                  <label
                    key={item}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                      focusItems[index]
                        ? 'border-emerald-400/30 bg-emerald-400/10'
                        : index === 1
                        ? 'border-cyan-400/30 bg-cyan-400/5'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={focusItems[index]}
                      onChange={() => toggleFocus(index)}
                      className="mt-1 h-4 w-4 rounded accent-cyan-300 cursor-pointer"
                    />
                    <span className="flex-1 text-xs sm:text-sm text-slate-200">
                      <span className={focusItems[index] ? 'line-through opacity-60 text-slate-400' : 'font-medium'}>
                        {item}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        {index === 0
                          ? 'Research complete · Earned +50 Influence'
                          : index === 1
                          ? '+150 Influence · Due Today'
                          : 'Recommended delegate milestone'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-3 text-xs text-cyan-200 flex items-center justify-between">
              <span>Today&apos;s Influence Score</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">+200 pts</span>
            </div>
          </section>
        </div>

        {/* Section 3: Quick Actions */}
        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>Delegate Workspaces</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [Award, 'Motion Practice', '/training'],
              [CalendarDays, 'Conference Planner', '/training'],
              [Mic2, 'Speech Rehearsal', '/committee'],
              [FolderOpen, 'AI Doubt Clarifier', '/ai-doubt-clarifier'],
            ].map(([Icon, label, path]) => {
              const ActionIcon = Icon as typeof Award;
              return (
                <Link
                  key={label as string}
                  to={path as string}
                  className="delegate-panel rounded-2xl p-5 text-center transition hover:border-cyan-300/40 hover:-translate-y-1 flex flex-col items-center justify-center group"
                >
                  <ActionIcon className="mb-2.5 h-6 w-6 text-cyan-300 group-hover:scale-110 transition" />
                  <span className="text-xs sm:text-sm font-semibold text-white">{label as string}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Section 4: Live Committee Room Code Entry */}
        <section className="rounded-3xl border border-cyan-400/30 bg-cyan-950/20 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Direct Room Access
              </p>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                Have a Secretariat Committee Code? Enter the floor.
              </h2>
            </div>

            <form onSubmit={joinSession} className="flex w-full gap-2 sm:w-auto">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="e.g. UNSC-ARCTIC-2026"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-950/80 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none sm:w-64"
              />
              <button
                type="submit"
                className="rounded-xl bg-cyan-300 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-cyan-200 flex items-center gap-1.5"
              >
                <span>Enter</span>
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
