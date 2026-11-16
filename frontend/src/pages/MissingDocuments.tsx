import React, { useState, useEffect } from 'react';
import { MissingDocItem, DocumentItem } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const MissingDocuments: React.FC = () => {
  const { addToast } = useToast();
  const [missingDocs, setMissingDocs] = useState<MissingDocItem[]>([]);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  // Attach Document Modal
  const [selectedAlert, setSelectedAlert] = useState<MissingDocItem | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
  const [attachNotes, setAttachNotes] = useState('');

  const fetchMissingDocs = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (resolvedFilter === 'unresolved') params.is_resolved = false;
      if (resolvedFilter === 'resolved') params.is_resolved = true;
      const data = await api.listMissingDocs(params);
      setMissingDocs(data);

      const docs = await api.listDocuments();
      setAvailableDocs(docs);
    } catch (err: any) {
      addToast('error', 'Evidentiary index retrieval notice', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissingDocs();
  }, [resolvedFilter]);

  const handleRunScan = async () => {
    setIsRunning(true);
    try {
      const res = await api.runMissingDocs();
      addToast('success', 'Documentation Scan Complete', `Detected ${res.missing_documents_detected} unattached transactions.`);
      fetchMissingDocs();
    } catch (err: any) {
      addToast('error', 'Scan Notice', err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAttachDocument = async () => {
    if (!selectedAlert || !selectedDocId) return;
    try {
      await api.attachMissingDoc(selectedAlert.id, {
        document_id: Number(selectedDocId),
        notes: attachNotes || 'Attached supporting voucher by auditor',
      });
      addToast('success', 'Document Attached', `Supporting evidence attached to transaction #${selectedAlert.transaction_id}.`);
      setSelectedAlert(null);
      setSelectedDocId('');
      setAttachNotes('');
      fetchMissingDocs();
    } catch (err: any) {
      addToast('error', 'Attach Notice', err.message);
    }
  };

  const handleWaiveAlert = async (alert: MissingDocItem) => {
    try {
      await api.resolveMissingDoc(alert.id, {
        action: 'resolve',
        resolution_notes: 'Auditor approved minor expenditure waiver under de minimis threshold.',
      });
      addToast('success', 'Waiver Approved', `Requirement waived for alert #${alert.id}.`);
      fetchMissingDocs();
    } catch (err: any) {
      addToast('error', 'Waiver Notice', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-card p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
            Missing Supporting Documentation Audit
          </h2>
          <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
            Identifies journal and bank transactions lacking mandatory invoice vouchers, receipt slips, or purchase orders
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isRunning}
          className="h-11 px-5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-all shadow-md shadow-[#FFC900]/20 flex items-center space-x-2 disabled:opacity-50 shrink-0 w-full md:w-auto justify-center active:scale-95 touch-manipulation"
        >
          <span>{isRunning ? 'Auditing Evidence...' : 'Scan for Missing Vouchers'}</span>
          <span className="font-mono text-xs">⚡</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-2 border border-white/10 shadow-xl">
        <span className="text-xs font-semibold text-[#F5F3EF]/60 font-sans">Status:</span>
        {[
          { id: 'unresolved', label: 'Evidentiary Gaps (Pending)' },
          { id: 'resolved', label: 'Resolved / Attached' },
          { id: 'all', label: 'All Transactions' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setResolvedFilter(item.id as any)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all border active:scale-95 touch-manipulation ${
              resolvedFilter === item.id
                ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-sm shadow-[#FFC900]/20'
                : 'glass-pill text-[#F5F3EF]/70 hover:text-[#F5F3EF] border-white/10'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="glass-card overflow-hidden border border-white/10 shadow-xl">
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display text-[#F5F3EF] tracking-tight">
              Missing Evidence Alerts
            </h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
              Transactions requiring primary supporting documentation
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#F5F3EF] bg-white/10 border border-white/10 px-3 py-1 rounded-full self-start sm:self-auto">
            {missingDocs.length} Alerts
          </span>
        </div>

        {/* Mobile Horizontal Scroll Indicator */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/10 text-[11px] font-mono text-[#F5F3EF]/50">
          <span>Scroll horizontally for all alert details →</span>
          <span className="text-[#FFC900] font-bold">8 columns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 bg-white/[0.02]">
                <th className="py-3 px-5">Tx ID</th>
                <th className="py-3 px-5">Vendor</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Required Document</th>
                <th className="py-3 px-5">Audit Explanation</th>
                <th className="py-3 px-5">Risk Level</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    Auditing evidentiary records...
                  </td>
                </tr>
              ) : missingDocs.length > 0 ? (
                missingDocs.map((alert) => (
                  <tr key={alert.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-5 font-mono font-semibold text-[#F5F3EF]/60">#{alert.transaction_id}</td>
                    <td className="py-3.5 px-5 font-bold text-[#F5F3EF]">
                      {alert.transaction?.vendor_name || 'Vendor N/A'}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#F5F3EF]">
                      ₹{alert.transaction?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 capitalize font-semibold text-[#F5F3EF]">
                      {alert.missing_document_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-5 text-[#F5F3EF]/70 max-w-sm">
                      <p className="line-clamp-2">{alert.explanation}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={alert.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-5">
                      {alert.is_resolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#08090B] bg-[#F5F3EF] px-2 py-0.5 rounded-full">
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#FFC900] bg-[#FFC900]/15 px-2 py-0.5 rounded-full border border-[#FFC900]/30">
                          Pending Voucher
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {!alert.is_resolved ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAlert(alert);
                              setSelectedDocId('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
                          >
                            Attach Evidence
                          </button>
                          <button
                            onClick={() => handleWaiveAlert(alert)}
                            className="px-2.5 py-1.5 rounded-xl glass-pill text-xs font-semibold text-[#F5F3EF] hover:bg-white/10 transition-colors border border-white/10"
                          >
                            Waive
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-[#F5F3EF]/40">Verified</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    All ledger transactions have complete supporting documentation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attach Document Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={`Attach Evidence: Transaction #${selectedAlert?.transaction_id}`}
        subtitle={`Select a verified repository voucher to fulfill missing ${selectedAlert?.missing_document_type.replace(/_/g, ' ')}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Select Verified Document</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(Number(e.target.value) || '')}
              className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] bg-[#08090B] border border-white/10"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-[#08090B] text-[#F5F3EF]">-- Choose document from repository --</option>
              {availableDocs.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#08090B] text-[#F5F3EF]">
                  {d.filename} ({d.category} · {(d.file_size_bytes / 1024).toFixed(0)} KB)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Auditor Reconciliation Notes</label>
            <textarea
              rows={3}
              value={attachNotes}
              onChange={(e) => setAttachNotes(e.target.value)}
              placeholder="e.g., Manually cross-verified transaction reference with physical supplier voucher."
              className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] border border-white/10"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setSelectedAlert(null)}
              className="px-4 py-2 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] border border-white/10"
            >
              Cancel
            </button>
            <button
              disabled={!selectedDocId}
              onClick={handleAttachDocument}
              className="px-5 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] font-bold text-xs disabled:opacity-40 hover:bg-[#FFD733] transition-colors"
            >
              Confirm Attachment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
