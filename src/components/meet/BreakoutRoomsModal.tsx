import React, { useState } from 'react';
import {
  Users,
  DoorOpen,
  Plus,
  ArrowRight,
  Shield,
  X,
  Radio,
} from 'lucide-react';

interface BreakoutRoom {
  id: string;
  name: string;
  count?: number;
}

interface BreakoutRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
  activeBreakout: string | null;
  onSwitchBreakout: (breakoutId: string | null, breakoutName: string) => void;
}

export default function BreakoutRoomsModal({
  isOpen,
  onClose,
  currentRoomId,
  activeBreakout,
  onSwitchBreakout,
}: BreakoutRoomsModalProps) {
  const [breakouts, setBreakouts] = useState<BreakoutRoom[]>([
    { id: 'plenary', name: 'Plenary Main Committee Hall' },
    { id: 'bloc-alpha', name: 'Caucus Bloc Alpha (P5 & Atlantic Security)' },
    { id: 'bloc-bravo', name: 'Caucus Bloc Bravo (Non-Aligned & G77)' },
    { id: 'crisis-wg', name: 'Emergency Crisis Working Group' },
  ]);
  const [newRoomName, setNewRoomName] = useState('');

  if (!isOpen) return null;

  const handleCreateBreakout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const newRoom: BreakoutRoom = {
      id: 'custom-' + Math.random().toString(36).substring(2, 7),
      name: newRoomName.trim(),
    };

    setBreakouts([...breakouts, newRoom]);
    setNewRoomName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-cyan-400/30 max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a1b1e]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Unmoderated Caucus Breakout Rooms</h3>
              <p className="text-xs text-slate-400">Join sub-caucuses to negotiate operative clauses</p>
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Available Caucus Rooms
            </p>

            <div className="space-y-2.5">
              {breakouts.map((room) => {
                const isCurrent =
                  (room.id === 'plenary' && !activeBreakout) ||
                  activeBreakout === room.id;

                return (
                  <div
                    key={room.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-cyan-500/10 border-cyan-400/40 text-white'
                        : 'bg-slate-950 border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                          isCurrent
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Radio className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{room.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {room.id === 'plenary' ? 'Main Chamber' : 'Caucus Working Group'}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="text-[11px] font-bold text-cyan-300 bg-cyan-400/20 px-3 py-1 rounded-full border border-cyan-400/30">
                        Current Room
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSwitchBreakout(
                            room.id === 'plenary' ? null : room.id,
                            room.name
                          );
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
                      >
                        <span>Join</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Custom Breakout Room */}
          <form onSubmit={handleCreateBreakout} className="pt-3 border-t border-white/10 space-y-2">
            <p className="text-xs font-bold text-slate-300">Create New Working Bloc</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Humanitarian Taskforce..."
                className="flex-1 rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300"
              />
              <button
                type="submit"
                disabled={!newRoomName.trim()}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-cyan-300 text-slate-950 text-xs font-bold hover:bg-cyan-200 disabled:opacity-40 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1a1b1e] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
