import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  BookOpen,
  FileText,
  Mic,
  Users,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Bot,
  Sliders,
} from 'lucide-react';

interface ModuleDetail {
  id: string;
  title: string;
  desc: string;
  duration: string;
  icon: typeof BookOpen;
  summary: string;
  keyPoints: string[];
  sampleScript?: string;
  proTip: string;
}

export default function TrainingPage() {
  const [activeModule, setActiveModule] = useState<string | null>('1');

  const modules: ModuleDetail[] = [
    {
      id: '1',
      title: '1. Rules of Procedure (RoP) Fundamentals',
      desc: 'Differences between UN4MUN, THIMUN, and North American Parliamentary procedure.',
      duration: '15 min read',
      icon: BookOpen,
      summary: 'Rules of Procedure govern how debate flows, how motions are recognized, and how voting occurs in Model UN committees.',
      keyPoints: [
        'THIMUN Procedure: Emphasizes consensus and resolution lobbying before formal debate. Strict Point of Information protocols.',
        'UN4MUN (UN Department of Global Communications): Prioritizes genuine consensus and line-by-line operative adoption without formal voting if possible.',
        'North American Procedure: Dynamic, fast-paced debate with formal General Speakers List (GSL), Moderated Caucuses, and Unmoderated Caucuses.',
        'Core Motions: Motion to Open General Speakers List, Motion for a Moderated Caucus, Motion for an Unmoderated Caucus, Motion to Introduce Draft Resolution.',
      ],
      sampleScript: 'Delegate: "The Delegation of France moves for a 12-minute Moderated Caucus with an individual speaking time of 60 seconds on the topic of: Safeguarding critical Arctic energy infrastructure against cyber threats."',
      proTip: 'Always specify three items when raising a moderated caucus motion: 1) Total duration, 2) Individual speaking time, 3) Specific sub-topic.',
    },
    {
      id: '2',
      title: '2. Structuring Position Papers & Research',
      desc: 'Country policy analysis, UN treaties citation, and policy-aligned solutions.',
      duration: '20 min guide',
      icon: FileText,
      summary: 'A position paper summarizes your state’s historical stance, foreign policy alignments, domestic interests, and proposed international remedies.',
      keyPoints: [
        'Paragraph 1 (Background): The historical context and global urgency of the agenda issue.',
        'Paragraph 2 (National Policy): Past UN resolutions voted for, treaties ratified, and actions taken by your sovereign government.',
        'Paragraph 3 (Proposed Solutions): Realistic, innovative, and mandate-compliant policy mechanisms with funding/implementation bodies.',
        'Citation Protocol: Always cite UN treaties (e.g. UNCLOS, Paris Agreement, Geneva Conventions) and past GA/SC resolutions.',
      ],
      sampleScript: '"The French Republic reaffirms its commitment to UNSC Resolution 2341 (2017) on critical infrastructure protection, emphasizing that multilateral risk assessments must precede sovereign military installations."',
      proTip: 'Never fabricate treaties or statistical data. Use the UN Official Document System (ODS) and World Bank/UNHCR statistics.',
    },
    {
      id: '3',
      title: '3. General Speakers List & Floor Strategy',
      desc: 'Delivering impactful 90-second opening speeches and handling points of inquiry.',
      duration: '10 min guide',
      icon: Mic,
      summary: 'The GSL sets the diplomatic tone for your entire committee experience. It signals your leadership potential and invites allies into your bloc.',
      keyPoints: [
        'The 15-45-30 Structure: 15s Hook (Sovereign principle), 45s Body (Specific crisis impacts & red lines), 30s Call to Action (Proposed working bloc framework).',
        'Yields Protocol: Yield time to the Chair, yield to another delegation, or yield to Questions/Points of Information.',
        'Delivery Dynamics: Speak with steady pacing (130-140 words/min), clear vocal emphasis on key verbs, and direct eye contact across both wings of the room.',
        'Placard Discipline: Keep your delegation placard upright and steady until recognized by the Dais.',
      ],
      sampleScript: '"Honorable Chair, esteemed delegates—while territorial disputes test the boundaries of international order, the French Republic reminds this Council that international waters are not arenas for unilateral annexation, but shared conduits of human prosperity..."',
      proTip: 'Conclude your GSL speech with a direct invitation: "France invites all delegations seeking sustainable maritime protocols to caucus with us during the upcoming informal consultation."',
    },
    {
      id: '4',
      title: '4. Moderated vs. Unmoderated Caucuses',
      desc: 'Forming voting blocs, negotiating working papers, and leading informal consultations.',
      duration: '25 min simulation',
      icon: Users,
      summary: 'Where debate turns into policy. Moderated caucuses refine specific points of friction; unmoderated caucuses assemble coalitions and draft text.',
      keyPoints: [
        'Moderated Caucus Mastery: Keep interventions surgical. Answer previous speakers directly and advance new operative clauses.',
        'Unmoderated Caucus Leadership: Claim the whiteboard/shared doc early. Become the principal author or mediator of conflicting viewpoints.',
        'Sponsors vs. Signatories: Sponsors actively author and defend the resolution; Signatories wish to see the draft debated on the floor.',
        'Preambulatory vs. Operative Clauses: Preams set the legal/historic backdrop; Operatives mandate actionable bodies, inspection regimes, or funding lines.',
      ],
      sampleScript: 'Operative Clause 1: "1. Urges member states to establish a Joint Polar Monitoring Mechanism (JPMM) under the auspices of UNEP, tasked with conducting biannual environmental integrity audits;"',
      proTip: 'During unmods, do not isolate opposing blocs. Seek compromise language that can win over moderate fence-sitters for a supermajority.',
    },
  ];

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-24 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-5 py-10 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              title="Back to Delegate Dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-400/40 transition text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                DelegateX Training Academy
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Essential frameworks, Rules of Procedure (RoP), and caucus strategies
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/rop-config"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-slate-800 transition"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Configure RoP Rules</span>
            </Link>
            <Link
              to="/ai-doubt-clarifier"
              className="flex items-center gap-1.5 rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-md shadow-cyan-500/20"
            >
              <Bot className="h-4 w-4" />
              <span>Ask AI Clarifier</span>
            </Link>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((m) => {
            const Icon = m.icon;
            const isOpen = activeModule === m.id;

            return (
              <div
                key={m.id}
                className={`delegate-panel rounded-2xl transition-all duration-300 overflow-hidden ${
                  isOpen ? 'border-cyan-300/40 bg-slate-900/90' : 'hover:border-white/20'
                }`}
              >
                {/* Header Toggle */}
                <button
                  onClick={() => setActiveModule(isOpen ? null : m.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-cyan-300 shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {m.title}
                        </h3>
                        <span className="rounded border border-white/10 bg-slate-950/70 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                          {m.duration}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  </div>

                  <div className="p-1 text-slate-400">
                    {isOpen ? <ChevronUp className="w-5 h-5 text-cyan-300" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="border-t border-white/10 p-5 sm:p-6 bg-slate-950/50 space-y-6">
                    {/* Summary */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-medium">
                        {m.summary}
                      </p>
                    </div>

                    {/* Key takeaways */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Core Rules & Takeaways
                      </h4>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {m.keyPoints.map((point, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/5 bg-slate-900/60 p-3.5 text-xs leading-relaxed text-slate-300"
                          >
                            <span className="font-semibold text-white block mb-1">
                              • {point.split(':')[0]}
                            </span>
                            <span className="text-slate-400">
                              {point.includes(':') ? point.split(':')[1] : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sample speech / motion script */}
                    {m.sampleScript && (
                      <div className="rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-4">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300 block mb-2">
                          Diplomatic Script / Sample Intervention
                        </span>
                        <p className="text-xs sm:text-sm font-mono text-cyan-100/90 leading-relaxed italic">
                          {m.sampleScript}
                        </p>
                      </div>
                    )}

                    {/* Pro Tip */}
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-4 text-xs text-emerald-200">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-300">Secretariat Pro-Tip: </span>
                        {m.proTip}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA to practice */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Have doubts about Rules of Procedure or Caucus Strategy?</h3>
            <p className="text-xs text-slate-400">Ask the DelegateX AI Clarifier for instant assistance on diplomatic protocol and speech formats.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/ai-doubt-clarifier"
              className="flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-md shadow-cyan-500/20"
            >
              <Bot className="h-4 w-4" />
              <span>Ask AI Clarifier</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
