import { useEffect, useState } from 'react';
import {
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Sparkles,
  Wallet,
  Banknote,
} from 'lucide-react';
import { api } from '../api/client';
import type { Payout, WalletBalance } from '../types';
import { formatCurrency } from '../utils/currency';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', icon: Clock, gradient: 'from-amber-500 to-orange-500' },
  PROCESSING: { label: 'Processing', icon: Loader, gradient: 'from-violet-500 to-purple-500' },
  COMPLETED: { label: 'Completed', icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500' },
  FAILED: { label: 'Failed', icon: XCircle, gradient: 'from-red-500 to-rose-500' },
};

export function PayoutsPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balanceData, payoutsData] = await Promise.all([
        api.getWalletBalance(),
        api.getPayouts({ limit: 20 }),
      ]);
      setBalance(balanceData);
      setPayouts(payoutsData.payouts);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum < 100) {
      setError('Minimum payout amount is ₹100');
      return;
    }

    if (balance && amountNum > balance.availableBalance) {
      setError('Insufficient balance');
      return;
    }

    setIsWithdrawing(true);
    try {
      await api.createPayout(amountNum);
      setAmount('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payout');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const quickAmounts = [100, 250, 500, 1000];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Banknote className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold vg-text-violet">Payouts</h1>
          <p className="text-white/50">Withdraw funds to your bank account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payout History */}
        <div className="lg:col-span-2 glass-card-vibrant p-6">
          <div className="flex items-center gap-3 mb-6">
            <ArrowUpCircle className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Withdrawal History</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                <Banknote className="w-10 h-10 text-white/30" />
              </div>
              <p className="text-white/50 text-lg font-semibold">No payouts yet</p>
              <p className="text-white/30 text-sm mt-2">Your withdrawal history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => {
                const config = STATUS_CONFIG[payout.status];
                const Icon = config.icon;

                return (
                  <div
                    key={payout.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <p className="font-mono font-bold text-white text-lg">
                        {formatCurrency(payout.amount)}
                      </p>
                      <p className="text-sm text-white/40">{formatDate(payout.createdAt)}</p>
                      {payout.errorMessage && (
                        <p className="text-xs text-red-400 mt-1">{payout.errorMessage}</p>
                      )}
                    </div>

                    <span className={`px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${config.gradient} text-white shadow-lg`}>
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Withdraw Form */}
        <div className="glass-card-vibrant p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 mb-6">
            <p className="text-sm text-white/50 mb-1">Available Balance</p>
            <p className="text-3xl font-bold vg-text-emerald font-mono">
              {formatCurrency(balance?.availableBalance ?? 0)}
            </p>
          </div>

          <form onSubmit={handlePayout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Amount</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="100"
                step="0.01"
                className="input-vibrant"
              />
              <p className="text-xs text-white/40 mt-2">Minimum withdrawal: ₹100</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a.toString())}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 border border-white/10 font-medium transition-all"
                >
                  {formatCurrency(a)}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!amount || parseFloat(amount) < 100 || isWithdrawing}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                !amount || parseFloat(amount) < 100
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]'
              }`}
            >
              {isWithdrawing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5" />
                  Withdraw Funds
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Information
            </h3>
            <ul className="space-y-2 text-sm text-white/40">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Withdrawals processed in 2-3 business days
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Small processing fee may apply
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                Minimum withdrawal amount: ₹100
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
