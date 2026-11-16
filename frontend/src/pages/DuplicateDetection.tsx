import React, { useState, useEffect } from 'react';
import { DuplicateGroupItem } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const DuplicateDetection: React.FC = () => {
  const { addToast } = useToast();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Resolve Modal
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroupItem | null>(null);
  const [resolveAction, setResolveAction] = useState<'resolve' | 'dismiss'>('resolve');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const data = await api.listDuplicates(statusFilter !== 'all' ? statusFilter : undefined);
      setDuplicateGroups(data);
    } catch (err: any) {
      addToast('error', 'Duplicate index retrieval notice', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [statusFilter]);

  const handleRunDetection = async () => {
    setIsRunning(true);
    try {
      const res = await api.runDuplicateDetection();
      addToast('success', 'Duplicate Scan Complete', `Identified ${res.duplicate_groups_detected} duplicate transaction group(s).`);
      fetchDuplicates();
    } catch (err: any) {
      addToast('error', 'Detection Notice', err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!selectedGroup) return;
    try {
      await api.resolveDuplicate(selectedGroup.group_id, {
        action: resolveAction,
        resolution_notes: resolutionNotes || 'Auditor reviewed and verified duplicate voucher status.',
      });
      addToast('success', 'Group Disposition Recorded', `Duplicate group ${selectedGroup.group_id} marked as ${resolveAction === 'dismiss' ? 'false positive' : 'resolved'}.`);
      setSelectedGroup(null);
      setResolutionNotes('');
      fetchDuplicates();
    } catch (err: any) {
      addToast('error', 'Action Notice', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-card p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
            Duplicate Invoice & Double-Payment Defense
          </h2>
          <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
            Identifies twin billings, duplicated disbursements, and vendor variations before ledger closure
          </p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={isRunning}
          className="h-11 px-5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-all shadow-md shadow-[#FFC900]/20 flex items-center space-x-2 disabled:opacity-50 shrink-0 w-full md:w-auto justify-center active:scale-95 touch-manipulation"
        >
          <span>{isRunning ? 'Scanning Ledger...' : 'Run Duplicate Scan'}</span>
          <span className="font-mono text-xs">⚡</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-2 border border-white/10 shadow-xl">
        <span className="text-xs font-semibold text-[#F5F3EF]/60 font-sans">Status:</span>
        {['all', 'flagged', 'resolved', 'false_positive'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold capitalize transition-all border active:scale-95 touch-manipulation ${
              statusFilter === st
                ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-sm shadow-[#FFC900]/20'
                : 'glass-pill text-[#F5F3EF]/70 hover:text-[#F5F3EF] border-white/10'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Duplicate Groups List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-[#F5F3EF]/40 glass-card border border-white/10">
            Scanning duplicate clusters...
          </div>
        ) : duplicateGroups.length > 0 ? (
          duplicateGroups.map((group) => (
            <div
              key={group.group_id}
              className="glass-card p-4 sm:p-6 space-y-4 hover:border-[#FFC900]/40 transition-all border border-white/10 shadow-xl"
            >
              {/* Group Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold font-mono text-[#F5F3EF]">{group.group_id}</span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FFC900]/20 text-[#FFC900] border border-[#FFC900]/40">
                    {group.duplicate_type.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={group.status} size="sm" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#F5F3EF]/50 block">Pattern Match</span>
                    <span className="text-xs font-mono font-bold text-[#FFC900]">{(group.confidence_score * 100).toFixed(0)}%</span>
                  </div>

                  {group.status === 'flagged' && (
                    <button
                      onClick={() => {
                        setSelectedGroup(group);
                        setResolveAction('resolve');
                      }}
                      className="px-3.5 py-1.5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-colors shadow-sm shadow-[#FFC900]/20"
                    >
                      Audit Disposition
                    </button>
                  )}
                </div>
              </div>

              {/* Reason Explanation */}
              <div className="p-3 bg-[#FFC900]/15 border border-[#FFC900]/30 rounded-2xl text-xs text-[#FFC900] flex items-center gap-2 font-mono">
                <span className="font-bold">Flag:</span>
                <span>{group.flag_reason}</span>
              </div>

              {/* Twin Transactions Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.records.map((rec, idx) => {
                  const tx = rec.transaction;
                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl glass-soft border border-white/10 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#08090B] bg-[#F5F3EF] px-2 py-0.5 rounded-md font-bold">
                          Voucher #{idx + 1} (Tx #{tx?.id})
                        </span>
                        <span className="text-[11px] font-mono text-[#F5F3EF]/60">
                          {tx?.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <div className="pt-1">
                        <p className="text-sm font-bold text-[#F5F3EF] font-display">{tx?.vendor_name || 'Vendor N/A'}</p>
                        <p className="text-xs text-[#F5F3EF]/60 font-mono mt-0.5">
                          Invoice: {tx?.invoice_number || 'None'} | Ref: {tx?.reference_no || 'None'}
                        </p>
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                        <span className="text-xs font-semibold text-[#F5F3EF]/60">Disbursement:</span>
                        <span className="text-base font-bold font-mono text-[#F5F3EF]">
                          ₹{tx?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-xs font-mono text-[#F5F3EF]/40 glass-card border border-white/10">
            No duplicate payment risks identified under current filters.
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        title={`Audit Disposition: Duplicate Cluster ${selectedGroup?.group_id}`}
        subtitle="Review twin records and document supervisory approval"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-[#F5F3EF]/80 font-mono">
            {selectedGroup?.flag_reason}
          </p>

          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Audit Disposition</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResolveAction('resolve')}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold transition-all border ${
                  resolveAction === 'resolve'
                    ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900]'
                    : 'glass-pill text-[#F5F3EF] border-white/10'
                }`}
              >
                Confirm Duplicate & Void
              </button>
              <button
                type="button"
                onClick={() => setResolveAction('dismiss')}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold transition-all border ${
                  resolveAction === 'dismiss'
                    ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900]'
                    : 'glass-pill text-[#F5F3EF] border-white/10'
                }`}
              >
                Authorized Recurring
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Auditor Workpaper Notes</label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g., Confirmed with AP department that invoice was submitted twice; second payment voided."
              className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] border border-white/10"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setSelectedGroup(null)}
              className="px-4 py-2 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmResolve}
              className="px-5 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
            >
              Submit Disposition
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
