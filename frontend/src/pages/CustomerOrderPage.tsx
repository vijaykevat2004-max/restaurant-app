import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Utensils,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Loader2,
  QrCode,
  CreditCard,
  ArrowLeft,
  Loader,
  ChefHat,
  Sparkles,
  Flame,
  Star,
  Crown,
  PartyPopper,
  IceCream,
  Coffee,
  Pizza,
  X,
  Timer,
  RefreshCw,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { MenuCategory } from '../types';
import { formatCurrency } from '../utils/currency';
import { playReadySound } from '../utils/sounds';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  cartId: string;
}

interface OrderInfo {
  id: string;
  orderNumber: number;
  status: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Starters': <Flame className="w-4 h-4" />,
  'Main Course': <Utensils className="w-4 h-4" />,
  'Breads': <Pizza className="w-4 h-4" />,
  'Beverages': <Coffee className="w-4 h-4" />,
  'Desserts': <IceCream className="w-4 h-4" />,
};

const GRADIENT_COLORS = [
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-violet-500 via-purple-500 to-fuchsia-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-blue-500 via-indigo-500 to-violet-500',
  'from-pink-500 via-rose-500 to-orange-500',
];

const API_BASE = 'https://backend-vijay19.vercel.app/api/v1';

export function CustomerOrderPage() {
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurant, setRestaurant] = useState<{ id: string; name: string; upiId?: string; upiName?: string } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [step, setStep] = useState<'menu' | 'checkout' | 'payment' | 'success'>('menu');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showStatusBanner, setShowStatusBanner] = useState(false);
  const prevStatus = useRef<string | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/menu/public/${slug}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
        setRestaurant(data.restaurant);
        if (data.data?.length > 0 && !selectedCategory) {
          setSelectedCategory(data.data[0].id);
        }
      } else {
        setError(data.error || 'Failed to load menu');
      }
    } catch (err) {
      setError('Unable to connect to server');
      console.error('Failed to fetch menu:', err);
    } finally {
      setIsLoading(false);
    }
  }, [slug, selectedCategory]);

  useEffect(() => {
    fetchMenu();
    const interval = setInterval(fetchMenu, 15000);
    return () => clearInterval(interval);
  }, [fetchMenu]);

  useEffect(() => {
    if (!order) return;

    const checkOrderStatus = async () => {
      try {
        const res = await fetch(`https://backend-vijay19.vercel.app/api/v1/menu/public/orders/${order.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          const newStatus = data.data.status;
          if (newStatus !== prevStatus.current) {
            prevStatus.current = newStatus;
            setOrderStatus(newStatus);
            
            if (['READY', 'SERVED'].includes(newStatus) && soundEnabled) {
              playReadySound();
              setShowStatusBanner(true);
              setTimeout(() => setShowStatusBanner(false), 5000);
            }
          }
        }
      } catch (err) {
        console.error('Failed to check order status:', err);
      }
    };

    const interval = setInterval(checkOrderStatus, 5000);
    checkOrderStatus();
    return () => clearInterval(interval);
  }, [order, soundEnabled]);

  const addToCart = (item: MenuCategory['items'][0]) => {
    const existing = cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        cartId: `cart-${Date.now()}-${Math.random()}`,
      }]);
    }
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart
      .map((c) => c.cartId === cartId ? { ...c, quantity: c.quantity + delta } : c)
      .filter((c) => c.quantity > 0)
    );
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      const items = cart.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      const res = await fetch(`${API_BASE}/menu/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerName: customerName.trim(),
          tableNumber: tableNumber.trim() || undefined,
          slug,
        }),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrder(data.order);
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayAtCounter = () => {
    setStep('success');
  };

  const handleNewOrder = () => {
    setStep('menu');
    setCart([]);
    setOrder(null);
    setCustomerName('');
    setTableNumber('');
    setError(null);
  };

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-spin" />
          <p className="text-white/60 text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={fetchMenu}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative">
      {step === 'menu' && (
        <>
          <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/20 border-b border-white/10">
            <div className="max-w-lg mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg text-white">{restaurant?.name || 'Menu'}</h1>
                    <p className="text-xs text-white/50">Scan & Order</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full text-xs font-bold flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((cat, index) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? `bg-gradient-to-r ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]} text-white shadow-lg`
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {selectedCategoryData && (
              <div className="space-y-3">
                {selectedCategoryData.items.map((item) => (
                  <div
                    key={item.id}
                    className={`glass-card-vibrant p-4 flex items-center gap-4 ${!item.isAvailable ? 'opacity-50' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={item.isVeg ? 'veg-badge' : 'non-veg-badge'} />
                        <h3 className="font-semibold text-white">{item.name}</h3>
                      </div>
                      {item.description && (
                        <p className="text-sm text-white/50 mt-1">{item.description}</p>
                      )}
                      <p className="text-lg font-bold text-amber-400 mt-1">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    {item.isAvailable ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                        Sold Out
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {categories.length === 0 && (
              <div className="text-center py-20">
                <ChefHat className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Menu coming soon!</p>
              </div>
            )}
          </div>
        </>
      )}

      {step === 'checkout' && (
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/20 border-b border-white/10">
            <div className="max-w-lg mx-auto px-4 py-4">
              <button
                onClick={() => setStep('menu')}
                className="flex items-center gap-2 text-white/70 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </div>
          </header>

          <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Complete Your Order</h2>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="glass-card-vibrant p-4 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Your Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Table Number (Optional)</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., Table 5"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="glass-card-vibrant p-4">
              <h3 className="text-white font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between text-white/70 text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-amber-400">{formatCurrency(getCartTotal())}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Place Order
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && order && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="glass-card-vibrant p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Order #{order.orderNumber}</h2>
            <p className="text-white/60 mb-6">Total: {formatCurrency(getCartTotal())}</p>

            {restaurant?.upiId ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${restaurant.upiId}&pn=${encodeURIComponent(restaurant.upiName || restaurant.name)}&am=${getCartTotal()}&cu=INR`}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-white/50">Scan QR code to pay</p>
                <p className="font-mono text-rose-300">{restaurant.upiId}</p>
              </div>
            ) : (
              <p className="text-white/60 mb-4">Pay at counter</p>
            )}

            <button
              onClick={handlePayAtCounter}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold"
            >
              Done - Pay at Counter
            </button>
          </div>
        </div>
      )}

      {step === 'success' && order && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          {showStatusBanner && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 p-4 flex items-center justify-center gap-3 animate-bounce">
              <Bell className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">
                {orderStatus === 'READY' ? '🎉 Your food is READY!' : 'Your order is being served!'}
              </span>
            </div>
          )}
          
          <div className="text-center mt-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center animate-bounce">
              <Check className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Order Placed!</h2>
            <p className="text-white/60 mb-6">Thank you for your order</p>

            <div className="glass-card-vibrant p-6 inline-block mb-6">
              <p className="text-sm text-white/50 mb-1">Order Number</p>
              <p className="text-5xl font-bold text-amber-400">#{order.orderNumber}</p>
            </div>

            {orderStatus && (
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                orderStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                orderStatus === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-400' :
                orderStatus === 'PREPARING' ? 'bg-orange-500/20 text-orange-400' :
                orderStatus === 'READY' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                Status: {orderStatus}
              </div>
            )}

            <p className="text-white/60 mb-8">Your food is being prepared!</p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 rounded-xl ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handleNewOrder}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold"
            >
              Order More
            </button>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-indigo-950 to-slate-950 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="p-2 text-white/70">
                <X className="w-6 h-6" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.cartId} className="flex items-center gap-4 p-4 glass-card-vibrant">
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-amber-400">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-white font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span className="text-white">Total</span>
                    <span className="text-amber-400">{formatCurrency(getCartTotal())}</span>
                  </div>
                  <button
                    onClick={() => { setShowCart(false); setStep('checkout'); }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold"
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
