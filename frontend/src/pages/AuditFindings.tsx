import React, { useState, useEffect } from 'react';
import { DiscrepancyItem } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const AuditFindings: React.FC = () => {
  const { addToast } = useToast();
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Resolution Modal
  const [selectedDisc, setSelectedDisc] = useState<DiscrepancyItem | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'resolve' | 'dismiss'>('resolve');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchDiscrepancies = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (riskFilter !== 'all') params.risk_level = riskFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await api.listDiscrepancies(params);
      setDiscrepancies(data);
    } catch (err: any) {
      addToast('error', 'Variance index retrieval notice', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscrepancies();
  }, [riskFilter, statusFilter]);

  const handleRunAnalysis = async () => {
    setIsRunning(true);
    try {
      const res = await api.runDiscrepancies();
      addToast('success', 'Variance Engine Executed', `Identified ${res.discrepancies_identified} ledger & tax discrepancies.`);
      fetchDiscrepancies();
    } catch (err: any) {
      addToast('error', 'Analysis Notice', err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!selectedDisc) return;
    try {
      await api.resolveDiscrepancy(selectedDisc.id, {
        action: resolutionAction,
        resolution_notes: resolutionNotes || 'Auditor verified and documented resolution.',
      });
      addToast('success', 'Finding Documented', `Discrepancy #${selectedDisc.id} marked as ${resolutionAction}d.`);
      setSelectedDisc(null);
      setResolutionNotes('');
      fetchDiscrepancies();
    } catch (err: any) {
      addToast('error', 'Action Notice', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div>
          <h2 className="text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
            Financial Discrepancy & Variance Analysis
          </h2>
          <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
            Systematic audit rules comparing billing documents, ledger postings, bank settlements, and statutory tax rates
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isRunning}
          className="h-11 px-5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-all shadow-md shadow-[#FFC900]/20 flex items-center space-x-2 disabled:opacity-50 shrink-0"
        >
          <span>{isRunning ? 'Analyzing Ledger Pools...' : 'Execute Variance Engine'}</span>
          <span className="font-mono text-xs">⚡</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3 border border-white/10 shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#F5F3EF]/60 font-sans">Risk Severity:</span>
          {['all', 'high', 'medium', 'low'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold capitalize transition-all border ${
                riskFilter === r
                  ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-sm shadow-[#FFC900]/20'
                  : 'glass-pill text-[#F5F3EF]/70 hover:text-[#F5F3EF] border-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#F5F3EF]/60 font-sans">Status:</span>
          {['all', 'unresolved', 'resolved', 'dismissed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold capitalize transition-all border ${
                statusFilter === s
                  ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-sm shadow-[#FFC900]/20'
                  : 'glass-pill text-[#F5F3EF]/70 hover:text-[#F5F3EF] border-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Discrepancies Table */}
      <div className="glass-card overflow-hidden border border-white/10 shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-[#F5F3EF] tracking-tight">
              Identified Audit Variances
            </h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
              Documented inconsistencies requiring evidentiary audit review
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#F5F3EF] bg-white/10 border border-white/10 px-3 py-1 rounded-full">
            {discrepancies.length} Tracked Variances
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 bg-white/[0.02]">
                <th className="py-3 px-5">Tx ID</th>
                <th className="py-3 px-5">Vendor</th>
                <th className="py-3 px-5">Variance Type</th>
                <th className="py-3 px-5">Expected Value</th>
                <th className="py-3 px-5">Actual Value</th>
                <th className="py-3 px-5">Variance (₹)</th>
                <th className="py-3 px-5">Risk Level</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    Scanning ledger variances...
                  </td>
                </tr>
              ) : discrepancies.length > 0 ? (
                discrepancies.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-5 font-mono font-semibold text-[#F5F3EF]/60">#{d.transaction_id}</td>
                    <td className="py-3.5 px-5 font-bold text-[#F5F3EF]">
                      {d.transaction?.vendor_name || 'Vendor N/A'}
                    </td>
                    <td className="py-3.5 px-5 font-medium capitalize text-[#F5F3EF]/80">
                      {d.discrepancy_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[#F5F3EF] font-semibold">{d.expected_value}</td>
                    <td className="py-3.5 px-5 font-mono text-[#F5F3EF] font-semibold bg-white/10 px-2 rounded-md">{d.actual_value}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#F5F3EF]">
                      ₹{d.difference_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={d.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {d.status === 'unresolved' ? (
                        <button
                          onClick={() => {
                            setSelectedDisc(d);
                            setResolutionAction('resolve');
                            setResolutionNotes('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-[#F5F3EF]/40">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    No discrepancies match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={!!selectedDisc}
        onClose={() => setSelectedDisc(null)}
        title={`Audit Resolution: Finding #${selectedDisc?.id}`}
        subtitle={`Transaction #${selectedDisc?.transaction_id} — ${selectedDisc?.discrepancy_type.replace(/_/g, ' ').toUpperCase()}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="p-4 rounded-2xl glass-soft border border-white/10 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-[#F5F3EF]/60">Expected:</span>
              <span className="font-bold text-[#F5F3EF]">{selectedDisc?.expected_value}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F5F3EF]/60">Recorded Actual:</span>
              <span className="font-bold text-[#F5F3EF]">{selectedDisc?.actual_value}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/10">
              <span className="text-[#F5F3EF]/60">Net Variance:</span>
              <span className="font-bold text-[#FFC900]">
                ₹{selectedDisc?.difference_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Resolution Action</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResolutionAction('resolve')}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold transition-all border ${
                  resolutionAction === 'resolve'
                    ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900]'
                    : 'glass-pill text-[#F5F3EF] border-white/10'
                }`}
              >
                Confirm & Adjust
              </button>
              <button
                type="button"
                onClick={() => setResolutionAction('dismiss')}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold transition-all border ${
                  resolutionAction === 'dismiss'
                    ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900]'
                    : 'glass-pill text-[#F5F3EF] border-white/10'
                }`}
              >
                Dismiss / Immaterial
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Auditor Sign-off Notes</label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Document the justification, amended journal reference, or partner sign-off..."
              className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] border border-white/10"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setSelectedDisc(null)}
              className="px-4 py-2 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmResolve}
              className="px-5 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
            >
              Submit Attestation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
