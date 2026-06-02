export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  restaurantId: string;
  restaurantName: string;
  branchId: string | null;
  branchName: string | null;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  _count?: {
    orders: number;
    users: number;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  upiId: string | null;
  upiName: string | null;
  razorpayId: string | null;
  razorpaySecret: string | null;
  paytmMid: string | null;
  paytmKey: string | null;
  paymentMode: 'upi' | 'razorpay' | 'paytm';
  branches: Branch[];
  _count: {
    users: number;
    orders: number;
  };
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: { name: string; price: number }[];
  notes?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: number;
  restaurantId: string;
  branchId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentId: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
}

export interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  restaurantId: string;
  type: 'CREDIT' | 'DEBIT' | 'FEE' | 'PAYOUT';
  amount: number;
  reference: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Payout {
  id: string;
  restaurantId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  razorpayId: string | null;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isVeg?: boolean;
  modifiers: { name: string; price: number }[] | null;
}

export interface CartItem extends OrderItem {
  cartId: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderStats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedToday: number;
  todayRevenue: number;
}
