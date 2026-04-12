import { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  CreditCard,
  Sparkles,
  IndianRupee,
} from 'lucide-react';
import { api } from '../api/client';
import type { WalletBalance, Transaction } from '../types';
import { formatCurrency } from '../utils/currency';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balanceData, txData] = await Promise.all([
        api.getWalletBalance(),
        api.getTransactions({ limit: 50 }),
      ]);
      setBalance(balanceData);
      setTransactions(txData.transactions);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-500 to-green-500 flex items-center justify-center shadow-lg shadow-lime-500/30">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold vg-text-emerald">Wallet</h1>
            <p className="text-white/50">Manage your restaurant finances</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Available Balance */}
        <div className="glass-card-vibrant p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-white/50">Available Balance</p>
              <p className="text-4xl font-extrabold vg-text-emerald mt-2 font-mono">
                {formatCurrency(balance?.availableBalance ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Sparkles className="w-4 h-4" />
            Ready to withdraw
          </div>
        </div>

        {/* Pending Balance */}
        <div className="glass-card-vibrant p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-white/50">Pending Balance</p>
              <p className="text-3xl font-bold text-amber-400 mt-2 font-mono">
                {formatCurrency(balance?.pendingBalance ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <ArrowUpCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <RefreshCw className="w-4 h-4" />
            Processing payments
          </div>
        </div>

        {/* Total Balance */}
        <div className="glass-card-vibrant p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-white/50">Total Balance</p>
              <p className="text-3xl font-bold vg-text-violet mt-2 font-mono">
                {formatCurrency(balance?.totalBalance ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-violet-400 text-sm">
            <IndianRupee className="w-4 h-4" />
            Available + Pending
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card-vibrant p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Transaction History</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
              <Wallet className="w-10 h-10 text-white/30" />
            </div>
            <p className="text-white/50 text-lg font-semibold">No transactions yet</p>
            <p className="text-white/30 text-sm mt-2">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.type === 'CREDIT'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
                      : tx.type === 'DEBIT'
                      ? 'bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/30'
                      : tx.type === 'PAYOUT'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
                      : 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30'
                  }`}
                >
                  {tx.type === 'CREDIT' && <ArrowDownCircle className="w-6 h-6 text-white" />}
                  {tx.type === 'DEBIT' && <ArrowUpCircle className="w-6 h-6 text-white" />}
                  {tx.type === 'PAYOUT' && <TrendingUp className="w-6 h-6 text-white" />}
                  {tx.type === 'FEE' && <TrendingDown className="w-6 h-6 text-white" />}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-white">{tx.description}</p>
                  <p className="text-sm text-white/40">
                    {formatDate(tx.createdAt)}
                    {tx.reference && ` • Ref: ${tx.reference.slice(0, 8)}`}
                  </p>
                </div>

                <div className={`text-xl font-bold font-mono ${
                  tx.type === 'CREDIT' || tx.type === 'PAYOUT' ? 'vg-text-emerald' : 'text-red-400'
                }`}>
                  {tx.type === 'CREDIT' ? '+' : '-'} {formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
