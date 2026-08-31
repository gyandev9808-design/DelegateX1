import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DelegateSidebar from '../components/DelegateSidebar';
import NotificationsPopover from '../components/NotificationsPopover';
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
  Bot,
  Bell,
  Menu,
  LogOut,
  Layers,
  ChevronRight,
  Edit2,
  X,
  User,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [focusItems, setFocusItems] = useState([true, false, false]);

  const rawName = user?.name || localStorage.getItem('mun_user_name') || '';
  let userName = rawName.trim();
  if (!userName || /^\d+$/.test(userName) || userName.toLowerCase() === 'distinguished delegate') {
    if (user?.email) {
      const prefix = user.email.split('@')[0].replace(/[._\d]+/g, ' ').trim();
      if (prefix) {
        userName = prefix
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      } else {
        userName = 'Delegate';
      }
    } else {
      userName = 'Delegate';
    }
  }

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
    <div className="delegate-page min-h-screen text-slate-100 flex bg-slate-950 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Side Bar with All Delegate Apps */}
      <DelegateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top App Bar with Mobile Menu Toggle, Brand & Notifications */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 sm:px-8 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
              title="Open Apps Menu"
              aria-label="Open Apps Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                Delegate Workspace
              </span>
              <span className="hidden sm:inline text-slate-600">/</span>
              <span className="text-xs font-bold text-cyan-300">
                Hub
              </span>
            </div>
          </div>

          {/* Top Actions: Notifications & Meet Shortcut */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Live Meet Action */}
            <Link
              to="/meet"
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-cyan-300 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-200 transition"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Live Meet</span>
            </Link>

            {/* Notification Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="View Notifications"
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:bg-white/10 hover:text-white transition"
              >
                <Bell className="h-4 w-4 text-cyan-300" />
                {/* Unread badge pulse */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-black text-slate-950 ring-2 ring-slate-950">
                  3
                </span>
              </button>

              {/* Notifications Popover Component */}
              <NotificationsPopover
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
              />
            </div>
          </div>
        </header>

        {/* Dashboard Main View Container */}
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 w-full space-y-8 flex-1">
          {/* Greeting: strictly Welcome Back, (The username) */}
          <div className="border-b border-white/10 pb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
              Welcome Back, <span className="text-cyan-300">{userName}</span>
            </h1>
          </div>

          {/* Quick Delegate Apps Launcher Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Layers className="h-4 w-4 text-cyan-300" />
                <span>Available Delegate Applications</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Quick Access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  to: '/meet',
                  title: 'Live Video Meet',
                  desc: 'Join chamber video sessions',
                  icon: Video,
                  color: 'from-blue-500/20 to-cyan-500/10 border-blue-400/30 text-cyan-300',
                  badge: 'Video',
                },
                {
                  to: '/committee',
                  title: 'Live Floor Timer',
                  desc: 'RoP speakers list & caucus timer',
                  icon: Radio,
                  color: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/30 text-emerald-300',
                  badge: 'Floor',
                },
                {
                  to: '/training',
                  title: 'Training Academy',
                  desc: 'Syllabus & caucus strategies',
                  icon: BookOpen,
                  color: 'from-amber-500/20 to-orange-500/10 border-amber-400/30 text-amber-300',
                  badge: 'Training',
                },
                {
                  to: '/ai-doubt-clarifier',
                  title: 'AI Doubt Clarifier',
                  desc: 'Instant diplomatic assistance',
                  icon: Bot,
                  color: 'from-purple-500/20 to-indigo-500/10 border-purple-400/30 text-purple-300',
                  badge: 'AI Help',
                },
              ].map((app) => {
                const AppIcon = app.icon;
                return (
                  <Link
                    key={app.to}
                    to={app.to}
                    className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/40 p-4 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900/80 shadow-lg shadow-black/20"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br border ${app.color}`}>
                          <AppIcon className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300 group-hover:border-cyan-400/30 group-hover:text-cyan-300 transition">
                          {app.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition">
                        {app.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {app.desc}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-cyan-300 group-hover:translate-x-0.5 transition">
                      <span>Launch App</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

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

          {/* Section 4: Live Committee Room Code Entry */}
          <section className="rounded-3xl border border-cyan-400/30 bg-cyan-950/20 p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                  Direct Chamber Access
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
    </div>
  );
}

