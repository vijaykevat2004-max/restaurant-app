import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Clock,
  DollarSign,
  Utensils,
  CheckCircle,
  Activity,
  TrendingUp,
  Users,
  Flame,
  Sparkles,
  Crown,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore, useBranchStore } from '../stores';
import type { OrderStats, Order } from '../types';
import { formatCurrency } from '../utils/currency';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
}

const STAT_GRADIENTS = [
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-violet-500 via-purple-500 to-fuchsia-500',
] as const;

const QUICK_ACTIONS = [
  { icon: ShoppingCart, label: 'New Order', gradient: 'from-rose-500 to-pink-500', href: '/pos' },
  { icon: Utensils, label: 'Kitchen Display', gradient: 'from-amber-500 to-orange-500', href: '/kds' },
  { icon: Clock, label: 'View Orders', gradient: 'from-violet-500 to-purple-500', href: '/orders' },
  { icon: DollarSign, label: 'Wallet', gradient: 'from-emerald-500 to-teal-500', href: '/wallet' },
] as const;

const PARTICLE_COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'] as const;
const PARTICLE_COUNT = 15;

function StatCard({ title, value, subtitle, icon: Icon, gradient }: StatCardProps) {
  return (
    <div className="stat-card group cursor-pointer">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-white/60 font-medium">{title}</p>
          <p className={`text-4xl font-extrabold mt-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-white/40 mt-2">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl" />
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { selectedBranchId } = useBranchStore();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          api.getOrderStats(selectedBranchId || undefined),
          api.getActiveOrders(selectedBranchId || undefined),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedBranchId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-28 bg-white/5 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-0 w-72 h-72 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Floating Particles */}
      <div className="floating-particles">
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${(i * 7 + 3) % 100}%`,
              backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
              animationDuration: `${10 + (i * 0.7) % 10}s`,
              animationDelay: `${(i * 0.3) % 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-white/60">Welcome back, {user?.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Sparkles className="w-4 h-4" />
            <span>Last updated: Just now</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Orders"
            value={stats?.todayOrders || 0}
            subtitle={`${stats?.pendingOrders ?? 0} pending orders`}
            icon={ShoppingCart}
            gradient={STAT_GRADIENTS[0]}
          />
          <StatCard
            title="Completed"
            value={stats?.completedToday || 0}
            subtitle="orders completed"
            icon={CheckCircle}
            gradient={STAT_GRADIENTS[1]}
          />
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(stats?.todayRevenue || 0)}
            subtitle="total earnings"
            icon={DollarSign}
            gradient={STAT_GRADIENTS[2]}
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            subtitle="all time"
            icon={Activity}
            gradient={STAT_GRADIENTS[3]}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Orders */}
          <div className="lg:col-span-2 glass-card-vibrant p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Active Orders</h2>
              </div>
              <a href="/orders" className="flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <Utensils className="w-10 h-10 text-white/30" />
                </div>
                <p className="text-white/50 text-lg">No active orders right now</p>
                <p className="text-white/30 text-sm mt-1">New orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className="order-card-vibrant"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                          <span className="text-xl font-extrabold vg-text-violet">#{order.orderNumber}</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">Order #{order.orderNumber}</p>
                          <p className="text-sm text-white/50">{order.items.length} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`status-badge-vibrant ${
                          order.status === 'PENDING' ? 'status-new-vibrant' :
                          order.status === 'CONFIRMED' ? 'status-confirmed-vibrant' :
                          order.status === 'PREPARING' ? 'status-preparing-vibrant' :
                          'status-ready-vibrant'
                        }`}>
                          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                          {order.status}
                        </span>
                        <span className="text-xl font-extrabold vg-text-amber">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-card-vibrant p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Quick Actions</h2>
            </div>

            <div className="space-y-4">
              {QUICK_ACTIONS.map((action, index) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white font-semibold flex-1">{action.label}</span>
                  <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white/60 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Avg Order Value</span>
                  <span className="text-emerald-400 font-bold">
                    {formatCurrency(stats?.todayRevenue && stats?.todayOrders ? stats.todayRevenue / stats.todayOrders : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Pending Orders</span>
                  <span className="text-amber-400 font-bold">{stats?.pendingOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">This Month</span>
                  <span className="text-violet-400 font-bold">{formatCurrency(stats?.todayRevenue || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats Bar */}
        <div className="glass-card-vibrant p-4 flex items-center justify-around">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-white/60">Growth</span>
            <span className="text-emerald-400 font-bold">+12.5%</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-violet-400" />
            <span className="text-white/60">Active Users</span>
            <span className="text-violet-400 font-bold">24</span>
          </div>
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-rose-400" />
            <span className="text-white/60">Cart Value</span>
            <span className="text-rose-400 font-bold">{formatCurrency(stats?.todayRevenue || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
