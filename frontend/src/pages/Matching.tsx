import React, { useState, useEffect } from 'react';
import { TransactionMatchItem } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const Matching: React.FC = () => {
  const { addToast } = useToast();
  const [matches, setMatches] = useState<TransactionMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Review Dialog State
  const [reviewMatchItem, setReviewMatchItem] = useState<{ match: TransactionMatchItem; action: 'confirmed' | 'rejected' } | null>(null);
  const [auditorNotes, setAuditorNotes] = useState('');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.match_type = typeFilter;
      const data = await api.listMatches(params);
      setMatches(data);
    } catch (err: any) {
      addToast('error', 'Reconciliation retrieval notice', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [statusFilter, typeFilter]);

  const handleRunMatching = async () => {
    setIsRunning(true);
    try {
      const res = await api.runMatching();
      addToast('success', 'Automated Reconciliation Executed', `Generated ${res.matches_generated} transaction reconciliation matches.`);
      fetchMatches();
    } catch (err: any) {
      addToast('error', 'Reconciliation Failed', err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleConfirmReview = async () => {
    if (!reviewMatchItem) return;
    try {
      await api.reviewMatch(reviewMatchItem.match.id, {
        status: reviewMatchItem.action,
        auditor_notes: auditorNotes || `Auditor ${reviewMatchItem.action} match`,
      });
      addToast(
        reviewMatchItem.action === 'confirmed' ? 'success' : 'info',
        `Match ${reviewMatchItem.action.toUpperCase()}`,
        `Reconciliation link marked as ${reviewMatchItem.action}.`
      );
      setReviewMatchItem(null);
      setAuditorNotes('');
      fetchMatches();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="glass-card p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
            Transaction Matching & Reconciliation Engine
          </h2>
          <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
            Automated multi-source cross-verification between Invoices, Bank Records, and General Ledger
          </p>
        </div>

        <button
          onClick={handleRunMatching}
          disabled={isRunning}
          className="h-11 px-5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-all shadow-md shadow-[#FFC900]/20 flex items-center space-x-2 disabled:opacity-50 shrink-0 w-full md:w-auto justify-center active:scale-95 touch-manipulation"
        >
          <span>{isRunning ? 'Reconciling Ledger Pools...' : 'Execute Matching Engine'}</span>
          <span className="font-mono text-xs">⚡</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3 border border-white/10 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#F5F3EF]/60 font-sans">Status:</span>
          {['all', 'suggested', 'confirmed', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold capitalize transition-all border active:scale-95 touch-manipulation ${
                statusFilter === st
                  ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-sm shadow-[#FFC900]/20'
                  : 'glass-pill text-[#F5F3EF]/70 hover:text-[#F5F3EF] border-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#F5F3EF]/60 font-sans shrink-0">Match Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="h-10 px-3 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] bg-[#08090B] border border-white/10 cursor-pointer font-sans w-full sm:w-auto"
          >
            <option value="all" className="bg-[#08090B] text-[#F5F3EF]">All Match Types</option>
            <option value="exact" className="bg-[#08090B] text-[#F5F3EF]">Exact (100% Invoice & Amount)</option>
            <option value="fuzzy" className="bg-[#08090B] text-[#F5F3EF]">Fuzzy (Vendor & Amount)</option>
            <option value="amount_mismatch" className="bg-[#08090B] text-[#F5F3EF]">Amount Variance</option>
            <option value="date_mismatch" className="bg-[#08090B] text-[#F5F3EF]">Date Inconsistency</option>
          </select>
        </div>
      </div>

      {/* Match Cards List (Side-by-Side Verification) */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-[#F5F3EF]/40 glass-card border border-white/10">
            Loading reconciliation candidates...
          </div>
        ) : matches.length > 0 ? (
          matches.map((m) => {
            const p = m.primary_transaction;
            const t = m.matched_transaction;
            const isMismatch = m.match_type === 'amount_mismatch' || m.match_type === 'date_mismatch';

            return (
              <div
                key={m.id}
                className="glass-card p-4 sm:p-6 space-y-4 hover:border-[#FFC900]/40 transition-all border border-white/10 shadow-xl"
              >
                {/* Match Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold font-mono text-[#F5F3EF]">Match #{m.id}</span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-[#F5F3EF] capitalize">
                      {m.match_type.replace('_', ' ')}
                    </span>
                    <StatusBadge status={m.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#F5F3EF]/50 block">Score</span>
                      <span className="text-xs font-mono font-bold text-[#FFC900]">{(m.confidence_score * 100).toFixed(0)}%</span>
                    </div>

                    {/* Review Action Buttons */}
                    {m.status === 'suggested' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setReviewMatchItem({ match: m, action: 'confirmed' })}
                          className="px-3.5 py-1.5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-colors shadow-sm shadow-[#FFC900]/20 active:scale-95 touch-manipulation"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setReviewMatchItem({ match: m, action: 'rejected' })}
                          className="px-3.5 py-1.5 rounded-2xl glass-pill hover:bg-white/10 text-[#F5F3EF] font-semibold text-xs transition-colors border border-white/10 active:scale-95 touch-manipulation"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Side: Primary Document Transaction */}
                  <div className="p-4 rounded-2xl glass-soft border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#08090B] bg-[#F5F3EF] px-2 py-0.5 rounded-md">
                        Primary: {p?.source_type.replace('_', ' ').toUpperCase()} #{p?.id}
                      </span>
                      <span className="text-[11px] font-mono text-[#F5F3EF]/60">
                        {p?.transaction_date ? new Date(p.transaction_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="pt-1">
                      <p className="text-sm font-bold text-[#F5F3EF] font-display">{p?.vendor_name || 'Vendor N/A'}</p>
                      <p className="text-xs text-[#F5F3EF]/60 font-mono mt-0.5">Inv: {p?.invoice_number || 'None'} | Ref: {p?.reference_no || 'None'}</p>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                      <span className="text-xs font-semibold text-[#F5F3EF]/60">Recorded Amount:</span>
                      <span className="text-base font-bold font-mono text-[#F5F3EF]">
                        ₹{p?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Matched Counterpart Transaction */}
                  <div className="p-4 rounded-2xl glass-soft border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#08090B] bg-[#FFC900] px-2 py-0.5 rounded-md font-bold">
                        Counterpart: {t?.source_type.replace('_', ' ').toUpperCase()} #{t?.id}
                      </span>
                      <span className="text-[11px] font-mono text-[#F5F3EF]/60">
                        {t?.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="pt-1">
                      <p className="text-sm font-bold text-[#F5F3EF] font-display">{t?.vendor_name || 'Vendor N/A'}</p>
                      <p className="text-xs text-[#F5F3EF]/60 font-mono mt-0.5">Inv: {t?.invoice_number || 'None'} | Ref: {t?.reference_no || 'None'}</p>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                      <span className="text-xs font-semibold text-[#F5F3EF]/60">Counterpart Amount:</span>
                      <span className="text-base font-bold font-mono text-[#F5F3EF]">
                        ₹{t?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Reason & Variance Note */}
                <div className={`p-3 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono ${
                  isMismatch
                    ? 'bg-[#FFC900]/15 text-[#FFC900] border border-[#FFC900]/40'
                    : 'glass-soft text-[#F5F3EF] border border-white/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Notice:</span>
                    <span>{m.match_reasons || 'Reconciliation match detected.'}</span>
                  </div>

                  {m.amount_difference > 0 && (
                    <span className="font-bold text-[#08090B] bg-[#FFC900] px-2 py-0.5 rounded-md self-start sm:self-auto shrink-0">
                      Variance: ₹{m.amount_difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-xs font-mono text-[#F5F3EF]/40 glass-card border border-white/10">
            No matching pairs found. Click "Execute Matching Engine" to trigger cross-ledger reconciliation.
          </div>
        )}
      </div>

      {/* Auditor Review Confirmation Modal */}
      <Modal
        isOpen={!!reviewMatchItem}
        onClose={() => setReviewMatchItem(null)}
        title={reviewMatchItem?.action === 'confirmed' ? 'Confirm Reconciliation Match' : 'Reject Reconciliation Match'}
        subtitle="This action will update the journal match status and record your attestation in the audit trail"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-[#F5F3EF]/80">
            You are about to mark Match #{reviewMatchItem?.match.id} as{' '}
            <strong className="uppercase font-mono text-[#FFC900]">{reviewMatchItem?.action}</strong>.
          </p>

          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Auditor Attestation Notes (Optional)</label>
            <textarea
              rows={3}
              value={auditorNotes}
              onChange={(e) => setAuditorNotes(e.target.value)}
              placeholder="e.g., Verified against physical bank statement and approved credit deduction."
              className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] border border-white/10"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setReviewMatchItem(null)}
              className="px-4 py-2 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReview}
              className="px-5 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
            >
              Confirm Decision
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
