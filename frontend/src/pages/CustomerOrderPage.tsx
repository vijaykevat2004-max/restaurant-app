import { useEffect, useState, useRef } from 'react';
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
} from 'lucide-react';
import type { MenuCategory, CartItem } from '../types';
import { formatCurrency } from '../utils/currency';

interface CartItemWithId extends CartItem {
  cartId: string;
}

interface UpiPaymentData {
  paymentId: string;
  qrCodeUrl: string;
  upiUrl: string;
  upiId: string;
  amount: number;
  status: string;
}

interface OrderData {
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

const PARTICLE_POSITIONS = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 5 + 2) % 100}%`,
  top: `${(i * 7 + 3) % 100}%`,
  delay: `${(i * 0.1) % 2}s`,
  duration: `${2 + (i * 0.3) % 3}s`,
}));

const PARTICLE_COLORS = ['rose-400', 'pink-400', 'violet-400', 'amber-400', 'emerald-400', 'blue-400'];

const GRADIENT_COLORS = [
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-violet-500 via-purple-500 to-fuchsia-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-blue-500 via-indigo-500 to-violet-500',
  'from-pink-500 via-rose-500 to-orange-500',
  'from-lime-500 via-emerald-500 to-teal-500',
  'from-yellow-500 via-amber-500 to-orange-500',
];

export function CustomerOrderPage() {
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurant, setRestaurant] = useState<{ id: string; name: string; upiId?: string; upiName?: string; paymentMode?: string; paytmMid?: string } | null>(null);
  const [cart, setCart] = useState<CartItemWithId[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [step, setStep] = useState<'menu' | 'checkout' | 'payment' | 'success'>('menu');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [paymentData, setPaymentData] = useState<UpiPaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`https://backend-vijay19.vercel.app/api/v1/menu/public/${slug}`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.data || []);
          setRestaurant(data.restaurant);
          if (data.data?.length > 0) {
            setSelectedCategory(data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      setCart(cart.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, cartId: Math.random().toString(36) }]);
    }
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart.map((c) => c.cartId === cartId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }
    setIsProcessing(true);
    try {
      const items = cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity }));
      const res = await fetch('https://backend-vijay19.vercel.app/api/v1/menu/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerName,
          tableNumber: tableNumber || undefined,
          slug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setStep('payment');
        if (restaurant?.id) {
          createPayment(data.order.id, getCartTotal(), restaurant.id);
        }
      }
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const createPayment = async (orderId: string, amount: number, restaurantId: string) => {
    try {
      const res = await fetch('https://backend-vijay19.vercel.app/api/v1/payments/create-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, orderId, amount }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentData(data.data);
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };

  const handlePaymentConfirm = async () => {
    try {
      await fetch('https://backend-vijay19.vercel.app/api/v1/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order?.id,
          paymentId: paymentData?.paymentId,
          restaurantId: restaurant?.id,
          status: 'SUCCESS',
        }),
      });
    } catch (e) {
      console.error('Verify error:', e);
    }
    setStep('success');
    if (pollInterval.current) clearInterval(pollInterval.current);
  };

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-500/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-500/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-amber-500/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-emerald-500/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="text-center relative z-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-pink-500/50 animate-bounce">
            <ChefHat className="w-12 h-12 text-white" />
          </div>
          <p className="text-white/90 text-xl font-bold mb-4">Loading Delicious Menu...</p>
          <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-rose-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-0 w-72 h-72 bg-gradient-to-r from-amber-500/25 to-orange-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLE_POSITIONS.map((pos, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-ping"
            style={{
              left: pos.left,
              top: pos.top,
              backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
              animationDuration: pos.duration,
              animationDelay: pos.delay,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {step === 'menu' && (
        <>
          {/* Colorful Header */}
          <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/10 border-b border-white/20">
            <div className="max-w-lg mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-pink-500/40 animate-pulse">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-xl text-white drop-shadow-lg">
                      {restaurant?.name || 'Menu'}
                    </h1>
                    <p className="text-xs text-rose-300 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3" /> Order & Pay Online
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-110 active:scale-95 animate-bounce"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-sm font-bold flex items-center justify-center animate-pulse shadow-lg">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <div className="max-w-lg mx-auto px-4 py-6 relative z-10">
            {/* Animated Category Pills */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-lg ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]} text-white scale-105 shadow-xl`
                      : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white backdrop-blur-xl border border-white/20'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {CATEGORY_ICONS[category.name] || <Star className="w-4 h-4" />}
                    {category.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Menu Items */}
            {selectedCategoryData && (
              <div className="space-y-4 mt-4">
                <h2 className="text-xl font-bold text-white/90 flex items-center gap-2 drop-shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                    {CATEGORY_ICONS[selectedCategoryData.name] || <Star className="w-5 h-5 text-white" />}
                  </div>
                  {selectedCategoryData.name}
                </h2>
                {selectedCategoryData.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="flex gap-4 p-4 relative z-10">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-28 h-28 rounded-2xl object-cover shadow-xl group-hover:shadow-2xl transition-shadow border-2 border-white/20"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-violet-600/60 to-pink-600/60 flex items-center justify-center shadow-xl border-2 border-white/20">
                          <Utensils className="w-10 h-10 text-white/70" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={item.isVeg ? 'veg-badge' : 'non-veg-badge'} />
                            <h3 className="font-bold text-lg text-white drop-shadow-md group-hover:text-rose-200 transition-colors">{item.name}</h3>
                          </div>
                          {item.description && (
                            <p className="text-sm text-white/50 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent drop-shadow-lg">
                            {formatCurrency(item.price)}
                          </p>
                          {item.isAvailable && (
                            <button
                              onClick={() => addToCart(item)}
                              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-110 active:scale-95 transition-all animate-pulse"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl backdrop-blur-sm">
                        <span className="text-white/90 font-bold text-sm bg-red-500/90 px-4 py-2 rounded-full shadow-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colorful Cart Modal */}
          {showCart && cart.length > 0 && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-end">
              <div className="bg-gradient-to-t from-indigo-950 via-purple-950 to-slate-950 w-full rounded-t-[2rem] p-6 max-h-[85vh] overflow-y-auto border-t border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    Your Cart
                  </h3>
                  <button onClick={() => setShowCart(false)} className="p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all backdrop-blur-xl border border-white/20">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.cartId} className="flex items-center justify-between bg-white/10 rounded-2xl p-4 backdrop-blur-xl border border-white/20">
                      <div className="flex items-center gap-4">
                        <button onClick={() => updateQuantity(item.cartId, -1)} className="p-3 rounded-xl bg-rose-500/30 text-rose-400 hover:bg-rose-500/50 transition-colors">
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-10 text-center text-xl font-bold text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartId, 1)} className="p-3 rounded-xl bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500/50 transition-colors">
                          <Plus className="w-5 h-5" />
                        </button>
                        <span className="text-white font-semibold text-lg">{item.name}</span>
                      </div>
                      <span className="text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/20 mt-6 pt-6">
                  <div className="flex justify-between text-2xl font-bold mb-4">
                    <span className="text-white/90">Total</span>
                    <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent text-3xl drop-shadow-lg">
                      {formatCurrency(getCartTotal())}
                    </span>
                  </div>
                  <button
                    onClick={() => { setStep('checkout'); setShowCart(false); }}
                    className="w-full py-5 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-2xl text-white font-bold text-lg shadow-xl shadow-pink-500/40 hover:shadow-pink-500/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-6 h-6" />
                    Checkout Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {step === 'checkout' && (
        <div className="min-h-screen relative z-10">
          <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/10 border-b border-white/20">
            <div className="max-w-lg mx-auto px-4 py-4">
              <button onClick={() => setStep('menu')} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Menu</span>
              </button>
            </div>
          </header>
          <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-pink-500/50 animate-bounce">
                <ChefHat className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-lg">Complete Order</h2>
              <p className="text-white/60 mt-2">Enter your details below</p>
            </div>
            
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 space-y-4 border border-white/20">
              <div>
                <label className="label flex items-center gap-2 text-white font-semibold">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse" />
                  Your Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full h-14 px-5 rounded-2xl bg-white/10 border-2 border-white/20 focus:border-rose-500 text-white placeholder:text-white/40 transition-all text-lg"
                />
              </div>
              <div>
                <label className="label flex items-center gap-2 text-white font-semibold">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" />
                  Table Number (Optional)
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., Table 5"
                  className="w-full h-14 px-5 rounded-2xl bg-white/10 border-2 border-white/20 focus:border-violet-500 text-white placeholder:text-white/40 transition-all text-lg"
                />
              </div>
            </div>
            
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Order Summary
              </h3>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between text-white/70">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/20 pt-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span className="text-white">Total</span>
                  <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent text-3xl">
                    {formatCurrency(getCartTotal())}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing || !customerName.trim()}
              className="w-full py-5 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-2xl text-white font-bold text-xl shadow-xl shadow-pink-500/40 hover:shadow-pink-500/60 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  Proceed to Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && paymentData && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative z-10">
          <div className="backdrop-blur-2xl bg-white/10 rounded-[2rem] p-8 max-w-sm w-full text-center border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-fuchsia-500/10" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500" />
            
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-pink-500/50 animate-bounce">
                <QrCode className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">Scan & Pay</h2>
              <p className="text-white/60 mb-6">Pay {formatCurrency(paymentData.amount)} via UPI</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-2xl">
                <img src={paymentData.qrCodeUrl} alt="QR Code" className="w-56 h-56 mx-auto" />
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 mb-6 border border-white/20">
                <p className="text-sm text-white/50">UPI ID</p>
                <p className="text-rose-300 font-mono font-bold text-lg">{paymentData.upiId}</p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-amber-400 mb-4 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Waiting for payment...</span>
              </div>
              
              <button
                onClick={handlePaymentConfirm}
                className="w-full px-6 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl text-white font-bold shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-6 h-6" />
                I've Completed Payment
              </button>
              <p className="text-xs text-white/40 mt-3">Pay via any UPI app, then click button</p>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && order && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative z-10">
          <div className="text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50 animate-bounce">
                <PartyPopper className="w-16 h-16 text-white" />
              </div>
              
              <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Order Confirmed!
              </h2>
              <p className="text-white/60 mb-8 text-lg">Your order has been placed successfully</p>
              
              <div className="backdrop-blur-xl bg-white/10 rounded-[2rem] p-8 mb-8 border border-white/20 inline-block">
                <p className="text-sm text-white/50 mb-2">Order Number</p>
                <p className="text-6xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent font-mono drop-shadow-lg">
                  #{order.orderNumber}
                </p>
              </div>
              
              <p className="text-lg text-white/70 mb-8 flex items-center justify-center gap-2">
                <ChefHat className="w-5 h-5 text-rose-400" />
                Your delicious food is being prepared!
              </p>
              
              <button
                onClick={() => {
                  setStep('menu');
                  setCart([]);
                  setOrder(null);
                  setPaymentData(null);
                  setCustomerName('');
                  setTableNumber('');
                }}
                className="px-10 py-5 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-2xl text-white font-bold text-lg shadow-xl shadow-pink-500/40 hover:shadow-pink-500/60 active:scale-[0.98] transition-all"
              >
                Order More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
