import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit3,
  Users,
  Calendar,
  Globe,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Sparkles,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { CommitteeItem, CommitteeCountry, RollCallStatus } from '../../types';

interface CommitteesManagerProps {
  onSelectCommitteeForRollCall?: (committeeId: string) => void;
}

export default function CommitteesManager({ onSelectCommitteeForRollCall }: CommitteesManagerProps) {
  const navigate = useNavigate();
  const [committees, setCommittees] = useState<CommitteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State for Adding / Editing Committee
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<CommitteeItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    topic: '',
    category: 'General Assembly',
    chairName: '',
    description: '',
    presetRoster: 'UNGA_CORE_30',
    customCountries: '',
  });
  const [saving, setSaving] = useState(false);

  // In-app Delete Confirmation Modal State
  const [committeeToDelete, setCommitteeToDelete] = useState<CommitteeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/committees');
      if (res.ok) {
        const data = await res.json();
        setCommittees(data.committees || []);
      } else {
        throw new Error('Failed to load committees');
      }
    } catch (err) {
      console.warn('Could not fetch from server, using local storage or seed');
      const cached = localStorage.getItem('mun_committees_cache');
      if (cached) {
        try {
          setCommittees(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, []);

  // Save cache when committees change
  useEffect(() => {
    if (committees.length > 0) {
      localStorage.setItem('mun_committees_cache', JSON.stringify(committees));
    } else {
      localStorage.removeItem('mun_committees_cache');
    }
  }, [committees]);

  const openCreateModal = () => {
    setEditingCommittee(null);
    setFormData({
      code: '',
      name: '',
      topic: '',
      category: 'General Assembly',
      chairName: '',
      description: '',
      presetRoster: 'UNGA_CORE_30',
      customCountries: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cmte: CommitteeItem) => {
    setEditingCommittee(cmte);
    setFormData({
      code: cmte.code,
      name: cmte.name,
      topic: cmte.topic || '',
      category: cmte.category || 'General Assembly',
      chairName: cmte.chairName || '',
      description: cmte.description || '',
      presetRoster: 'NONE',
      customCountries: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      showToast('Committee Code and Name are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingCommittee) {
        // Update
        const res = await fetch(`/api/committees/${editingCommittee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.code,
            name: formData.name,
            topic: formData.topic,
            category: formData.category,
            chairName: formData.chairName,
            description: formData.description,
          }),
        });

        if (!res.ok) throw new Error('Failed to update committee');
        const data = await res.json();
        setCommittees((prev) => prev.map((c) => (c.id === editingCommittee.id ? data.committee : c)));
        showToast(`Committee ${data.committee.code} updated successfully.`);
      } else {
        // Create new
        const payload: any = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          topic: formData.topic.trim(),
          category: formData.category,
          chairName: formData.chairName.trim(),
          description: formData.description.trim(),
        };

        if (formData.presetRoster && formData.presetRoster !== 'NONE' && formData.presetRoster !== 'CUSTOM') {
          payload.preset = formData.presetRoster;
        } else if (formData.presetRoster === 'CUSTOM' && formData.customCountries.trim()) {
          const names = formData.customCountries
            .split(/[\n,;]+/)
            .map((n) => n.trim())
            .filter((n) => n.length > 0);
          payload.initialCountries = names.map((name) => ({ name, status: 'PRESENT' }));
        }

        const res = await fetch('/api/committees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create committee');
        }

        const data = await res.json();
        setCommittees((prev) => [...prev, data.committee]);
        showToast(`Committee ${data.committee.code} created with ${data.committee.countries.length} delegations!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error saving committee', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Perform Delete Committee (In-app confirmed)
  const confirmDeleteSingle = async () => {
    if (!committeeToDelete) return;
    const { id, code } = committeeToDelete;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/committees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete committee');
      
      setCommittees((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showToast(`Committee ${code} deleted successfully.`);
      setCommitteeToDelete(null);
      if (isModalOpen && editingCommittee?.id === id) {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete committee', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Perform Bulk Delete Committees
  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);

    try {
      const res = await fetch('/api/committees/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        // Fallback to sequential deletion
        for (const id of selectedIds) {
          await fetch(`/api/committees/${id}`, { method: 'DELETE' }).catch(() => {});
        }
      }

      setCommittees((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      showToast(`Successfully deleted ${selectedIds.length} committee(s).`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to bulk delete committees', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectCommittee = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCommittees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCommittees.map((c) => c.id));
    }
  };

  const navigateToRollCall = (committeeId: string) => {
    if (onSelectCommitteeForRollCall) {
      onSelectCommitteeForRollCall(committeeId);
    } else {
      navigate(`/admin/roll-call?committee=${committeeId}`);
    }
  };

  // Filter committees safely without throwing on undefined
  const q = (searchQuery || '').toLowerCase().trim();
  const filteredCommittees = committees.filter((c) => {
    const codeStr = (c?.code || '').toLowerCase();
    const nameStr = (c?.name || '').toLowerCase();
    const topicStr = (c?.topic || '').toLowerCase();

    const matchesSearch =
      !q ||
      codeStr.includes(q) ||
      nameStr.includes(q) ||
      topicStr.includes(q);
    const matchesCategory = selectedCategory === 'ALL' || c?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCountries = committees.reduce((acc, c) => acc + (c?.countries?.length || 0), 0);
  const categories = ['ALL', 'General Assembly', 'Security & Disarmament', 'Human Rights & Social', 'Economic & Specialized', 'Crisis Simulation', 'Regional Bodies'];

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Committees</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">{committees.length}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active simulation councils</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Enrolled Delegations</span>
            <Globe className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">{totalCountries}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Country seats across committees</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Administration Mode</span>
            <Shield className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">Full Authority</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Creation & deletion enabled</p>
        </div>
      </div>

      {/* Action Header & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-2xl border border-white/10">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search committees by code, title, or agenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400/60"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Bulk delete trigger if items are selected */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          {filteredCommittees.length > 0 && (
            <button
              onClick={toggleSelectAll}
              title={selectedIds.length === filteredCommittees.length ? 'Deselect all' : 'Select all'}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {selectedIds.length === filteredCommittees.length && filteredCommittees.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-cyan-400" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Select All</span>
            </button>
          )}

          <button
            onClick={fetchCommittees}
            title="Refresh list"
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Committee</span>
          </button>
        </div>
      </div>

      {/* Toast message */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            actionMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          }`}
        >
          {actionMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Committees Grid */}
      {loading && committees.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading committees & rosters...</div>
      ) : filteredCommittees.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-12 text-center space-y-3">
          <Layers className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Committees Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No committees match your search criteria. Try clearing the filter.'
              : 'No committees configured yet. Click "Add New Committee" to set up your first council.'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Committee</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCommittees.map((cmte) => {
            const isSelected = selectedIds.includes(cmte.id);
            const countryCount = cmte.countries?.length || 0;
            const presentCount = cmte.countries?.filter((c) => c.status === 'PRESENT' || c.status === 'PRESENT_AND_VOTING').length || 0;
            const quorumThreshold = Math.ceil(countryCount / 3);
            const hasQuorum = countryCount > 0 && presentCount >= quorumThreshold;

            return (
              <div
                key={cmte.id}
                className={`group flex flex-col justify-between rounded-2xl border p-5 transition shadow-lg space-y-4 ${
                  isSelected
                    ? 'border-cyan-400/60 bg-slate-900/95 ring-1 ring-cyan-400/30'
                    : 'border-white/10 bg-slate-900/90 hover:border-cyan-400/40'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Checkbox, Code badge & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleSelectCommittee(cmte.id)}
                        className="text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                        title={isSelected ? 'Deselect' : 'Select for deletion'}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500" />
                        )}
                      </button>

                      <span className="rounded-xl bg-cyan-400/15 border border-cyan-400/30 px-3 py-1 text-xs font-black text-cyan-300 tracking-wider">
                        {cmte.code}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-slate-300">
                        {cmte.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cmte)}
                        title="Edit Committee Details"
                        className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setCommitteeToDelete(cmte)}
                        title="Delete Committee"
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Agenda */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition">
                      {cmte.name}
                    </h3>
                    {cmte.topic && (
                      <p className="mt-1.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        <strong className="text-slate-400">Agenda:</strong> {cmte.topic}
                      </p>
                    )}
                  </div>

                  {/* Chair and Metadata */}
                  {cmte.chairName && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-300">Dais / Executive Board:</span>
                      <span>{cmte.chairName}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Stats & Link to Roll Call */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-cyan-400" />
                      {countryCount} Countries
                    </span>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        hasQuorum
                          ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {hasQuorum ? 'Quorum Met' : `${presentCount}/${countryCount} Present`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCommitteeToDelete(cmte)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline px-1 py-1 cursor-pointer font-medium"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => navigateToRollCall(cmte.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition cursor-pointer"
                    >
                      <span>Open Roll Call</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Committee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {editingCommittee ? `Edit Committee: ${editingCommittee.code}` : 'Create New Committee'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingCommittee
                      ? 'Modify committee metadata and agendas'
                      : 'Admins and Chairs can add any number of committees'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommittee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Committee Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UNGA, UNSC, WHO, ECOSOC"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  Full Committee Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United Nations General Assembly Plenary"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Agenda / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Global Nuclear Non-Proliferation and De-escalation"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Executive Board / Chair Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. President Sarah Jenkins, Vice-Chair David Kim"
                  value={formData.chairName}
                  onChange={(e) => setFormData({ ...formData, chairName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Committee Mandate & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of committee scope and procedural guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Preset Roster (Only for new creation) */}
              {!editingCommittee && (
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                      Initial Country Delegations
                    </label>
                    <select
                      value={formData.presetRoster}
                      onChange={(e) => setFormData({ ...formData, presetRoster: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="UNGA_CORE_30">Load Core 30 UN Member States (Balanced Global Matrix)</option>
                      <option value="G20">Load G20 Major Economies (20 delegations)</option>
                      <option value="UNSC_15">Load UN Security Council 15 Members (P5 + E10)</option>
                      <option value="ASEAN_10">Load ASEAN Bloc (10 Southeast Asian nations)</option>
                      <option value="EU_KEY">Load European Union Major Delegations (15 nations)</option>
                      <option value="AU_KEY">Load African Union Major Delegations (14 nations)</option>
                      <option value="CUSTOM">Custom List (Enter country names below)</option>
                      <option value="NONE">Start Empty (Add countries later in Roll Call)</option>
                    </select>
                  </div>

                  {formData.presetRoster === 'CUSTOM' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Enter country names (comma or line separated):
                      </label>
                      <textarea
                        rows={3}
                        placeholder="United States, United Kingdom, France, Germany, Japan, India, Brazil, Canada..."
                        value={formData.customCountries}
                        onChange={(e) => setFormData({ ...formData, customCountries: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                {editingCommittee ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCommitteeToDelete(editingCommittee);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Committee</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving...' : editingCommittee ? 'Update Committee' : 'Create Committee'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated In-App Confirmation Modal for Single Committee Deletion */}
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
                onClick={confirmDeleteSingle}
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

      {/* Dedicated In-App Confirmation Modal for Bulk Deletion */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Delete {selectedIds.length} Committees?</h3>
                <p className="text-xs text-slate-400">Permanent deletion confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete all <strong className="text-white">{selectedIds.length}</strong> selected committees? All country rosters and roll call data for these committees will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isDeleting}
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition shadow-lg shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Deleting...' : `Delete All ${selectedIds.length}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
