import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  GitCompare,
  AlertOctagon,
  Copy,
  FileQuestion,
  Cpu,
  Building2,
  FileBarChart2,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'documents'
  | 'transactions'
  | 'matching'
  | 'findings'
  | 'duplicates'
  | 'missing'
  | 'anomalies'
  | 'vendors'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  badgeCounts?: {
    discrepancies?: number;
    duplicates?: number;
    missing?: number;
    anomalies?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, badgeCounts }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents' as NavTab, label: 'Documents', icon: FileText },
    { id: 'transactions' as NavTab, label: 'Transactions', icon: ArrowLeftRight },
    { id: 'matching' as NavTab, label: 'Transaction Matching', icon: GitCompare },
    {
      id: 'findings' as NavTab,
      label: 'Audit Findings',
      icon: AlertOctagon,
      badge: badgeCounts?.discrepancies,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'duplicates' as NavTab,
      label: 'Duplicate Detection',
      icon: Copy,
      badge: badgeCounts?.duplicates,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'missing' as NavTab,
      label: 'Missing Documents',
      icon: FileQuestion,
      badge: badgeCounts?.missing,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    {
      id: 'anomalies' as NavTab,
      label: 'Anomaly Detection',
      icon: Cpu,
      badge: badgeCounts?.anomalies,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
    { id: 'vendors' as NavTab, label: 'Vendor Analysis', icon: Building2 },
    { id: 'reports' as NavTab, label: 'Audit Reports', icon: FileBarChart2 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              FinAudit <span className="text-teal-400 font-extrabold text-xs px-1.5 py-0.5 rounded-md bg-teal-950/60 border border-teal-500/30">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Financial Assurance System</p>
          </div>
        </div>
      </div>

      {/* Entity Card */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/60">
        <div className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-teal-400 block">Audited Entity</span>
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.company_name || 'Acme Global Enterprise'}</p>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            FY24
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Core Audit Modules
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center space-x-1.5 ml-2">
                {item.badge && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {user?.full_name ? user.full_name[0] : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Auditor User'}</p>
              <span className="text-[10px] uppercase font-bold text-teal-400 capitalize">{user?.role || 'Auditor'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
