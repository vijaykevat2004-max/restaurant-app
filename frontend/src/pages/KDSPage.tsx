import { useEffect, useState, useCallback } from 'react';
import { Flame, Check, Clock, RefreshCw, ChefHat, PartyPopper, X, AlertCircle } from 'lucide-react';
import { useBranchStore } from '../stores';
import type { Order, OrderStatus } from '../types';
import { formatCurrency } from '../utils/currency';

const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  gradient: string;
  nextStatus: OrderStatus | null;
  nextLabel: string;
}> = {
  PENDING: { label: 'New', gradient: 'from-cyan-500 to-blue-500', nextStatus: 'CONFIRMED', nextLabel: 'Confirm' },
  CONFIRMED: { label: 'Confirmed', gradient: 'from-violet-500 to-purple-500', nextStatus: 'PREPARING', nextLabel: 'Start Cooking' },
  PREPARING: { label: 'Cooking', gradient: 'from-amber-500 to-orange-500', nextStatus: 'READY', nextLabel: 'Mark Ready' },
  READY: { label: 'Ready', gradient: 'from-emerald-500 to-teal-500', nextStatus: 'SERVED', nextLabel: 'Served' },
  SERVED: { label: 'Served', gradient: 'from-green-500 to-emerald-500', nextStatus: null, nextLabel: '' },
  COMPLETED: { label: 'Completed', gradient: 'from-gray-500 to-gray-600', nextStatus: null, nextLabel: '' },
  CANCELLED: { label: 'Cancelled', gradient: 'from-red-500 to-rose-500', nextStatus: null, nextLabel: '' },
};

function getElapsedTime(createdAt: string): { minutes: number; seconds: number; color: string } {
  const now = new Date();
  const created = new Date(createdAt);
  const diffSec = Math.floor((now.getTime() - created.getTime()) / 1000);
  const minutes = Math.floor(diffSec / 60);
  const seconds = diffSec % 60;
  const color = diffSec < 300 ? 'text-emerald-400' : diffSec < 600 ? 'text-amber-400' : 'text-red-400';
  return { minutes, seconds, color };
}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

interface ParsedOrder extends Omit<Order, 'items'> {
  items: OrderItem[];
}

function OrderCard({
  order,
  onUpdate,
}: {
  order: ParsedOrder;
  onUpdate: (orderId: string, status: OrderStatus) => void;
}) {
  const [elapsed, setElapsed] = useState(getElapsedTime(order.createdAt));
  const config = STATUS_CONFIG[order.status];
  const isNew = order.status === 'PENDING' || order.status === 'CONFIRMED';

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedTime(order.createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  return (
    <div className={`glass-card-vibrant p-5 min-w-[280px] max-w-[320px] ${isNew ? 'ring-2 ring-cyan-500/50 animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-xl bg-gradient-to-r ${config.gradient} text-white text-sm font-bold`}>
            #{order.orderNumber}
          </div>
          {config.nextStatus && (
            <button
              onClick={() => onUpdate(order.id, config.nextStatus!)}
              className={`px-3 py-1 rounded-xl bg-gradient-to-r ${config.gradient} text-white text-sm font-bold hover:scale-105 transition-transform`}
            >
              {config.nextLabel}
            </button>
          )}
        </div>
        <div className={`flex items-center gap-1 ${elapsed.color}`}>
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm font-bold">
            {elapsed.minutes}:{elapsed.seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-white/50 text-sm">
          {order.customerName || 'Customer'}{order.tableNumber ? ` • ${order.tableNumber}` : ''}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center font-bold text-amber-400">
              {item.quantity}x
            </span>
            <p className="text-white font-medium flex-1">{item.name}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-3 flex justify-between items-center">
        <span className="text-white/60 text-sm">Total</span>
        <span className="text-lg font-bold text-amber-400">{formatCurrency(order.total)}</span>
      </div>
    </div>
  );
}

export function KDSPage() {
  const { selectedBranchId } = useBranchStore();
  const [orders, setOrders] = useState<ParsedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedBranchId) params.append('branchId', selectedBranchId);
      
      const res = await fetch(`https://backend-vijay19.vercel.app/api/v1/orders/active?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.data || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err) {
      setError('Unable to connect to server');
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://backend-vijay19.vercel.app/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      
      if (data.success) {
        setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o));
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  const counts = {
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
    PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
    READY: orders.filter((o) => o.status === 'READY').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
            <p className="text-white/50 text-sm">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm">
              {counts.PENDING + counts.CONFIRMED} New
            </span>
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-sm">
              {counts.PREPARING} Cooking
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-sm">
              {counts.READY} Ready
            </span>
          </div>

          <span className="text-3xl font-mono font-bold text-white">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card-vibrant py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <ChefHat className="w-10 h-10 text-white/30" />
          </div>
          <p className="text-white/50 text-xl font-semibold">No orders in queue</p>
          <p className="text-white/30 text-sm mt-2">New orders will appear here</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
