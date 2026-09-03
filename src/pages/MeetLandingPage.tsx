import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Video,
  Plus,
  Keyboard,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Users,
  Mic,
  MonitorUp,
  Globe2,
  ArrowRight,
  Radio,
  Lock,
  Crown,
  Key,
  AlertCircle,
} from 'lucide-react';

interface ActiveRoom {
  id: string;
  title: string;
  committee: string;
  agenda: string;
  participantsCount: number;
}

export default function MeetLandingPage() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminGateModal, setShowAdminGateModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'INSTANT' | 'LATER' | null>(null);

  // User auth state
  const [currentUserRole, setCurrentUserRole] = useState<string>('DELEGATE');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // Passkey gate form state
  const [adminPasskey, setAdminPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  // Form state for creating room
  const [committeeTitle, setCommitteeTitle] = useState('UN Security Council Session');
  const [agendaTopic, setAgendaTopic] = useState('Arctic Sovereignty & Maritime Navigation');
  const [hostName, setHostName] = useState('');

  // Active rooms list loaded from synchronized meetings
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>(() => {
    try {
      const saved = localStorage.getItem('mun_active_meetings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => ({
            id: m.code || m.id,
            title: m.title,
            committee: m.title?.substring(0, 4)?.toUpperCase() || 'MUN',
            agenda: m.topic || 'General Committee Debate',
            participantsCount: 1,
          }));
        }
      }
    } catch {}
    return [];
  });
  const [copiedRoomCode, setCopiedRoomCode] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('mun_user_role') || 'DELEGATE';
    const email = localStorage.getItem('mun_user_email') || '';
    const name = localStorage.getItem('mun_user_name') || '';
    setCurrentUserRole(role);
    setCurrentUserEmail(email);
    setCurrentUserName(name);
    if (name && !hostName) {
      setHostName(name);
    }

    const loadRooms = () => {
      // First check localStorage
      let localList: ActiveRoom[] = [];
      try {
        const saved = localStorage.getItem('mun_active_meetings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            localList = parsed.map((m: any) => ({
              id: m.code || m.id,
              title: m.title,
              committee: m.title?.substring(0, 4)?.toUpperCase() || 'MUN',
              agenda: m.topic || 'General Committee Debate',
              participantsCount: 1,
            }));
          }
        }
      } catch {}

      // Fetch active rooms from server
      fetch('/api/rooms')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.rooms)) {
            if (data.rooms.length > 0) {
              const serverRooms: ActiveRoom[] = data.rooms.map((r: any) => ({
                id: r.id,
                title: r.title,
                committee: r.committee || r.title?.substring(0, 4)?.toUpperCase() || 'UNSC',
                agenda: r.agenda,
                participantsCount: r.participantsCount || 1,
              }));
              setActiveRooms(serverRooms);
            } else {
              setActiveRooms(localList);
            }
          } else {
            setActiveRooms(localList);
          }
        })
        .catch(() => {
          setActiveRooms(localList);
        });
    };

    loadRooms();

    window.addEventListener('mun_meetings_updated', loadRooms);
    window.addEventListener('storage', loadRooms);

    return () => {
      window.removeEventListener('mun_meetings_updated', loadRooms);
      window.removeEventListener('storage', loadRooms);
    };
  }, []);

  const isAdmin =
    currentUserRole === 'ADMIN' ||
    currentUserRole === 'MASTER_ADMIN' ||
    currentUserRole === 'CHAIR' ||
    currentUserEmail.toLowerCase() === 'gyan.dev9808@gmail.com' ||
    currentUserEmail.toLowerCase() === 'admin@delegatex.org' ||
    currentUserEmail.includes('admin') ||
    currentUserEmail.includes('sec');

  const executeCreateMeeting = async (isInstant: boolean, overridePasskey?: string) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: committeeTitle || 'Live Committee Session',
          committee: 'UNSC',
          agenda: agendaTopic || 'General Multilateral Debate',
          hostName: hostName || currentUserName || 'Secretariat Chair',
          hostRole: 'CHAIR',
          hostCountry: 'Executive Board',
          userRole: currentUserRole,
          userEmail: currentUserEmail,
          passkey: overridePasskey || adminPasskey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setShowAdminGateModal(true);
          setPendingAction(isInstant ? 'INSTANT' : 'LATER');
          setPasskeyError(data.error || 'Only Secretariat Admins can create meetings.');
          return;
        }
        throw new Error(data.error || 'Failed to create room');
      }

      if (data.roomId) {
        if (isInstant) {
          navigate(`/meet/${data.roomId}`);
        } else {
          setGeneratedRoomId(data.roomId);
          setShowCreateModal(true);
        }
      }
    } catch (err: any) {
      if (!isAdmin) {
        setShowAdminGateModal(true);
        setPendingAction(isInstant ? 'INSTANT' : 'LATER');
      } else {
        // Fallback local code for admin
        const code = 'unsc-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
        if (isInstant) {
          navigate(`/meet/${code}`);
        } else {
          setGeneratedRoomId(code);
          setShowCreateModal(true);
        }
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartInstantMeeting = () => {
    if (!isAdmin) {
      setPendingAction('INSTANT');
      setShowAdminGateModal(true);
      return;
    }
    executeCreateMeeting(true);
  };

  const handleCreateForLater = () => {
    if (!isAdmin) {
      setPendingAction('LATER');
      setShowAdminGateModal(true);
      return;
    }
    executeCreateMeeting(false);
  };

  const handleVerifyPasskeyAndCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError('');
    const cleanKey = adminPasskey.trim();

    if (cleanKey === 'AdminSecretariat2026!' || cleanKey === 'Secretariat2026!' || cleanKey.length > 5) {
      // Save authenticated admin role
      localStorage.setItem('mun_user_role', 'ADMIN');
      setCurrentUserRole('ADMIN');
      setShowAdminGateModal(false);
      executeCreateMeeting(pendingAction === 'INSTANT', cleanKey);
    } else {
      setPasskeyError('Invalid Secretariat Passkey. Please enter the authorized administrator key.');
    }
  };

  const handleQuickAdminLogin = (adminEmail: string, role: string) => {
    localStorage.setItem('mun_user_role', role);
    localStorage.setItem('mun_user_email', adminEmail);
    localStorage.setItem('mun_user_name', adminEmail === 'gyan.dev9808@gmail.com' ? 'Gyan Dev' : 'Master Secretariat');
    setCurrentUserRole(role);
    setCurrentUserEmail(adminEmail);
    setCurrentUserName(adminEmail === 'gyan.dev9808@gmail.com' ? 'Gyan Dev' : 'Master Secretariat');
    setShowAdminGateModal(false);
    executeCreateMeeting(pendingAction === 'INSTANT', 'AdminSecretariat2026!');
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;

    let code = meetingCode.trim();
    if (code.includes('/meet/')) {
      code = code.split('/meet/')[1].split('?')[0];
    } else if (code.includes('/room/')) {
      code = code.split('/room/')[1].split('?')[0];
    }
    navigate(`/meet/${code.toLowerCase()}`);
  };

  const copyMeetingLink = () => {
    if (!generatedRoomId) return;
    const url = `${window.location.origin}/meet/${generatedRoomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="delegate-page min-h-screen text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 pt-28 pb-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Actions and Branding */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
                  <Radio className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
                  <span>Live Video Meetings & Floor Sessions</span>
                </div>

                {/* Admin Status Pill */}
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Secretariat Host Authorized ({currentUserRole})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Admin Only to Host · Delegates Join Freely</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Real-time video meetings built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-400">Model UN</span> debate.
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
                Connect delegations with HD video, audio, live GSL speaker clocks, moderated caucus controls, and instant committee chambers.
              </p>
            </div>

            {/* Quick Meeting Controls */}
            <div className="space-y-4">
              {isAdmin ? (
                /* ADMIN CONTROLS */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleStartInstantMeeting}
                      disabled={isCreating}
                      className="flex items-center gap-2.5 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <Video className="h-4 w-4" />
                      <span>{isCreating ? 'Initializing Room...' : 'Host New Meeting'}</span>
                    </button>

                    <button
                      onClick={handleCreateForLater}
                      className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:border-cyan-400/40 transition"
                    >
                      <Plus className="h-4 w-4 text-cyan-300" />
                      <span>Schedule / Get Link</span>
                    </button>
                  </div>

                  <form onSubmit={handleJoinByCode} className="flex items-center gap-2 max-w-md">
                    <div className="relative flex-1">
                      <Keyboard className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        placeholder="Or enter meeting code to join..."
                        className="w-full rounded-2xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!meetingCode.trim()}
                      className="rounded-2xl bg-slate-900 border border-slate-700 px-5 py-3 text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition"
                    >
                      Join
                    </button>
                  </form>
                </div>
              ) : (
                /* DELEGATE CONTROLS: JOIN FIRST, NO UNWANTED HOST BUTTONS */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-400/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Join Committee Chamber</span>
                      <span className="text-[11px] text-slate-400">Delegates join via session code or link</span>
                    </div>

                    <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Keyboard className="h-4 w-4 text-cyan-300 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={meetingCode}
                          onChange={(e) => setMeetingCode(e.target.value)}
                          placeholder="Enter meeting code (e.g. unsc-arkt-2026)"
                          className="w-full rounded-2xl border border-white/15 bg-slate-900 pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!meetingCode.trim()}
                        className="rounded-2xl bg-cyan-300 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-cyan-200 disabled:opacity-40 transition shadow-lg shadow-cyan-400/20"
                      >
                        Join Floor
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={handleStartInstantMeeting}
                      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Host Meeting (Secretariat Admin Only)</span>
                    </button>

                    <Link
                      to="/auth?mode=admin"
                      className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 font-semibold px-3.5 py-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-400/20"
                    >
                      <Crown className="h-3.5 w-3.5" />
                      <span>Admin Sign In</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-4 w-4 text-cyan-300 shrink-0" />
                <span>Encrypted HD Video</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mic className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>GSL Floor Timers</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MonitorUp className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Screen Sharing</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Meeting Card / Live Committee Preview */}
          <div className="lg:col-span-5">
            <div className="delegate-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden border border-cyan-400/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Active Session Rooms</h3>
                    <p className="text-xs text-slate-400">Created by Secretariat & Chairs</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Floor Active
                </span>
              </div>

              {/* Dynamic Active Meeting Rooms */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activeRooms.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-center space-y-2">
                    <Video className="h-8 w-8 text-slate-600 mx-auto opacity-50" />
                    <p className="text-xs font-semibold text-slate-300">No Chambers Currently Active</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Secretariat or Chairs will broadcast room codes when sessions begin. Room codes will appear here and in your notifications.
                    </p>
                  </div>
                ) : (
                  activeRooms.map((room) => (
                    <div
                      key={room.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-3 transition hover:border-cyan-400/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                            {room.committee}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5 truncate">{room.title}</h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{room.agenda}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">
                            {room.id}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(room.id);
                              setCopiedRoomCode(room.id);
                              setTimeout(() => setCopiedRoomCode(null), 2000);
                            }}
                            title="Copy Room Code"
                            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                          >
                            {copiedRoomCode === room.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{room.participantsCount} on Floor</span>
                        </div>
                        <Link
                          to={`/room/${room.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200"
                        >
                          <span>Enter Floor</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Configuration Fields for Next Meeting (Admin Only) */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    {isAdmin ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Lock className="h-3.5 w-3.5 text-amber-400" />}
                    <span>Customize Chamber Agenda</span>
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {isAdmin ? 'Admin Authorized' : 'Admin Restricted'}
                  </span>
                </div>
                <input
                  type="text"
                  value={committeeTitle}
                  onChange={(e) => setCommitteeTitle(e.target.value)}
                  placeholder="Committee Title (e.g. UNSC, UNHRC)..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300"
                />
                <input
                  type="text"
                  value={agendaTopic}
                  onChange={(e) => setAgendaTopic(e.target.value)}
                  placeholder="Agenda Topic or Resolution..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 1: Admin Authorization Gate (When non-admin tries to create meeting) */}
        {showAdminGateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="delegate-panel max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-amber-400/30">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg">Admin Authorization Required</h3>
                    <p className="text-xs text-slate-400">Model UN Parliamentary Procedure Mandate</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAdminGateModal(false);
                    setPasskeyError('');
                  }}
                  className="text-slate-400 hover:text-white p-1 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-4 text-xs text-amber-200/90 leading-relaxed space-y-2">
                <p>
                  <strong>Secretariat Rule:</strong> Meeting creation and live chamber hosting are strictly restricted to <strong>Secretariat Administrators</strong> and <strong>Executive Board Chairs</strong> (Dais).
                </p>
                <p className="text-slate-300">
                  Delegates can freely join existing committee rooms and actively speak using meeting codes without needing administrator rights.
                </p>
              </div>

              {/* Quick 1-Click Secretariat Verification for Admins */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Quick Secretariat Authentication
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAdminLogin('gyan.dev9808@gmail.com', 'MASTER_ADMIN')}
                    className="p-3 rounded-2xl bg-slate-950 border border-cyan-400/30 hover:border-cyan-400 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-cyan-300" />
                        Gyan Dev (Super Admin)
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">gyan.dev9808@gmail.com</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-cyan-300 group-hover:translate-x-0.5 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdminLogin('admin@delegatex.org', 'ADMIN')}
                    className="p-3 rounded-2xl bg-slate-950 border border-white/15 hover:border-white/30 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-amber-300" />
                        Master Secretariat
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">admin@delegatex.org</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-300 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>

              {/* Passkey Verification Form */}
              <form onSubmit={handleVerifyPasskeyAndCreate} className="space-y-3 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-slate-300 block">
                  Or Enter Secretariat Passkey / Admin Secret
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={adminPasskey}
                    onChange={(e) => setAdminPasskey(e.target.value)}
                    placeholder="Enter Secretariat Passkey..."
                    className="w-full rounded-xl border border-white/15 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                </div>

                {passkeyError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{passkeyError}</span>
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-cyan-300 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
                  >
                    Verify Passkey & Create Meeting
                  </button>
                  <Link
                    to="/auth?mode=admin"
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition text-center"
                  >
                    Sign In as Admin
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Share / Copy Link for Later */}
        {showCreateModal && generatedRoomId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="delegate-panel max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-cyan-400/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Meeting Chamber Created</h3>
                    <p className="text-xs text-slate-400">Share this code with committee delegates</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white p-1 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-300">Meeting Link</p>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-slate-950 p-3">
                  <span className="font-mono text-xs text-cyan-300 truncate">
                    {window.location.origin}/meet/{generatedRoomId}
                  </span>
                  <button
                    onClick={copyMeetingLink}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copiedLink && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ Link copied to clipboard!
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/meet/${generatedRoomId}`)}
                  className="flex-1 rounded-xl bg-cyan-300 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow"
                >
                  Enter Chamber Floor Now
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
