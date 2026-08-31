import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  ShieldCheck,
  UserPlus,
  Video,
  Globe,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Search,
  Bell,
  LogOut,
  Calendar,
  Mail,
  FileCheck,
  Settings,
  Users,
  Award,
  Layers,
  Plus,
  ExternalLink,
  Shield,
  ArrowRight,
  LayoutDashboard,
  LogIn,
  User,
} from 'lucide-react';
import { StaffAccount, MeetingRoom } from '../types';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeModal, setActiveModal] = useState<'MEETING' | 'STAFF' | 'ROSTER' | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const [staffList, setStaffList] = useState<StaffAccount[]>([
    { id: 'admin_gyan_01', name: 'Gyan Dev', email: 'gyan.dev9808@gmail.com', role: 'ADMIN' },
    { id: 'admin_sec_02', name: 'Master Secretariat', email: 'admin@delegatex.org', role: 'ADMIN' },
    { id: '1', name: 'Sarah Jenkins', email: 'sarah.eb@delegatex.org', role: 'CHAIR' },
    { id: '2', name: 'David Kim', email: 'david.sec@delegatex.org', role: 'ADMIN' },
    { id: '3', name: 'Aarav Mehta', email: 'aarav.eb@delegatex.org', role: 'CHAIR' },
  ]);

  React.useEffect(() => {
    fetch('/api/admin/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts && data.accounts.length > 0) {
          const mapped: StaffAccount[] = data.accounts.map((a: any) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            role: a.role === 'CHAIR' ? 'CHAIR' : 'ADMIN',
          }));
          setStaffList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'ADMIN' | 'CHAIR'>('CHAIR');

  const [meetings, setMeetings] = useState<MeetingRoom[]>([
    {
      id: '1',
      code: 'UNSC-ARCTIC-2026',
      title: 'UNSC: Situation in Arctic',
      topic: 'Militarization & Navigation',
      type: 'LIVE_COMMITTEE',
      googleMeetUrl: 'https://meet.google.com/qru-wspg-nzr',
    },
    {
      id: '2',
      code: 'TRAIN-ROP-01',
      title: 'THIMUN RoP Masterclass',
      topic: 'Resolution Drafting',
      type: 'TRAINING',
      googleMeetUrl: 'https://meet.google.com/qru-wspg-nzr',
    },
    {
      id: '3',
      code: 'DISEC-DISARM-2026',
      title: 'DISEC: Autonomous Weaponry',
      topic: 'AI Non-Proliferation',
      type: 'LIVE_COMMITTEE',
      googleMeetUrl: 'https://meet.google.com/qru-wspg-nzr',
    },
  ]);

  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingTopic, setNewMeetingTopic] = useState('');
  const [newMeetingUrl, setNewMeetingUrl] = useState('');
  const [newMeetingType, setNewMeetingType] = useState<'LIVE_COMMITTEE' | 'TRAINING'>('LIVE_COMMITTEE');

  const [countries, setCountries] = useState<string[]>([
    'United States of America',
    'French Republic',
    'United Kingdom',
    'People\'s Republic of China',
    'Russian Federation',
    'Federal Republic of Germany',
    'Federative Republic of Brazil',
    'Republic of India',
    'Japan',
  ]);
  const [newCountry, setNewCountry] = useState('');

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim() || !newMeetingUrl.trim()) return;

    try {
      const parsedUrl = new URL(newMeetingUrl.trim());
      if (parsedUrl.hostname !== 'meet.google.com' && !parsedUrl.hostname.includes('google.com')) {
        showNotice('Please provide a valid Google Meet link (https://meet.google.com/...)');
        return;
      }
    } catch {
      showNotice('Please enter a valid meeting URL');
      return;
    }

    const cleanTitlePrefix = newMeetingTitle.trim().substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'MUN');
    const generatedCode = `${cleanTitlePrefix.toLowerCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newMeeting: MeetingRoom = {
      id: Date.now().toString(),
      code: generatedCode,
      title: newMeetingTitle.trim(),
      topic: newMeetingTopic.trim() || 'General Committee Debate',
      type: newMeetingType,
      googleMeetUrl: newMeetingUrl.trim(),
    };

    // Register with server live room store
    fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newMeeting.title,
        committee: cleanTitlePrefix,
        agenda: newMeeting.topic,
        userRole: 'ADMIN',
        userEmail: 'gyan.dev9808@gmail.com',
        passkey: 'AdminSecretariat2026!',
      }),
    }).catch(() => {});

    setMeetings([newMeeting, ...meetings]);
    setNewMeetingTitle('');
    setNewMeetingTopic('');
    setNewMeetingUrl('');
    showNotice(`Meeting room created! Room code: ${generatedCode}`);
  };

  const copyMeetingLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/room/${code}`);
    setCopiedCode(code);
    showNotice(`Copied room URL to clipboard for ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || newStaffPassword.length < 8) {
      showNotice('Password must be at least 8 characters.');
      return;
    }

    const newStaff: StaffAccount = {
      id: Date.now().toString(),
      name: newStaffName.trim(),
      email: newStaffEmail.trim().toLowerCase(),
      role: newStaffRole,
    };

    setStaffList([...staffList, newStaff]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPassword('');
    showNotice(`Added ${newStaff.name} as ${newStaff.role}`);
  };

  const handleDeleteStaff = (id: string) => {
    setStaffList(staffList.filter((s) => s.id !== id));
    showNotice('Staff account removed.');
  };

  const handleAddCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountry.trim()) return;
    setCountries([...countries, newCountry.trim()]);
    setNewCountry('');
    showNotice('Delegation added to roster.');
  };

  const isDelegate = isAuthenticated && user?.role === 'DELEGATE';
  const isAdminOrChair = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN' || user?.role === 'CHAIR');

  // If not authenticated or user is a delegate, show the Secretariat Access Barrier
  if (!isAuthenticated || isDelegate) {
    return (
      <div className="delegate-page min-h-screen text-slate-100 pt-20 pb-16 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center items-center text-center">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6 shadow-xl shadow-amber-500/5">
            <ShieldCheck className="h-12 w-12 mx-auto" />
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
                You are currently signed in as <strong className="text-cyan-300">{user?.name}</strong> (<em>Distinguished Delegate</em>). The Master Secretariat Panel is exclusively accessible to authorized Secretariat Administrators and Executive Board Chairs.
              </>
            ) : (
              <>
                The Master Secretariat Panel is restricted to authorized conference administrators, Executive Board chairs, and secretariat directors. Please sign in with an Admin account to proceed.
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            {isDelegate ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Delegate Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate('/auth');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-white/10 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span>Sign In as Admin</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In to Admin Account</span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <span>Return to Home</span>
                </button>
              </>
            )}
          </div>

          <div className="mt-8 p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-400 max-w-md">
            <span>Default Admin: <code className="text-amber-300 font-mono">gyan.dev9808@gmail.com</code> | Passkey: <code className="text-amber-300 font-mono">AdminSecretariat2026!</code></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-20 pb-16 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      {/* Top Secretariat Header */}
      <header className="border-b border-white/10 bg-slate-950/80 px-4 sm:px-8 py-3.5 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 sticky top-14 z-30">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white">Master Secretariat Panel</h1>
            <p className="text-[11px] text-slate-400">Conference Administration & Executive Board Oversight</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Delegate Dashboard</span>
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>{user.name || 'Delegate'} ({user.role})</span>
              </div>
            </div>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-300 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Delegate / Staff Sign In</span>
            </Link>
          )}

          <button
            onClick={() => navigate('/admin/search')}
            aria-label="Search records"
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-full transition"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/admin/notifications')}
            aria-label="Notifications"
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-full transition relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-cyan-400 rounded-full absolute top-1.5 right-1.5" />
          </button>
          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                navigate('/auth');
              }}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-rose-400 rounded-full transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Admin Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Management Modules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recently Used Actions */}
          <section className="delegate-panel rounded-3xl p-6 shadow-xl">
            <h2 className="text-xs uppercase font-bold tracking-[0.22em] text-slate-300 mb-4">
              Core Secretariat Controls
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <button
                onClick={() => setActiveModal('MEETING')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition shadow-md">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Live Meetings</span>
              </button>

              <button
                onClick={() => setActiveModal('STAFF')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition shadow-md">
                  <UserPlus className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Staff & EB</span>
              </button>

              <button
                onClick={() => setActiveModal('ROSTER')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 group-hover:scale-105 transition shadow-md">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Country Roster</span>
              </button>

              <button
                onClick={() => navigate('/admin/circulars')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-indigo-400/10 border border-indigo-400/20 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition shadow-md">
                  <FileCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Circulars</span>
              </button>
            </div>
          </section>

          {/* Secretariat & Oversight */}
          <section className="delegate-panel rounded-3xl p-6 shadow-xl">
            <h2 className="text-xs uppercase font-bold tracking-[0.22em] text-slate-300 mb-4">
              Secretariat & Oversight
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <button
                onClick={() => navigate('/admin/awards')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 group-hover:scale-105 transition shadow-md">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Awards & Certs</span>
              </button>

              <button
                onClick={() => navigate('/admin/roll-call')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 group-hover:scale-105 transition shadow-md">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Roll Call List</span>
              </button>

              <button
                onClick={() => navigate('/admin/delegates')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 group-hover:scale-105 transition shadow-md">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Delegates (120)</span>
              </button>

              <button
                onClick={() => navigate('/admin/committees')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 group-hover:scale-105 transition shadow-md">
                  <Layers className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Committees (6)</span>
              </button>
            </div>
          </section>

          {/* Communication & Rules */}
          <section className="delegate-panel rounded-3xl p-6 shadow-xl">
            <h2 className="text-xs uppercase font-bold tracking-[0.22em] text-slate-300 mb-4">
              Communication & Rules of Procedure
            </h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <button
                onClick={() => navigate('/admin/broadcasts')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition shadow-md">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Broadcast SMS / Circulars</span>
              </button>

              <button
                onClick={() => navigate('/admin/rop-config')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition shadow-md">
                  <Settings className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">RoP Configuration</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right Col: Create Live Meeting & Active Room Codes */}
        <aside className="space-y-6 lg:sticky lg:top-32">
          {/* Quick Create Live Meeting Box */}
          <div className="delegate-panel rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold flex items-center space-x-2 text-white">
              <LinkIcon className="w-4 h-4 text-cyan-300" />
              <span>Create Live Committee Link</span>
            </h2>
            <p className="text-xs text-slate-400">
              Generate synchronized room codes for live committee simulations or RoP masterclasses.
            </p>

            <form onSubmit={handleCreateMeeting} className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Committee Title
                </label>
                <input
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="e.g. UNSC: Middle East Crisis"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Agenda / Topic
                </label>
                <input
                  value={newMeetingTopic}
                  onChange={(e) => setNewMeetingTopic(e.target.value)}
                  placeholder="e.g. Humanitarian Corridors & Ceasefire"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Google Meet Link
                </label>
                <input
                  required
                  type="url"
                  value={newMeetingUrl}
                  onChange={(e) => setNewMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/qru-wspg-nzr"
                  pattern="https://meet\.google\.com/.*"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Session Type
                </label>
                <select
                  value={newMeetingType}
                  onChange={(e) => setNewMeetingType(e.target.value as 'LIVE_COMMITTEE' | 'TRAINING')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                >
                  <option value="LIVE_COMMITTEE">Live Committee Simulation</option>
                  <option value="TRAINING">Training / RoP Masterclass</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-300 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-md shadow-cyan-500/20 active:scale-95"
              >
                Generate Room Code & Launch
              </button>
            </form>
          </div>

          {/* Active Room Codes */}
          <div className="delegate-panel rounded-3xl p-6 shadow-xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300 block">
              Active Room Codes ({meetings.length})
            </span>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {meetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="text-xs font-bold text-white truncate">{m.title}</p>
                    <p className="text-[10px] font-mono text-cyan-300">Code: {m.code}</p>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => copyMeetingLink(m.code)}
                      className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs transition"
                      title="Copy room link"
                    >
                      {copiedCode === m.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Link
                      to={`/room/${m.code}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Join
                    </Link>
                    <a
                      href={m.googleMeetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>Meet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Floating Notice Toast */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900 border border-cyan-400/40 px-5 py-3 text-xs font-bold text-cyan-200 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          {notice}
        </div>
      )}

      {/* MODALS */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="delegate-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-700 animate-scale-up">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Secretariat Management
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">
                  {activeModal === 'MEETING'
                    ? 'Active Live Meetings'
                    : activeModal === 'STAFF'
                    ? 'Staff & Executive Board Roster'
                    : 'Country Delegation Roster'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                aria-label="Close panel"
                className="rounded-xl p-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                Close
              </button>
            </div>

            {/* Modal: Meetings */}
            {activeModal === 'MEETING' && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    handleCreateMeeting(e);
                  }}
                  className="space-y-3"
                >
                  <input
                    required
                    value={newMeetingTitle}
                    onChange={(e) => setNewMeetingTitle(e.target.value)}
                    placeholder="Committee title (e.g. UNHRC: Human Rights in Conflict)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                  <input
                    value={newMeetingTopic}
                    onChange={(e) => setNewMeetingTopic(e.target.value)}
                    placeholder="Specific agenda or working topic"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                  <input
                    required
                    type="url"
                    value={newMeetingUrl}
                    onChange={(e) => setNewMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/qru-wspg-nzr"
                    pattern="https://meet\.google\.com/.*"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-cyan-300 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
                  >
                    Create Meeting
                  </button>
                </form>

                <div className="space-y-2 border-t border-slate-800 pt-4 max-h-56 overflow-y-auto">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3 border border-slate-800"
                    >
                      <div className="pr-2 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{meeting.title}</p>
                        <p className="font-mono text-[10px] text-cyan-400">{meeting.code}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link
                          onClick={() => setActiveModal(null)}
                          to={`/room/${meeting.code}`}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          Open Room
                        </Link>
                        <a
                          href={meeting.googleMeetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                        >
                          Meet
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal: Staff & EB */}
            {activeModal === 'STAFF' && (
              <div className="space-y-4">
                <form onSubmit={handleAddStaff} className="grid gap-2.5 sm:grid-cols-2">
                  <input
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Full name (e.g. Elena Rostova)"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                  <input
                    required
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="Email address"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="Password (8+ chars)"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as 'ADMIN' | 'CHAIR')}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  >
                    <option value="CHAIR">Executive Board (Chair)</option>
                    <option value="ADMIN">Secretariat Administrator</option>
                  </select>
                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-xl bg-cyan-300 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
                  >
                    Create Account
                  </button>
                </form>

                <div className="space-y-2 border-t border-slate-800 pt-4 max-h-56 overflow-y-auto">
                  {staffList.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3 border border-slate-800"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{staff.name}</p>
                        <p className="text-[11px] text-slate-400">{staff.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300">
                          {staff.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-slate-800 transition"
                          title="Delete staff account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal: Country Roster */}
            {activeModal === 'ROSTER' && (
              <div className="space-y-4">
                <form onSubmit={handleAddCountry} className="flex gap-2">
                  <input
                    required
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    placeholder="Add delegation (e.g. Swiss Confederation, Republic of Korea)..."
                    className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
                  >
                    Add
                  </button>
                </form>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto">
                  {countries.map((country) => (
                    <div
                      key={country}
                      className="rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2 text-xs text-slate-300 flex items-center justify-between"
                    >
                      <span>{country}</span>
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
