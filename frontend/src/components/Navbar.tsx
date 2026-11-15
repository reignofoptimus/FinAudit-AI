import React, { useState, useEffect } from 'react';
import { NavTab } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

interface NavbarProps {
  activeTab: NavTab;
  onRefreshData?: () => void;
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onRefreshData, onSearch }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [, setSampleFiles] = useState<{ filename: string; size_bytes: number; file_type: string }[]>([]);

  const tabTitles: Record<NavTab, { title: string; greeting: string }> = {
    dashboard: {
      title: 'Overview',
      greeting: `Welcome back, ${user?.full_name ? user.full_name.split(' ')[0] : 'Sarah'} · Institutional Ledger & Assurance Overview`,
    },
    transactions: {
      title: 'Ledger Transactions',
      greeting: 'Consolidated multi-source transaction records and audit verification trail',
    },
    matching: {
      title: 'Reconciliation Engine',
      greeting: 'Automated cross-source reconciliation and three-way document matching',
    },
    documents: {
      title: 'Document Repository',
      greeting: 'Optical text & table extraction and field verification repository',
    },
    findings: {
      title: 'Variance & Discrepancies',
      greeting: 'Identified ledger discrepancies, pricing variances, and calculation discrepancies',
    },
    duplicates: {
      title: 'Duplicate Detection',
      greeting: 'Cross-factor duplicate invoices, duplicate payments, and disbursement flags',
    },
    missing: {
      title: 'Missing Documentation',
      greeting: 'Evidentiary gaps, missing vouchers, and unattached ledger entries',
    },
    anomalies: {
      title: 'Statistical Outliers',
      greeting: 'Multi-variable outlier scoring and distribution analysis across ledger accounts',
    },
    vendors: {
      title: 'Counterparty Analysis',
      greeting: 'Vendor concentration, velocity distribution, and risk stratification',
    },
    reports: {
      title: 'Audit Reports Studio',
      greeting: 'Downloadable PDF comprehensive compliance, assurance, and executive workpapers',
    },
    settings: {
      title: 'Control Settings',
      greeting: 'Institutional parameters, tolerance limits, and operational configurations',
    },
  };

  useEffect(() => {
    api.listSampleFiles().then(setSampleFiles).catch(() => {});
  }, []);

  const current = tabTitles[activeTab] || {
    title: 'Overview',
    greeting: 'Welcome back · Institutional Ledger & Assurance Overview',
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 px-6 py-4">
      {/* Top Glass Bar Container */}
      <div className="glass-card px-6 py-3 flex items-center justify-between gap-4 border border-white/10 shadow-xl">
        {/* Left: Page Title in Space Grotesk + Muted One-line Greeting */}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#F5F3EF] tracking-tight truncate">
            {current.title}
          </h1>
          <p className="text-xs text-[#F5F3EF]/60 truncate font-sans">
            {current.greeting}
          </p>
        </div>

        {/* Right Row of 44px Height Glass Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Glass Search Field with Hint Key */}
          <div className="relative hidden md:flex items-center">
            <div className="absolute left-3.5 text-[#F5F3EF]/40 pointer-events-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search ledger, vendors..."
              className="h-11 w-56 lg:w-64 pl-10 pr-12 rounded-2xl glass-input text-xs font-sans text-[#F5F3EF] placeholder-[#F5F3EF]/40 border border-white/10"
            />
            <div className="absolute right-3">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-white/10 text-[#F5F3EF]/60 border border-white/10">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Test Sample Files Button (Glass Pill) */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setShowSampleMenu(!showSampleMenu)}
              className="h-11 px-3.5 rounded-2xl glass-pill flex items-center space-x-2 text-xs font-medium text-[#F5F3EF] hover:border-white/30"
              title="Download test invoices and statements"
            >
              <svg className="w-4 h-4 text-[#FFC900]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Test Files</span>
            </button>

            {showSampleMenu && (
              <div
                className="absolute right-0 mt-2 w-72 glass-card p-3 shadow-2xl z-50 border border-white/15 animate-in fade-in"
                onMouseLeave={() => setShowSampleMenu(false)}
              >
                <div className="pb-2 mb-2 border-b border-white/10">
                  <p className="text-xs font-bold text-[#F5F3EF]">Ready-to-Upload Test Files</p>
                  <p className="text-[10px] text-[#F5F3EF]/60">Download sample files to test OCR & matching:</p>
                </div>
                <div className="space-y-1">
                  <a
                    href={api.getSampleFileUrl('sample_invoice_cloudscale.pdf')}
                    download
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs text-[#F5F3EF] hover:bg-white/10 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FFC900]" />
                    <span className="truncate font-mono">Invoice_CloudScale.pdf</span>
                  </a>
                  <a
                    href={api.getSampleFileUrl('sample_bank_statement.csv')}
                    download
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs text-[#F5F3EF] hover:bg-white/10 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F5F3EF]" />
                    <span className="truncate font-mono">Bank_Statement.csv</span>
                  </a>
                  <a
                    href={api.getSampleFileUrl('sample_general_ledger.csv')}
                    download
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs text-[#F5F3EF] hover:bg-white/10 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F5F3EF]/40" />
                    <span className="truncate font-mono">General_Ledger.csv</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Glass 'Last 30 days' Date-Range Pill */}
          <div className="relative">
            <button
              onClick={() => setShowDateMenu(!showDateMenu)}
              className="h-11 px-3.5 rounded-2xl glass-pill flex items-center space-x-2 text-xs font-medium text-[#F5F3EF] hover:border-white/30"
            >
              {/* Golden Yellow Calendar Icon */}
              <svg className="w-4 h-4 text-[#FFC900]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{dateRange}</span>
              <svg className="w-3.5 h-3.5 text-[#F5F3EF]/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showDateMenu && (
              <div
                className="absolute right-0 mt-2 w-44 glass-card p-2 shadow-2xl z-50 border border-white/15 animate-in fade-in"
                onMouseLeave={() => setShowDateMenu(false)}
              >
                {['Today', 'Last 7 days', 'Last 30 days', 'This Quarter', 'Year to date'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDateMenu(false);
                      if (onRefreshData) onRefreshData();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xl transition-colors ${
                      dateRange === range
                        ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-sm'
                        : 'text-[#F5F3EF] hover:bg-white/10'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Glass Bell Button with a Golden Yellow Notification Dot */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              className="h-11 w-11 rounded-2xl glass-pill flex items-center justify-center text-[#F5F3EF] relative hover:bg-white/10 transition-all hover:border-white/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

              {/* Golden Yellow Notification Dot */}
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FFC900] ring-2 ring-[#08090B]" />
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 glass-card p-4 shadow-2xl z-50 border border-white/15 animate-in fade-in"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="text-xs font-bold font-display text-[#F5F3EF]">Notifications</h4>
                  <span className="text-[10px] font-mono text-[#FFC900]">3 Unreviewed</span>
                </div>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <p className="font-semibold text-[#F5F3EF]">High Variance Invoice</p>
                    <p className="text-[11px] text-[#F5F3EF]/70 mt-0.5">Invoice #INV-2024-089 has an unexpected ₹4,200 difference from purchase order.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <p className="font-semibold text-[#F5F3EF]">Duplicate Disbursement Flag</p>
                    <p className="text-[11px] text-[#F5F3EF]/70 mt-0.5">Identical payment amount detected across 2 bank transactions within 48 hours.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Avatar Chip (Photo/Initials + Name + Role) */}
          <div className="h-11 pl-2 pr-3.5 rounded-2xl glass-pill flex items-center space-x-2.5 cursor-pointer hover:bg-white/10 transition-all hover:border-white/30">
            <div className="w-7 h-7 rounded-full bg-[#14161B] text-[#FFC900] flex items-center justify-center font-mono font-bold text-[11px] ring-1 ring-white/20">
              {user?.full_name
                ? user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'SJ'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#F5F3EF] leading-tight truncate">
                {user?.full_name || 'Sarah Jenkins'}
              </p>
              <p className="text-[10px] font-mono text-[#F5F3EF]/60 leading-tight">
                {user?.role === 'admin' ? 'Lead Partner' : 'Senior Auditor'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
