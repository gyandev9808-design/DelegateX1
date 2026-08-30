import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, Shield, CheckCircle2, Award, Users, Calendar, Mail, Settings, FileCheck, Search, Bell } from 'lucide-react';

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
    desc: 'Configure committee voting standards: THIMUN, UN4MUN, Harvard MUN, or custom Secretariat rules.',
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
  const config = (area && adminAreaTitles[area]) || {
    title: 'Secretariat Oversight Module',
    desc: 'Conference administration management tools.',
    icon: Shield,
  };
  const Icon = config.icon;

  const [simulatedActionMessage, setSimulatedActionMessage] = useState('');

  const triggerAction = (name: string) => {
    setSimulatedActionMessage(`${name} updated successfully.`);
    setTimeout(() => setSimulatedActionMessage(''), 2500);
  };

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-24 pb-16 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-5 py-10 flex-1 w-full space-y-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Secretariat Control Center</span>
        </Link>

        <section className="delegate-panel rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
            <Icon className="h-7 w-7" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Secretariat Area
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">{config.title}</h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-2xl">{config.desc}</p>
          </div>

          {/* Area specific functional cards */}
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

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => triggerAction('Module settings')}
                className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
              >
                Save & Synchronize
              </button>
              <button
                onClick={() => triggerAction('Data cache')}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Export Audit Log
              </button>
            </div>
          </div>

          {simulatedActionMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{simulatedActionMessage}</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
