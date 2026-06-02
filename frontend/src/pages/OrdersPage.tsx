import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Clock, ChevronRight, Utensils, ChefHat } from 'lucide-react';
import { api } from '../api/client';
import { useBranchStore } from '../stores';
import type { Order, OrderStatus } from '../types';
import { formatCurrency } from '../utils/currency';

const STATUS_FILTERS: { value: OrderStatus | 'ALL'; label: string; gradient: string }[] = [
  { value: 'ALL', label: 'All', gradient: 'from-slate-500 to-gray-500' },
  { value: 'PENDING', label: 'New', gradient: 'from-cyan-500 to-blue-500' },
  { value: 'CONFIRMED', label: 'Confirmed', gradient: 'from-violet-500 to-purple-500' },
  { value: 'PREPARING', label: 'Preparing', gradient: 'from-amber-500 to-orange-500' },
  { value: 'READY', label: 'Ready', gradient: 'from-emerald-500 to-teal-500' },
  { value: 'SERVED', label: 'Served', gradient: 'from-fuchsia-500 to-pink-500' },
  { value: 'COMPLETED', label: 'Done', gradient: 'from-green-500 to-emerald-500' },
  { value: 'CANCELLED', label: 'Cancelled', gradient: 'from-red-500 to-rose-500' },
];

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status: OrderStatus) {
  const statusMap: Record<OrderStatus, { gradient: string; color: string }> = {
    PENDING: { gradient: 'from-cyan-500/20 to-blue-500/20', color: 'text-cyan-400' },
    CONFIRMED: { gradient: 'from-violet-500/20 to-purple-500/20', color: 'text-violet-400' },
    PREPARING: { gradient: 'from-amber-500/20 to-orange-500/20', color: 'text-amber-400' },
    READY: { gradient: 'from-emerald-500/20 to-teal-500/20', color: 'text-emerald-400' },
    SERVED: { gradient: 'from-fuchsia-500/20 to-pink-500/20', color: 'text-fuchsia-400' },
    COMPLETED: { gradient: 'from-green-500/20 to-emerald-500/20', color: 'text-green-400' },
    CANCELLED: { gradient: 'from-red-500/20 to-rose-500/20', color: 'text-red-400' },
  };
  return statusMap[status] || statusMap.PENDING;
}

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; gradient: string }>> = {
  PENDING: { status: 'CONFIRMED', label: 'Confirm', gradient: 'from-violet-500 to-purple-500' },
  CONFIRMED: { status: 'PREPARING', label: 'Start Prep', gradient: 'from-amber-500 to-orange-500' },
  PREPARING: { status: 'READY', label: 'Mark Ready', gradient: 'from-emerald-500 to-teal-500' },
  READY: { status: 'SERVED', label: 'Served', gradient: 'from-fuchsia-500 to-pink-500' },
  SERVED: { status: 'COMPLETED', label: 'Complete', gradient: 'from-green-500 to-emerald-500' },
};

export function OrdersPage() {
  const { selectedBranchId } = useBranchStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (filter !== 'ALL') params.status = filter;

      const result = await api.getOrders(params);
      setOrders(result.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) =>
    search === '' || order.orderNumber.toString().includes(search)
  );

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Utensils className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
                Orders
              </h1>
              <p className="text-white/60">Manage and track all orders</p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="btn-vibrant btn-violet flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="glass-card-vibrant p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search order number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-vibrant pl-12"
              />
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 ${
                    filter === f.value
                      ? `bg-gradient-to-r ${f.gradient} text-white shadow-lg`
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card-vibrant p-6 animate-pulse">
                <div className="h-20 bg-white/5 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-card-vibrant py-20 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-white/30" />
            </div>
            <p className="text-white/50 text-xl font-semibold">No orders found</p>
            <p className="text-white/30 mt-2">New orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const statusStyle = getStatusBadge(order.status);
              const nextAction = NEXT_STATUS[order.status];

              return (
                <div
                  key={order.id}
                  className="order-card-vibrant"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Main Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                        <span className="text-2xl font-extrabold vg-text-violet">#{order.orderNumber}</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">Order #{order.orderNumber}</p>
                        <div className="flex items-center gap-3 text-sm text-white/50 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(order.createdAt)}
                          </span>
                          <span>•</span>
                          <span>{order.items.length} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold vg-text-amber">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-xs text-white/40">
                          Subtotal: {formatCurrency(order.subtotal)}
                        </p>
                      </div>

                      <div className={`status-badge-vibrant bg-gradient-to-br ${statusStyle.gradient} text-${statusStyle.color.split('-')[1]}-400`}>
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {order.status}
                      </div>

                      {nextAction && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, nextAction.status)}
                          className={`px-5 py-3 rounded-xl bg-gradient-to-r ${nextAction.gradient} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2`}
                        >
                          {nextAction.label}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}

                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => api.cancelOrder(order.id).then(() => fetchOrders())}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 rounded-xl bg-white/5 text-white/80 text-sm font-medium border border-white/10"
                        >
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
