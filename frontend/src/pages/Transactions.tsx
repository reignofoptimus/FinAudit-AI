import React, { useState, useEffect } from 'react';
import { TransactionItem } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const Transactions: React.FC = () => {
  const { addToast } = useToast();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sourceType, setSourceType] = useState('all');
  const [matchStatus, setMatchStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [riskOnly, setRiskOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(0);
  const limit = 25;

  // Detail Modal
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        skip: page * limit,
        limit,
        sort_by: sortBy,
      };
      if (sourceType !== 'all') params.source_type = sourceType;
      if (matchStatus !== 'all') params.match_status = matchStatus;
      if (search) params.search = search;
      if (riskOnly) params.risk_only = true;

      const data = await api.listTransactions(params);
      setTransactions(data);
    } catch (err: any) {
      addToast('error', 'Ledger retrieval notice', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [sourceType, matchStatus, search, riskOnly, sortBy, page]);

  return (
    <div className="space-y-6">
      {/* Top Filter Glass Card */}
      <div className="glass-card p-4 sm:p-5 border border-white/10 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5F3EF]/40">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search vendor, invoice #, transaction ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full h-11 pl-10 pr-4 rounded-2xl glass-input text-xs text-[#F5F3EF] placeholder-[#F5F3EF]/40 font-sans border border-white/10"
            />
          </div>

          {/* Filter Dropdowns strictly styled in 3-colour palette */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value);
                setPage(0);
              }}
              style={{ colorScheme: 'dark' }}
              className="h-11 px-3.5 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] bg-[#08090B] border border-white/10 cursor-pointer font-sans flex-1 sm:flex-none min-w-[130px]"
            >
              <option value="all" className="bg-[#08090B] text-[#F5F3EF]">All Sources</option>
              <option value="invoice" className="bg-[#08090B] text-[#F5F3EF]">Invoices</option>
              <option value="bank_statement" className="bg-[#08090B] text-[#F5F3EF]">Bank Statements</option>
              <option value="ledger" className="bg-[#08090B] text-[#F5F3EF]">General Ledger</option>
            </select>

            <select
              value={matchStatus}
              onChange={(e) => {
                setMatchStatus(e.target.value);
                setPage(0);
              }}
              style={{ colorScheme: 'dark' }}
              className="h-11 px-3.5 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] bg-[#08090B] border border-white/10 cursor-pointer font-sans flex-1 sm:flex-none min-w-[130px]"
            >
              <option value="all" className="bg-[#08090B] text-[#F5F3EF]">All Match States</option>
              <option value="matched" className="bg-[#08090B] text-[#F5F3EF]">Fully Matched</option>
              <option value="unmatched" className="bg-[#08090B] text-[#F5F3EF]">Unmatched</option>
              <option value="discrepancy" className="bg-[#08090B] text-[#F5F3EF]">Discrepancy</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="h-11 px-3.5 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] bg-[#08090B] border border-white/10 cursor-pointer font-sans flex-1 sm:flex-none min-w-[130px]"
            >
              <option value="date_desc" className="bg-[#08090B] text-[#F5F3EF]">Newest First</option>
              <option value="date_asc" className="bg-[#08090B] text-[#F5F3EF]">Oldest First</option>
              <option value="amount_desc" className="bg-[#08090B] text-[#F5F3EF]">Highest Amount</option>
              <option value="amount_asc" className="bg-[#08090B] text-[#F5F3EF]">Lowest Amount</option>
            </select>

            {/* Risk Only Toggle Button */}
            <button
              onClick={() => {
                setRiskOnly(!riskOnly);
                setPage(0);
              }}
              className={`h-11 px-4 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border flex-1 sm:flex-none active:scale-95 touch-manipulation ${
                riskOnly
                  ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-md shadow-[#FFC900]/20'
                  : 'glass-pill text-[#F5F3EF] border-white/10 hover:border-white/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${riskOnly ? 'bg-[#08090B]' : 'bg-[#FFC900]'}`} />
              <span>Flagged Risks Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="glass-card overflow-hidden border border-white/10 shadow-xl">
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display text-[#F5F3EF] tracking-tight">Consolidated Financial Transactions</h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">Cross-verified multi-source ledger journals</p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#F5F3EF] px-3 py-1 rounded-full bg-white/10 border border-white/10 self-start sm:self-auto">
            Page {page + 1}
          </span>
        </div>

        {/* Mobile Horizontal Scroll Indicator */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/10 text-[11px] font-mono text-[#F5F3EF]/50">
          <span>Scroll horizontally for full ledger →</span>
          <span className="text-[#FFC900] font-bold">9 columns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 bg-white/[0.02]">
                <th className="py-3 px-5">Tx ID</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Vendor / Payee</th>
                <th className="py-3 px-5">Invoice / Ref</th>
                <th className="py-3 px-5">Source</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Match Status</th>
                <th className="py-3 px-5">Audit Flags</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    Loading ledger records...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[11px] font-semibold text-[#F5F3EF]/60">#{tx.id}</td>
                    <td className="py-3.5 px-5 text-[#F5F3EF]/80 font-mono text-[11px]">
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#F5F3EF]">
                      {tx.vendor_name || 'General Financial Account'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-[#F5F3EF]/70">
                      {tx.invoice_number || tx.reference_no || '—'}
                    </td>
                    <td className="py-3.5 px-5 capitalize">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/10 text-[#F5F3EF]">
                        {tx.source_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#F5F3EF]">
                      ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={tx.match_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tx.is_duplicate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFC900] text-[#08090B]">
                            Duplicate
                          </span>
                        )}
                        {tx.is_anomaly && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFC900]/20 text-[#FFC900] border border-[#FFC900]/40">
                            Outlier
                          </span>
                        )}
                        {tx.has_missing_doc && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/15 text-[#F5F3EF] border border-white/20">
                            Missing Doc
                          </span>
                        )}
                        {!tx.is_duplicate && !tx.is_anomaly && !tx.has_missing_doc && tx.match_status !== 'discrepancy' && (
                          <span className="text-[11px] font-mono text-[#F5F3EF]/40">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 rounded-xl glass-pill text-xs font-semibold text-[#F5F3EF] hover:bg-[#FFC900] hover:text-[#08090B] transition-colors border border-white/10"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    No transactions match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs font-sans">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2.5 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 border border-white/10 active:scale-95 touch-manipulation"
          >
            ← Previous
          </button>
          <span className="font-mono text-xs text-[#F5F3EF]/70">
            Page {page + 1}
          </span>
          <button
            disabled={transactions.length < limit}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2.5 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 border border-white/10 active:scale-95 touch-manipulation"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <Modal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title={`Ledger Transaction #${selectedTx.id}`}
          subtitle={`Verified Source: ${selectedTx.source_type.replace('_', ' ').toUpperCase()}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl glass-soft border border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F5F3EF]/50 block">Amount</span>
                <span className="text-lg font-bold font-mono text-[#F5F3EF]">
                  ₹{selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-2xl glass-soft border border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F5F3EF]/50 block">Transaction Date</span>
                <span className="text-sm font-bold font-mono text-[#F5F3EF]">
                  {new Date(selectedTx.transaction_date).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 rounded-2xl glass-soft border border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F5F3EF]/50 block">Match Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedTx.match_status} size="sm" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-soft border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#F5F3EF]/60">Vendor / Payee</span>
                <span className="font-bold text-[#F5F3EF]">{selectedTx.vendor_name || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#F5F3EF]/60">Invoice Number</span>
                <span className="font-mono font-bold text-[#F5F3EF]">{selectedTx.invoice_number || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#F5F3EF]/60">Account Code</span>
                <span className="font-mono text-[#F5F3EF]">{selectedTx.account_code || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#F5F3EF]/60">Description / Memo</span>
                <span className="font-medium text-[#F5F3EF] text-right max-w-xs">{selectedTx.description || 'Verified journal record'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
              >
                Close Workpaper
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
