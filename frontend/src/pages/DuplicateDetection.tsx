import React, { useState, useEffect } from 'react';
import {
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
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
      addToast('error', 'Failed to fetch duplicate records', err.message);
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
      addToast('error', 'Detection Failed', err.message);
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
      addToast('success', 'Group Updated', `Duplicate group ${selectedGroup.group_id} marked as ${resolveAction === 'dismiss' ? 'false positive' : 'resolved'}.`);
      setSelectedGroup(null);
      setResolutionNotes('');
      fetchDuplicates();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2">
            <Copy className="w-3.5 h-3.5" />
            <span>Multi-Factor Pattern Matching</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Duplicate Invoices & Double-Payment Defense</h2>
          <p className="text-xs text-slate-500">
            Identifies twin billings, duplicated wire transfers, and fuzzy vendor name variations before settlement clearance.
          </p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={isRunning}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Scanning Ledger...' : 'Run Duplicate Scan'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
        {['all', 'flagged', 'resolved', 'false_positive'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Duplicate Groups List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/90">
            Loading duplicate analysis...
          </div>
        ) : duplicateGroups.length > 0 ? (
          duplicateGroups.map((group) => (
            <div
              key={group.group_id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-4"
            >
              {/* Group Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-slate-900">{group.group_id}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    {group.duplicate_type.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={group.status} size="sm" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Similarity</span>
                    <span className="text-xs font-bold text-amber-600">{(group.confidence_score * 100).toFixed(0)}% Match</span>
                  </div>

                  {group.status === 'flagged' && (
                    <button
                      onClick={() => {
                        setSelectedGroup(group);
                        setResolveAction('resolve');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                    >
                      Audit Disposition
                    </button>
                  )}
                </div>
              </div>

              {/* Reason Explanation */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{group.flag_reason}</span>
              </div>

              {/* Twin Transactions Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.records.map((rec, idx) => {
                  const tx = rec.transaction;
                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Voucher #{idx + 1} (Tx #{tx?.id})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {tx?.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <div className="pt-1">
                        <p className="text-sm font-bold text-slate-900">{tx?.vendor_name || 'Vendor N/A'}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Invoice: {tx?.invoice_number || 'None'} | Ref: {tx?.reference_no || 'None'}
                        </p>
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
                        <span className="text-xs font-semibold text-slate-500">Disbursement:</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          ${tx?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/90">
            No duplicate transactions detected. Click "Run Duplicate Scan" to evaluate ledger records.
          </div>
        )}
      </div>

      {/* Resolve Duplicate Modal */}
      <Modal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        title={`Audit Disposition: Duplicate Group ${selectedGroup?.group_id}`}
        subtitle="Review twin records and specify resolution or false positive classification"
        maxWidth="lg"
      >
        {selectedGroup && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Select how to resolve this flagged duplicate pattern:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResolveAction('resolve')}
                className={`p-3 rounded-xl border text-left font-semibold transition-colors ${
                  resolveAction === 'resolve'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-amber-600 mb-1" />
                <span>Confirmed Duplicate / Refund Requested</span>
                <p className="text-[10px] font-normal opacity-80 mt-0.5">Voucher flagged for payment cancellation or vendor credit memo</p>
              </button>

              <button
                type="button"
                onClick={() => setResolveAction('dismiss')}
                className={`p-3 rounded-xl border text-left font-semibold transition-colors ${
                  resolveAction === 'dismiss'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-blue-600 mb-1" />
                <span>Legitimate Recurring / False Positive</span>
                <p className="text-[10px] font-normal opacity-80 mt-0.5">Separate legitimate charges with coincidentally identical amounts</p>
              </button>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Auditor Working Notes</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Reference vendor communication, PO numbers, or verification with procurement..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                Save Disposition
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
