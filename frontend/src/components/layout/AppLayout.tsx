import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Wallet,
  ArrowUpCircle,
  Settings,
  LogOut,
  ChevronDown,
  Utensils,
  QrCode,
  UtensilsCrossed,
  Crown,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore, useBranchStore } from '../../stores';
import { useState, useRef, useEffect } from 'react';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', gradient: 'from-rose-500 to-pink-500', roles: ['OWNER', 'MANAGER'] },
  { path: '/orders', icon: ShoppingCart, label: 'Orders', gradient: 'from-emerald-500 to-teal-500', roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { path: '/pos', icon: ShoppingCart, label: 'POS', gradient: 'from-amber-500 to-orange-500', roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { path: '/kds', icon: ChefHat, label: 'Kitchen', gradient: 'from-violet-500 to-purple-500', roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { path: '/menu', icon: UtensilsCrossed, label: 'Menu', gradient: 'from-cyan-500 to-blue-500', roles: ['OWNER', 'MANAGER'] },
  { path: '/qr-code', icon: QrCode, label: 'QR Menu', gradient: 'from-fuchsia-500 to-pink-500', roles: ['OWNER'] },
  { path: '/wallet', icon: Wallet, label: 'Wallet', gradient: 'from-lime-500 to-green-500', roles: ['OWNER'] },
  { path: '/payouts', icon: ArrowUpCircle, label: 'Payouts', gradient: 'from-indigo-500 to-violet-500', roles: ['OWNER'] },
  { path: '/settings', icon: Settings, label: 'Settings', gradient: 'from-gray-500 to-gray-600', roles: ['OWNER', 'MANAGER'] },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const { branches, selectedBranchId, selectBranch } = useBranchStore();
  const navigate = useNavigate();
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setShowBranchDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const selectedBranch = branches?.find((b) => b.id === selectedBranchId);
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 lg:z-auto
        w-64 h-full
        bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 
        border-r border-white/10 flex flex-col relative overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 lg:hidden hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>

        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-t from-fuchsia-500/10 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="p-5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/30 animate-pulse">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
                Apna Restaurant
              </h1>
              <p className="text-xs text-white/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {user?.restaurantName}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 relative z-10">
          {visibleNavItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-white/10 to-white/5'
                    : 'hover:bg-white/5'
                }`
              }
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator */}
                  {isActive && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.gradient} rounded-r-full`} />
                  )}
                  
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                      : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                  </div>

                  {/* Label */}
                  <span className={`font-medium transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>

                  {/* Active Glow */}
                  {isActive && (
                    <div className={`absolute right-2 w-2 h-2 rounded-full bg-gradient-to-br ${item.gradient}`} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10 relative z-10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-red-500/20 flex items-center justify-center transition-all">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
        {/* Header */}
        <header className="h-18 px-4 lg:px-6 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-white/5">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors lg:hidden"
          >
            <Menu className="w-6 h-6 text-white/70" />
          </button>

          {/* Branch Selector */}
          <div ref={branchRef} className="relative">
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/60 text-sm">Branch:</span>
              <span className="font-semibold text-white">
                {selectedBranch?.name || 'All Branches'}
              </span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${showBranchDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showBranchDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-2">
                  <button
                    onClick={() => {
                      selectBranch(null);
                      setShowBranchDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Utensils className="w-4 h-4 text-white/60" />
                    </div>
                    <span className="text-white font-medium">All Branches</span>
                    {!selectedBranchId && (
                      <div className="ml-auto w-2.5 h-2.5 bg-violet-500 rounded-full" />
                    )}
                  </button>
                  {(branches || []).map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => {
                        selectBranch(branch.id);
                        setShowBranchDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Utensils className="w-4 h-4 text-white/60" />
                      </div>
                      <span className="text-white font-medium">{branch.name}</span>
                      {selectedBranchId === branch.id && (
                        <div className="ml-auto w-2.5 h-2.5 bg-violet-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-white/10 transition-all duration-300"
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-white/50 capitalize flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    user?.role === 'OWNER' ? 'bg-amber-400' :
                    user?.role === 'MANAGER' ? 'bg-violet-400' : 'bg-emerald-400'
                  }`} />
                  {user?.role.toLowerCase()}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showUserDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-white/60" />
                    <span className="text-white font-medium">Settings</span>
                  </button>
                  <div className="my-2 border-t border-white/10" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
