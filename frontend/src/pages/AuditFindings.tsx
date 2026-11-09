import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  FileCheck
} from 'lucide-react';
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
      addToast('error', 'Failed to load audit findings', err.message);
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
      addToast('success', 'Discrepancy Engine Executed', `Identified ${res.discrepancies_identified} ledger & tax discrepancies.`);
      fetchDiscrepancies();
    } catch (err: any) {
      addToast('error', 'Analysis Failed', err.message);
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
      addToast('success', 'Finding Updated', `Discrepancy #${selectedDisc.id} marked as ${resolutionAction}d.`);
      setSelectedDisc(null);
      setResolutionNotes('');
      fetchDiscrepancies();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Deterministic Variance & Tax Audit Rules</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Financial Discrepancy & Variance Analysis</h2>
          <p className="text-xs text-slate-500">
            Systematic analysis of differences between billing documents, ledger postings, bank settlements, and statutory tax rates.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isRunning}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Analyzing Ledgers...' : 'Re-Run Discrepancy Analysis'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Risk Severity:</span>
          {['all', 'high', 'medium', 'low'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                riskFilter === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          {['all', 'unresolved', 'resolved', 'dismissed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Discrepancies Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Flagged Audit Variances</h3>
            <p className="text-xs text-slate-500">Documented inconsistencies requiring evidentiary audit review</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {discrepancies.length} Issues Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Discrepancy Type</th>
                <th className="py-3 px-4">Expected Value</th>
                <th className="py-3 px-4">Actual Value</th>
                <th className="py-3 px-4">Variance ($)</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading discrepancies...</td>
                </tr>
              ) : discrepancies.length > 0 ? (
                discrepancies.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">#{d.transaction_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {d.transaction?.vendor_name || 'Vendor N/A'}
                    </td>
                    <td className="py-3 px-4 font-medium capitalize text-slate-700">
                      {d.discrepancy_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">{d.expected_value}</td>
                    <td className="py-3 px-4 font-mono text-rose-700 font-semibold">{d.actual_value}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ${d.difference_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.risk_level} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.status === 'unresolved' ? (
                        <button
                          onClick={() => {
                            setSelectedDisc(d);
                            setResolutionAction('resolve');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No discrepancies found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancy Resolution Modal */}
      <Modal
        isOpen={!!selectedDisc}
        onClose={() => setSelectedDisc(null)}
        title={`Audit Resolution: Discrepancy #${selectedDisc?.id}`}
        subtitle="Record your findings, remediation steps, or accounting justification"
        maxWidth="lg"
      >
        {selectedDisc && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{selectedDisc.discrepancy_type.replace(/_/g, ' ').toUpperCase()}</span>
                <StatusBadge status={selectedDisc.risk_level} size="sm" />
              </div>
              <p className="text-slate-700">{selectedDisc.explanation}</p>
              <div className="flex items-center gap-4 pt-2 text-slate-600 font-mono">
                <span>Expected: <strong className="text-emerald-700">{selectedDisc.expected_value}</strong></span>
                <span>Actual: <strong className="text-rose-700">{selectedDisc.actual_value}</strong></span>
                <span>Diff: <strong className="text-slate-900">${selectedDisc.difference_amount.toFixed(2)}</strong></span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Resolution Action</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionAction('resolve')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-colors ${
                    resolutionAction === 'resolve'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mb-1" />
                  <span>Mark Resolved</span>
                  <p className="text-[10px] font-normal opacity-80">Adjusted in journal or confirmed valid credit</p>
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionAction('dismiss')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-colors ${
                    resolutionAction === 'dismiss'
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-4 h-4 mb-1" />
                  <span>Dismiss Finding</span>
                  <p className="text-[10px] font-normal opacity-80">Deemed immaterial or intentional variance</p>
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Auditor Working Notes</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail the supporting documents reviewed, journal adjustments, or authorized variance approvals..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedDisc(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Save Resolution</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
