import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  AlertTriangle,
  Copy,
  Cpu,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Download
} from 'lucide-react';
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
      addToast('error', 'Failed to fetch transactions', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [sourceType, matchStatus, search, riskOnly, sortBy, page]);

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters, Risk Toggle */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor, invoice #, transaction ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Sources</option>
              <option value="invoice">Invoices</option>
              <option value="bank_statement">Bank Statements</option>
              <option value="ledger">General Ledger</option>
            </select>

            <select
              value={matchStatus}
              onChange={(e) => {
                setMatchStatus(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Match States</option>
              <option value="matched">Fully Matched</option>
              <option value="unmatched">Unmatched</option>
              <option value="discrepancy">Discrepancy</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>

            {/* Risk Only Toggle Button */}
            <button
              onClick={() => {
                setRiskOnly(!riskOnly);
                setPage(0);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                riskOnly
                  ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${riskOnly ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Audit Risks Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Consolidated Financial Transactions</h3>
            <p className="text-xs text-slate-500">Cross-verified multi-source journal records</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Showing Page {page + 1}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vendor / Payee</th>
                <th className="py-3 px-4">Invoice / Ref</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Match Status</th>
                <th className="py-3 px-4">Audit Risk Flags</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading ledger records...</td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-500">#{tx.id}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {tx.vendor_name || 'General Financial Account'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {tx.invoice_number || tx.reference_no || '—'}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {tx.source_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tx.match_status} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tx.is_duplicate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800" title="Flagged duplicate payment">
                            <Copy className="w-3 h-3" /> Duplicate
                          </span>
                        )}
                        {tx.is_anomaly && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800" title="Isolation Forest ML anomaly">
                            <Cpu className="w-3 h-3" /> Outlier
                          </span>
                        )}
                        {tx.has_missing_doc && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800" title="Missing primary supporting document">
                            <FileQuestion className="w-3 h-3" /> Missing Doc
                          </span>
                        )}
                        {!tx.is_duplicate && !tx.is_anomaly && !tx.has_missing_doc && tx.match_status !== 'discrepancy' && (
                          <span className="text-[11px] text-slate-400 font-medium">No flags</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing transactions {page * limit + 1} - {page * limit + transactions.length}
          </p>
          <div className="flex items-center space-x-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={transactions.length < limit}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={`Transaction Details: #${selectedTx?.id}`}
        subtitle="Complete ledger metadata, audit classifications, and evidence links"
        maxWidth="lg"
      >
        {selectedTx && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Vendor / Counterparty</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedTx.vendor_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Amount</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">${selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedTx.currency}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Posting Date</span>
                <p className="font-semibold text-slate-800 mt-0.5">{new Date(selectedTx.transaction_date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Source Type</span>
                <p className="font-semibold text-slate-800 capitalize mt-0.5">{selectedTx.source_type.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Invoice / Ref</span>
                <p className="font-mono text-slate-800 mt-0.5">{selectedTx.invoice_number || selectedTx.reference_no || 'None'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Account Code</span>
                <p className="font-mono text-slate-800 mt-0.5">{selectedTx.account_code || '6000'}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description / Memo</span>
              <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700">{selectedTx.description || 'No description recorded.'}</p>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80">
              <span className="text-xs font-bold text-amber-900 block mb-1">Audit Verification Status</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedTx.match_status} size="sm" />
                {selectedTx.is_duplicate && <span className="text-[11px] font-bold text-amber-700">• Potential Duplicate</span>}
                {selectedTx.is_anomaly && <span className="text-[11px] font-bold text-purple-700">• Statistical Outlier</span>}
                {selectedTx.has_missing_doc && <span className="text-[11px] font-bold text-rose-700">• Unattached Voucher</span>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
