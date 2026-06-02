import { useEffect, useState, useCallback, useRef } from 'react';
import { Flame, Clock, RefreshCw, ChefHat, Volume2, VolumeX, Bell, Utensils, Coffee, Cookie, Sandwich } from 'lucide-react';
import { useBranchStore } from '../stores';
import type { Order, OrderStatus } from '../types';
import { formatCurrency } from '../utils/currency';
import { playOrderSound, playReadySound } from '../utils/sounds';
import { api } from '../api/client';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  categoryName?: string;
}

interface ParsedOrder extends Omit<Order, 'items'> {
  items: OrderItem[];
  customerName?: string;
  tableNumber?: string | null;
}

const STATION_CATEGORIES: Record<string, { keywords: string[]; icon: React.ReactNode; color: string }> = {
  GRILL: {
    keywords: ['burger', 'patty', 'grilled', 'chicken', 'tikka', 'seekh', 'kabab', 'bbq'],
    icon: <Utensils className="w-5 h-5" />,
    color: 'from-orange-500 to-red-500',
  },
  FRY: {
    keywords: ['fries', 'fry', 'crispy', 'fried', 'nuggets', 'wings', 'samosa', 'pakora'],
    icon: <Flame className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-500',
  },
  DRINKS: {
    keywords: ['coffee', 'tea', 'cola', 'soda', 'juice', 'milkshake', 'lassi', 'chai', 'drink', 'water'],
    icon: <Coffee className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
  },
  DESSERTS: {
    keywords: ['ice cream', 'cake', 'pastry', 'cookie', 'brownie', 'dessert', 'sweet'],
    icon: <Cookie className="w-5 h-5" />,
    color: 'from-pink-500 to-rose-500',
  },
  DEFAULT: {
    keywords: [],
    icon: <Sandwich className="w-5 h-5" />,
    color: 'from-gray-500 to-gray-600',
  },
};

function getStation(itemName: string): string {
  const name = itemName.toLowerCase();
  for (const [station, config] of Object.entries(STATION_CATEGORIES)) {
    if (station === 'DEFAULT') continue;
    if (config.keywords.some(keyword => name.includes(keyword))) {
      return station;
    }
  }
  return 'DEFAULT';
}

function getElapsedTime(createdAt: string): { minutes: number; seconds: number; color: string; urgent: boolean } {
  const now = new Date();
  const created = new Date(createdAt);
  const diffSec = Math.floor((now.getTime() - created.getTime()) / 1000);
  const minutes = Math.floor(diffSec / 60);
  const seconds = diffSec % 60;
  
  if (diffSec < 180) return { minutes, seconds, color: 'text-emerald-400', urgent: false };
  if (diffSec < 360) return { minutes, seconds, color: 'text-amber-400', urgent: false };
  return { minutes, seconds, color: 'text-red-400', urgent: true };
}

function OrderCard({
  order,
  onUpdate,
  soundEnabled,
}: {
  order: ParsedOrder;
  onUpdate: (orderId: string, status: OrderStatus) => void;
  soundEnabled: boolean;
}) {
  const [elapsed, setElapsed] = useState(getElapsedTime(order.createdAt));
  const [showActions, setShowActions] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedTime(order.createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const getNextAction = () => {
    switch (order.status) {
      case 'PENDING': return { label: 'Accept', status: 'CONFIRMED' as OrderStatus, color: 'from-cyan-500 to-blue-500' };
      case 'CONFIRMED': return { label: 'Start Cooking', status: 'PREPARING' as OrderStatus, color: 'from-amber-500 to-orange-500' };
      case 'PREPARING': return { label: 'Ready', status: 'READY' as OrderStatus, color: 'from-emerald-500 to-teal-500' };
      case 'READY': return { label: 'Served', status: 'SERVED' as OrderStatus, color: 'from-violet-500 to-purple-500' };
      default: return null;
    }
  };

  const action = getNextAction();

  return (
    <div
      className={`glass-card-vibrant p-5 min-w-[300px] max-w-[340px] transition-all duration-300 ${
        elapsed.urgent ? 'ring-2 ring-red-500/50' : order.status === 'PENDING' ? 'ring-2 ring-cyan-500/50' : ''
      } ${elapsed.urgent ? 'animate-pulse' : ''}`}
      onClick={() => setShowActions(!showActions)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${order.status === 'PENDING' ? 'from-cyan-500 to-blue-500' : order.status === 'PREPARING' ? 'from-amber-500 to-orange-500' : order.status === 'READY' ? 'from-emerald-500 to-teal-500' : 'from-gray-500 to-gray-600'} text-white font-bold shadow-lg`}>
            #{order.orderNumber}
          </div>
          <span className="text-white/50 text-sm">
            {order.customerName || 'Customer'}
            {order.tableNumber ? ` • ${order.tableNumber}` : ''}
          </span>
        </div>
      </div>

      <div className={`flex items-center gap-2 mb-4 ${elapsed.color}`}>
        <Clock className="w-5 h-5" />
        <span className="font-mono text-xl font-bold">
          {elapsed.minutes}:{elapsed.seconds.toString().padStart(2, '0')}
        </span>
        {elapsed.urgent && <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded-full">Urgent!</span>}
      </div>

      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center font-bold text-amber-400 text-lg">
              {item.quantity}
            </span>
            <div className="flex-1">
              <p className="text-white font-semibold">{item.name}</p>
              <span className="text-xs text-white/40">
                {item.categoryName || getStation(item.name)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-3 flex justify-between items-center">
        <span className="text-white/60 text-sm">Total</span>
        <span className="text-xl font-bold text-amber-400">{formatCurrency(order.total)}</span>
      </div>

      {showActions && action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (action.status === 'READY' && soundEnabled) {
              playReadySound();
            }
            onUpdate(order.id, action.status);
          }}
          className={`w-full mt-4 py-3 rounded-xl bg-gradient-to-r ${action.color} text-white font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function KDSPage() {
  const { selectedBranchId } = useBranchStore();
  const [orders, setOrders] = useState<ParsedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundInitialized, setSoundInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY'>('ALL');
  const prevOrderCount = useRef(0);
  const audioContextRef = useRef<any>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setSoundInitialized(true);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const token = api.getToken();
      const params = new URLSearchParams();
      if (selectedBranchId) params.append('branchId', selectedBranchId);
      
      const res = await fetch(`${API_BASE}/orders/active?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      
      if (data.success) {
        const newOrders = data.data || [];
        
        if (soundEnabled && soundInitialized && newOrders.length > prevOrderCount.current) {
          playOrderSound();
        }
        
        prevOrderCount.current = newOrders.length;
        setOrders(newOrders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId, soundEnabled, soundInitialized]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      const token = api.getToken();
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
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

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter((o) => o.status === filter);

  const pendingOrders = filteredOrders.filter((o) => ['PENDING', 'CONFIRMED'].includes(o.status));
  const preparingOrders = filteredOrders.filter((o) => o.status === 'PREPARING');
  const readyOrders = filteredOrders.filter((o) => ['READY', 'SERVED'].includes(o.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Kitchen Display</h1>
            <p className="text-white/50 text-xs">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold">
              {counts.PENDING + counts.CONFIRMED} New
            </span>
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
              {counts.PREPARING} Cooking
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
              {counts.READY} Ready
            </span>
          </div>

          <span className="text-2xl font-mono font-bold text-white">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button
            onClick={() => {
              if (!soundInitialized) {
                initAudio();
              }
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2 rounded-xl transition-all ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['ALL', 'PENDING', 'PREPARING', 'READY'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? f === 'ALL' ? 'bg-white/20 text-white' : f === 'PENDING' ? 'bg-cyan-500/20 text-cyan-400' : f === 'PREPARING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/5 text-white/60'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'PENDING' ? 'New' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-card-vibrant py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-white/50 text-lg font-semibold">No orders in queue</p>
          <p className="text-white/30 text-sm mt-2">New orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                New Orders ({pendingOrders.length})
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {pendingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdate={handleStatusUpdate}
                    soundEnabled={soundEnabled}
                  />
                ))}
              </div>
            </div>
          )}

          {preparingOrders.length > 0 && (
            <div>
              <h2 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5" />
                Cooking ({preparingOrders.length})
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {preparingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdate={handleStatusUpdate}
                    soundEnabled={soundEnabled}
                  />
                ))}
              </div>
            </div>
          )}

          {readyOrders.length > 0 && (
            <div>
              <h2 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Ready to Serve ({readyOrders.length})
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {readyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdate={handleStatusUpdate}
                    soundEnabled={soundEnabled}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
