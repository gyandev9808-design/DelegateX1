import React from 'react';
import {
  ShieldAlert,
  MicOff,
  Lock,
  Unlock,
  MessageSquare,
  MonitorUp,
  UserX,
  X,
  Crown,
  CheckCircle,
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  country?: string;
  role: string;
  isMuted: boolean;
}

interface HostControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLocked: boolean;
  chatDisabled: boolean;
  screenShareDisabled: boolean;
  participants: Participant[];
  currentUserId: string;
  onMuteAll: () => void;
  onToggleLock: (locked: boolean) => void;
  onToggleChat: (disabled: boolean) => void;
  onToggleScreenShare: (disabled: boolean) => void;
  onKickParticipant: (userId: string) => void;
}

export default function HostControlsModal({
  isOpen,
  onClose,
  isLocked,
  chatDisabled,
  screenShareDisabled,
  participants,
  currentUserId,
  onMuteAll,
  onToggleLock,
  onToggleChat,
  onToggleScreenShare,
  onKickParticipant,
}: HostControlsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-cyan-400/40 max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a1b1e]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Host & Executive Dais Controls</h3>
              <p className="text-xs text-slate-400">Manage floor permissions, security & delegates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Dais Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Session-Wide Actions
            </h4>

            {/* Mute All */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Mute all delegates</p>
                <p className="text-[11px] text-slate-400">
                  Instantly silence all participants on the committee floor
                </p>
              </div>
              <button
                onClick={() => {
                  onMuteAll();
                  alert('All delegations have been muted.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold transition"
              >
                <MicOff className="h-3.5 w-3.5" />
                <span>Mute All</span>
              </button>
            </div>

            {/* Lock Meeting */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Meeting Lock</p>
                <p className="text-[11px] text-slate-400">
                  {isLocked
                    ? 'Floor is locked. No new delegates may enter without host permission.'
                    : 'Floor is open. Anyone with the link can join.'}
                </p>
              </div>
              <button
                onClick={() => onToggleLock(!isLocked)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  isLocked
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
              </button>
            </div>
          </div>

          {/* Delegate Floor Permissions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Delegate Permissions
            </h4>

            {/* Chat Permission */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-cyan-300" />
                <div>
                  <p className="text-xs font-bold text-white">Allow In-Call Chat Messages</p>
                  <p className="text-[11px] text-slate-400">Delegates can send public floor messages</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!chatDisabled}
                onChange={(e) => onToggleChat(!e.target.checked)}
                className="h-4 w-4 rounded accent-cyan-400"
              />
            </div>

            {/* Screen Share Permission */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MonitorUp className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-xs font-bold text-white">Allow Delegate Screen Sharing</p>
                  <p className="text-[11px] text-slate-400">Delegates can present documents and draft resolutions</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!screenShareDisabled}
                onChange={(e) => onToggleScreenShare(!e.target.checked)}
                className="h-4 w-4 rounded accent-cyan-400"
              />
            </div>
          </div>

          {/* Participant Moderation List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Delegations ({participants.length})
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {participants.map((p) => {
                const isSelf = p.id === currentUserId;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {p.name} {isSelf && '(You / Host)'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {p.country || 'Delegate'} · {p.role}
                      </p>
                    </div>

                    {!isSelf && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${p.name} from the committee session?`)) {
                            onKickParticipant(p.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition"
                        title="Remove participant"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1a1b1e] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-300 text-slate-950 font-bold text-xs hover:bg-cyan-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
