import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Utensils,
  ShoppingCart,
  Plus,
  Minus,
  RefreshCw,
  Loader,
  Check,
} from 'lucide-react';
import type { MenuCategory } from '../types';
import { formatCurrency } from '../utils/currency';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

interface CartItemWithId {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  cartId: string;
}

export function QRMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurant, setRestaurant] = useState<{ name: string; slug: string } | null>(null);
  const [cart, setCart] = useState<CartItemWithId[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [order, setOrder] = useState<{ id: string; orderNumber: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsRefreshing(true);
      try {
        const res = await fetch(`${API_BASE}/menu/public/${slug}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        const data = await res.json();
        if (cancelled) return;

        if (data.success && Array.isArray(data.data)) {
          const nextCategories: MenuCategory[] = data.data;
          setCategories(nextCategories);
          setRestaurant(data.restaurant);

          setSelectedCategory((prev) => {
            if (!nextCategories.length) return null;
            if (!prev) return nextCategories[0].id;
            const stillExists = nextCategories.some((c) => c.id === prev);
            return stillExists ? prev : nextCategories[0].id;
          });
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slug, refreshNonce]);

  const addToCart = (item: MenuCategory['items'][0]) => {
    const existing = cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([
        ...cart,
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          price: item.price,
        cartId: `${item.id}-${Date.now()}`,
        },
      ]);
    }
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(
      cart
        .map((c) =>
          c.cartId === cartId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      setCheckoutError('Please enter your name');
      return;
    }
    setCheckoutError(null);
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/menu/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity, name: i.name, price: i.price })),
          customerName: customerName.trim(),
          tableNumber: tableNumber.trim() || undefined,
          slug,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to place order');
      setOrder(data.order);
      setCart([]);
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{restaurant?.name || 'Menu'}</h1>
                <p className="text-xs text-gray-500">Scan to order</p>
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 bg-orange-500 text-white rounded-xl"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsLoading(true);
                setRefreshNonce((v) => v + 1);
              }}
              className="p-2 bg-gray-100 text-gray-700 rounded-xl"
              title="Menu auto-refreshes every 5s"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-[72px] z-30">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {selectedCategoryData && (
          <div className="space-y-3">
            {selectedCategoryData.items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl p-4 shadow-sm flex gap-4 ${!item.isAvailable ? 'opacity-60' : ''}`}
                >
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {!item.isAvailable && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600">
                        Sold Out
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  )}
                  <p className="text-orange-600 font-bold mt-2">{formatCurrency(item.price)}</p>
                </div>
                {item.isAvailable && (
                  <button
                    onClick={() => addToCart(item)}
                    className="self-center p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Menu coming soon!</p>
          </div>
        )}
      </main>

      {/* Cart / Checkout Drawer */}
      {showCart && !order && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl animate-slide-in overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">Your Order</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                    <button
                      onClick={() => setShowCart(false)}
                      className="mt-4 text-orange-500 font-medium"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
                      <h3 className="font-semibold text-gray-700">Your Details</h3>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your Name *"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                      />
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Table Number (optional)"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                      />
                    </div>
                    {checkoutError && (
                      <p className="text-red-500 text-sm mb-2">{checkoutError}</p>
                    )}
                    {cart.map((item) => (
                      <div key={item.cartId} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-bold text-gray-900 w-16 text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-bold text-gray-900">{formatCurrency(getCartTotal())}</span>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><Loader className="w-5 h-5 animate-spin" /> Placing Order...</>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation */}
      {order && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-5xl font-bold text-orange-500 mb-2">#{order.orderNumber}</p>
          <p className="text-gray-500 mb-6">Thank you for your order</p>
          <button
            onClick={() => { setOrder(null); setShowCart(false); setCustomerName(''); setTableNumber(''); setCheckoutError(null); }}
            className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold"
          >
            Order More
          </button>
        </div>
      )}
    </div>
  );
}
