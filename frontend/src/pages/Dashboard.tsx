import React, { useState, useEffect } from 'react';
import {
  FileText,
  ArrowLeftRight,
  AlertOctagon,
  Copy,
  FileQuestion,
  Cpu,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardStats } from '../types';
import { api } from '../api/client';
import { NavTab } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Calculating Live Audit Statistics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Banner: Health Score & Quick State */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Audit Pipeline Active</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Health & Verification Overview</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Real-time multi-ledger synchronization, automated invoice three-way matching, duplicate payment defense, and Isolation Forest ML anomaly scoring.
            </p>
          </div>

          {/* Health Score Pill */}
          <div className="flex items-center gap-6 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 self-start lg:self-auto">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Health</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-extrabold text-white">{stats?.audit_health_score || 84}%</span>
                <span className="text-xs text-emerald-400 font-semibold">Reliable</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-700" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Audit Status</span>
              <div className="mt-1">
                <StatusBadge status={stats?.overall_status || 'In Review'} size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Key Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Transactions"
          value={stats?.total_transactions.toLocaleString() || '0'}
          subtitle={`Spend $${((stats?.total_spend || 0) / 1000).toFixed(0)}k`}
          icon={<ArrowLeftRight className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
          onClick={() => onNavigate('transactions')}
        />

        <MetricCard
          title="Documents"
          value={stats?.total_documents || 0}
          subtitle="PDF, CSV & Excel"
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-slate-100 text-slate-700"
          onClick={() => onNavigate('documents')}
        />

        <MetricCard
          title="Discrepancies"
          value={stats?.total_discrepancies || 0}
          subtitle="Variances found"
          icon={<AlertOctagon className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-600"
          badgeText="Investigate"
          badgeColor="bg-rose-100 text-rose-700"
          onClick={() => onNavigate('findings')}
        />

        <MetricCard
          title="Duplicates"
          value={stats?.total_duplicates || 0}
          subtitle="Payment twins"
          icon={<Copy className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
          badgeText="At Risk"
          badgeColor="bg-amber-100 text-amber-700"
          onClick={() => onNavigate('duplicates')}
        />

        <MetricCard
          title="Missing Docs"
          value={stats?.total_missing_docs || 0}
          subtitle="Lacks voucher"
          icon={<FileQuestion className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
          onClick={() => onNavigate('missing')}
        />

        <MetricCard
          title="ML Anomalies"
          value={stats?.total_anomalies || 0}
          subtitle="Isolation Forest"
          icon={<Cpu className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-600"
          badgeText="Outliers"
          badgeColor="bg-purple-100 text-purple-700"
          onClick={() => onNavigate('anomalies')}
        />
      </div>

      {/* Charts Section: Monthly Income/Expense + Findings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Financial Inflow vs Outflow Velocity</h3>
              <p className="text-xs text-slate-500">Monthly comparison of customer deposits vs vendor expenditures</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthly_trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income / Deposits" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenditures" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Finding Types Distribution (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Audit Findings Concentration</h3>
            <p className="text-xs text-slate-500">Distribution across active control anomalies</p>

            <div className="h-48 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.type_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {(stats?.type_distribution || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px]">
            {(stats?.type_distribution || []).map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Critical Findings & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Risk Findings Section (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Critical High-Risk Findings</h3>
                <p className="text-xs text-slate-500">Unexplained variances, extreme outliers, and duplicate vouchers</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('findings')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Explore All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats?.high_risk_findings && stats.high_risk_findings.length > 0 ? (
              stats.high_risk_findings.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition-all flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={item.risk_level} size="sm" />
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{item.explanation}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>Vendor: <strong className="text-slate-700">{item.vendor}</strong></span>
                      <span>•</span>
                      <span>Date: <strong className="text-slate-700">{item.date}</strong></span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-extrabold text-slate-900 block">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <button
                      onClick={() => onNavigate(item.type === 'anomaly' ? 'anomalies' : 'findings')}
                      className="mt-1 text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Investigate →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">No critical high risk findings detected.</div>
            )}
          </div>
        </div>

        {/* Live Activity Feed (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Audit Activity Log</h3>
          </div>

          <div className="space-y-3">
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              stats.recent_activities.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{log.details || log.action}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{log.user_name || 'System'}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No recent actions logged</p>
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('documents')}
              className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload Docs</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Build Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
