import { useEffect, useState } from 'react';
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

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}>
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899, #f43f5e)' }}>
          <span className="text-3xl">🍽️</span>
        </div>
        <p className="text-white/80 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-500/20">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-white/60 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
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
  const { checkAuth, isLoading: authLoading } = useAuthStore();
  const { setBranches, selectBranch, selectedBranchId } = useBranchStore();
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        await checkAuth();
        if (mounted) {
          setInitialized(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        if (mounted) {
          setInitialized(true);
        }
      }
    };

    init();
    
    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  useEffect(() => {
    if (!initialized || authLoading) return;

    const loadBranches = async () => {
      try {
        const branches = await api.getBranches();
        setBranches(branches || []);
        if (branches?.length > 0 && !selectedBranchId) {
          selectBranch(branches[0].id);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
        setBranches([]);
      }
    };

    loadBranches();
  }, [initialized, authLoading, setBranches, selectBranch, selectedBranchId]);

  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  if (error) {
    return <ErrorScreen message={error} onRetry={handleRetry} />;
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}>
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
