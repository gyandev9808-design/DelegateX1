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
  Sparkles,
  Radio,
} from 'lucide-react';
import { StaffAccount, MeetingRoom } from '../types';
import { useAuth } from '../context/AuthContext';
import { PromptGenerator } from '../components/admin/PromptGenerator';
import { addMeetingRoomNotification, deleteNotification } from '../utils/notifications';
import { validateRealEmail } from '../utils/emailValidator';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeModal, setActiveModal] = useState<'MEETING' | 'STAFF' | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const [staffList, setStaffList] = useState<StaffAccount[]>([
    { id: 'admin_gyan_01', name: 'Gyan Dev', email: 'gyan.dev9808@gmail.com', role: 'ADMIN' },
    { id: 'admin_master_02', name: 'Master Secretariat', email: 'admin@delegatex.org', role: 'ADMIN' },
    { id: 'staff_sarah_03', name: 'Sarah Jenkins', email: 'sarah.eb@delegatex.org', role: 'CHAIR' },
    { id: 'staff_david_04', name: 'David Kim', email: 'david.sec@delegatex.org', role: 'ADMIN' },
    { id: 'staff_aarav_05', name: 'Aarav Mehta', email: 'aarav.eb@delegatex.org', role: 'CHAIR' },
  ]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  const fetchStaffAccounts = async () => {
    try {
      setLoadingStaff(true);
      const res = await fetch('/api/admin/accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && Array.isArray(data.accounts)) {
          const mapped: StaffAccount[] = data.accounts.map((a: any) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            role: a.role === 'CHAIR' ? 'CHAIR' : 'ADMIN',
          }));
          setStaffList(mapped);
        }
      }
    } catch {
      // Keep local state on error
    } finally {
      setLoadingStaff(false);
    }
  };

  React.useEffect(() => {
    fetchStaffAccounts();
  }, []);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const newStaffRole = 'ADMIN';

  // Live meeting rooms initialized as empty - only created on-demand with one server per meeting
  const [meetings, setMeetings] = useState<MeetingRoom[]>(() => {
    try {
      const saved = localStorage.getItem('mun_active_meetings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Synchronize active meeting servers from the server
  React.useEffect(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.rooms)) {
          if (data.rooms.length > 0) {
            const mapped: MeetingRoom[] = data.rooms.map((r: any) => ({
              id: r.id,
              code: r.id,
              title: r.title,
              topic: r.agenda,
              type: 'LIVE_COMMITTEE',
            }));
            setMeetings(mapped);
            localStorage.setItem('mun_active_meetings', JSON.stringify(mapped));
          } else {
            // When server has no active rooms, clean local state so no stale meetings are shown
            const saved = localStorage.getItem('mun_active_meetings');
            if (!saved) {
              setMeetings([]);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingTopic, setNewMeetingTopic] = useState('');
  const [newMeetingType, setNewMeetingType] = useState<'LIVE_COMMITTEE' | 'TRAINING'>('LIVE_COMMITTEE');

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim()) return;

    const cleanTitlePrefix = newMeetingTitle.trim().substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'MUN');
    const generatedCode = `${cleanTitlePrefix.toLowerCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Register with server live room store enforcing exactly ONE server per meeting
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: generatedCode,
          code: generatedCode,
          title: newMeetingTitle.trim(),
          committee: cleanTitlePrefix,
          agenda: newMeetingTopic.trim() || 'General Committee Debate',
          userRole: user?.role || 'ADMIN',
          userEmail: user?.email || 'gyan.dev9808@gmail.com',
          passkey: 'AdminSecretariat2026!',
        }),
      });
      const data = await res.json();
      const finalCode = data.roomId || generatedCode;

      const newMeeting: MeetingRoom = {
        id: Date.now().toString(),
        code: finalCode,
        title: newMeetingTitle.trim(),
        topic: newMeetingTopic.trim() || 'General Committee Debate',
        type: newMeetingType,
      };

      setMeetings((prev) => {
        const updated = [newMeeting, ...prev.filter((m) => m.code !== finalCode)];
        localStorage.setItem('mun_active_meetings', JSON.stringify(updated));
        return updated;
      });

      // Synchronize with delegate notifications
      addMeetingRoomNotification({
        code: finalCode,
        title: newMeeting.title,
        topic: newMeeting.topic,
      });
      window.dispatchEvent(new Event('mun_meetings_updated'));

      setNewMeetingTitle('');
      setNewMeetingTopic('');
      showNotice(`Meeting room created! Single room server online: ${finalCode}`);
    } catch {
      const fallbackMeeting: MeetingRoom = {
        id: Date.now().toString(),
        code: generatedCode,
        title: newMeetingTitle.trim(),
        topic: newMeetingTopic.trim() || 'General Committee Debate',
        type: newMeetingType,
      };
      setMeetings((prev) => {
        const updated = [fallbackMeeting, ...prev];
        localStorage.setItem('mun_active_meetings', JSON.stringify(updated));
        return updated;
      });

      addMeetingRoomNotification({
        code: generatedCode,
        title: fallbackMeeting.title,
        topic: fallbackMeeting.topic,
      });
      window.dispatchEvent(new Event('mun_meetings_updated'));

      setNewMeetingTitle('');
      setNewMeetingTopic('');
      showNotice(`Meeting room created! Room code: ${generatedCode}`);
    }
  };

  const handleDeleteMeeting = (id: string, code: string) => {
    setMeetings((prev) => {
      const updated = prev.filter((m) => m.id !== id && m.code !== code);
      localStorage.setItem('mun_active_meetings', JSON.stringify(updated));
      return updated;
    });
    deleteNotification(`notif_room_${code.toLowerCase().trim()}`);
    window.dispatchEvent(new Event('mun_meetings_updated'));
    fetch(`/api/rooms/${code}`, {
      method: 'DELETE',
    }).catch(() => {});
    showNotice(`Room code ${code} deleted.`);
  };

  const copyMeetingLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/room/${code}`);
    setCopiedCode(code);
    showNotice(`Copied room URL to clipboard for ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameClean = newStaffName.trim();
    const emailClean = newStaffEmail.trim().toLowerCase();
    const passClean = newStaffPassword.trim();

    if (!nameClean || !emailClean || passClean.length < 6) {
      showNotice('Please provide full name, email, and password (min 6 characters).');
      return;
    }

    const emailCheck = validateRealEmail(emailClean);
    if (!emailCheck.isValid) {
      showNotice(emailCheck.error || 'Please enter a genuine, active email address.');
      return;
    }

    setIsCreatingStaff(true);
    try {
      const res = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameClean,
          email: emailCheck.cleanEmail,
          password: passClean,
          role: 'ADMIN',
          title: 'Secretariat Administrator',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Failed to create account.');
        return;
      }

      showNotice(`Successfully created Admin account for ${nameClean}!`);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      await fetchStaffAccounts();
    } catch {
      showNotice('Network error creating admin account.');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteStaff = async (id: string, email?: string) => {
    const cleanEmail = email?.toLowerCase().trim() || id;
    setDeletingId(id);

    try {
      const url = `/api/admin/accounts/${encodeURIComponent(id)}${email ? `?email=${encodeURIComponent(email)}` : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Failed to delete account.');
        setDeletingId(null);
        return;
      }

      setStaffList((prev) => prev.filter((s) => s.id !== id && s.email !== email));
      showNotice(`Account for ${cleanEmail} deleted permanently.`);
      fetchStaffAccounts();
    } catch {
      // Also update local state immediately so user is never blocked
      setStaffList((prev) => prev.filter((s) => s.id !== id && s.email !== email));
      showNotice(`Account for ${cleanEmail} removed.`);
    } finally {
      setDeletingId(null);
    }
  };

  const isMasterAdmin = user?.role === 'MASTER_ADMIN' || user?.email?.toLowerCase() === 'gyan.dev9808@gmail.com';
  const isAdminOrChair =
    isAuthenticated &&
    (isMasterAdmin ||
      user?.role === 'ADMIN' ||
      user?.role === 'CHAIR' ||
      user?.email?.toLowerCase() === 'admin@delegatex.org' ||
      (user?.email?.toLowerCase().includes('admin') ?? false));
  const isDelegate = isAuthenticated && !isAdminOrChair;

  // If not authenticated or user is not an admin/chair, show the Secretariat Access Barrier
  if (!isAuthenticated || !isAdminOrChair) {
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
                to="/committee"
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition"
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Floor Chamber</span>
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>{user.name || 'Admin'} ({user.role})</span>
              </div>
            </div>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-300 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Staff Sign In</span>
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
          {/* Core Secretariat Controls */}
          <section className="delegate-panel rounded-3xl p-6 shadow-xl">
            <h2 className="text-xs uppercase font-bold tracking-[0.22em] text-slate-300 mb-4">
              Core Secretariat Controls
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
              <button
                onClick={() => setActiveModal('MEETING')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition shadow-md">
                  <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Live Meetings</span>
              </button>

              <button
                onClick={() => setActiveModal('STAFF')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition shadow-md">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Admin Accounts</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('prompt-generator-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 group-hover:scale-105 transition shadow-md">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Prompt Gen</span>
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
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Delegates & Allocations</span>
              </button>

              <button
                onClick={() => navigate('/admin/committees')}
                className="group flex flex-col items-center rounded-2xl p-4 transition hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 group-hover:scale-105 transition shadow-md">
                  <Layers className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2.5">Committees & Rosters</span>
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

          {/* Admin & Dais Personnel Accounts Management */}
          <section className="delegate-panel rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Secretariat Admin Accounts</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                    {staffList.length} Active
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create and manage Secretariat Administrator accounts. Admins can create only Admin accounts.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  placeholder="Filter admin accounts..."
                  className="rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none w-full sm:w-48"
                />
              </div>
            </div>

            {/* Quick Admin Creation Form */}
            <form onSubmit={handleAddStaff} className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Create New Admin Account</span>
                </p>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                  Admin Only Creation
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <input
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Full Name (e.g. Elena Rostova)"
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
                <input
                  required
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="Email address (e.g. admin@org.com)"
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
                <input
                  required
                  type="password"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="Password (6+ chars)"
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-slate-900/90 px-3 py-2 text-xs">
                  <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[11px] font-bold text-white truncate">Role: ADMIN</p>
                    <p className="text-[9px] text-cyan-400/80 truncate">Secretariat Administrator</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/10"
                >
                  {isCreatingStaff ? 'Creating...' : '+ Create Admin Account'}
                </button>
              </div>
            </form>

            {/* List of Admin Accounts */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {loadingStaff ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading admin accounts...</div>
              ) : staffList.filter((s) => {
                  if (!staffSearchQuery) return true;
                  const q = staffSearchQuery.toLowerCase();
                  return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
                }).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">No matching admin accounts found.</div>
              ) : (
                staffList
                  .filter((s) => {
                    if (!staffSearchQuery) return true;
                    const q = staffSearchQuery.toLowerCase();
                    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
                  })
                  .map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between rounded-xl bg-slate-950/80 border border-slate-800/90 p-3.5 hover:border-slate-700 transition"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate">{staff.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{staff.email}</p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            staff.role === 'ADMIN'
                              ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/20'
                              : 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                          }`}
                        >
                          {staff.role}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.id, staff.email)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 hover:border-rose-500/30 border border-transparent transition cursor-pointer"
                          title={`Delete ${staff.name}'s account`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>

          {/* Prompt Generator Section */}
          <PromptGenerator
            onApplyToMeeting={(appliedCommittee, appliedTopic) => {
              setNewMeetingTitle(appliedCommittee);
              setNewMeetingTopic(appliedTopic);
              const formEl = document.getElementById('create-meeting-form');
              if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
            }}
            showToast={showNotice}
          />
        </div>

        {/* Right Col: Create Live Meeting & Active Room Codes */}
        <aside className="space-y-6 lg:sticky lg:top-32">
          {/* Quick Create Live Meeting Box */}
          <div className="delegate-panel rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold flex items-center space-x-2 text-white">
              <LinkIcon className="w-4 h-4 text-cyan-300" />
              <span>Create Live Committee Room</span>
            </h2>
            <p className="text-xs text-slate-400">
              Generate synchronized room codes for live committee simulations or RoP masterclasses.
            </p>

            <form id="create-meeting-form" onSubmit={handleCreateMeeting} className="space-y-3 pt-1">
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
                className="w-full rounded-xl bg-cyan-300 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
              >
                Generate Room Code & Launch
              </button>
            </form>
          </div>

          {/* Active Room Codes */}
          <div className="delegate-panel rounded-3xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300 block">
                Active Room Codes ({meetings.length})
              </span>
            </div>

            {meetings.length === 0 ? (
              <div className="py-6 px-3 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-400">No active meetings scheduled</p>
                <p className="text-[11px] text-slate-500">
                  Create a live room above or use the Prompt Generator to initialize a single unified meeting server.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {meetings.map((m) => (
                  <div
                    key={m.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2 group"
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
                        className="px-2.5 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded-lg text-xs font-bold transition"
                      >
                        Join Room
                      </Link>
                      <button
                        onClick={() => handleDeleteMeeting(m.id, m.code)}
                        className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-rose-950/40 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-lg text-xs transition"
                        title="Delete room code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    : 'Secretariat Admin Accounts Roster'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                aria-label="Close panel"
                className="rounded-xl p-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
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
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-cyan-300 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition cursor-pointer"
                  >
                    Create Meeting Room
                  </button>
                </form>

                <div className="space-y-2 border-t border-slate-800 pt-4 max-h-56 overflow-y-auto">
                  {meetings.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No active meetings scheduled. Use the form above to initialize a room.
                    </p>
                  ) : (
                    meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3 border border-slate-800"
                      >
                        <div className="pr-2 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{meeting.title}</p>
                          <p className="font-mono text-[10px] text-cyan-400">{meeting.code}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            onClick={() => setActiveModal(null)}
                            to={`/room/${meeting.code}`}
                            className="rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 px-3 py-1.5 text-xs font-bold hover:bg-cyan-400/20"
                          >
                            Open Room
                          </Link>
                          <button
                            onClick={() => handleDeleteMeeting(meeting.id, meeting.code)}
                            className="rounded-lg bg-slate-900 border border-slate-800 p-1.5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                            title="Delete room code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Modal: Admin Accounts */}
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
                  <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-slate-900/90 px-3.5 py-2 text-xs">
                    <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div className="min-w-0 leading-tight">
                      <p className="text-xs font-bold text-white">Role: ADMIN</p>
                      <p className="text-[10px] text-cyan-400/80">Secretariat Administrator (Exclusive)</p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingStaff}
                    className="sm:col-span-2 rounded-xl bg-cyan-300 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingStaff ? 'Creating...' : '+ Create Admin Account'}
                  </button>
                </form>

                <div className="space-y-2 border-t border-slate-800 pt-4 max-h-56 overflow-y-auto">
                  {staffList.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3 border border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white">{staff.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-400">{staff.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300">
                          {staff.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.id, staff.email)}
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-slate-800 transition cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  );
}
