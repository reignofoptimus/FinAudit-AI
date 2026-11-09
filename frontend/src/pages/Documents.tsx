import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Check,
  Save,
  Download,
  Sparkles
} from 'lucide-react';
import { DocumentItem, ExtractedRecord } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const Documents: React.FC = () => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('invoice');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Extracted Records Modal
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExtractedRecord | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await api.listDocuments();
      setDocuments(data);
    } catch (err: any) {
      addToast('error', 'Failed to load documents', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('category', category);

    try {
      setUploadProgress(60);
      const res = await api.uploadDocuments(formData);
      setUploadProgress(100);
      addToast('success', 'Upload & Extraction Finished', `Successfully processed ${res.length} document(s) with automated OCR.`);
      fetchDocs();
    } catch (err: any) {
      addToast('error', 'Upload Error', err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openRecordsModal = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setRecordsLoading(true);
    try {
      const records = await api.getExtractedRecords(doc.id);
      setExtractedRecords(records);
    } catch (err: any) {
      addToast('error', 'Error loading extracted fields', err.message);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!editingRecord) return;
    try {
      const updated = await api.updateExtractedRecord(editingRecord.id, {
        invoice_number: editingRecord.invoice_number,
        vendor_name: editingRecord.vendor_name,
        total_amount: editingRecord.total_amount,
        tax_amount: editingRecord.tax_amount,
        payment_status: editingRecord.payment_status,
        is_verified: true,
        verification_notes: editingRecord.verification_notes || 'Verified by auditor'
      });
      addToast('success', 'Record Verified', 'Extracted financial fields updated and verified.');
      setExtractedRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingRecord(null);
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & Quick Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload Financial Documents for Audit</h3>
            <p className="text-xs text-slate-500">
              Drag and drop PDF invoices, CSV bank statements, and Excel general ledgers for automated OCR extraction.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Document Type:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-hidden focus:border-blue-500"
            >
              <option value="invoice">Supplier / Sales Invoice (PDF)</option>
              <option value="bank_statement">Bank Statement (CSV/PDF)</option>
              <option value="general_ledger">General Ledger Records (Excel)</option>
              <option value="receipt">Expense Receipt (PDF/Image)</option>
            </select>
          </div>
        </div>

        {/* Drag and Drop Container */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf,.csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Click to select files or drag & drop documents here
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Supports PDF (PyMuPDF OCR), CSV, and Excel .xlsx/.xls (up to 25MB)</p>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs mt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Processing OCR & Data Normalization...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents Repository Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Processed Document Repository</h3>
            <p className="text-xs text-slate-500">Verified evidence base and parsed financial data</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {documents.length} Files Uploaded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Extracted Records</th>
                <th className="py-3 px-4">OCR Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      {doc.file_type === 'pdf' ? (
                        <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      )}
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">{doc.category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 uppercase text-slate-500 font-mono text-[11px]">{doc.file_type}</td>
                    <td className="py-3 px-4 text-slate-500">{(doc.file_size_bytes / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{doc.extracted_records_count}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">{(doc.confidence_score * 100).toFixed(0)}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${doc.confidence_score * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={doc.processing_status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openRecordsModal(doc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-blue-600 font-semibold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect OCR</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No documents uploaded yet. Use the upload area above to parse invoices or ledgers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extracted Records Verification Modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => {
          setSelectedDoc(null);
          setEditingRecord(null);
        }}
        title={`Extracted Financial Records: ${selectedDoc?.filename || ''}`}
        subtitle="Review, verify, and correct OCR fields before finalizing for transaction matching"
        maxWidth="4xl"
      >
        {recordsLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading extracted records...</div>
        ) : editingRecord ? (
          /* Inline Record Editor */
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-900">Edit Extracted Record #{editingRecord.id}</h4>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={editingRecord.invoice_number || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, invoice_number: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  value={editingRecord.vendor_name || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, vendor_name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Total Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRecord.total_amount}
                  onChange={(e) => setEditingRecord({ ...editingRecord, total_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tax Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRecord.tax_amount || 0}
                  onChange={(e) => setEditingRecord({ ...editingRecord, tax_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Auditor Verification Notes</label>
              <input
                type="text"
                value={editingRecord.verification_notes || ''}
                placeholder="e.g., Confirmed with physical voucher"
                onChange={(e) => setEditingRecord({ ...editingRecord, verification_notes: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecord}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Confirm & Save Changes</span>
              </button>
            </div>
          </div>
        ) : (
          /* Records Table */
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Tax</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Verified</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {extractedRecords.length > 0 ? (
                    extractedRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.invoice_number || 'N/A'}</td>
                        <td className="py-2.5 px-3 text-slate-700">{rec.vendor_name || 'N/A'}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {rec.transaction_date ? new Date(rec.transaction_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">${rec.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-slate-500">${(rec.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-teal-600">{(rec.confidence_score * 100).toFixed(0)}%</span>
                        </td>
                        <td className="py-2.5 px-3">
                          {rec.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setEditingRecord(rec)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1 ml-auto"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">No records extracted from this document.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Close Viewer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
