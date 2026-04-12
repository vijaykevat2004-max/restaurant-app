import { useEffect, useState } from 'react';
import { ChefHat, Check, Clock, Flame, RefreshCw, PartyPopper } from 'lucide-react';
import { api } from '../api/client';
import { useBranchStore } from '../stores';
import type { Order, OrderStatus } from '../types';

function getElapsedTime(createdAt: string): { minutes: number; color: string } {
  const now = new Date();
  const created = new Date(createdAt);
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
  const color = diff < 5 ? 'text-emerald-400' : diff < 10 ? 'text-amber-400' : 'text-red-400';
  return { minutes: diff, color };
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'from-cyan-500 to-blue-500',
  CONFIRMED: 'from-violet-500 to-purple-500',
  PREPARING: 'from-amber-500 to-orange-500',
  READY: 'from-emerald-500 to-teal-500',
  SERVED: 'from-fuchsia-500 to-pink-500',
  COMPLETED: 'from-green-500 to-emerald-500',
  CANCELLED: 'from-red-500 to-rose-500',
};

function OrderCard({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  const [elapsed, setElapsed] = useState(getElapsedTime(order.createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedTime(order.createdAt));
    }, 10000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const statusActions: Record<OrderStatus, { label: string; nextStatus: OrderStatus } | null> = {
    NEW: { label: 'Start Cooking', nextStatus: 'PREPARING' },
    CONFIRMED: { label: 'Start Cooking', nextStatus: 'PREPARING' },
    PREPARING: { label: 'Mark Ready', nextStatus: 'READY' },
    READY: { label: 'Served', nextStatus: 'SERVED' },
    SERVED: null,
    COMPLETED: null,
    CANCELLED: null,
  };

  const action = statusActions[order.status];
  const isNew = order.status === 'NEW';

  return (
    <div
      className={`glass-card-vibrant p-5 min-w-[260px] max-w-[300px] ${
        isNew ? 'ring-2 ring-cyan-500/50 animate-pulse' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
          <span className="text-xl font-extrabold vg-text-violet">#{order.orderNumber}</span>
        </div>
        <div className={`flex items-center gap-1 ${elapsed.color}`}>
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm font-bold">{elapsed.minutes}m</span>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-2 rounded-xl bg-white/5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center font-bold text-amber-400">
              {item.quantity}x
            </span>
            <p className="text-white font-medium flex-1">{item.name}</p>
          </div>
        ))}
      </div>

      {action && (
        <button
          onClick={() => onStatusChange(order.id, action.nextStatus)}
          className={`w-full py-3 rounded-xl bg-gradient-to-r ${STATUS_COLORS[action.nextStatus]} text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
        >
          {action.nextStatus === 'READY' ? <PartyPopper className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
          {action.label}
        </button>
      )}

      {order.status === 'READY' && (
        <button
          onClick={() => onStatusChange(order.id, 'SERVED')}
          className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Mark Served
        </button>
      )}
    </div>
  );
}

export function KDSPage() {
  const { selectedBranchId } = useBranchStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchOrders = async () => {
    try {
      const activeOrders = await api.getActiveOrders(selectedBranchId || undefined);
      setOrders(activeOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [selectedBranchId]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const filteredOrders = filter === 'ALL'
    ? orders
    : orders.filter((o) => o.status === filter);

  const counts = {
    NEW: orders.filter((o) => o.status === 'NEW').length,
    PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
    READY: orders.filter((o) => o.status === 'READY').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold vg-text-amber">Kitchen Display</h1>
            <p className="text-white/50 text-sm">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Status Counts */}
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 font-bold">
              {counts.NEW} New
            </span>
            <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 font-bold">
              {counts.PREPARING} Cooking
            </span>
            <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 font-bold">
              {counts.READY} Ready
            </span>
          </div>

          <span className="text-3xl font-mono font-bold vg-text-violet">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6">
        {(['ALL', 'NEW', 'PREPARING', 'READY'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl font-semibold transition-all duration-300 ${
              filter === f
                ? f === 'ALL' ? 'bg-white/20 text-white' :
                  `bg-gradient-to-r ${STATUS_COLORS[f as OrderStatus]} text-white shadow-lg`
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            {f === 'ALL' ? 'All Orders' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-card-vibrant py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-white/30" />
            </div>
            <p className="text-white/50 text-xl font-semibold">No orders in queue</p>
            <p className="text-white/30 text-sm mt-2">New orders will appear here</p>
          </div>
        ) : (
          <div className="flex gap-4 pb-4 overflow-x-auto">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
