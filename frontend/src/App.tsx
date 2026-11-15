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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading FinAudit AI Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Dark Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        badgeCounts={badgeCounts}
      />

      {/* Main Workspace (White / Light-Grey) */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar
          activeTab={activeTab}
          onRefreshData={refreshBadges}
        />

        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
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
