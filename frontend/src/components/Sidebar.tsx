import React, { useState } from 'react';
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
  mobileDrawerOpen?: boolean;
  setMobileDrawerOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  badgeCounts,
  mobileDrawerOpen = false,
  setMobileDrawerOpen,
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [localDrawerOpen, setLocalDrawerOpen] = useState(false);

  const isDrawerOpen = mobileDrawerOpen !== undefined ? mobileDrawerOpen : localDrawerOpen;
  const setIsDrawerOpen = setMobileDrawerOpen || setLocalDrawerOpen;

  const totalActionBadges =
    (badgeCounts?.discrepancies || 0) +
    (badgeCounts?.duplicates || 0) +
    (badgeCounts?.missing || 0) +
    (badgeCounts?.anomalies || 0);

  // Optical inline SVGs adhering to strict 3-colour palette (#08090B, #F5F3EF, #FFC900)
  const navItems: {
    id: NavTab;
    label: string;
    shortLabel: string;
    badge?: number;
    group: 'core' | 'audit' | 'management';
    icon: (active: boolean) => React.ReactNode;
  }[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      shortLabel: 'Overview',
      group: 'core',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: 'transactions',
      label: 'Ledger Transactions',
      shortLabel: 'Ledger',
      group: 'core',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 6v12" />
        </svg>
      ),
    },
    {
      id: 'matching',
      label: 'Reconciliation Engine',
      shortLabel: 'Match',
      group: 'core',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
    {
      id: 'documents',
      label: 'Document Repository',
      shortLabel: 'Docs',
      group: 'core',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      ),
    },
    {
      id: 'findings',
      label: 'Variance & Discrepancies',
      shortLabel: 'Variance',
      group: 'audit',
      badge: badgeCounts?.discrepancies,
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      ),
    },
    {
      id: 'duplicates',
      label: 'Duplicate Detection',
      shortLabel: 'Duplicates',
      group: 'audit',
      badge: badgeCounts?.duplicates,
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      ),
    },
    {
      id: 'missing',
      label: 'Missing Documentation',
      shortLabel: 'Missing',
      group: 'audit',
      badge: badgeCounts?.missing,
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <circle cx="10" cy="13" r="2" />
          <path d="m20 17-1.5-1.5" />
        </svg>
      ),
    },
    {
      id: 'anomalies',
      label: 'Statistical Outliers',
      shortLabel: 'Outliers',
      group: 'audit',
      badge: badgeCounts?.anomalies,
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="4" y1="21" y2="14" />
          <line x1="4" x2="4" y1="10" y2="3" />
          <line x1="12" x2="12" y1="21" y2="12" />
          <line x1="12" x2="12" y1="8" y2="3" />
          <line x1="20" x2="20" y1="21" y2="16" />
          <line x1="20" x2="20" y1="12" y2="3" />
          <line x1="1" x2="7" y1="14" y2="14" />
          <line x1="9" x2="15" y1="8" y2="8" />
          <line x1="17" x2="23" y1="16" y2="16" />
        </svg>
      ),
    },
    {
      id: 'vendors',
      label: 'Counterparty Analysis',
      shortLabel: 'Vendors',
      group: 'management',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'reports',
      label: 'Audit Reports',
      shortLabel: 'Reports',
      group: 'management',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Control Settings',
      shortLabel: 'Settings',
      group: 'management',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* ============================================================== */}
      {/* 1. DESKTOP SLIM ICON RAIL (>= md: 768px)                       */}
      {/* ============================================================== */}
      <aside className="hidden md:flex w-20 fixed left-0 top-0 bottom-0 z-40 p-2.5 select-none flex-col items-center justify-between">
        <div className="w-full h-full glass-card py-3 px-1 flex flex-col items-center justify-between relative shadow-2xl border border-white/10">
          {/* Top Logo & Navigation */}
          <div className="flex flex-col items-center space-y-2.5 w-full">
            <div
              title="FinAudit Assurance Platform"
              className="w-11 h-11 rounded-2xl bg-[#FFC900] shadow-md shadow-[#FFC900]/20 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
              onClick={() => setActiveTab('dashboard')}
            >
              <svg className="w-6 h-6 text-[#08090B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2.5" />
                <path d="M12 19.5V22" />
                <path d="M4.93 4.93l1.77 1.77" />
                <path d="M17.3 17.3l1.77 1.77" />
                <path d="M2 12h2.5" />
                <path d="M19.5 12H22" />
                <path d="M4.93 19.07l1.77-1.77" />
                <path d="M17.3 6.7l1.77-1.77" />
              </svg>
            </div>

            <div className="w-8 h-px bg-white/10" />

            {/* Navigation Icons Stack */}
            <nav className="flex flex-col space-y-1.5 items-center overflow-y-auto max-h-[calc(100vh-190px)] py-1 w-full no-scrollbar">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <div key={item.id} className="relative group w-full flex justify-center">
                    <button
                      onClick={() => setActiveTab(item.id)}
                      title={item.label}
                      aria-label={item.label}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                        isActive
                          ? 'bg-[#FFC900] text-[#08090B] shadow-lg shadow-[#FFC900]/25 font-bold scale-105'
                          : 'text-[#F5F3EF]/60 hover:text-[#F5F3EF] hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      {item.icon(isActive)}

                      {/* Badge Indicator */}
                      {typeof item.badge === 'number' && item.badge > 0 && !isActive && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FFC900] ring-2 ring-[#08090B] animate-pulse" />
                      )}
                    </button>

                    {/* Tooltip on Hover */}
                    <div className="fixed left-20 px-3 py-1.5 rounded-xl bg-[#F5F3EF] text-[#08090B] text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-2xl flex items-center gap-2 border border-white/30">
                      <span>{item.label}</span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="font-mono text-[10px] text-[#08090B] bg-[#FFC900] px-1.5 py-0.5 rounded-md font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col items-center space-y-2.5 pt-2.5 border-t border-white/10 w-full shrink-0">
            <div className="relative group w-full flex justify-center">
              <button
                onClick={() => setShowHelpModal(true)}
                aria-label="Help & Documentation"
                title="Help & System Guide"
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#F5F3EF]/60 hover:text-[#F5F3EF] hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
              <div className="fixed left-20 px-3 py-1.5 rounded-xl bg-[#F5F3EF] text-[#08090B] text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-2xl border border-white/30">
                System Guide
              </div>
            </div>

            {/* Pinned Circular Avatar */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-[#14161B] text-[#FFC900] font-mono font-bold text-xs flex items-center justify-center ring-2 ring-white/20 hover:ring-[#FFC900] transition-all"
                title={`${user?.full_name || 'Auditor'} (${user?.role || 'Admin'})`}
              >
                {user?.full_name
                  ? user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'SJ'}
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  className="fixed left-20 bottom-3 w-56 glass-card p-3 shadow-2xl z-50 border border-white/15 tab-enter"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="pb-2 border-b border-white/10">
                    <p className="text-xs font-bold text-[#F5F3EF] truncate">{user?.full_name || 'Sarah Jenkins'}</p>
                    <p className="text-[11px] font-mono text-[#F5F3EF]/60 truncate">{user?.email || 'admin@finaudit.ai'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFC900]/20 text-[#FFC900]">
                      {user?.role?.toUpperCase() || 'LEAD PARTNER'}
                    </span>
                  </div>
                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-[#F5F3EF] hover:bg-white/10 rounded-xl transition-colors"
                    >
                      Control Settings
                    </button>
                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-2 py-1.5 text-xs font-semibold text-[#F5F3EF] hover:bg-[#FFC900] hover:text-[#08090B] rounded-xl transition-colors flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <span className="text-xs">→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE BOTTOM NAVIGATION BAR (< md: 768px)                   */}
      {/* ============================================================== */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 py-2 bg-[#08090B]/90 backdrop-blur-2xl border-t border-white/10 shadow-2xl flex items-center justify-around safe-area-bottom">
        {/* Tab 1: Overview */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[56px] min-h-[44px] ${
            activeTab === 'dashboard'
              ? 'text-[#FFC900] font-bold'
              : 'text-[#F5F3EF]/60 hover:text-[#F5F3EF]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#FFC900]/20 text-[#FFC900]' : ''}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <span className="text-[10px] font-sans tracking-tight mt-0.5">Overview</span>
        </button>

        {/* Tab 2: Ledger */}
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[56px] min-h-[44px] ${
            activeTab === 'transactions'
              ? 'text-[#FFC900] font-bold'
              : 'text-[#F5F3EF]/60 hover:text-[#F5F3EF]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'transactions' ? 'bg-[#FFC900]/20 text-[#FFC900]' : ''}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            </svg>
          </div>
          <span className="text-[10px] font-sans tracking-tight mt-0.5">Ledger</span>
        </button>

        {/* Tab 3: Reconcile / Matching */}
        <button
          onClick={() => setActiveTab('matching')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[56px] min-h-[44px] ${
            activeTab === 'matching'
              ? 'text-[#FFC900] font-bold'
              : 'text-[#F5F3EF]/60 hover:text-[#F5F3EF]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'matching' ? 'bg-[#FFC900]/20 text-[#FFC900]' : ''}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <span className="text-[10px] font-sans tracking-tight mt-0.5">Match</span>
        </button>

        {/* Tab 4: Documents */}
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[56px] min-h-[44px] ${
            activeTab === 'documents'
              ? 'text-[#FFC900] font-bold'
              : 'text-[#F5F3EF]/60 hover:text-[#F5F3EF]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'documents' ? 'bg-[#FFC900]/20 text-[#FFC900]' : ''}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            </svg>
          </div>
          <span className="text-[10px] font-sans tracking-tight mt-0.5">Docs</span>
        </button>

        {/* Tab 5: All Modules / More Drawer Toggle */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[56px] min-h-[44px] ${
            !['dashboard', 'transactions', 'matching', 'documents'].includes(activeTab) || isDrawerOpen
              ? 'text-[#FFC900] font-bold'
              : 'text-[#F5F3EF]/60 hover:text-[#F5F3EF]'
          }`}
        >
          <div className={`relative p-1.5 rounded-xl transition-all ${!['dashboard', 'transactions', 'matching', 'documents'].includes(activeTab) || isDrawerOpen ? 'bg-[#FFC900]/20 text-[#FFC900]' : ''}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            {totalActionBadges > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FFC900] ring-2 ring-[#08090B] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-sans tracking-tight mt-0.5">Modules</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* 3. MOBILE FULL-MODULES SLIDE-OVER DRAWER                       */}
      {/* ============================================================== */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-[#08090B]/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-4/5 max-w-xs h-full bg-[#08090B] border-r border-white/10 flex flex-col justify-between p-5 z-10 shadow-2xl tab-enter">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFC900] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#08090B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="4.5" />
                      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-display text-[#F5F3EF]">FinAudit</h2>
                    <p className="text-[10px] text-[#F5F3EF]/60 font-mono">Assurance Engine</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#F5F3EF] hover:bg-white/20 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* All Modules List */}
              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 no-scrollbar">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all ${
                        isActive
                          ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-md shadow-[#FFC900]/20'
                          : 'text-[#F5F3EF]/70 hover:text-[#F5F3EF] hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <span className={isActive ? 'text-[#08090B]' : 'text-[#FFC900]'}>
                          {item.icon(isActive)}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ml-2 ${
                            isActive
                              ? 'bg-[#08090B] text-[#FFC900]'
                              : 'bg-[#FFC900] text-[#08090B]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer / User Section */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="w-8 h-8 rounded-full bg-[#14161B] text-[#FFC900] flex items-center justify-center font-mono font-bold text-xs ring-1 ring-white/20">
                    {user?.full_name ? user.full_name[0].toUpperCase() : 'S'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#F5F3EF] truncate">{user?.full_name || 'Sarah Jenkins'}</p>
                    <p className="text-[10px] font-mono text-[#F5F3EF]/50 truncate">{user?.role?.toUpperCase() || 'LEAD PARTNER'}</p>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-2 rounded-xl text-[#F5F3EF]/60 hover:text-[#FFC900] hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SYSTEM GUIDE MODAL (Accessible everywhere)                   */}
      {/* ============================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-[#08090B]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 relative shadow-2xl border border-white/15 tab-enter">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold font-display text-[#F5F3EF]">FinAudit Assurance Platform Guide</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#F5F3EF] hover:bg-[#FFC900] hover:text-[#08090B] transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#F5F3EF]/80">
              <p>
                <strong className="text-[#F5F3EF]">Multi-Source Verification:</strong> Cross-references Invoices, General Ledger, and Bank Statements to flag evidentiary gaps.
              </p>
              <ul className="space-y-1.5 list-disc pl-4 font-mono text-[11px] text-[#F5F3EF]/70">
                <li><strong className="text-[#F5F3EF]">Overview:</strong> Real-time KPIs, monthly velocity charts, and high-risk findings queue.</li>
                <li><strong className="text-[#F5F3EF]">Reconciliation:</strong> Automated 3-way exact and fuzzy matching.</li>
                <li><strong className="text-[#F5F3EF]">Outliers:</strong> Scikit-learn Isolation Forest unsupervised anomaly model.</li>
                <li><strong className="text-[#F5F3EF]">Reports:</strong> PDF executive summary compile studio.</li>
              </ul>
              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
                >
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
