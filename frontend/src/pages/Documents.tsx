import React, { useState, useEffect, useRef } from 'react';
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
      addToast('error', 'Document repository notice', err.message);
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
    setUploadProgress(25);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('category', category);

    try {
      setUploadProgress(65);
      const res = await api.uploadDocuments(formData);
      setUploadProgress(100);
      addToast('success', 'Document Processing Complete', `Successfully verified ${res.length} document(s).`);
      fetchDocs();
    } catch (err: any) {
      addToast('error', 'Document Upload Error', err.message);
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
        currency: editingRecord.currency,
        verification_notes: editingRecord.verification_notes,
      });

      setExtractedRecords((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setEditingRecord(null);
      addToast('success', 'Field Record Verified', `Record #${updated.id} successfully updated.`);
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <div className="glass-card p-4 sm:p-6 border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
              Optical Document Repository & Extraction
            </h2>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
              Upload PDF invoices, bank receipts, or CSV bank statements for automated normalization
            </p>
          </div>

          {/* Category Toggle Pills strictly in 3-colour palette */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'invoice', label: 'Invoices' },
              { id: 'bank_statement', label: 'Bank Statements' },
              { id: 'ledger', label: 'General Ledger' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all border active:scale-95 touch-manipulation ${
                  category === cat.id
                    ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-md shadow-[#FFC900]/20'
                    : 'glass-pill text-[#F5F3EF]/70 hover:text-[#F5F3EF] border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
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
          className="border-2 border-dashed border-white/15 hover:border-[#FFC900] hover:bg-white/[0.03] rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 active:scale-[0.99] touch-manipulation"
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf,.csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-[#FFC900] text-[#08090B] flex items-center justify-center shadow-lg shadow-[#FFC900]/25">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#F5F3EF] font-display">
              Click to select files or drag & drop documents here
            </p>
            <p className="text-xs text-[#F5F3EF]/50 font-mono mt-0.5">
              Supports PDF, CSV, and Excel (.xlsx/.xls) up to 25MB
            </p>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs mt-3">
              <div className="flex justify-between text-xs font-mono font-semibold text-[#F5F3EF] mb-1">
                <span>Parsing optical fields...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FFC900] transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents Repository Table */}
      <div className="glass-card overflow-hidden border border-white/10 shadow-xl">
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display text-[#F5F3EF] tracking-tight">
              Processed Document Repository
            </h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
              Verified evidence base and parsed financial data
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#F5F3EF] bg-white/10 border border-white/10 px-3 py-1 rounded-full self-start sm:self-auto">
            {documents.length} Files Verified
          </span>
        </div>

        {/* Mobile Horizontal Scroll Indicator */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/10 text-[11px] font-mono text-[#F5F3EF]/50">
          <span>Scroll horizontally for all document columns →</span>
          <span className="text-[#FFC900] font-bold">8 columns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 bg-white/[0.02]">
                <th className="py-3 px-5">Filename</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Format</th>
                <th className="py-3 px-5">Size</th>
                <th className="py-3 px-5">Parsed Records</th>
                <th className="py-3 px-5">OCR Confidence</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    Loading repository index...
                  </td>
                </tr>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#F5F3EF] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FFC900]" />
                      <span className="truncate max-w-xs font-mono">{doc.filename}</span>
                    </td>
                    <td className="py-3.5 px-5 capitalize text-[#F5F3EF]/80 font-medium">
                      {doc.category.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-5 uppercase text-[#F5F3EF]/60 font-mono text-[11px]">
                      {doc.file_type}
                    </td>
                    <td className="py-3.5 px-5 text-[#F5F3EF]/60 font-mono">
                      {(doc.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#F5F3EF]">
                      {doc.extracted_records_count}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#F5F3EF]">
                          {(doc.confidence_score * 100).toFixed(0)}%
                        </span>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FFC900] rounded-full"
                            style={{ width: `${doc.confidence_score * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={doc.processing_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => openRecordsModal(doc)}
                        className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-[#F5F3EF] hover:bg-[#FFC900] hover:text-[#08090B] transition-colors border border-white/10"
                      >
                        Inspect OCR
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#F5F3EF]/40 font-mono">
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
        title={`Extracted Records: ${selectedDoc?.filename || ''}`}
        subtitle="Review, verify, and correct optical parsing fields before finalizing for transaction matching"
        maxWidth="4xl"
      >
        {recordsLoading ? (
          <div className="py-12 text-center text-xs font-mono text-[#F5F3EF]/50">
            Loading extracted fields...
          </div>
        ) : editingRecord ? (
          /* Inline Record Editor */
          <div className="p-5 rounded-2xl glass-soft space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold font-display text-[#F5F3EF]">
                Edit Extracted Record #{editingRecord.id}
              </h4>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-xs text-[#F5F3EF]/60 hover:text-[#F5F3EF]"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-semibold text-[#F5F3EF] block mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={editingRecord.invoice_number || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, invoice_number: e.target.value })}
                  className="w-full glass-input rounded-xl p-2 text-xs font-mono text-[#F5F3EF] border border-white/10"
                />
              </div>

              <div>
                <label className="font-semibold text-[#F5F3EF] block mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  value={editingRecord.vendor_name || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, vendor_name: e.target.value })}
                  className="w-full glass-input rounded-xl p-2 text-xs text-[#F5F3EF] border border-white/10"
                />
              </div>

              <div>
                <label className="font-semibold text-[#F5F3EF] block mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRecord.total_amount}
                  onChange={(e) => setEditingRecord({ ...editingRecord, total_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input rounded-xl p-2 text-xs font-mono text-[#F5F3EF] border border-white/10"
                />
              </div>

              <div>
                <label className="font-semibold text-[#F5F3EF] block mb-1">Tax Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRecord.tax_amount || 0}
                  onChange={(e) => setEditingRecord({ ...editingRecord, tax_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input rounded-xl p-2 text-xs font-mono text-[#F5F3EF] border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">Auditor Verification Notes</label>
              <textarea
                rows={2}
                value={editingRecord.verification_notes || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, verification_notes: e.target.value })}
                placeholder="Enter auditor sign-off notes or tax variance reasoning..."
                className="w-full glass-input rounded-xl p-2 text-xs text-[#F5F3EF] border border-white/10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecord}
                className="px-5 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] text-xs font-bold hover:bg-[#FFD733] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* Table of Extracted Records */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50">
                  <th className="py-2.5 px-3">Rec ID</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Tax</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {extractedRecords.length > 0 ? (
                  extractedRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#F5F3EF]/60">#{rec.id}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#F5F3EF]">
                        {rec.invoice_number || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#F5F3EF]">{rec.vendor_name || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-[#F5F3EF]/70">
                        {rec.transaction_date || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F5F3EF]">
                        ₹{rec.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#F5F3EF]/70">
                        ₹{rec.tax_amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setEditingRecord(rec)}
                          className="px-2.5 py-1 rounded-xl glass-pill text-xs font-semibold text-[#F5F3EF] hover:bg-[#FFC900] hover:text-[#08090B] transition-colors border border-white/10"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#F5F3EF]/40 font-mono">
                      No records parsed from this document.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};
