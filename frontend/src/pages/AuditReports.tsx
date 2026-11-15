import React, { useState, useEffect } from 'react';
import { AuditReportItem } from '../types';
import { api } from '../api/client';
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
      addToast('error', 'Report registry retrieval notice', err.message);
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
      addToast('error', 'Compilation Notice', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div>
          <h2 className="text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
            Audit Report Studio & Compliance Workpapers
          </h2>
          <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
            Synthesize multi-ledger findings into formal, regulatory-ready audit draft reports with attestation sign-off blocks
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="h-11 px-5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-all shadow-md shadow-[#FFC900]/20 flex items-center space-x-2 shrink-0"
        >
          <span>Compile New Audit Report</span>
          <span className="font-mono text-xs">+</span>
        </button>
      </div>

      {/* Reports Archive */}
      <div className="glass-card overflow-hidden border border-white/10 shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-[#F5F3EF] tracking-tight">
              Compiled Audit Report Archive
            </h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
              Published audit drafts and historical PDF certifications
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#F5F3EF] bg-white/10 border border-white/10 px-3 py-1 rounded-full">
            {reports.length} Reports Compiled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 bg-white/[0.02]">
                <th className="py-3 px-5">Report Title</th>
                <th className="py-3 px-5">Period</th>
                <th className="py-3 px-5">Transactions</th>
                <th className="py-3 px-5">Variances</th>
                <th className="py-3 px-5">Duplicates</th>
                <th className="py-3 px-5">Outliers</th>
                <th className="py-3 px-5">Auditor / Author</th>
                <th className="py-3 px-5">Generated Date</th>
                <th className="py-3 px-5 text-right">PDF Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    Loading report archive...
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#F5F3EF] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FFC900]" />
                      <span className="truncate max-w-xs font-display">{rep.title}</span>
                    </td>
                    <td className="py-3.5 px-5 text-[#F5F3EF]/80 font-mono text-[11px] font-semibold">{rep.audit_period}</td>
                    <td className="py-3.5 px-5 text-[#F5F3EF] font-mono font-bold">{rep.total_transactions}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#F5F3EF]">{rep.discrepancies_count}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#F5F3EF]">{rep.duplicates_count}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#F5F3EF]">{rep.anomalies_count}</td>
                    <td className="py-3.5 px-5 text-[#F5F3EF]/70">{rep.generated_by}</td>
                    <td className="py-3.5 px-5 text-[#F5F3EF]/60 font-mono text-[11px]">
                      {new Date(rep.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <a
                        href={api.getReportDownloadUrl(rep.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-colors shadow-sm shadow-[#FFC900]/20"
                      >
                        <span>Download PDF</span>
                        <span className="font-mono text-xs">↓</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#F5F3EF]/40 font-mono">
                    No reports generated yet. Click "Compile New Audit Report" to synthesize your findings into a PDF draft.
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
        subtitle="Compile evidence, outlier analyses, and findings into a downloadable formal PDF"
        maxWidth="xl"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4 text-xs font-sans">
          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Report Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] font-semibold border border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">Audit Period</label>
              <input
                type="text"
                required
                value={auditPeriod}
                onChange={(e) => setAuditPeriod(e.target.value)}
                placeholder="e.g., FY2024 (Full Year)"
                className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] border border-white/10"
              />
            </div>

            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">Risk Severity Filter</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] font-semibold bg-[#08090B] border border-white/10"
              >
                <option value="all" className="bg-[#08090B] text-[#F5F3EF]">Include All Risk Levels</option>
                <option value="high" className="bg-[#08090B] text-[#F5F3EF]">High Risk Critical Only</option>
                <option value="medium" className="bg-[#08090B] text-[#F5F3EF]">Medium & High Risk</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#F5F3EF] block mb-1">Auditor Attestation Commentary</label>
            <textarea
              rows={4}
              value={auditorComments}
              onChange={(e) => setAuditorComments(e.target.value)}
              placeholder="State any specific findings, remedial recommendations, or scope exceptions..."
              className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] border border-white/10"
            />
          </div>

          <div className="p-3 bg-[#FFC900]/15 rounded-2xl border border-[#FFC900]/30 text-[#FFC900] text-[11px] font-mono">
            <strong>Compliance Notice:</strong> The generated report will contain formal structured tables, executive summary metrics, and the certification block requiring human auditor signature attestation.
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="px-4 py-2 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm shadow-[#FFC900]/20"
            >
              <span>{isGenerating ? 'Compiling PDF Report...' : 'Compile & Generate PDF'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
