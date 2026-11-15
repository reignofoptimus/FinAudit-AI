import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  RefreshCw,
  Upload,
  Link,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck2,
  Check
} from 'lucide-react';
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
      addToast('error', 'Failed to load missing document alerts', err.message);
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
      addToast('success', 'Missing Document Scan Complete', `Detected ${res.missing_documents_detected} unattached transactions.`);
      fetchMissingDocs();
    } catch (err: any) {
      addToast('error', 'Scan Failed', err.message);
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
      addToast('error', 'Attach Failed', err.message);
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
      addToast('error', 'Waiver Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Evidentiary Compliance Surveillance</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Missing Supporting Documentation Audit</h2>
          <p className="text-xs text-slate-500">
            Identifies journal and bank transactions lacking mandatory invoice vouchers, receipt slips, or purchase orders.
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isRunning}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Auditing Evidence...' : 'Scan for Missing Documents'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <span className="text-xs font-semibold text-slate-500">Filter By Status:</span>
        {[
          { id: 'unresolved', label: 'Evidentiary Gaps (Pending)' },
          { id: 'resolved', label: 'Resolved / Attached' },
          { id: 'all', label: 'All Transactions' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setResolvedFilter(item.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              resolvedFilter === item.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Missing Evidence Alerts</h3>
            <p className="text-xs text-slate-500">Transactions requiring primary supporting documentation</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {missingDocs.length} Alerts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Required Document Type</th>
                <th className="py-3 px-4">Audit Explanation</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Resolution</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading missing document alerts...</td>
                </tr>
              ) : missingDocs.length > 0 ? (
                missingDocs.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">#{alert.transaction_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {alert.transaction?.vendor_name || 'Vendor N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ${alert.transaction?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-blue-700">
                      {alert.missing_document_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm">
                      <p className="line-clamp-2">{alert.explanation}</p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={alert.risk_level} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      {alert.is_resolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" /> Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending Voucher
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {!alert.is_resolved ? (
                        <>
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Link className="w-3 h-3" /> Attach Evidence
                          </button>
                          <button
                            onClick={() => handleWaiveAlert(alert)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
                          >
                            Waive
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Voucher Attached</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No missing document alerts found for this filter.
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
        title={`Attach Supporting Document to Tx #${selectedAlert?.transaction_id}`}
        subtitle={`Select uploaded evidence to satisfy the missing ${selectedAlert?.missing_document_type.replace(/_/g, ' ')} requirement`}
        maxWidth="md"
      >
        {selectedAlert && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-900">
                Transaction: ${selectedAlert.transaction?.amount.toFixed(2)} to {selectedAlert.transaction?.vendor_name}
              </p>
              <p className="text-slate-500 mt-0.5">Required: {selectedAlert.missing_document_type.replace(/_/g, ' ')}</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Select Uploaded Evidence Document</label>
              {availableDocs.length > 0 ? (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option value="">-- Choose from Document Repository --</option>
                  {availableDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename} ({doc.category.toUpperCase()} - {doc.file_type.toUpperCase()})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-slate-500 italic">No documents available. Upload one in the Documents module first.</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Auditor Verification Note</label>
              <input
                type="text"
                value={attachNotes}
                onChange={(e) => setAttachNotes(e.target.value)}
                placeholder="e.g., Verified invoice signature matches authorized signatory"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!selectedDocId}
                onClick={handleAttachDocument}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Link Evidence & Resolve</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
