import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useBranchStore } from './stores';
import { api } from './api/client';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { POSPage } from './pages/POSPage';
import { KDSPage } from './pages/KDSPage';
import { WalletPage } from './pages/WalletPage';
import { PayoutsPage } from './pages/PayoutsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MenuPage } from './pages/MenuPage';
import { QRCodePage } from './pages/QRCodePage';
import { QRMenuPage } from './pages/QRMenuPage';
import { CustomerOrderPage } from './pages/CustomerOrderPage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/30 animate-bounce">
          <span className="text-2xl">🍽️</span>
        </div>
        <div className="flex justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <p className="text-white/60 mt-4 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth, isLoading } = useAuthStore();
  const { setBranches, selectBranch, selectedBranchId } = useBranchStore();

  useEffect(() => {
    checkAuth().catch(() => {
      // Ignore auth check errors
    });
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      api.getBranches()
        .then((branches) => {
          setBranches(branches || []);
          if (branches?.length > 0 && !selectedBranchId) {
            selectBranch(branches[0].id);
          }
        })
        .catch(() => {
          setBranches([]);
        });
    }
  }, [isLoading, setBranches, selectBranch, selectedBranchId]);

  return (
    <div className="relative min-h-screen">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
      
      <div className="relative z-10">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute roles={['OWNER', 'MANAGER']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="kds" element={<KDSPage />} />
            <Route
              path="wallet"
              element={
                <ProtectedRoute roles={['OWNER']}>
                  <WalletPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="payouts"
              element={
                <ProtectedRoute roles={['OWNER']}>
                  <PayoutsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute roles={['OWNER', 'MANAGER']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="menu"
              element={
                <ProtectedRoute roles={['OWNER', 'MANAGER']}>
                  <MenuPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="qr-code"
              element={
                <ProtectedRoute roles={['OWNER']}>
                  <QRCodePage />
                </ProtectedRoute>
              }
            />
          </Route>
          
          <Route path="/menu/:slug" element={<QRMenuPage />} />
          <Route path="/order/:slug" element={<CustomerOrderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;