import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ArrowRight,
  Sparkles,
  Link2,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
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
      addToast('error', 'Failed to fetch matches', err.message);
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
      addToast('success', 'Automated Matching Executed', `Generated ${res.matches_generated} transaction reconciliation matches.`);
      fetchMatches();
    } catch (err: any) {
      addToast('error', 'Matching Failed', err.message);
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
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic Fuzzy & Three-Way Reconciliation</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Transaction Matching & Verification</h2>
          <p className="text-xs text-slate-500">
            Automatically pairs Invoices vs Ledgers and Bank Statements vs Journal entries. Review and confirm reconciliation matches.
          </p>
        </div>

        <button
          onClick={handleRunMatching}
          disabled={isRunning}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Analyzing Ledger Pools...' : 'Execute Automated Matching'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
          {['all', 'suggested', 'confirmed', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Match Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Match Types</option>
            <option value="exact">Exact (100% Invoice & Amount)</option>
            <option value="fuzzy">Fuzzy (Vendor & Amount)</option>
            <option value="amount_mismatch">Amount Mismatch</option>
            <option value="date_mismatch">Date Mismatch</option>
          </select>
        </div>
      </div>

      {/* Match Cards List (Side-by-Side Verification) */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/90">
            Loading matching candidates...
          </div>
        ) : matches.length > 0 ? (
          matches.map((m) => {
            const p = m.primary_transaction;
            const t = m.matched_transaction;

            const isMismatch = m.match_type === 'amount_mismatch' || m.match_type === 'date_mismatch';

            return (
              <div
                key={m.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-4"
              >
                {/* Match Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Match #{m.id}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono capitalize">
                      {m.match_type.replace('_', ' ')}
                    </span>
                    <StatusBadge status={m.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence Score</span>
                      <span className="text-xs font-bold text-teal-600">{(m.confidence_score * 100).toFixed(0)}%</span>
                    </div>

                    {/* Review Action Buttons */}
                    {m.status === 'suggested' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setReviewMatchItem({ match: m, action: 'confirmed' })}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                        <button
                          onClick={() => setReviewMatchItem({ match: m, action: 'rejected' })}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Side: Primary Document Transaction */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Source: {p?.source_type.replace('_', ' ').toUpperCase()} #{p?.id}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {p?.transaction_date ? new Date(p.transaction_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="pt-1">
                      <p className="text-sm font-bold text-slate-900">{p?.vendor_name || 'Vendor N/A'}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Inv: {p?.invoice_number || 'None'} | Ref: {p?.reference_no || 'None'}</p>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-xs font-semibold text-slate-500">Recorded Amount:</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ${p?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Matched Counterpart Transaction */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Counterpart: {t?.source_type.replace('_', ' ').toUpperCase()} #{t?.id}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t?.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="pt-1">
                      <p className="text-sm font-bold text-slate-900">{t?.vendor_name || 'Vendor N/A'}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Inv: {t?.invoice_number || 'None'} | Ref: {t?.reference_no || 'None'}</p>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-xs font-semibold text-slate-500">Counterpart Amount:</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ${t?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Reason & Variance Note */}
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                  isMismatch ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {isMismatch && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                    <span>{m.match_reasons || 'Reconciliation match detected.'}</span>
                  </div>

                  {m.amount_difference > 0 && (
                    <span className="font-bold text-rose-600">
                      Variance: ${m.amount_difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/90">
            No matching pairs found. Click "Execute Automated Matching" to trigger cross-ledger reconciliation.
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
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You are about to mark Match #{reviewMatchItem?.match.id} as{' '}
            <strong className="uppercase">{reviewMatchItem?.action}</strong>.
          </p>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Auditor Review Notes (Optional)</label>
            <textarea
              rows={3}
              value={auditorNotes}
              onChange={(e) => setAuditorNotes(e.target.value)}
              placeholder="e.g., Verified against physical bank statement and approved credit deduction."
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setReviewMatchItem(null)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReview}
              className={`px-4 py-1.5 rounded-xl text-white font-semibold flex items-center gap-1.5 ${
                reviewMatchItem?.action === 'confirmed'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Decision</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
