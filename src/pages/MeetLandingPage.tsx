import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Video,
  Plus,
  Keyboard,
  Copy,
  Check,
  Shield,
  Clock,
  Sparkles,
  Users,
  Mic,
  MonitorUp,
  Globe2,
  ArrowRight,
  Radio,
} from 'lucide-react';

export default function MeetLandingPage() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating room
  const [committeeTitle, setCommitteeTitle] = useState('UN Security Council Session');
  const [agendaTopic, setAgendaTopic] = useState('Arctic Sovereignty & Maritime Navigation');
  const [hostName, setHostName] = useState('');
  const [hostRole, setHostRole] = useState<'CHAIR' | 'DELEGATE'>('CHAIR');

  const handleStartInstantMeeting = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: committeeTitle || 'Live Committee Session',
          committee: 'UNSC',
          agenda: agendaTopic || 'General Multilateral Debate',
          hostName: hostName || 'Session Host',
          hostRole: hostRole,
          hostCountry: hostRole === 'CHAIR' ? 'Executive Board' : 'Delegation',
        }),
      });
      const data = await res.json();
      if (data.roomId) {
        navigate(`/meet/${data.roomId}`);
      }
    } catch {
      // Fallback local code
      const code = 'unsc-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
      navigate(`/meet/${code}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateForLater = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: committeeTitle || 'Scheduled Committee Floor',
          committee: 'UNSC',
          agenda: agendaTopic || 'Multilateral Debate',
          hostName: hostName || 'Session Host',
          hostRole: hostRole,
        }),
      });
      const data = await res.json();
      if (data.roomId) {
        setGeneratedRoomId(data.roomId);
        setShowCreateModal(true);
      }
    } catch {
      const code = 'mun-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
      setGeneratedRoomId(code);
      setShowCreateModal(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;

    // Handle full URL or plain code
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
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
                <Radio className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
                <span>Live Video Meetings & Floor Sessions</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Real-time video meetings built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-400">Model UN</span> debate.
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
                Connect with delegates and secretariats across the globe with HD video, high-fidelity audio, live GSL speaker clocks, screen sharing, and real-time floor caucus tools.
              </p>
            </div>

            {/* Quick Meeting Controls */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleStartInstantMeeting}
                  disabled={isCreating}
                  className="flex items-center gap-2.5 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Video className="h-4 w-4" />
                  <span>{isCreating ? 'Creating Room...' : 'New Meeting'}</span>
                </button>

                <button
                  onClick={handleCreateForLater}
                  className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:border-cyan-400/40 transition"
                >
                  <Plus className="h-4 w-4 text-cyan-300" />
                  <span>Get Link for Later</span>
                </button>
              </div>

              {/* Code Entry Input */}
              <form onSubmit={handleJoinByCode} className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                  <Keyboard className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    placeholder="Enter a meeting code or link (e.g. abc-defg-hij)"
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
                    <p className="text-xs text-slate-400">Join instantly with 1-click</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Floor Active
                </span>
              </div>

              {/* Active Meeting Room Item 1 */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-3 transition hover:border-cyan-400/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      UN Security Council (UNSC)
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      Arctic Sovereignty & Maritime Corridors
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                    unsc-arkt-2026
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>15 Delegations on Floor</span>
                  </div>
                  <Link
                    to="/meet/unsc-arkt-2026"
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200"
                  >
                    <span>Enter Floor</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Active Meeting Room Item 2 */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-3 transition hover:border-cyan-400/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      UN Human Rights Council (UNHRC)
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      Protection of Displaced Persons in Conflict Zones
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                    hrc-prot-2026
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>22 Delegations on Floor</span>
                  </div>
                  <Link
                    to="/meet/hrc-prot-2026"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200"
                  >
                    <span>Enter Floor</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Configuration Fields for Custom Meeting */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-300">Customize Next Meeting</p>
                <input
                  type="text"
                  value={committeeTitle}
                  onChange={(e) => setCommitteeTitle(e.target.value)}
                  placeholder="Committee Title..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300"
                />
                <input
                  type="text"
                  value={agendaTopic}
                  onChange={(e) => setAgendaTopic(e.target.value)}
                  placeholder="Agenda Topic..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Get Link for Later */}
        {showCreateModal && generatedRoomId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="delegate-panel max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-cyan-400/30 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Here's your joining info</h3>
                    <p className="text-xs text-slate-400">Send this to delegates and co-chairs</p>
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
                  className="flex-1 rounded-xl bg-cyan-300 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition"
                >
                  Join Meeting Now
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
