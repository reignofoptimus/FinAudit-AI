import React, { useState, useEffect } from 'react';
import { NavTab } from '../components/Sidebar';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/client';
import { DashboardStats, TransactionItem, HighRiskItem } from '../types';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTx, setRecentTx] = useState<TransactionItem[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, txData] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.listTransactions({ limit: 6 }).catch(() => ({ items: [] })),
        ]);
        if (statsData) setStats(statsData);
        if (txData?.items?.length) {
          setRecentTx(txData.items.slice(0, 6));
        }
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fallback high-risk findings if backend has not detected any yet
  const fallbackHighRiskFindings: HighRiskItem[] = [
    {
      id: 1,
      type: 'discrepancy',
      title: 'Variance: Tax Calculation Error',
      amount: 3760.0,
      vendor: 'Pinnacle Legal Advisors',
      risk_level: 'high',
      explanation: 'Recorded sales/VAT tax of ₹5,200.00 deviates from computed statutory schedule by ₹3,760.00.',
      date: '2024-09-05',
    },
    {
      id: 2,
      type: 'anomaly',
      title: 'Isolation Forest Outlier (Score 66)',
      amount: 42500.0,
      vendor: 'Delta Logistics Corp',
      risk_level: 'high',
      explanation: 'High absolute amount: ₹42,500.00 • Frequency deviation beyond 3.2 sigma threshold.',
      date: '2024-04-10',
    },
    {
      id: 3,
      type: 'anomaly',
      title: 'Isolation Forest Outlier (Score 74)',
      amount: 58000.0,
      vendor: 'Quantum Data Analytics',
      risk_level: 'high',
      explanation: 'High absolute amount: ₹58,000.00 • Off-cycle weekend disbursement detected without matched PO.',
      date: '2024-07-24',
    },
    {
      id: 4,
      type: 'anomaly',
      title: 'Isolation Forest Outlier (Score 86)',
      amount: 98500.0,
      vendor: 'Horizon Marketing LLC',
      risk_level: 'high',
      explanation: 'High absolute amount: ₹98,500.00 • Rapid vendor velocity escalation within 48-hour window.',
      date: '2024-09-15',
    },
  ];

  const highRiskList = stats?.high_risk_findings && stats.high_risk_findings.length > 0
    ? stats.high_risk_findings
    : fallbackHighRiskFindings;

  // Fallback transactions if none in DB yet
  const fallbackTransactions = [
    {
      id: 1,
      name: 'CloudScale Solutions',
      email: 'TX-00160',
      plan: 'GENERAL LEDGER',
      date: '2024-11-04',
      status: 'Completed',
      amount: '₹14,250.00',
    },
    {
      id: 2,
      name: 'Apex Global Logistics',
      email: 'TX-00159',
      plan: 'INVOICE',
      date: '2024-11-03',
      status: 'Processing',
      amount: '₹8,640.20',
    },
    {
      id: 3,
      name: 'Vertex Advisory Partners',
      email: 'TX-00158',
      plan: 'BANK STATEMENT',
      date: '2024-11-02',
      status: 'Completed',
      amount: '₹22,500.00',
    },
    {
      id: 4,
      name: 'Starlight Media Group',
      email: 'TX-00157',
      plan: 'INVOICE',
      date: '2024-11-01',
      status: 'Pending',
      amount: '₹3,890.00',
    },
    {
      id: 5,
      name: 'Nexis Cyber Systems',
      email: 'TX-00156',
      plan: 'GENERAL LEDGER',
      date: '2024-10-30',
      status: 'Completed',
      amount: '₹18,120.50',
    },
  ];

  const displayTransactions = recentTx.length > 0
    ? recentTx.map((tx) => ({
        id: tx.id,
        name: tx.vendor_name || 'Counterparty',
        email: tx.account_code || `TX-${tx.id.toString().padStart(5, '0')}`,
        plan: tx.source_type ? tx.source_type.replace('_', ' ').toUpperCase() : 'GENERAL LEDGER',
        date: tx.transaction_date ? new Date(tx.transaction_date).toISOString().split('T')[0] : '2024-11-04',
        status: tx.match_status === 'matched' ? 'Completed' : tx.match_status === 'partial' ? 'Processing' : 'Pending',
        amount: `₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }))
    : fallbackTransactions;

  // Month labels for the area chart
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Circumference for Donut Chart (Radius = 70 => 2 * PI * 70 = 439.82)
  const donutCircumference = 439.82;
  const totalFindings = (stats?.total_discrepancies || 3) +
    (stats?.total_duplicates || 2) +
    (stats?.total_missing_docs || 63) +
    (stats?.total_anomalies || 13);

  const pDiscrepancies = ((stats?.total_discrepancies || 3) / totalFindings);
  const pDuplicates = ((stats?.total_duplicates || 2) / totalFindings);
  const pMissing = ((stats?.total_missing_docs || 63) / totalFindings);
  const pAnomalies = ((stats?.total_anomalies || 13) / totalFindings);

  const seg1 = donutCircumference * pMissing;
  const seg2 = donutCircumference * pAnomalies;
  const seg3 = donutCircumference * pDiscrepancies;
  const seg4 = donutCircumference * pDuplicates;

  const handleInvestigateFinding = (item: HighRiskItem) => {
    switch (item.type) {
      case 'discrepancy':
        onNavigate('findings');
        break;
      case 'anomaly':
        onNavigate('anomalies');
        break;
      case 'duplicate':
        onNavigate('duplicates');
        break;
      case 'missing_doc':
        onNavigate('missing');
        break;
      default:
        onNavigate('findings');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* TOP BANNER: AUDIT HEALTH SCORE & VERIFICATION OVERVIEW */}
      <div className="glass-card p-6 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC900]/15 text-[#FFC900] border border-[#FFC900]/30 text-xs font-mono font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#FFC900] animate-pulse" />
              <span>Autonomous Assurance Engine Active</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-[#F5F3EF] tracking-tight">
              Audit Health & Verification Overview
            </h1>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-1 max-w-2xl leading-relaxed">
              Real-time multi-ledger synchronization, automated invoice three-way matching, duplicate payment defense, and Isolation Forest statistical anomaly scoring.
            </p>
          </div>

          {/* Health Score & Status Badge Pill */}
          <div className="flex items-center gap-6 glass-soft p-4 rounded-2xl border border-white/10 shrink-0">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 block">
                Overall Health
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold font-mono text-[#F5F3EF]">
                  {stats?.audit_health_score ? `${stats.audit_health_score.toFixed(0)}%` : '84%'}
                </span>
                <span className="text-xs font-mono font-bold text-[#FFC900]">
                  {stats?.audit_health_score && stats.audit_health_score >= 80 ? 'Reliable' : 'Attention'}
                </span>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10" />

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 block">
                Audit Status
              </span>
              <div className="mt-1">
                <StatusBadge status={stats?.overall_status || 'In Review'} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6-UP FINANCIAL AUDIT KPI STAT CARDS ROW (Exact Screenshot 1 elements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: TRANSACTIONS */}
        <MetricCard
          title="TRANSACTIONS"
          value={stats?.total_transactions ? stats.total_transactions.toLocaleString() : '160'}
          subtitle={`Spend ₹${stats?.total_spend ? (stats.total_spend / 1000).toFixed(0) : '2,194'}k`}
          delta="+12.4%"
          isPositive={true}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          }
          sparklineData={[30, 42, 38, 55, 48, 65, 78]}
          onClick={() => onNavigate('transactions')}
        />

        {/* KPI 2: DOCUMENTS */}
        <MetricCard
          title="DOCUMENTS"
          value={stats?.total_documents ?? 3}
          subtitle="PDF, CSV & Excel"
          delta="+2"
          isPositive={true}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
          sparklineData={[10, 15, 12, 22, 28, 30, 35]}
          onClick={() => onNavigate('documents')}
        />

        {/* KPI 3: DISCREPANCIES */}
        <MetricCard
          title="DISCREPANCIES"
          value={stats?.total_discrepancies ?? 3}
          subtitle="Variances found"
          badge="Investigate"
          badgeVariant="warning"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          sparklineData={[8, 12, 10, 16, 14, 18, 15]}
          onClick={() => onNavigate('findings')}
        />

        {/* KPI 4: DUPLICATES */}
        <MetricCard
          title="DUPLICATES"
          value={stats?.total_duplicates ?? 2}
          subtitle="Payment twins"
          badge="At Risk"
          badgeVariant="warning"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          }
          sparklineData={[5, 4, 6, 8, 5, 7, 6]}
          onClick={() => onNavigate('duplicates')}
        />

        {/* KPI 5: MISSING DOCS */}
        <MetricCard
          title="MISSING DOCS"
          value={stats?.total_missing_docs ?? 63}
          subtitle="Lacks voucher"
          badgeVariant="alert"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <circle cx="10" cy="13" r="2" />
              <path d="m20 17-1.5-1.5" />
            </svg>
          }
          sparklineData={[45, 52, 50, 58, 60, 65, 63]}
          onClick={() => onNavigate('missing')}
        />

        {/* KPI 6: ML ANOMALIES */}
        <MetricCard
          title="ML ANOMALIES"
          value={stats?.total_anomalies ?? 13}
          subtitle="Isolation Forest"
          badge="Outliers"
          badgeVariant="warning"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
          }
          sparklineData={[12, 10, 14, 11, 15, 12, 13]}
          onClick={() => onNavigate('anomalies')}
        />
      </div>

      {/* TWO-THIRDS / ONE-THIRD ROW: REVENUE & LEDGER AREA CHART + AUDIT FINDINGS DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE & EXPENDITURE AREA CHART (SPANS 2/3) */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between border border-white/10 shadow-xl">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
                Ledger Expenditure & Cash Flow Velocity
              </h2>
              <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
                Monthly verified disbursements vs prior period historical baseline
              </p>
            </div>

            {/* Small Legend */}
            <div className="flex items-center space-x-4 text-xs font-sans">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FFC900] inline-block shadow-sm shadow-[#FFC900]/30" />
                <span className="font-semibold text-[#F5F3EF]">Current FY</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-white/50 inline-block" />
                <span className="text-[#F5F3EF]/60">Prior FY</span>
              </div>
            </div>
          </div>

          {/* Inline-SVG Area Chart */}
          <div className="w-full h-64 relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 800 240"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="yellowAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFC900" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#FFC900" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#FFC900" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Faint Horizontal Gridlines */}
              <line x1="0" y1="40" x2="800" y2="40" stroke="#F5F3EF" strokeOpacity="0.08" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="800" y2="90" stroke="#F5F3EF" strokeOpacity="0.08" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="800" y2="140" stroke="#F5F3EF" strokeOpacity="0.08" strokeDasharray="4 4" />
              <line x1="0" y1="190" x2="800" y2="190" stroke="#F5F3EF" strokeOpacity="0.08" strokeDasharray="4 4" />
              <line x1="0" y1="230" x2="800" y2="230" stroke="#F5F3EF" strokeOpacity="0.15" />

              {/* Smooth Area Path for Current FY (Gradient Fill) */}
              <path
                d="M 0 170 Q 70 160 140 135 T 280 110 T 420 85 T 560 60 T 700 40 T 800 25 L 800 230 L 0 230 Z"
                fill="url(#yellowAreaGradient)"
              />

              {/* Dashed Pure White Comparison Line (Prior FY) */}
              <path
                d="M 0 195 Q 70 190 140 170 T 280 150 T 420 135 T 560 115 T 700 95 T 800 80"
                fill="none"
                stroke="#F5F3EF"
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeOpacity="0.4"
              />

              {/* Smooth Golden Yellow Line for Current FY */}
              <path
                d="M 0 170 Q 70 160 140 135 T 280 110 T 420 85 T 560 60 T 700 40 T 800 25"
                fill="none"
                stroke="#FFC900"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Highlighted White-Ringed Point on Curve */}
              <circle cx="490" cy="72" r="7" fill="#FFC900" stroke="#F5F3EF" strokeWidth="3" />

              {/* Solid Golden Yellow End Point with Pulsing Ring */}
              <circle cx="800" cy="25" r="5" fill="#FFC900" stroke="#08090B" strokeWidth="2" />
            </svg>
          </div>

          {/* Row of 12 Month Labels in Mono Below */}
          <div className="grid grid-cols-12 text-center text-[10px] font-mono font-medium text-[#F5F3EF]/50 pt-3 border-t border-white/10 mt-2">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* AUDIT RISK & FINDING DISTRIBUTION DONUT (SPANS 1/3) */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/10 shadow-xl">
          {/* Card Header */}
          <div className="pb-3 border-b border-white/10 mb-4">
            <h2 className="text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
              Audit Finding Distribution
            </h2>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
              Stratification across active risk classifications
            </p>
          </div>

          {/* Centred SVG Donut Ring */}
          <div className="relative flex items-center justify-center my-3">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#F5F3EF"
                strokeOpacity="0.08"
                strokeWidth="26"
              />

              {/* Missing Docs: Golden Yellow (#FFC900) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#FFC900"
                strokeWidth="26"
                strokeDasharray={`${seg1} ${donutCircumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />

              {/* ML Anomalies: Pure White (#F5F3EF) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#F5F3EF"
                strokeWidth="26"
                strokeDasharray={`${seg2} ${donutCircumference}`}
                strokeDashoffset={`-${seg1}`}
                strokeLinecap="round"
              />

              {/* Discrepancies: White Neutral (45% opacity) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#F5F3EF"
                strokeOpacity="0.45"
                strokeWidth="26"
                strokeDasharray={`${seg3} ${donutCircumference}`}
                strokeDashoffset={`-${seg1 + seg2}`}
                strokeLinecap="round"
              />

              {/* Duplicates: White Neutral (20% opacity) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#F5F3EF"
                strokeOpacity="0.2"
                strokeWidth="26"
                strokeDasharray={`${seg4} ${donutCircumference}`}
                strokeDashoffset={`-${seg1 + seg2 + seg3}`}
                strokeLinecap="round"
              />
            </svg>

            {/* Centred Total in JetBrains Mono + Caption */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-3xl font-bold font-mono text-[#F5F3EF] tracking-tight">
                {totalFindings}
              </span>
              <span className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5 font-medium">
                Active Findings
              </span>
            </div>
          </div>

          {/* Below Legend List */}
          <div className="space-y-2.5 pt-3 border-t border-white/10 font-sans text-xs">
            <div
              className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate('missing')}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFC900]" />
                <span className="text-[#F5F3EF] font-medium">Missing Documents</span>
              </div>
              <span className="font-mono font-bold text-[#F5F3EF]">
                {stats?.total_missing_docs ?? 63} ({(pMissing * 100).toFixed(0)}%)
              </span>
            </div>
            <div
              className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate('anomalies')}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5F3EF]" />
                <span className="text-[#F5F3EF] font-medium">ML Anomalies</span>
              </div>
              <span className="font-mono font-bold text-[#F5F3EF]">
                {stats?.total_anomalies ?? 13} ({(pAnomalies * 100).toFixed(0)}%)
              </span>
            </div>
            <div
              className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate('findings')}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5F3EF]/45" />
                <span className="text-[#F5F3EF] font-medium">Variances & Discrepancies</span>
              </div>
              <span className="font-mono font-bold text-[#F5F3EF]">
                {stats?.total_discrepancies ?? 3} ({(pDiscrepancies * 100).toFixed(0)}%)
              </span>
            </div>
            <div
              className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate('duplicates')}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5F3EF]/20" />
                <span className="text-[#F5F3EF] font-medium">Duplicate Payments</span>
              </div>
              <span className="font-mono font-bold text-[#F5F3EF]">
                {stats?.total_duplicates ?? 2} ({(pDuplicates * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-THIRDS / ONE-THIRD ROW: CRITICAL HIGH-RISK FINDINGS (Screenshot 2) + RECENT LEDGER ENTRIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CRITICAL HIGH-RISK FINDINGS (EXACT SCREENSHOT 2 CARD - SPANS 2/3) */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between border border-white/10 shadow-xl">
          {/* Card Header with Shield Icon + Explore All Link */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFC900]/15 border border-[#FFC900]/30 flex items-center justify-center text-[#FFC900] shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
                  Critical High-Risk Findings
                </h2>
                <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
                  Unexplained variances, extreme outliers, and duplicate vouchers
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('findings')}
              className="text-xs font-bold text-[#08090B] px-3.5 py-1.5 rounded-xl bg-[#FFC900] hover:bg-[#FFD733] transition-colors shadow-md shadow-[#FFC900]/20 flex items-center gap-1.5 shrink-0"
            >
              <span>Explore All</span>
              <span className="font-mono text-xs">→</span>
            </button>
          </div>

          {/* List of High-Risk Findings (Exact items from Screenshot 2) */}
          <div className="space-y-3">
            {highRiskList.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="glass-soft p-4 rounded-2xl border border-white/10 hover:border-[#FFC900]/40 transition-all space-y-2 group"
              >
                {/* Item Top Row: Risk Pill + Title (left) & Dollar Amount (right) */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-white/15 text-[#F5F3EF] border border-white/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFC900]" />
                      <span>{item.risk_level}</span>
                    </span>
                    <h4 className="text-sm font-bold font-display text-[#F5F3EF] tracking-tight">
                      {item.title}
                    </h4>
                  </div>

                  <span className="text-base font-bold font-mono text-[#F5F3EF] shrink-0">
                    ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Explanation text */}
                <p className="text-xs text-[#F5F3EF]/70 font-sans leading-relaxed line-clamp-2">
                  {item.explanation}
                </p>

                {/* Meta row: Vendor + Date (left) & Investigate -> (right) */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <div className="flex items-center space-x-2 text-[#F5F3EF]/60 font-sans text-[11px]">
                    <span>Vendor: <strong className="text-[#F5F3EF] font-semibold">{item.vendor}</strong></span>
                    <span>•</span>
                    <span className="font-mono">Date: <strong className="text-[#F5F3EF] font-semibold">{item.date}</strong></span>
                  </div>

                  <button
                    onClick={() => handleInvestigateFinding(item)}
                    className="text-[#FFC900] group-hover:text-[#FFD733] font-semibold text-xs flex items-center gap-1 hover:underline transition-all"
                  >
                    <span>Investigate</span>
                    <span className="font-mono text-xs">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT TRANSACTIONS TABLE (SPANS 1/3) */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/10 shadow-xl">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h2 className="text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
                  Recent Ledger Entries
                </h2>
                <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
                  Verified institutional records
                </p>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs font-semibold text-[#FFC900] hover:text-[#FFD733] flex items-center gap-1"
              >
                <span>View all</span>
                <span className="font-mono text-xs">→</span>
              </button>
            </div>

            {/* Compact Transaction List */}
            <div className="space-y-3">
              {displayTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl glass-soft border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#14161B] text-[#FFC900] flex items-center justify-center font-mono font-bold text-xs shrink-0 ring-1 ring-white/20">
                      {tx.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-[#F5F3EF] truncate leading-tight">
                        {tx.name}
                      </p>
                      <p className="text-[10px] font-mono text-[#F5F3EF]/50 truncate leading-tight mt-0.5">
                        {tx.email} • {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-[#F5F3EF] block">
                      {tx.amount}
                    </span>
                    <div className="mt-1">
                      <StatusBadge status={tx.status} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Ledger Action at Bottom */}
          <div className="pt-4 border-t border-white/10 mt-4">
            <button
              onClick={() => onNavigate('matching')}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-[#F5F3EF] font-semibold text-xs transition-colors border border-white/15 flex items-center justify-center gap-2"
            >
              <span>Execute 3-Way Reconciliation</span>
              <span className="font-mono text-xs">⚡</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
