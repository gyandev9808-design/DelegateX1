import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, LayoutDashboard, Sparkles, CheckCircle2 } from 'lucide-react';

const areaNames: Record<string, string> = {
  search: 'Workspace Search',
  notifications: 'Delegate Notifications',
  syllabus: 'Comprehensive Syllabus',
  motions: 'Motion Practice Room',
  planner: 'Conference Strategy Planner',
  speeches: 'Opening Speech Lab',
  briefs: 'Country Policy Briefs Library',
};

export default function DashboardAreaPage() {
  const { area } = useParams<{ area: string }>();
  const title = (area && areaNames[area]) || 'Delegate Workspace';

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-24 pb-16 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-5 py-10 flex-1 w-full space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Delegate Command Center</span>
        </Link>

        <section className="delegate-panel rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
            <LayoutDashboard className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Command Sub-Module
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              This dedicated module is active and configured for your conference preparation.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Ready for Live Delegation Data
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All research, RoP simulations, and delegate caucus tools are synchronized with your active committee room.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              to="/committee"
              className="rounded-xl bg-cyan-300 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
            >
              Go to Committee Floor
            </Link>
            <Link
              to="/training"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Open Training Academy
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
