import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Transactions } from './pages/Transactions';
import { Matching } from './pages/Matching';
import { AuditFindings } from './pages/AuditFindings';
import { DuplicateDetection } from './pages/DuplicateDetection';
import { MissingDocuments } from './pages/MissingDocuments';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { VendorAnalysis } from './pages/VendorAnalysis';
import { AuditReports } from './pages/AuditReports';
import { Settings } from './pages/Settings';
import { api } from './api/client';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<{
    discrepancies?: number;
    duplicates?: number;
    missing?: number;
    anomalies?: number;
  }>({});

  const refreshBadges = async () => {
    if (!user) return;
    try {
      const stats = await api.getDashboardStats();
      setBadgeCounts({
        discrepancies: stats.total_discrepancies,
        duplicates: stats.total_duplicates,
        missing: stats.total_missing_docs,
        anomalies: stats.total_anomalies,
      });
    } catch {
      // Ignore background badge errors
    }
  };

  useEffect(() => {
    if (user) {
      refreshBadges();
    }
  }, [user, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center p-6 text-[#F5F3EF]">
        <div className="glass-card p-8 flex flex-col items-center space-y-4 max-w-sm w-full text-center border border-white/15">
          <div className="w-12 h-12 rounded-2xl bg-[#FFC900] flex items-center justify-center shadow-lg shadow-[#FFC900]/25 animate-pulse">
            <svg className="w-6 h-6 text-[#08090B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[#F5F3EF]">FinAudit Platform</h3>
            <p className="text-xs text-[#F5F3EF]/60 font-mono mt-1">Initializing ledger & assurance engine...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#08090B] text-[#F5F3EF] flex relative overflow-x-hidden selection:bg-[#FFC900] selection:text-[#08090B]">
      {/* Subtle fixed ambient background elements */}
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-[#FFC900]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-[600px] h-[400px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation (Desktop Rail + Mobile Bottom Bar + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        badgeCounts={badgeCounts}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 ml-0 md:ml-20 flex flex-col min-w-0 pb-20 md:pb-6 transition-all duration-200">
        <Navbar
          activeTab={activeTab}
          onRefreshData={refreshBadges}
          onToggleMobileDrawer={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        />

        <main className="px-3 sm:px-6 flex-1 overflow-y-auto">
          <div key={activeTab} className="tab-enter">
            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === 'documents' && <Documents />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'matching' && <Matching />}
            {activeTab === 'findings' && <AuditFindings />}
            {activeTab === 'duplicates' && <DuplicateDetection />}
            {activeTab === 'missing' && <MissingDocuments />}
            {activeTab === 'anomalies' && <AnomalyDetection />}
            {activeTab === 'vendors' && <VendorAnalysis />}
            {activeTab === 'reports' && <AuditReports />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
