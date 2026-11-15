import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { AuditReportItem } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const AuditReports: React.FC = () => {
  const { addToast } = useToast();
  const [reports, setReports] = useState<AuditReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // New Report Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [title, setTitle] = useState('FY2024 Comprehensive Financial Audit Report');
  const [auditPeriod, setAuditPeriod] = useState('Q1 - Q4 FY2024');
  const [riskFilter, setRiskFilter] = useState('all');
  const [auditorComments, setAuditorComments] = useState(
    'All critical high-variance transactions and duplicate payment alerts investigated. Recommend vendor credit deductions before year-end close.'
  );

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.listReports();
      setReports(data);
    } catch (err: any) {
      addToast('error', 'Failed to load reports', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const rep = await api.generateReport({
        title,
        audit_period: auditPeriod,
        risk_filter: riskFilter,
        auditor_comments: auditorComments,
      });
      addToast('success', 'PDF Audit Report Generated', `Report #${rep.id} synthesized and compiled successfully.`);
      setShowGenerateModal(false);
      fetchReports();
    } catch (err: any) {
      addToast('error', 'Generation Failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formal ReportLab PDF Synthesis & LLM Executive Summary</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Audit Report Generation Studio</h2>
          <p className="text-xs text-slate-500">
            Synthesize multi-ledger findings into formal, regulatory-ready audit draft reports with attestation sign-off blocks.
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-xs flex items-center space-x-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Build New Audit Report</span>
        </button>
      </div>

      {/* Reports Archive */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Compiled Audit Report Archive</h3>
            <p className="text-xs text-slate-500">Published audit drafts and historical PDF certifications</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {reports.length} Reports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report Title</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Transactions</th>
                <th className="py-3 px-4">Discrepancies</th>
                <th className="py-3 px-4">Duplicates</th>
                <th className="py-3 px-4">Anomalies</th>
                <th className="py-3 px-4">Auditor / Author</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4 text-right">PDF Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading audit report registry...</td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate max-w-xs">{rep.title}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{rep.audit_period}</td>
                    <td className="py-3 px-4 text-slate-700">{rep.total_transactions}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">{rep.discrepancies_count}</td>
                    <td className="py-3 px-4 font-bold text-amber-600">{rep.duplicates_count}</td>
                    <td className="py-3 px-4 font-bold text-purple-600">{rep.anomalies_count}</td>
                    <td className="py-3 px-4 text-slate-600">{rep.generated_by}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(rep.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={api.getReportDownloadUrl(rep.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No reports generated yet. Click "Build New Audit Report" to synthesize your findings into a PDF draft.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Synthesize Comprehensive Audit Report"
        subtitle="Compile evidence, ML anomaly results, and findings into a downloadable PDF"
        maxWidth="xl"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Report Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Audit Period</label>
              <input
                type="text"
                required
                value={auditPeriod}
                onChange={(e) => setAuditPeriod(e.target.value)}
                placeholder="e.g., FY2024 (Full Year)"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Risk Severity Filter</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold"
              >
                <option value="all">Include All Risk Levels</option>
                <option value="high">High Risk Critical Only</option>
                <option value="medium">Medium & High Risk</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Auditor Attestation Commentary</label>
            <textarea
              rows={4}
              value={auditorComments}
              onChange={(e) => setAuditorComments(e.target.value)}
              placeholder="State any specific findings, remedial recommendations, or scope exceptions..."
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
            <strong>Notice:</strong> The generated report will contain formal ReportLab formatted tables, executive summary metrics, and the mandatory AI-assisted disclaimer requiring certified human auditor attestation.
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Compiling PDF Report...' : 'Compile & Generate PDF'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
