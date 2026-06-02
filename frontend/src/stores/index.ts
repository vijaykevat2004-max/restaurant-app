import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Branch, CartItem, Order, MenuCategory } from '../types';
import { api } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const { token, user } = await api.login(email, password);
        api.setToken(token);
        set({ user, token, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          // ignore
        }
        api.setToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          api.setToken(token);
          const user = await api.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          api.setToken(null);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'serveflow-auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.setToken(state.token);
        }
      },
    }
  )
);

interface BranchState {
  branches: Branch[];
  selectedBranchId: string | null;
  setBranches: (branches: Branch[]) => void;
  selectBranch: (branchId: string | null) => void;
}

export const useBranchStore = create<BranchState>()((set) => ({
  branches: [],
  selectedBranchId: null,
  setBranches: (branches) => set({ branches }),
  selectBranch: (branchId) => set({ selectedBranchId: branchId }),
}));

interface CartState {
  items: CartItem[];
  branchId: string | null;
  addItem: (item: Omit<CartItem, 'cartId'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  setBranchId: (branchId: string) => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  branchId: null,

  addItem: (item) => {
    const { items } = get();
    const existingIndex = items.findIndex(
      (i) => i.menuItemId === item.menuItemId && JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + item.quantity,
      };
      set({ items: newItems });
    } else {
      set({
        items: [
          ...items,
          {
            ...item,
            cartId: `${item.menuItemId}-${Date.now()}`,
          },
        ],
      });
    }
  },

  removeItem: (cartId) => {
    set({ items: get().items.filter((i) => i.cartId !== cartId) });
  },

  updateQuantity: (cartId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.cartId === cartId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  setBranchId: (branchId) => set({ branchId }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const modifiersTotal = (item.modifiers || []).reduce((m, mod) => m + mod.price, 0);
      return sum + (item.price + modifiersTotal) * item.quantity;
    }, 0);
  },

  getTax: () => get().getSubtotal() * 0.08,

  getTotal: () => get().getSubtotal() + get().getTax(),
}));

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  isLoading: boolean;
  setOrders: (orders: Order[]) => void;
  setActiveOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: [],
  activeOrders: [],
  isLoading: false,

  setOrders: (orders) => set({ orders }),

  setActiveOrders: (activeOrders) => set({ activeOrders }),

  addOrder: (order) => {
    const { orders, activeOrders } = get();
    if (!['COMPLETED', 'CANCELLED'].includes(order.status)) {
      set({ activeOrders: [...activeOrders, order] });
    }
    set({ orders: [...orders, order] });
  },

  updateOrder: (order) => {
    const { orders, activeOrders } = get();

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      set({
        activeOrders: activeOrders.filter((o) => o.id !== order.id),
      });
    } else {
      set({
        activeOrders: activeOrders.map((o) => (o.id === order.id ? order : o)),
      });
    }

    set({
      orders: orders.map((o) => (o.id === order.id ? order : o)),
    });
  },

  removeOrder: (orderId) => {
    const { activeOrders } = get();
    set({
      activeOrders: activeOrders.filter((o) => o.id !== orderId),
    });
  },
}));

interface MenuState {
  categories: MenuCategory[];
  isLoading: boolean;
  setCategories: (categories: MenuCategory[]) => void;
}

export const useMenuStore = create<MenuState>()((set) => ({
  categories: [],
  isLoading: false,
  setCategories: (categories) => set({ categories }),
}));
