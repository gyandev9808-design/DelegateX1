import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  Award,
  Users,
  Calendar,
  Mail,
  Settings,
  FileCheck,
  Search,
  Bell,
  BookOpen,
  LogIn,
  Sliders,
  Check,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminAreaTitles: Record<string, { title: string; desc: string; icon: any }> = {
  search: {
    title: 'Secretariat Global Search',
    desc: 'Search conference archives, submitted working papers, and registered delegates.',
    icon: Search,
  },
  notifications: {
    title: 'Secretariat Alerts & Dispatches',
    desc: 'Live committee feeds, motion requests, and emergency Dais communications.',
    icon: Bell,
  },
  awards: {
    title: 'Committee Awards & Certificates',
    desc: 'Grade delegate performances, calculate GSL speech scores, and assign Best Delegate, High Commendation, and Special Mention certificates.',
    icon: Award,
  },
  'roll-call': {
    title: 'Quorum & Roll Call Manager',
    desc: 'Record present vs. present & voting delegations. Calculate two-thirds and simple majority voting thresholds dynamically.',
    icon: Calendar,
  },
  delegates: {
    title: 'Registered Delegate Directory (120)',
    desc: 'Manage credentials, country allocations, committee assignments, and attendance logs.',
    icon: Users,
  },
  committees: {
    title: 'Active Committees & Agendas (6)',
    desc: 'UNSC, UNHRC, DISEC, UNEP, Crisis Simulation, and General Assembly Plenary settings.',
    icon: Settings,
  },
  broadcasts: {
    title: 'Broadcast SMS & Emergency Circulars',
    desc: 'Send real-time alerts to delegates and chairs regarding crisis updates, schedule adjustments, or draft resolution deadlines.',
    icon: Mail,
  },
  'rop-config': {
    title: 'Rules of Procedure Configuration',
    desc: 'Configure committee debate standards: THIMUN, UN4MUN, Harvard MUN, or custom Secretariat rules.',
    icon: Settings,
  },
  circulars: {
    title: 'Official Conference Circulars',
    desc: 'Publish conference guidebooks, Dais background guides, and code of conduct documentation.',
    icon: FileCheck,
  },
};

export default function AdminAreaPage() {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const config = (area && adminAreaTitles[area]) || {
    title: 'Secretariat Oversight Module',
    desc: 'Conference administration management tools.',
    icon: Shield,
  };
  const Icon = config.icon;

  const [simulatedActionMessage, setSimulatedActionMessage] = useState('');

  // RoP specific interactive state
  const [ropStandard, setRopStandard] = useState<'THIMUN' | 'UN4MUN' | 'HARVARD' | 'CUSTOM'>('HARVARD');
  const [gslTime, setGslTime] = useState(90);
  const [modSpeakerTime, setModSpeakerTime] = useState(60);
  const [modTotalTime, setModTotalTime] = useState(12);
  const [votingMajority, setVotingMajority] = useState<'SIMPLE' | 'TWO_THIRDS'>('SIMPLE');
  const [allowP5Veto, setAllowP5Veto] = useState(true);
  const [pointsAllowed, setPointsAllowed] = useState({
    personalPrivilege: true,
    order: true,
    parliamentaryInquiry: true,
    information: true,
  });

  const triggerAction = (name: string) => {
    setSimulatedActionMessage(`${name} updated and synced across all committee floors successfully.`);
    setTimeout(() => setSimulatedActionMessage(''), 3000);
  };

  const isDelegate = isAuthenticated && user?.role === 'DELEGATE';
  const isAdminOrChair = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN' || user?.role === 'CHAIR');

  // If not authenticated or user is a delegate, show Secretariat Access Barrier
  if (!isAuthenticated || isDelegate) {
    return (
      <div className="delegate-page min-h-screen text-slate-100 pt-24 pb-16 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center items-center text-center">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6 shadow-xl shadow-amber-500/5">
            <Shield className="h-12 w-12 mx-auto" />
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            Secretariat Access Restricted
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
            Admin Account Only
          </h1>

          <p className="text-sm text-slate-300 mb-8 max-w-md leading-relaxed">
            {isDelegate ? (
              <>
                You are currently signed in as <strong className="text-cyan-300">{user?.name}</strong> (<em>Distinguished Delegate</em>). The Secretariat Oversight and Admin modules are exclusively accessible to authorized Secretariat Administrators.
              </>
            ) : (
              <>
                This administrative module is restricted to authorized Secretariat Administrators and Executive Board Chairs. Please sign in with an Admin account to proceed.
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            {isDelegate ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 rounded-xl bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Go to Delegate Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Sign In to Admin Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-24 pb-16 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-5 py-6 flex-1 w-full space-y-6">
        {/* Navigation Bar / Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            {isDelegate ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-slate-800 transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Exit to Delegate Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Exit to Secretariat Panel</span>
              </Link>
            )}

            <Link
              to={isDelegate ? '/admin' : '/dashboard'}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <span>or switch to {isDelegate ? 'Secretariat Panel' : 'Delegate Dashboard'}</span>
            </Link>
          </div>

          {/* Auth indicator */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-cyan-200">
                  {user.name || 'Delegate'} ({user.role})
                </span>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 rounded-full bg-cyan-300 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In to Access Tool</span>
              </Link>
            )}
          </div>
        </div>

        {/* Main Panel Content */}
        <section className="delegate-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 shrink-0">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                {area === 'rop-config' ? 'Rules of Procedure & Floor Protocol' : 'Secretariat Oversight Module'}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">{config.title}</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">{config.desc}</p>
            </div>
          </div>

          {/* If area === 'rop-config', show interactive RoP Configuration Engine */}
          {area === 'rop-config' ? (
            <div className="space-y-6 pt-2">
              {/* RoP Framework Selection */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Parliamentary Debate Standard
                  </label>
                  <span className="rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cyan-300">
                    {ropStandard} Protocol
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {[
                    { id: 'HARVARD', label: 'Harvard MUN', sub: 'North American RoP' },
                    { id: 'THIMUN', label: 'THIMUN', sub: 'Hague Protocol' },
                    { id: 'UN4MUN', label: 'UN4MUN', sub: 'UN DGC Consensus' },
                    { id: 'CUSTOM', label: 'Custom Hybrid', sub: 'Chamber Tailored' },
                  ].map((std) => (
                    <button
                      key={std.id}
                      onClick={() => setRopStandard(std.id as any)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                        ropStandard === std.id
                          ? 'border-cyan-400 bg-cyan-950/30 text-white shadow-lg shadow-cyan-950/40'
                          : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-white">{std.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{std.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Debate Timing Configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-300 block">
                    GSL Speaking Time
                  </span>
                  <div className="flex items-center gap-2">
                    {[60, 90, 120].map((t) => (
                      <button
                        key={t}
                        onClick={() => setGslTime(t)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          gslTime === t
                            ? 'bg-cyan-300 text-slate-950 border-cyan-300'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">Default General Speakers List intervention duration</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-300 block">
                    Mod Speaker Limit
                  </span>
                  <div className="flex items-center gap-2">
                    {[45, 60, 90].map((t) => (
                      <button
                        key={t}
                        onClick={() => setModSpeakerTime(t)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          modSpeakerTime === t
                            ? 'bg-cyan-300 text-slate-950 border-cyan-300'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">Individual speaking time per recognized motion</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-300 block">
                    Mod Total Duration
                  </span>
                  <div className="flex items-center gap-2">
                    {[8, 12, 15].map((t) => (
                      <button
                        key={t}
                        onClick={() => setModTotalTime(t)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          modTotalTime === t
                            ? 'bg-cyan-300 text-slate-950 border-cyan-300'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {t}m
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">Total caucus length before returning to formal list</p>
                </div>
              </div>

              {/* Voting and Veto Rules */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Substantive Voting & Majority Protocols
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">Resolution Majority</div>
                      <div className="text-[11px] text-slate-400">Threshold required for draft resolution adoption</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setVotingMajority('SIMPLE')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                          votingMajority === 'SIMPLE'
                            ? 'bg-cyan-300 text-slate-950 border-cyan-300'
                            : 'bg-slate-900 text-slate-400 border-white/10'
                        }`}
                      >
                        50%+1
                      </button>
                      <button
                        onClick={() => setVotingMajority('TWO_THIRDS')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                          votingMajority === 'TWO_THIRDS'
                            ? 'bg-cyan-300 text-slate-950 border-cyan-300'
                            : 'bg-slate-900 text-slate-400 border-white/10'
                        }`}
                      >
                        2/3 Majority
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">P5 Veto Power (UNSC)</div>
                      <div className="text-[11px] text-slate-400">Negative vote by permanent member fails resolution</div>
                    </div>
                    <button
                      onClick={() => setAllowP5Veto(!allowP5Veto)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                        allowP5Veto
                          ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                          : 'bg-slate-900 text-slate-400 border-white/10'
                      }`}
                    >
                      {allowP5Veto ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Generic module configuration card */
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                  Configuration Status
                </span>
                <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-3 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                  Active & Synced
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                All settings configured in this module automatically apply to live committee sessions, Google Meet rooms, and delegate dashboards.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => triggerAction(area === 'rop-config' ? 'Rules of Procedure' : 'Module settings')}
                className="rounded-xl bg-cyan-300 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20"
              >
                Save & Synchronize RoP
              </button>
              <Link
                to="/committee"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Test in Live Committee Chamber
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={isDelegate ? '/dashboard' : '/admin'}
                className="text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                ← Return to {isDelegate ? 'Delegate Dashboard' : 'Secretariat Panel'}
              </Link>
            </div>
          </div>

          {simulatedActionMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{simulatedActionMessage}</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

