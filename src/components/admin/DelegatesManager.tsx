import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Award,
  Sparkles,
  Download,
  Filter,
  UserCheck,
  UserX,
  Building2,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck,
  Flag,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CommitteeItem, CommitteeCountry } from '../../types';

export interface DelegateItem {
  id: string;
  name: string;
  email: string;
  role: string;
  gradeClass?: string;
  title?: string;
  country?: string;
  committee?: string;
  avatarColor?: string;
  createdAt?: number;
}

export const DelegatesManager: React.FC = () => {
  const [delegates, setDelegates] = useState<DelegateItem[]>([]);
  const [committees, setCommittees] = useState<CommitteeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCommitteeFilter, setSelectedCommitteeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Assign Modal State
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [targetDelegate, setTargetDelegate] = useState<DelegateItem | null>(null);
  const [assignCommittee, setAssignCommittee] = useState<string>('');
  const [assignCountry, setAssignCountry] = useState<string>('');
  const [customCountry, setCustomCountry] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  // Add Delegate Modal State
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newGrade, setNewGrade] = useState<string>('');
  const [newCommittee, setNewCommittee] = useState<string>('');
  const [newCountry, setNewCountry] = useState<string>('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);

  // Delete Confirm Modal State
  const [delegateToDelete, setDelegateToDelete] = useState<DelegateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Auto Allocate State
  const [isAutoAllocating, setIsAutoAllocating] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const broadcastUpdate = () => {
    try {
      localStorage.setItem('mun_assignments_timestamp', Date.now().toString());
      window.dispatchEvent(new Event('mun_assignments_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [delRes, cmteRes] = await Promise.all([
        fetch('/api/admin/delegates'),
        fetch('/api/committees'),
      ]);

      if (delRes.ok) {
        const delData = await delRes.json();
        setDelegates(delData.delegates || []);
      }

      if (cmteRes.ok) {
        const cmteData = await cmteRes.json();
        setCommittees(cmteData.committees || []);
      }
    } catch (err) {
      console.error('Failed to load delegates and committees:', err);
      showToast('Could not fetch delegates directory from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Delegates
  const filteredDelegates = useMemo(() => {
    return delegates.filter((del) => {
      const matchesSearch =
        !searchTerm ||
        del.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        del.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (del.country && del.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (del.committee && del.committee.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCommittee =
        selectedCommitteeFilter === 'ALL' ||
        (del.committee && (del.committee.toLowerCase() === selectedCommitteeFilter.toLowerCase() || del.committee.includes(selectedCommitteeFilter)));

      const isAssigned = !!(del.committee && del.country && del.committee.trim() !== '' && del.country.trim() !== '');
      const matchesStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ASSIGNED' && isAssigned) ||
        (selectedStatusFilter === 'UNASSIGNED' && !isAssigned);

      return matchesSearch && matchesCommittee && matchesStatus;
    });
  }, [delegates, searchTerm, selectedCommitteeFilter, selectedStatusFilter]);

  // Stats calculation
  const totalCount = delegates.length;
  const assignedCount = delegates.filter((d) => d.committee && d.country && d.committee.trim() !== '' && d.country.trim() !== '').length;
  const unassignedCount = totalCount - assignedCount;
  const coveragePercent = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

  // Find countries for currently selected committee in assign modal
  const activeCommitteeCountries = useMemo(() => {
    if (!assignCommittee) return [];
    const cmte = committees.find(
      (c) => c.name.toLowerCase() === assignCommittee.toLowerCase() || c.code.toLowerCase() === assignCommittee.toLowerCase() || c.id === assignCommittee
    );
    return cmte ? cmte.countries : [];
  }, [assignCommittee, committees]);

  // Open Assign Modal for a Delegate
  const handleOpenAssign = (delegate: DelegateItem) => {
    setTargetDelegate(delegate);
    setAssignCommittee(delegate.committee || (committees.length > 0 ? committees[0].name : ''));
    setAssignCountry(delegate.country || '');
    setCustomCountry('');
    setAssignModalOpen(true);
  };

  // Submit Assignment
  const handleSaveAssignment = async () => {
    if (!targetDelegate) return;
    const finalCountry = customCountry.trim() || assignCountry.trim();
    if (!assignCommittee && finalCountry) {
      showToast('Please choose a committee for this country allocation.', 'error');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      const res = await fetch('/api/admin/delegates/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegateId: targetDelegate.id,
          delegateEmail: targetDelegate.email,
          committee: assignCommittee,
          country: finalCountry,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Assigned ${targetDelegate.name} successfully!`);
        setDelegates((prev) =>
          prev.map((d) =>
            d.id === targetDelegate.id
              ? { ...d, committee: assignCommittee, country: finalCountry }
              : d
          )
        );
        broadcastUpdate();
        setAssignModalOpen(false);
      } else {
        showToast(data.error || 'Failed to save assignment.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error communicating with server.', 'error');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Unassign Delegate
  const handleUnassign = async (delegate: DelegateItem) => {
    try {
      const res = await fetch('/api/admin/delegates/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegateId: delegate.id,
          delegateEmail: delegate.email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Cleared assignments for ${delegate.name}.`);
        setDelegates((prev) =>
          prev.map((d) => (d.id === delegate.id ? { ...d, committee: '', country: '' } : d))
        );
        broadcastUpdate();
      } else {
        showToast(data.error || 'Failed to unassign.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Server error.', 'error');
    }
  };

  // Create New Delegate
  const handleCreateDelegate = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Delegate name and email are required.', 'error');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await fetch('/api/admin/delegates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          gradeClass: newGrade.trim(),
          committee: newCommittee.trim(),
          country: newCountry.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Delegate ${newName} created & registered successfully!`);
        setDelegates((prev) => [data.delegate, ...prev]);
        setNewName('');
        setNewEmail('');
        setNewGrade('');
        setNewCommittee('');
        setNewCountry('');
        setAddModalOpen(false);
        broadcastUpdate();
      } else {
        showToast(data.error || 'Failed to register delegate.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Server error creating delegate.', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Delete Delegate
  const handleDeleteDelegate = async () => {
    if (!delegateToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/delegates/${delegateToDelete.id}?email=${encodeURIComponent(delegateToDelete.email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Delegate ${delegateToDelete.name} deleted.`);
        setDelegates((prev) => prev.filter((d) => d.id !== delegateToDelete.id));
        setDelegateToDelete(null);
        broadcastUpdate();
      } else {
        showToast(data.error || 'Failed to delete delegate.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting delegate.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto Allocate Unassigned
  const handleAutoAllocate = async () => {
    if (unassignedCount === 0) {
      showToast('All registered delegates already have assigned portfolios!', 'info');
      return;
    }

    setIsAutoAllocating(true);
    try {
      const res = await fetch('/api/admin/delegates/auto-allocate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Auto-allocated ${data.allocatedCount} delegates!`);
        await loadData();
        broadcastUpdate();
      } else {
        showToast(data.error || 'Auto-allocation failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error during auto-allocation.', 'error');
    } finally {
      setIsAutoAllocating(false);
    }
  };

  // Export Roster as CSV
  const handleExportRoster = () => {
    if (delegates.length === 0) {
      showToast('No delegates to export.', 'info');
      return;
    }

    const headers = ['Full Name', 'Email', 'Grade/Class', 'Assigned Committee', 'Assigned Country', 'Allocation Status'];
    const rows = delegates.map((d) => [
      `"${d.name.replace(/"/g, '""')}"`,
      `"${d.email.replace(/"/g, '""')}"`,
      `"${(d.gradeClass || '').replace(/"/g, '""')}"`,
      `"${(d.committee || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(d.country || 'Not Allocated').replace(/"/g, '""')}"`,
      d.committee && d.country ? 'Assigned' : 'Pending Allocation',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DelegateX_Diplomatic_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Delegates roster exported as CSV successfully!');
  };

  return (
    <div id="delegates-manager" className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-500/30'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Sparkles className="h-5 w-5 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner & Stats */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Secretariat Allocation Desk</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Delegates & Matrix Allocations
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Assign registered delegates to specific committees and member state delegations. Once assigned, their official diplomatic credentials activate in their Delegate Dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="refresh-delegates-btn"
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold flex items-center gap-2 transition"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Sync</span>
            </button>

            <button
              id="export-roster-btn"
              onClick={handleExportRoster}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold flex items-center gap-2 transition"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              <span>Export Roster (CSV)</span>
            </button>

            <button
              id="auto-allocate-btn"
              onClick={handleAutoAllocate}
              disabled={isAutoAllocating || unassignedCount === 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/30 text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className={`h-4 w-4 ${isAutoAllocating ? 'animate-spin' : ''}`} />
              <span>{isAutoAllocating ? 'Allocating...' : `Auto-Allocate (${unassignedCount} Open)`}</span>
            </button>

            <button
              id="add-delegate-btn"
              onClick={() => setAddModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Delegate</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Delegates</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Registered in system</div>
          </div>

          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Allocated</span>
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{assignedCount}</div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Committee & Country set</div>
          </div>

          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Pending Allocation</span>
              <UserX className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-amber-300">{unassignedCount}</div>
            <div className="text-[11px] text-amber-400/80 mt-0.5">Awaiting assignment</div>
          </div>

          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4">
            <div className="flex items-center justify-between text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Roster Coverage</span>
              <Building2 className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-blue-300">{coveragePercent}%</div>
            <div className="text-[11px] text-blue-400/80 mt-0.5">{committees.length} active chambers</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="search-delegates-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search delegates by name, email, country, or committee..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/60 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Committee Filter */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 px-3.5 py-2.5 rounded-2xl">
            <Building2 className="h-4 w-4 text-cyan-400 shrink-0" />
            <select
              id="filter-committee-select"
              value={selectedCommitteeFilter}
              onChange={(e) => setSelectedCommitteeFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Committees</option>
              {committees.map((c) => (
                <option key={c.id} value={c.name} className="bg-slate-900 text-white">
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 px-3.5 py-2.5 rounded-2xl">
            <Filter className="h-4 w-4 text-blue-400 shrink-0" />
            <select
              id="filter-status-select"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Statuses ({totalCount})</option>
              <option value="ASSIGNED" className="bg-slate-900 text-white">Assigned ({assignedCount})</option>
              <option value="UNASSIGNED" className="bg-slate-900 text-white">Pending Allocation ({unassignedCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delegates Table / Card List */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/90 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Registered Delegates Directory ({filteredDelegates.length})
            </span>
          </div>
          {filteredDelegates.length < totalCount && (
            <span className="text-xs text-slate-400">
              Filtered from {totalCount} total delegates
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-sm">Loading diplomatic delegation records...</p>
          </div>
        ) : filteredDelegates.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3 px-4">
            <UserX className="h-12 w-12 text-slate-600 mx-auto" />
            <p className="text-base font-bold text-white">No matching delegates found</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchTerm || selectedCommitteeFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
                ? 'Try adjusting your search terms or filter selections.'
                : 'No delegates currently registered. Click "+ Add Delegate" above to register people.'}
            </p>
            {(searchTerm || selectedCommitteeFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCommitteeFilter('ALL');
                  setSelectedStatusFilter('ALL');
                }}
                className="mt-2 text-xs font-bold text-cyan-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredDelegates.map((delegate) => {
              const isAssigned = !!(delegate.committee && delegate.country && delegate.committee.trim() !== '' && delegate.country.trim() !== '');

              return (
                <div
                  key={delegate.id}
                  id={`delegate-row-${delegate.id}`}
                  className="p-5 sm:px-6 hover:bg-white/[0.02] transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Delegate Identity */}
                  <div className="flex items-start sm:items-center gap-4 min-w-[260px]">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-base shadow-md shrink-0">
                      {delegate.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'D'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base">{delegate.name}</span>
                        {isAssigned ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Assigned</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Pending Allocation</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{delegate.email}</span>
                        {delegate.gradeClass && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300">{delegate.gradeClass}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Committee & Country Portfolio Badges */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 max-w-xl">
                    {/* Committee Badge */}
                    <div className="flex-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                        <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Assigned Committee</span>
                      </div>
                      <div className="text-sm font-semibold text-white truncate">
                        {delegate.committee ? (
                          <span className="text-cyan-300">{delegate.committee}</span>
                        ) : (
                          <span className="text-slate-400 italic">No committee chosen</span>
                        )}
                      </div>
                    </div>

                    {/* Country Badge */}
                    <div className="flex-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                        <Globe className="h-3.5 w-3.5 text-blue-400" />
                        <span>Assigned Country</span>
                      </div>
                      <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                        {delegate.country ? (
                          <>
                            <span className="text-amber-300">{delegate.country}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">No country chosen</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      id={`assign-btn-${delegate.id}`}
                      onClick={() => handleOpenAssign(delegate)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Assign or edit committee & country for this delegate"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>{isAssigned ? 'Edit Allocation' : 'Assign Portfolio'}</span>
                    </button>

                    {isAssigned && (
                      <button
                        onClick={() => handleUnassign(delegate)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                        title="Unassign committee & country"
                      >
                        Unassign
                      </button>
                    )}

                    <button
                      onClick={() => setDelegateToDelete(delegate)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete delegate record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: ASSIGN COMMITTEE & COUNTRY TO DELEGATE */}
      {/* ========================================================= */}
      {assignModalOpen && targetDelegate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Assign Diplomatic Portfolio</h3>
                  <p className="text-xs text-slate-400">{targetDelegate.name} ({targetDelegate.email})</p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Committee Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Select Committee Chamber
                </label>
                <select
                  id="modal-assign-committee-select"
                  value={assignCommittee}
                  onChange={(e) => {
                    setAssignCommittee(e.target.value);
                    setAssignCountry('');
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                >
                  <option value="">-- Choose Committee --</option>
                  {committees.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.code} — {c.name} ({c.countries.length} delegations)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Country Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  2. Select Member State / Delegation Country
                </label>

                {activeCommitteeCountries.length > 0 ? (
                  <div className="space-y-3">
                    <select
                      id="modal-assign-country-select"
                      value={assignCountry}
                      onChange={(e) => {
                        setAssignCountry(e.target.value);
                        if (e.target.value) setCustomCountry('');
                      }}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                    >
                      <option value="">-- Choose from Chamber Roster --</option>
                      {activeCommitteeCountries.map((c) => {
                        const isCurrent = targetDelegate.country === c.name;
                        const isOccupied = c.assignedDelegate && c.assignedDelegate !== targetDelegate.name;
                        return (
                          <option key={c.id} value={c.name}>
                            {c.flag || '🌐'} {c.name} {c.p5 ? '(P5 Veto)' : ''} {isOccupied ? `— [Occupied: ${c.assignedDelegate}]` : isCurrent ? '— [Current Assignment]' : '— [Available]'}
                          </option>
                        );
                      })}
                    </select>

                    <div className="text-center text-xs text-slate-400">or type a custom country name</div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mb-2">
                    {assignCommittee ? 'No preset countries in this committee. Type custom country below:' : 'Please select a committee above first.'}
                  </p>
                )}

                <input
                  id="modal-assign-custom-country-input"
                  type="text"
                  value={customCountry}
                  onChange={(e) => {
                    setCustomCountry(e.target.value);
                    if (e.target.value) setAssignCountry('');
                  }}
                  placeholder="Or enter custom country (e.g. Germany, Japan, Brazil...)"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition mt-2"
                />
              </div>

              {/* Summary of Assignment */}
              <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-4 space-y-1">
                <div className="text-xs font-bold text-cyan-300">Assignment Summary:</div>
                <div className="text-sm text-slate-200">
                  Assign <strong className="text-white">{targetDelegate.name}</strong> as the Official Delegate of{' '}
                  <strong className="text-amber-300">{customCountry.trim() || assignCountry || 'Pending Selection'}</strong> in{' '}
                  <strong className="text-cyan-300">{assignCommittee || 'Pending Selection'}</strong>.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                id="modal-confirm-assign-btn"
                type="button"
                disabled={isSubmittingAssign || (!assignCountry && !customCountry.trim())}
                onClick={handleSaveAssignment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-black shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingAssign ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Assignment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Assign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD NEW DELEGATE */}
      {/* ========================================================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Register New Delegate</h3>
                  <p className="text-xs text-slate-400">Add a delegate to the diplomatic roster</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="new-delegate-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Samantha Vance"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="new-delegate-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. samantha.vance@munmail.org"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Academic Grade / Class
                </label>
                <input
                  id="new-delegate-grade"
                  type="text"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="e.g. Grade 11 / Senior / University"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Committee (Optional)
                  </label>
                  <select
                    id="new-delegate-committee"
                    value={newCommittee}
                    onChange={(e) => setNewCommittee(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition"
                  >
                    <option value="">-- None (Allocate later) --</option>
                    {committees.map((c) => (
                      <option key={c.id} value={c.name}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Country (Optional)
                  </label>
                  <input
                    id="new-delegate-country"
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    placeholder="e.g. France, Japan..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                id="confirm-create-delegate-btn"
                type="button"
                disabled={isSubmittingAdd || !newName.trim() || !newEmail.trim()}
                onClick={handleCreateDelegate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-black shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingAdd ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Register Delegate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {delegateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Delegate Record?</h3>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to permanently delete delegate <strong className="text-white">{delegateToDelete.name}</strong> ({delegateToDelete.email})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setDelegateToDelete(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteDelegate}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
              >
                {isDeleting ? 'Deleting...' : 'Delete Delegate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
