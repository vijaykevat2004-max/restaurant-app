import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Plus,
  CreditCard,
  Check,
  X,
  Settings,
  Store,
  Shield,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { useBranchStore } from '../stores';
import type { Restaurant, Branch } from '../types';

export function SettingsPage() {
  const { branches, setBranches } = useBranchStore();
  const [activeTab, setActiveTab] = useState<'restaurant' | 'branches' | 'team' | 'payments'>('restaurant');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [paytmMid, setPaytmMid] = useState('');
  const [paytmKey, setPaytmKey] = useState('');
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'razorpay' | 'paytm'>('upi');
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [isSavingRestaurant, setIsSavingRestaurant] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const restaurantData = await api.getRestaurant();
        setRestaurant(restaurantData);
        setRestaurantName(restaurantData.name || '');
        setUpiId(restaurantData.upiId || '');
        setUpiName(restaurantData.upiName || '');
        setRazorpayKeyId(restaurantData.razorpayId || '');
        setRazorpaySecret(restaurantData.razorpaySecret || '');
        setPaymentMode(restaurantData.paymentMode as 'upi' | 'razorpay' | 'paytm' || 'upi');
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveRestaurant = async () => {
    if (!restaurantName.trim()) return;
    setIsSavingRestaurant(true);
    try {
      const updated = await api.updateRestaurant({ name: restaurantName });
      setRestaurant(updated);
    } catch (error) {
      console.error('Failed to save restaurant:', error);
    } finally {
      setIsSavingRestaurant(false);
    }
  };

  const handleSaveUpi = async () => {
    setIsSavingUpi(true);
    try {
      await api.updateRestaurant({
        upiId,
        upiName,
        razorpayId: paymentMode === 'razorpay' ? razorpayKeyId : null,
        razorpaySecret: paymentMode === 'razorpay' ? razorpaySecret : null,
        paytmMid: paymentMode === 'paytm' ? paytmMid : null,
        paytmKey: paymentMode === 'paytm' ? paytmKey : null,
        paymentMode
      });
      setRestaurant({ ...restaurant!, upiId, upiName, razorpayId: razorpayKeyId, paymentMode } as Restaurant);
    } catch (error) {
      console.error('Failed to save UPI settings:', error);
    } finally {
      setIsSavingUpi(false);
    }
  };

  const TABS = [
    { id: 'restaurant', label: 'Restaurant', icon: Store, gradient: 'from-rose-500 to-pink-500' },
    { id: 'branches', label: 'Branches', icon: Building2, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'team', label: 'Team', icon: Users, gradient: 'from-violet-500 to-purple-500' },
    { id: 'payments', label: 'Payments', icon: CreditCard, gradient: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Settings className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-white/60">Manage your restaurant configuration</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="glass-card-vibrant p-8 animate-pulse">
            <div className="h-64 bg-white/5 rounded-2xl" />
          </div>
        ) : activeTab === 'restaurant' ? (
          <div className="glass-card-vibrant p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Restaurant Details</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Restaurant Name</label>
                <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="input-vibrant" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Slug</label>
                <input type="text" defaultValue={restaurant?.slug || ''} disabled className="input-vibrant opacity-50" />
                <p className="text-xs text-white/40 mt-2">URL: yoursite.com/{restaurant?.slug}</p>
              </div>
              <button onClick={handleSaveRestaurant} disabled={isSavingRestaurant} className="btn-vibrant btn-violet flex items-center gap-2">
                {isSavingRestaurant ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        ) : activeTab === 'branches' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAddBranch(true)} className="btn-vibrant btn-emerald flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Branch
              </button>
            </div>

            {branches.length === 0 ? (
              <div className="glass-card-vibrant py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white/30" />
                </div>
                <p className="text-white/50 text-lg font-semibold">No branches yet</p>
                <button onClick={() => setShowAddBranch(true)} className="btn-vibrant btn-emerald mt-4">
                  Add your first branch
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {branches.map((branch) => (
                  <div key={branch.id} className="glass-card-vibrant p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{branch.name}</p>
                        <p className="text-sm text-white/50">{branch.address || 'No address'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const newName = prompt('New branch name:', branch.name);
                          if (newName && newName !== branch.name) {
                            try {
                              const updated = await api.updateBranch(branch.id, { name: newName });
                              setBranches(branches.map((b) => b.id === branch.id ? { ...b, ...updated } : b));
                            } catch (e) { console.error(e); }
                          }
                        }}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete branch "${branch.name}"?`)) return;
                          try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/restaurant/branches/${branch.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${api.getToken()}` },
                            });
                            const data = await res.json();
                            if (data.success) setBranches(branches.filter((b) => b.id !== branch.id));
                          } catch (e) { console.error(e); }
                        }}
                        className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'team' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAddUser(true)} className="btn-vibrant btn-violet flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add Team Member
              </button>
            </div>

            <div className="glass-card-vibrant p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Users className="w-10 h-10 text-white/30" />
              </div>
              <p className="text-white/50 text-lg font-semibold">Team management coming soon...</p>
              <p className="text-white/30 mt-2">Add managers and staff members to your team</p>
            </div>
          </div>
        ) : activeTab === 'payments' ? (
          <div className="glass-card-vibrant p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Payment Settings</h2>
                <p className="text-sm text-white/50">Configure how you receive payments</p>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => setPaymentMode('upi')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  paymentMode === 'upi'
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                    : 'border-white/10 hover:border-emerald-500/30 bg-white/5'
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white text-center mb-2">UPI QR Code</h3>
                <p className="text-sm text-white/50 text-center">Scan & Pay directly</p>
              </button>
              <button
                onClick={() => setPaymentMode('razorpay')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  paymentMode === 'razorpay'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                    : 'border-white/10 hover:border-blue-500/30 bg-white/5'
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white text-center mb-2">Razorpay</h3>
                <p className="text-sm text-white/50 text-center">Cards, UPI, NetBanking</p>
              </button>
              <button
                onClick={() => setPaymentMode('paytm')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  paymentMode === 'paytm'
                    ? 'border-violet-500 bg-gradient-to-br from-violet-500/20 to-purple-500/20'
                    : 'border-white/10 hover:border-violet-500/30 bg-white/5'
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white text-center mb-2">Paytm Gateway</h3>
                <p className="text-sm text-white/50 text-center">Automatic verification</p>
              </button>
            </div>

            {/* UPI Settings */}
            {paymentMode === 'upi' && (
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="input-vibrant"
                  />
                  <p className="text-xs text-white/40 mt-2">Customers will pay to this UPI ID</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">UPI Display Name</label>
                  <input
                    type="text"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    placeholder="Restaurant Name"
                    className="input-vibrant"
                  />
                </div>
              </div>
            )}

            {/* Razorpay Settings */}
            {paymentMode === 'razorpay' && (
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="rzp_live_XXXXXXXXXX"
                    className="input-vibrant"
                  />
                  <p className="text-xs text-white/40 mt-2">Get from Razorpay Dashboard → API Keys</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Razorpay Key Secret</label>
                  <input
                    type="password"
                    value={razorpaySecret}
                    onChange={(e) => setRazorpaySecret(e.target.value)}
                    placeholder="Your Razorpay Secret"
                    className="input-vibrant"
                  />
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-400">
                    <strong>How to get Razorpay credentials:</strong>
                  </p>
                  <ul className="text-sm text-white/50 mt-2 space-y-1">
                    <li>1. Go to dashboard.razorpay.com</li>
                    <li>2. Create account and complete KYC</li>
                    <li>3. Go to Settings → API Keys</li>
                    <li>4. Copy Key ID and Key Secret</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Paytm Settings */}
            {paymentMode === 'paytm' && (
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Paytm Merchant ID (MID)</label>
                  <input
                    type="text"
                    value={paytmMid}
                    onChange={(e) => setPaytmMid(e.target.value)}
                    placeholder="Your Paytm MID"
                    className="input-vibrant"
                  />
                  <p className="text-xs text-white/40 mt-2">Get from Paytm Business Dashboard</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Paytm Merchant Key</label>
                  <input
                    type="password"
                    value={paytmKey}
                    onChange={(e) => setPaytmKey(e.target.value)}
                    placeholder="Your Paytm Merchant Key"
                    className="input-vibrant"
                  />
                </div>
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-sm text-violet-400">
                    <strong>How to get Paytm credentials:</strong>
                  </p>
                  <ul className="text-sm text-white/50 mt-2 space-y-1">
                    <li>1. Go to business.paytm.com</li>
                    <li>2. Create merchant account</li>
                    <li>3. Go to API Keys section</li>
                    <li>4. Copy MID and Merchant Key</li>
                  </ul>
                </div>
              </div>
            )}

            <button onClick={handleSaveUpi} disabled={isSavingUpi} className="btn-vibrant btn-emerald mt-6 flex items-center gap-2">
              {isSavingUpi ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              Save Payment Settings
            </button>

            {/* Info Box */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white">
                    {paymentMode === 'upi' ? 'How UPI works' : paymentMode === 'razorpay' ? 'How Razorpay works' : 'How Paytm works'}
                  </h3>
                  <p className="text-sm text-white/60 mt-1">
                    {paymentMode === 'upi'
                      ? 'Customers scan QR code on table, pay via any UPI app, payment is tracked automatically.'
                      : paymentMode === 'razorpay'
                      ? 'Customers pay via cards, UPI, or NetBanking. Payment is automatically verified via Razorpay webhook.'
                      : 'Customers pay through Paytm gateway, payment is automatically verified and credited to wallet.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modals */}
        {showAddBranch && (
          <AddBranchModal onClose={() => setShowAddBranch(false)} onAdd={(branch) => {
            setBranches([...branches, branch]);
            setShowAddBranch(false);
          }} apiToken={api.getToken()} />
        )}

        {showAddUser && (
          <AddUserModal onClose={() => setShowAddUser(false)} apiToken={api.getToken()} />
        )}
      </div>
    </div>
  );
}

function AddBranchModal({ onClose, onAdd, apiToken }: { onClose: () => void; onAdd: (branch: Branch) => void; apiToken: string | null }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/restaurant/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ name, address: address || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        onAdd(data.data);
      } else {
        console.error('Failed to add branch:', data.error);
      }
    } catch (error) {
      console.error('Failed to add branch:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card-vibrant w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Branch</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Branch Name</label>
            <input
              type="text"
              placeholder="Main Branch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-vibrant"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Address (optional)</label>
            <input
              type="text"
              placeholder="123 Main Street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-vibrant"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-vibrant btn-emerald">
              {isSubmitting ? 'Adding...' : 'Add Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddUserModal({ onClose, apiToken }: { onClose: () => void; apiToken: string | null }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'STAFF'>('STAFF');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/restaurant/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        onClose();
      } else {
        console.error('Failed to add user:', data.error);
      }
    } catch (error) {
      console.error('Failed to add user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card-vibrant w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Team Member</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Full Name</label>
            <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="input-vibrant" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
            <input type="email" placeholder="john@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-vibrant" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="input-vibrant" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('MANAGER')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === 'MANAGER'
                    ? 'border-violet-500 bg-gradient-to-br from-violet-500/20 to-purple-500/20'
                    : 'border-white/10 hover:border-violet-500/30 bg-white/5'
                }`}
              >
                <span className="text-white font-semibold">Manager</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('STAFF')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === 'STAFF'
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                    : 'border-white/10 hover:border-emerald-500/30 bg-white/5'
                }`}
              >
                <span className="text-white font-semibold">Staff</span>
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-vibrant btn-violet">
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
