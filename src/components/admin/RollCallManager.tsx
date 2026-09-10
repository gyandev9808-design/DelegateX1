import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Globe,
  Trash2,
  Edit3,
  ChevronRight,
  Filter,
  Shield,
  X,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { CommitteeItem, CommitteeCountry, RollCallStatus } from '../../types';

interface RollCallManagerProps {
  initialCommitteeId?: string;
}

export default function RollCallManager({ initialCommitteeId }: RollCallManagerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCommitteeId = searchParams.get('committee');

  const [committees, setCommittees] = useState<CommitteeItem[]>([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>(
    initialCommitteeId || urlCommitteeId || ''
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RollCallStatus>('ALL');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);

  // Add Countries Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'MULTIPLE' | 'SINGLE'>('MULTIPLE');
  const [bulkCountryText, setBulkCountryText] = useState('');
  const [bulkStatus, setBulkStatus] = useState<RollCallStatus>('PRESENT');
  const [singleCountryName, setSingleCountryName] = useState('');
  const [singleBloc, setSingleBloc] = useState('General Member State');
  const [singleStatus, setSingleStatus] = useState<RollCallStatus>('PRESENT');
  const [singleP5, setSingleP5] = useState(false);
  const [singleDelegate, setSingleDelegate] = useState('');
  const [isSubmittingCountries, setIsSubmittingCountries] = useState(false);

  // Quick Add Committee Modal State
  const [isCreateCommitteeOpen, setIsCreateCommitteeOpen] = useState(false);
  const [newCmteCode, setNewCmteCode] = useState('');
  const [newCmteName, setNewCmteName] = useState('');
  const [newCmteTopic, setNewCmteTopic] = useState('');
  const [newCmteCategory, setNewCmteCategory] = useState('General Assembly');
  const [newCmtePreset, setNewCmtePreset] = useState('UNGA_CORE_30');

  // Edit Country Modal State
  const [editingCountry, setEditingCountry] = useState<CommitteeCountry | null>(null);
  const [editName, setEditName] = useState('');
  const [editBloc, setEditBloc] = useState('');
  const [editDelegate, setEditDelegate] = useState('');

  // In-app Delete Confirmation Modal States
  const [countryToDelete, setCountryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [committeeToDelete, setCommitteeToDelete] = useState<CommitteeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCommittees = async (preserveSelectedId?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/committees');
      if (res.ok) {
        const data = await res.json();
        const list: CommitteeItem[] = data.committees || [];
        setCommittees(list);

        // Determine active committee
        const targetId = preserveSelectedId || selectedCommitteeId || urlCommitteeId || (list[0] ? list[0].id : '');
        if (targetId && list.some((c) => c.id === targetId)) {
          setSelectedCommitteeId(targetId);
        } else if (list.length > 0) {
          setSelectedCommitteeId(list[0].id);
        }
      }
    } catch (err) {
      console.warn('Error fetching committees:', err);
      const cached = localStorage.getItem('mun_committees_cache');
      if (cached) {
        try {
          const parsed: CommitteeItem[] = JSON.parse(cached);
          setCommittees(parsed);
          if (parsed.length > 0 && !selectedCommitteeId) {
            setSelectedCommitteeId(parsed[0].id);
          }
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, []);

  // Sync selected committee with URL params
  const handleSelectCommittee = (cmteId: string) => {
    setSelectedCommitteeId(cmteId);
    setSearchParams({ committee: cmteId });
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  const activeCommittee = committees.find((c) => c.id === selectedCommitteeId) || committees[0] || null;

  // Handle single country status toggle (PRESENT -> PRESENT_AND_VOTING -> ABSENT)
  const handleToggleCountryStatus = async (country: CommitteeCountry, nextStatus: RollCallStatus) => {
    if (!activeCommittee) return;

    // Optimistic UI update
    const updatedCountries = activeCommittee.countries.map((c) =>
      c.id === country.id ? { ...c, status: nextStatus } : c
    );
    const updatedCommittee = { ...activeCommittee, countries: updatedCountries };

    setCommittees((prev) => prev.map((c) => (c.id === activeCommittee.id ? updatedCommittee : c)));

    try {
      const res = await fetch(`/api/committees/${activeCommittee.id}/countries/${country.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update country status');
    } catch (err) {
      showToast('Error syncing status with server, preserved locally', 'error');
    }
  };

  // Add Multiple / Single Countries
  const handleAddCountries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommittee) return;

    setIsSubmittingCountries(true);
    try {
      let payload: any = {};

      if (addMode === 'MULTIPLE') {
        const names = bulkCountryText
          .split(/[\n,;]+/)
          .map((n) => n.trim())
          .filter((n) => n.length > 0);

        if (names.length === 0) {
          showToast('Please enter at least one country name.', 'error');
          setIsSubmittingCountries(false);
          return;
        }

        payload = {
          names,
          defaultStatus: bulkStatus,
        };
      } else {
        if (!singleCountryName.trim()) {
          showToast('Country name is required.', 'error');
          setIsSubmittingCountries(false);
          return;
        }

        payload = {
          countries: [
            {
              name: singleCountryName.trim(),
              status: singleStatus,
              bloc: singleBloc,
              p5: singleP5,
              assignedDelegate: singleDelegate.trim() || undefined,
            },
          ],
        };
      }

      const res = await fetch(`/api/committees/${activeCommittee.id}/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add countries');
      }

      const data = await res.json();
      setCommittees((prev) => prev.map((c) => (c.id === activeCommittee.id ? data.committee : c)));

      showToast(`Countries successfully added to ${data.committee.code}!`);
      setIsAddModalOpen(false);
      setBulkCountryText('');
      setSingleCountryName('');
      setSingleDelegate('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add countries', 'error');
    } finally {
      setIsSubmittingCountries(false);
    }
  };

  // Load Preset directly into active committee
  const handleLoadPresetIntoCommittee = async (presetKey: string) => {
    if (!activeCommittee) return;
    setIsSubmittingCountries(true);
    try {
      const res = await fetch(`/api/committees/${activeCommittee.id}/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: presetKey, defaultStatus: 'PRESENT' }),
      });

      if (!res.ok) throw new Error('Failed to load preset');
      const data = await res.json();
      setCommittees((prev) => prev.map((c) => (c.id === activeCommittee.id ? data.committee : c)));
      showToast(`Preset delegations added to ${data.committee.code}!`);
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to load preset', 'error');
    } finally {
      setIsSubmittingCountries(false);
    }
  };

  // Batch Update (Mark All Present, Present & Voting, Reset)
  const handleBatchUpdate = async (action: 'MARK_ALL_PRESENT' | 'MARK_ALL_PRESENT_AND_VOTING' | 'RESET') => {
    if (!activeCommittee) return;

    try {
      const res = await fetch(`/api/committees/${activeCommittee.id}/roll-call/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error('Failed to batch update roll call');
      const data = await res.json();
      setCommittees((prev) => prev.map((c) => (c.id === activeCommittee.id ? data.committee : c)));

      const actionLabels = {
        MARK_ALL_PRESENT: 'All countries marked as Present',
        MARK_ALL_PRESENT_AND_VOTING: 'All countries marked as Present & Voting',
        RESET: 'Roll call reset (all marked absent for next session)',
      };
      showToast(actionLabels[action]);
    } catch (err: any) {
      showToast(err.message || 'Error updating roll call', 'error');
    }
  };

  // Delete Country from Committee (confirmed via modal)
  const confirmDeleteCountry = async () => {
    if (!activeCommittee || !countryToDelete) return;
    const { id: countryId, name: countryName } = countryToDelete;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/committees/${activeCommittee.id}/countries/${countryId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete country');
      const data = await res.json();
      setCommittees((prev) => prev.map((c) => (c.id === activeCommittee.id ? data.committee : c)));
      showToast(`${countryName} removed from committee.`);
      setCountryToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove country', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Committee (confirmed via modal)
  const confirmDeleteCommittee = async () => {
    if (!committeeToDelete) return;
    const { id, code } = committeeToDelete;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/committees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete committee');
      
      const remaining = committees.filter((c) => c.id !== id);
      setCommittees(remaining);
      showToast(`Committee ${code} deleted.`);
      setCommitteeToDelete(null);

      if (selectedCommitteeId === id) {
        setSelectedCommitteeId(remaining.length > 0 ? remaining[0].id : '');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete committee', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save edited country
  const handleSaveCountryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommittee || !editingCountry) return;

    try {
      const res = await fetch(`/api/committees/${activeCommittee.id}/countries/${editingCountry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          bloc: editBloc.trim(),
          assignedDelegate: editDelegate.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to update country');
      const data = await res.json();
      setCommittees((prev) => prev.map((c) => (c.id === activeCommittee.id ? data.committee : c)));
      showToast(`${editName} updated successfully.`);
      setEditingCountry(null);
    } catch (err: any) {
      showToast(err.message || 'Error saving changes', 'error');
    }
  };

  // Create new committee quickly
  const handleQuickCreateCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmteCode.trim() || !newCmteName.trim()) {
      showToast('Committee Code and Name are required.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCmteCode.trim().toUpperCase(),
          name: newCmteName.trim(),
          topic: newCmteTopic.trim(),
          category: newCmteCategory,
          preset: newCmtePreset !== 'NONE' ? newCmtePreset : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create committee');
      const data = await res.json();
      setCommittees((prev) => [...prev, data.committee]);
      setSelectedCommitteeId(data.committee.id);
      setSearchParams({ committee: data.committee.id });
      showToast(`Committee ${data.committee.code} created and opened!`);
      setIsCreateCommitteeOpen(false);
      setNewCmteCode('');
      setNewCmteName('');
      setNewCmteTopic('');
    } catch (err: any) {
      showToast(err.message || 'Failed to create committee', 'error');
    }
  };

  // Copy Roll Call Report to Clipboard
  const handleCopyRollCallSummary = () => {
    if (!activeCommittee) return;

    const total = activeCommittee.countries.length;
    const pv = activeCommittee.countries.filter((c) => c.status === 'PRESENT_AND_VOTING');
    const p = activeCommittee.countries.filter((c) => c.status === 'PRESENT');
    const absent = activeCommittee.countries.filter((c) => c.status === 'ABSENT');
    const presentTotal = pv.length + p.length;
    const quorumThreshold = Math.ceil(total / 3);
    const simpleMajority = Math.floor(presentTotal / 2) + 1;
    const twoThirdsMajority = Math.ceil((presentTotal * 2) / 3);

    const text = `=== OFFICIAL ROLL CALL & QUORUM REPORT ===
Committee: ${activeCommittee.code} - ${activeCommittee.name}
Agenda: ${activeCommittee.topic || 'General Debate'}
Date & Time: ${new Date().toLocaleString()}

-- QUORUM & VOTING BENCHMARKS --
Total Delegations Enrolled: ${total}
Quorum Threshold (1/3 required): ${quorumThreshold}
Delegations Present: ${presentTotal} (${presentTotal >= quorumThreshold ? 'QUORUM ATTAINED' : 'QUORUM NOT MET'})
Simple Majority (50% + 1): ${simpleMajority} votes
Two-Thirds Majority (2/3): ${twoThirdsMajority} votes

-- BREAKDOWN --
Present & Voting (${pv.length}):
${pv.map((c) => `• ${c.name} (${c.bloc || 'Member State'})`).join('\n') || 'None'}

Present (${p.length}):
${p.map((c) => `• ${c.name} (${c.bloc || 'Member State'})`).join('\n') || 'None'}

Absent (${absent.length}):
${absent.map((c) => `• ${c.name}`).join('\n') || 'None'}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Official Roll Call summary copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  // Calculation Math for Active Committee
  const countries = activeCommittee?.countries || [];
  const totalDelegations = countries.length;
  const presentAndVoting = countries.filter((c) => c.status === 'PRESENT_AND_VOTING');
  const presentOnly = countries.filter((c) => c.status === 'PRESENT');
  const absentDelegations = countries.filter((c) => c.status === 'ABSENT');
  const totalPresent = presentAndVoting.length + presentOnly.length;

  const quorumThreshold = Math.ceil(totalDelegations / 3);
  const quorumAttained = totalDelegations > 0 && totalPresent >= quorumThreshold;
  const simpleMajority = Math.floor(totalPresent / 2) + 1;
  const twoThirdsMajority = Math.ceil((totalPresent * 2) / 3);

  // Filter countries for display
  const filteredCountries = countries.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.bloc && c.bloc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.assignedDelegate && c.assignedDelegate.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border shadow-lg ${
            toastMessage.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Committee Selector Cards (User Request: "for eg: UNGA, then we click it it opens all the countries lists") */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Select Committee to Open Country List & Conduct Roll Call:</span>
          </label>
          <button
            onClick={() => setIsCreateCommitteeOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Committee</span>
          </button>
        </div>

        {/* Committee Chips / Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {committees.map((cmte) => {
            const isSelected = activeCommittee?.id === cmte.id;
            const cCount = cmte.countries?.length || 0;
            const pCount = cmte.countries?.filter((c) => c.status === 'PRESENT' || c.status === 'PRESENT_AND_VOTING').length || 0;
            const isQuorumMet = cCount > 0 && pCount >= Math.ceil(cCount / 3);

            return (
              <button
                key={cmte.id}
                onClick={() => handleSelectCommittee(cmte.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition relative cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/20 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-black text-xs ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {cmte.code}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isQuorumMet ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                    }`}
                    title={isQuorumMet ? 'Quorum Met' : 'Quorum Pending'}
                  />
                </div>
                <div className="text-[11px] text-slate-400 truncate w-full mt-1">{cmte.name}</div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Users className="h-2.5 w-2.5 text-cyan-400/70" />
                  <span>{cCount} Delegations</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Committee View: Opened Countries List */}
      {activeCommittee ? (
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Active Committee Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-cyan-400/20 border border-cyan-400/40 px-3 py-1 text-xs font-black text-cyan-300 tracking-wider">
                  {activeCommittee.code}
                </span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                  {activeCommittee.category}
                </span>
                {quorumAttained ? (
                  <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    QUORUM ATTAINED
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                    QUORUM PENDING ({totalPresent}/{quorumThreshold})
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {activeCommittee.name} — Roll Call Roster
              </h2>
              {activeCommittee.topic && (
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  <strong className="text-slate-400">Formal Agenda:</strong> {activeCommittee.topic}
                </p>
              )}
            </div>

            {/* Dais Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleCopyRollCallSummary}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-400" />}
                <span>{copied ? 'Copied!' : 'Copy Dais Summary'}</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Countries to {activeCommittee.code}</span>
              </button>

              <button
                onClick={() => setCommitteeToDelete(activeCommittee)}
                title="Delete this committee"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Delete Committee</span>
              </button>
            </div>
          </div>

          {/* Quorum and Dynamic Majority Math Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-white/10">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Delegations</div>
              <div className="mt-1 text-2xl font-black text-white">{totalDelegations}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Enrolled member states</div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-400/20">
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">Present & Voting</div>
              <div className="mt-1 text-2xl font-black text-cyan-300">{presentAndVoting.length}</div>
              <div className="text-[10px] text-cyan-200/70 mt-0.5">Mandatory substantive vote</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-400/20">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Present (Abstainable)</div>
              <div className="mt-1 text-2xl font-black text-emerald-300">{presentOnly.length}</div>
              <div className="text-[10px] text-emerald-200/70 mt-0.5">Eligible to abstain</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Absent</div>
              <div className="mt-1 text-2xl font-black text-slate-300">{absentDelegations.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Non-attending delegations</div>
            </div>
          </div>

          {/* Voting Majority Calculation Rules Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-bold text-white">Quorum Status:</span>
              <span>
                Requires 1/3 of council ({quorumThreshold} delegations). Currently{' '}
                <strong className={quorumAttained ? 'text-emerald-400' : 'text-amber-400'}>
                  {totalPresent} delegations present
                </strong>
                .
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Simple Majority (50% + 1):</span>
                <span className="text-cyan-300 font-bold px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20">
                  {totalPresent > 0 ? simpleMajority : 0} votes
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Two-Thirds (2/3):</span>
                <span className="text-indigo-300 font-bold px-2 py-0.5 rounded-md bg-indigo-400/10 border border-indigo-400/20">
                  {totalPresent > 0 ? twoThirdsMajority : 0} votes
                </span>
              </div>
            </div>
          </div>

          {/* Search, Status Filters & Batch Roll Call Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search countries by name, bloc, or delegate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-white/10 text-[11px]">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'ALL' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({totalDelegations})
                </button>
                <button
                  onClick={() => setStatusFilter('PRESENT_AND_VOTING')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'PRESENT_AND_VOTING' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  P&V ({presentAndVoting.length})
                </button>
                <button
                  onClick={() => setStatusFilter('PRESENT')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Present ({presentOnly.length})
                </button>
                <button
                  onClick={() => setStatusFilter('ABSENT')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'ABSENT' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Absent ({absentDelegations.length})
                </button>
              </div>
            </div>

            {/* Quick Batch Roll Call Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleBatchUpdate('MARK_ALL_PRESENT')}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-900/40 transition cursor-pointer"
                title="Mark all countries in this committee as Present"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleBatchUpdate('MARK_ALL_PRESENT_AND_VOTING')}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-950/40 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-900/40 transition cursor-pointer"
                title="Mark all countries as Present & Voting (Substantive mandate)"
              >
                Mark All P&V
              </button>
              <button
                onClick={() => handleBatchUpdate('RESET')}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 transition"
                title="Reset roll call (Mark all Absent for next session)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 3. The Country Roster Table / List */}
          {filteredCountries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-10 text-center space-y-3">
              <Globe className="h-9 w-9 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Countries in this Committee</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? 'No countries match your search filter.'
                  : `There are currently no country delegations added to ${activeCommittee.code}.`}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Countries to {activeCommittee.code}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden">
              {filteredCountries.map((country, idx) => {
                const isPV = country.status === 'PRESENT_AND_VOTING';
                const isP = country.status === 'PRESENT';
                const isAb = country.status === 'ABSENT';

                return (
                  <div
                    key={country.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-white/[0.02] transition"
                  >
                    {/* Left: Flag, Country Name, Bloc, Delegate */}
                    <div className="flex items-center gap-3">
                      <span className="text-xl sm:text-2xl select-none">{country.flag || '🌐'}</span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{country.name}</span>
                          {country.p5 && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              P5 Veto
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{country.bloc || 'General Member State'}</span>
                          {country.assignedDelegate && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-300 font-medium">Delegate: {country.assignedDelegate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: 3-State Interactive Roll Call Status Selector & Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-white/10">
                        {/* Present & Voting */}
                        <button
                          onClick={() => handleToggleCountryStatus(country, 'PRESENT_AND_VOTING')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                            isPV
                              ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30 font-black'
                              : 'text-slate-400 hover:text-cyan-300'
                          }`}
                          title="Mandatory substantive voting, no abstentions allowed"
                        >
                          Present & Voting
                        </button>

                        {/* Present */}
                        <button
                          onClick={() => handleToggleCountryStatus(country, 'PRESENT')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                            isP
                              ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/30 font-black'
                              : 'text-slate-400 hover:text-emerald-300'
                          }`}
                          title="Present, eligible to vote or abstain"
                        >
                          Present
                        </button>

                        {/* Absent */}
                        <button
                          onClick={() => handleToggleCountryStatus(country, 'ABSENT')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                            isAb
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 font-black'
                              : 'text-slate-400 hover:text-rose-300'
                          }`}
                          title="Absent from this committee session"
                        >
                          Absent
                        </button>
                      </div>

                      {/* Edit & Delete Country buttons */}
                      <button
                        onClick={() => {
                          setEditingCountry(country);
                          setEditName(country.name);
                          setEditBloc(country.bloc || '');
                          setEditDelegate(country.assignedDelegate || '');
                        }}
                        title="Edit country or assign delegate"
                        className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setCountryToDelete({ id: country.id, name: country.name })}
                        title="Remove country from committee"
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Modal: Add Multiple / Single Countries to Active Committee */}
      {isAddModalOpen && activeCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    Add Countries to {activeCommittee.code}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add multiple delegations at once or load standardized UN matrices
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher: Multiple (Bulk) vs Single */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setAddMode('MULTIPLE')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  addMode === 'MULTIPLE' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Add Multiple / Bulk Countries
              </button>
              <button
                type="button"
                onClick={() => setAddMode('SINGLE')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  addMode === 'SINGLE' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Add Single Country
              </button>
            </div>

            {/* Quick-Load Presets Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>One-Click Standardized Matrix Presets:</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadPresetIntoCommittee('G20')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-cyan-400 hover:text-slate-950 transition border border-white/5"
                >
                  + G20 Nations (20)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetIntoCommittee('UNSC_15')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-cyan-400 hover:text-slate-950 transition border border-white/5"
                >
                  + UNSC (P5 + E10)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetIntoCommittee('UNGA_CORE_30')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-cyan-400 hover:text-slate-950 transition border border-white/5"
                >
                  + Core UNGA 30
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetIntoCommittee('ASEAN_10')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-cyan-400 hover:text-slate-950 transition border border-white/5"
                >
                  + ASEAN 10
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetIntoCommittee('EU_KEY')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-cyan-400 hover:text-slate-950 transition border border-white/5"
                >
                  + European Union 15
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetIntoCommittee('AU_KEY')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-cyan-400 hover:text-slate-950 transition border border-white/5"
                >
                  + African Union 14
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCountries} className="space-y-4">
              {addMode === 'MULTIPLE' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Paste or Type Country Names (comma or line separated):
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="e.g. Canada, Mexico, Norway, Sweden, Finland, Poland, Brazil, Egypt, Nigeria, Singapore, India, Australia..."
                      value={bulkCountryText}
                      onChange={(e) => setBulkCountryText(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Countries already present in this committee will be automatically skipped to prevent duplicates.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Initial Roll Call Status
                    </label>
                    <select
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value as RollCallStatus)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="PRESENT">Present (Standard)</option>
                      <option value="PRESENT_AND_VOTING">Present & Voting (Substantive Mandate)</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Country Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Switzerland"
                      value={singleCountryName}
                      onChange={(e) => setSingleCountryName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Regional Bloc
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Western Bloc, African Group, GRULAC"
                        value={singleBloc}
                        onChange={(e) => setSingleBloc(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Initial Status
                      </label>
                      <select
                        value={singleStatus}
                        onChange={(e) => setSingleStatus(e.target.value as RollCallStatus)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="PRESENT">Present</option>
                        <option value="PRESENT_AND_VOTING">Present & Voting</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Assigned Delegate Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gyan Dev"
                      value={singleDelegate}
                      onChange={(e) => setSingleDelegate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="singleP5"
                      checked={singleP5}
                      onChange={(e) => setSingleP5(e.target.checked)}
                      className="rounded border-white/10 bg-slate-950 text-cyan-400 focus:ring-0"
                    />
                    <label htmlFor="singleP5" className="text-xs font-semibold text-slate-300">
                      Permanent Member with Veto Power (P5)
                    </label>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCountries}
                  className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCountries ? 'Adding...' : 'Add to Roll Call List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Add New Committee */}
      {isCreateCommitteeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-white">Create New Committee</h3>
              </div>
              <button
                onClick={() => setIsCreateCommitteeOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCommittee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UNODC, ICJ, NATO"
                    value={newCmteCode}
                    onChange={(e) => setNewCmteCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newCmteCategory}
                    onChange={(e) => setNewCmteCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="General Assembly">General Assembly</option>
                    <option value="Security & Disarmament">Security & Disarmament</option>
                    <option value="Human Rights & Social">Human Rights & Social</option>
                    <option value="Economic & Specialized">Economic & Specialized</option>
                    <option value="Crisis Simulation">Crisis Simulation</option>
                    <option value="Regional Bodies">Regional Bodies</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UN Office on Drugs and Crime"
                  value={newCmteName}
                  onChange={(e) => setNewCmteName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Agenda / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Combating Transnational Illicit Trafficking and Synthetic Opioids"
                  value={newCmteTopic}
                  onChange={(e) => setNewCmteTopic(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Initial Country Delegation Preset
                </label>
                <select
                  value={newCmtePreset}
                  onChange={(e) => setNewCmtePreset(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="UNGA_CORE_30">Core UNGA 30 Delegations</option>
                  <option value="G20">G20 Major Economies (20)</option>
                  <option value="UNSC_15">UN Security Council 15 Members</option>
                  <option value="NONE">Start Empty (Add countries manually)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateCommitteeOpen(false)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Country */}
      {editingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-extrabold text-white">Edit Country Delegation</h3>
              <button
                onClick={() => setEditingCountry(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCountryEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Country Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Regional Group / Bloc
                </label>
                <input
                  type="text"
                  value={editBloc}
                  onChange={(e) => setEditBloc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Assigned Delegate Name
                </label>
                <input
                  type="text"
                  placeholder="Delegate's real name or empty"
                  value={editDelegate}
                  onChange={(e) => setEditDelegate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCountry(null)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-400 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated In-App Confirmation Modal for Committee Deletion */}
      {committeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Delete Committee?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{committeeToDelete.code}</span>
                <span className="text-slate-400">{committeeToDelete.category}</span>
              </div>
              <p className="font-semibold text-white">{committeeToDelete.name}</p>
              <p className="text-slate-400 text-[11px]">
                Enrolled Delegations: <strong className="text-slate-200">{committeeToDelete.countries?.length || 0} countries</strong>
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Deleting this committee will remove all its country rosters, roll call records, and committee configurations.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCommitteeToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCommittee}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition shadow-lg shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Committee'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated In-App Confirmation Modal for Country Deletion */}
      {countryToDelete && activeCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Remove Country Delegation?</h3>
                <p className="text-xs text-slate-400">Remove from {activeCommittee.code} roll call</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{countryToDelete.name}</strong> from the <strong className="text-cyan-300">{activeCommittee.code}</strong> roster?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCountryToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCountry}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition shadow-lg shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Yes, Remove Delegation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
