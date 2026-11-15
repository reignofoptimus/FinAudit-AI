import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Download,
  Search,
  Bell,
  Sparkles,
  FileCheck2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

interface NavbarProps {
  activeTab: NavTab;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onRefreshData }) => {
  const { addToast } = useToast();
  const [isReseeding, setIsReseeding] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [sampleFiles, setSampleFiles] = useState<{ filename: string; size_bytes: number; file_type: string }[]>([]);

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Audit Executive Dashboard', subtitle: 'Continuous financial integrity & risk surveillance overview' },
    documents: { title: 'Financial Document Repository', subtitle: 'Upload, OCR extraction, and field verification workspace' },
    transactions: { title: 'Transaction Ledger & Records', subtitle: 'Consolidated multi-source financial transaction ledger' },
    matching: { title: 'Automated Transaction Matching', subtitle: 'Cross-document reconciliation & three-way matching engine' },
    findings: { title: 'Financial Discrepancy Analysis', subtitle: 'Ledger variances, billing errors, and tax miscalculations' },
    duplicates: { title: 'Duplicate Payment Detection', subtitle: 'Multi-factor duplicate invoices and duplicate disbursement alerts' },
    missing: { title: 'Missing Documentation Surveillance', subtitle: 'Evidentiary gaps, missing vouchers, and unattached expenses' },
    anomalies: { title: 'Machine Learning Anomaly Detection', subtitle: 'Isolation Forest statistical outlier scoring & behavioral analysis' },
    vendors: { title: 'Vendor Risk & Spend Analytics', subtitle: 'Vendor payment patterns, spend velocity, and risk classification' },
    reports: { title: 'Audit Report Generation Studio', subtitle: 'Downloadable PDF comprehensive compliance & audit reports' },
    settings: { title: 'Audit Control Settings', subtitle: 'Configurable risk thresholds, model parameters, and company profile' },
  };

  useEffect(() => {
    api.listSampleFiles().then(setSampleFiles).catch(() => {});
  }, []);

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await api.reseedDatabase();
      addToast('success', 'Database Re-seeded', 'Audit dataset reset with 120+ synthetic records and fresh ML models.');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      addToast('error', 'Seeding Failed', err.message);
    } finally {
      setIsReseeding(false);
    }
  };

  const current = titles[activeTab] || { title: 'Financial Audit', subtitle: '' };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {current.title}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            <Sparkles className="w-3 h-3 text-teal-600" /> AI-Assisted
          </span>
        </h2>
        <p className="text-xs text-slate-500">{current.subtitle}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Sample Files Dropdown for Quick Testing */}
        <div className="relative">
          <button
            onClick={() => setShowSampleMenu(!showSampleMenu)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Test Sample Documents</span>
          </button>

          {showSampleMenu && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setShowSampleMenu(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Download Ready-to-Upload Test Files</p>
                <p className="text-[10px] text-slate-500">Test the drag-and-drop extraction pipeline:</p>
              </div>
              <div className="py-1 space-y-1">
                <a
                  href={api.getSampleFileUrl('sample_invoice_cloudscale.pdf')}
                  download
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">sample_invoice_cloudscale.pdf</p>
                    <p className="text-[10px] text-slate-400">PDF Invoice with extracted items</p>
                  </div>
                </a>

                <a
                  href={api.getSampleFileUrl('sample_bank_statement_q4.csv')}
                  download
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">sample_bank_statement_q4.csv</p>
                    <p className="text-[10px] text-slate-400">CSV Bank settlement entries</p>
                  </div>
                </a>

                <a
                  href={api.getSampleFileUrl('sample_general_ledger.xlsx')}
                  download
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">sample_general_ledger.xlsx</p>
                    <p className="text-[10px] text-slate-400">Excel multi-column general ledger</p>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Reseed / Reset Audit Dataset Button */}
        <button
          onClick={handleReseed}
          disabled={isReseeding}
          title="Re-run audit pipelines on fresh synthetic data"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isReseeding ? 'animate-spin' : ''}`} />
          <span>{isReseeding ? 'Syncing...' : 'Reset Demo Data'}</span>
        </button>

        {/* Audit Status Indicator */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-600 hidden sm:inline">Engine Active</span>
        </div>
      </div>
    </header>
  );
};
