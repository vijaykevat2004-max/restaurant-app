import { useEffect, useState } from 'react';
import { Plus, Minus, Trash2, CreditCard, ShoppingBag, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useCartStore, useMenuStore, useBranchStore, useOrderStore } from '../stores';
import type { MenuItem } from '../types';
import { formatCurrency } from '../utils/currency';

const CATEGORY_GRADIENTS = [
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-blue-500',
];

export function POSPage() {
  const { selectedBranchId } = useBranchStore();
  const { items: cartItems, addItem, removeItem, updateQuantity, clearCart, getSubtotal, getTax, getTotal } = useCartStore();
  const { categories, setCategories } = useMenuStore();
  const { addOrder } = useOrderStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menu = await api.getMenu();
        setCategories(menu);
        if (menu.length > 0) {
          setSelectedCategory(menu[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [setCategories]);

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      price: item.price,
    });
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !selectedBranchId) return;

    setIsProcessing(true);
    try {
      const order = await api.createOrder(cartItems, selectedBranchId);
      addOrder(order);
      setOrderNumber(order.orderNumber);
      clearCart();
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center animate-bounce">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/60">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold vg-text-emerald">Point of Sale</h1>
                <p className="text-white/50 text-sm">Select items to create order</p>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length]} text-white shadow-lg`
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {selectedCategoryData && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedCategoryData.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.isAvailable && handleAddToCart(item)}
                    className={`glass-card-vibrant p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      !item.isAvailable ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-2xl mb-3 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-white/40" />
                    </div>
                    <h3 className="font-semibold text-white truncate">{item.name}</h3>
                    <p className="text-xl font-bold vg-text-amber mt-1">
                      {formatCurrency(item.price)}
                    </p>
                    {!item.isAvailable && (
                      <p className="text-xs text-red-400 mt-1">Unavailable</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 glass-card-vibrant p-4 lg:p-6 flex flex-col max-h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Current Order</h2>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
              >
                Clear
              </button>
            )}
          </div>

          {orderNumber && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
              <p className="text-emerald-400 font-semibold">
                Order #{orderNumber} created!
              </p>
              <button
                onClick={() => setOrderNumber(null)}
                className="mt-2 text-sm text-emerald-400/70 hover:text-emerald-400"
              >
                New Order
              </button>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {cartItems.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">Cart empty</p>
                <p className="text-white/30 text-sm">Select items from menu</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.cartId} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <button
                      onClick={() => removeItem(item.cartId)}
                      className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        className="w-8 h-8 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        className="w-8 h-8 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-bold vg-text-amber">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Tax (8%)</span>
              <span className="font-mono">{formatCurrency(getTax())}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="vg-text-sunset">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isProcessing}
            className={`w-full mt-4 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              cartItems.length === 0 || isProcessing
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            {isProcessing ? 'Processing...' : `Pay ${formatCurrency(getTotal())}`}
          </button>
        </div>
      </div>
    </div>
  );
}
