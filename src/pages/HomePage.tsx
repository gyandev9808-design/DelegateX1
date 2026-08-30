import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Globe2,
  ArrowRight,
  BookOpen,
  Mic2,
  Users,
  Award,
  Landmark,
  Bot,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [isPlayingRehearsal, setIsPlayingRehearsal] = useState(false);
  const [rehearsalTime, setRehearsalTime] = useState(0);

  const features = [
    [BookOpen, 'RoP Academy', 'Master THIMUN, UN4MUN, and North American parliamentary procedures with structured interactive modules.'],
    [Mic2, 'GSL & Caucus Clock', 'Real-time speaker timers, placard raising simulations, and queue management for seamless debate control.'],
    [Bot, 'AI Doubt Clarifier', 'Instant diplomatic answers on foreign policy stances, drafting operative clauses, and raising points.'],
    [Users, 'Secretariat Workspace', 'Comprehensive control for Executive Boards: generate Google Meet sessions, assign rosters, and chair rooms.'],
    [Award, 'Delegate Command Center', 'Track syllabus mastery, research progress, and daily diplomatic focus items with dynamic rank scoring.'],
    [Landmark, 'Live Simulations', 'Engage in active UNSC, UNHRC, and DISEC committee simulations with synchronized delegate rosters.'],
  ];

  const workflowSteps = [
    {
      num: '01',
      title: 'Choose your committee',
      desc: 'Pick your conference, committee agenda, allocated country, and diplomatic objectives.',
      icon: Landmark,
    },
    {
      num: '02',
      title: 'Build your position',
      desc: 'Turn reliable UN treaties and policy briefs into a razor-sharp, defensible working paper.',
      icon: BookOpen,
    },
    {
      num: '03',
      title: 'Practise the floor',
      desc: 'Rehearse your 90-second GSL speech, master caucusing, and enter live simulations.',
      icon: Mic2,
    },
  ];

  return (
    <div className="delegate-page min-h-screen text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden px-5 pt-32 pb-20 sm:px-8 sm:pt-40 sm:pb-28">
          <div className="mx-auto max-w-5xl text-center">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-lg shadow-cyan-500/10 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Next-Generation MUN Training & Floor Simulation</span>
            </div>

            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
              Lead the Committee. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                Command the Floor.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
              DelegateX is the all-in-one platform for Model United Nations delegates, chairs, and secretariats.
              Master Rules of Procedure, sharpen opening speeches, and run live interactive simulations.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full bg-cyan-300 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-200 hover:scale-105 active:scale-95"
              >
                <span>Enter Delegate Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/committee"
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-cyan-400/40"
              >
                <Mic2 className="h-4 w-4 text-cyan-300" />
                <span>Launch Live Committee</span>
              </Link>
            </div>

            {/* Interactive Hero Preview Card */}
            <div className="relative mx-auto mt-16 max-w-4xl">
              <div className="delegate-panel rounded-2xl p-6 text-left transition duration-500">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base">UN Security Council (UNSC)</h3>
                      <p className="text-xs text-slate-400">Arctic Sovereignty & Environmental Security · Session 04</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Brief Ready
                  </span>
                </div>

                <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                  {/* Country brief */}
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                      Country Brief · French Republic
                    </p>
                    <h4 className="text-base font-bold text-white leading-snug">
                      Protection of critical maritime infrastructure & scientific navigation in polar corridors
                    </h4>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Research & Treaty Synthesis</span>
                        <span className="text-cyan-300 font-bold">84%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 w-[84%]" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 font-medium">
                        UNCLOS Art. 234
                      </span>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 font-medium">
                        EU Arctic Policy
                      </span>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 font-medium">
                        Bloc: NATO / Nordic
                      </span>
                    </div>
                  </div>

                  {/* Speech rehearsal demo */}
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5 flex flex-col justify-between">
                    <div>
                      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white">
                        <span className="flex items-center gap-2">
                          <Mic2 className="h-4 w-4 text-emerald-400" /> Opening Speech Rehearsal
                        </span>
                        <span className="font-mono text-xs text-slate-400">90s GSL</span>
                      </div>

                      <div className="my-3 flex h-20 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/20">
                        <button
                          onClick={() => setIsPlayingRehearsal(!isPlayingRehearsal)}
                          className="flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-slate-950 font-bold text-xs shadow-lg transition hover:scale-105"
                        >
                          {isPlayingRehearsal ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                          <span>{isPlayingRehearsal ? 'Pause Rehearsal' : 'Listen Sample'}</span>
                        </button>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-400 italic">
                        &quot;France firmly asserts that sovereign disputes in the High North must yield to the supremacy of international maritime law...&quot;
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                      <span className="text-slate-400">Pacing & Content Score</span>
                      <span className="font-bold text-emerald-300">9.4 / 10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating aesthetic tags */}
              <div className="absolute -left-6 top-16 hidden w-52 -rotate-3 rounded-xl border border-white/10 bg-slate-900/90 p-4 text-left shadow-2xl backdrop-blur-lg lg:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Next Live Session</p>
                <p className="mt-1 font-bold text-white text-sm">Opening Speeches & GSL</p>
                <p className="mt-1 text-xs text-emerald-400 font-semibold">Today · 7:30 PM</p>
              </div>

              <div className="absolute -right-6 bottom-6 hidden w-56 rotate-3 rounded-xl border border-white/10 bg-slate-900/90 p-4 text-left shadow-2xl backdrop-blur-lg lg:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Diplomatic Tip</p>
                <p className="mt-1 text-xs leading-5 text-slate-200">
                  Lead with verified data, anchor with UN charter articles, then form the voting bloc.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="border-t border-white/10 px-5 py-24 sm:px-8 bg-slate-950/40">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                Complete Diplomatic Suite
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Everything you need to excel as a delegate and chair.
              </h2>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                Engineered specifically for high school and university delegates preparing for Harvard MUN, THIMUN, HMUN, and national conferences.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map(([Icon, title, description]) => {
                const FeatureIcon = Icon as typeof BookOpen;
                return (
                  <div
                    key={title as string}
                    className="group rounded-2xl border border-white/10 bg-slate-900/40 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-slate-900/80"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300 border border-cyan-300/20 group-hover:scale-105 transition">
                      <FeatureIcon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-white">{title as string}</h3>
                    <p className="text-xs sm:text-sm leading-6 text-slate-400">{description as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3-STEP WORKFLOW */}
        <section id="workflow" className="border-y border-white/10 bg-slate-900/30 px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300 mb-2">
                The Preparation Loop
              </p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                From Blank Page to Best Delegate.
              </h2>
              <p className="mt-3 text-slate-400 text-sm">
                A structured three-step methodology developed by award-winning MUN veterans.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-7 shadow-xl hover:border-cyan-300/30 transition"
                  >
                    <span className="text-6xl font-black text-cyan-300/15 font-mono select-none">
                      {step.num}
                    </span>
                    <Icon className="absolute right-6 top-7 h-6 w-6 text-emerald-400" />
                    <h3 className="mt-6 text-lg font-bold text-white">{step.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-400">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL & TRUST */}
        <section className="px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-300 mb-6">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-xl font-medium leading-relaxed text-slate-200 sm:text-2xl">
              &quot;DelegateX made our committee preparation feel structured and empowering. The real-time speech timers and AI clarifier let our school delegation walk into committee confident, prepared, and ready to lead.&quot;
            </p>
            <div className="mt-8 flex items-center justify-center gap-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/20 font-bold text-emerald-300 border border-emerald-400/30">
                A
              </span>
              <div className="text-left">
                <p className="font-bold text-white text-sm">Ananya R.</p>
                <p className="text-xs text-slate-400">Best Delegate · High School MUN Secretariat</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAST CALLOUT BANNER */}
        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto max-w-5xl rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 p-8 sm:p-12 text-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Ready to take the floor?
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm text-slate-300">
              Join delegates across the globe using DelegateX for committee practice, rules of procedure mastery, and speech training.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/training"
                className="rounded-full bg-cyan-300 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
              >
                Explore Training Modules
              </Link>
              <Link
                to="/ai-doubt-clarifier"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Ask AI Doubt Clarifier
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950 px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <Link to="/" className="flex items-center gap-2 text-base font-bold text-cyan-300">
            <Globe2 className="h-5 w-5" />
            <span>Delegate<span className="text-emerald-400">X</span></span>
          </Link>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <Link className="hover:text-cyan-300 transition" to="/training">Training Modules</Link>
            <Link className="hover:text-cyan-300 transition" to="/committee">Live Floor</Link>
            <Link className="hover:text-cyan-300 transition" to="/ai-doubt-clarifier">AI Clarifier</Link>
            <Link className="hover:text-cyan-300 transition" to="/dashboard">Delegate Dashboard</Link>
            <Link className="hover:text-cyan-300 transition" to="/admin">Secretariat Panel</Link>
            <Link className="hover:text-cyan-300 transition" to="/auth">Sign In</Link>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} DelegateX Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
