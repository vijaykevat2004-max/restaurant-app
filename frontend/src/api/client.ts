import type {
  ApiResponse,
  User,
  Restaurant,
  Branch,
  Order,
  OrderStats,
  WalletBalance,
  Transaction,
  Payout,
  MenuCategory,
  MenuItem,
  CartItem,
} from '../types';
import { parseOrders, parseOrder } from '../utils/order';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers as Record<string, string> },
      });

      const text = await response.text();
      
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error('API Error:', error.message);
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    console.log('Attempting login for:', email);
    try {
      const response = await this.request<ApiResponse<{ token: string; user: User }>>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid response from server');
      }
      this.token = response.data.token;
      return response.data;
    } catch (e) {
      console.error('Login error:', e);
      throw e;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout errors
    }
    this.token = null;
  }

  async getMe(): Promise<User> {
    const response = await this.request<ApiResponse<User>>('/auth/me');
    if (!response.data) {
      throw new Error('User data not found');
    }
    return response.data;
  }

  async getRestaurant(): Promise<Restaurant> {
    const response = await this.request<ApiResponse<Restaurant>>('/restaurant');
    if (!response.data) {
      throw new Error('Restaurant not found');
    }
    return response.data;
  }

  async updateRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const response = await this.request<ApiResponse<Restaurant>>('/restaurant', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to update restaurant');
    }
    return response.data;
  }

  async getBranches(): Promise<Branch[]> {
    const response = await this.request<ApiResponse<Branch[]>>('/restaurant/branches');
    return response.data || [];
  }

  async getOrders(params?: {
    branchId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: Order[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.set('branchId', params.branchId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const response = await this.request<ApiResponse<Order[]>>(`/orders${query ? `?${query}` : ''}`);
    return {
      orders: parseOrders(response.data || []),
      pagination: (response as any)?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  async getActiveOrders(branchId?: string): Promise<Order[]> {
    const query = branchId ? `?branchId=${branchId}` : '';
    const response = await this.request<ApiResponse<Order[]>>(`/orders/active${query}`);
    return parseOrders(response.data || []);
  }

  async getOrderStats(branchId?: string): Promise<OrderStats> {
    const query = branchId ? `?branchId=${branchId}` : '';
    const response = await this.request<ApiResponse<OrderStats>>(`/orders/stats${query}`);
    if (!response.data) {
      return { totalOrders: 0, todayOrders: 0, pendingOrders: 0, completedToday: 0, todayRevenue: 0 };
    }
    return response.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await this.request<ApiResponse<Order>>(`/orders/${id}`);
    if (!response.data) {
      throw new Error('Order not found');
    }
    return parseOrder(response.data);
  }

  async createOrder(items: CartItem[], branchId: string): Promise<Order> {
    const response = await this.request<ApiResponse<Order>>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items, branchId }),
    });
    if (!response.data) {
      throw new Error('Failed to create order');
    }
    return parseOrder(response.data);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const response = await this.request<ApiResponse<Order>>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!response.data) {
      throw new Error('Failed to update order');
    }
    return parseOrder(response.data);
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const response = await this.request<ApiResponse<Order>>(`/orders/${orderId}`, {
      method: 'DELETE',
    });
    if (!response.data) {
      throw new Error('Failed to cancel order');
    }
    return parseOrder(response.data);
  }

  async getMenu(): Promise<MenuCategory[]> {
    const response = await this.request<ApiResponse<MenuCategory[]>>(`/menu?t=${Date.now()}`);
    return response.data || [];
  }

  async createCategory(name: string, sortOrder?: number): Promise<MenuCategory> {
    const response = await this.request<ApiResponse<MenuCategory>>('/menu/categories', {
      method: 'POST',
      body: JSON.stringify({ name, sortOrder }),
    });
    if (!response.data) {
      throw new Error('Failed to create category');
    }
    return response.data;
  }

  async createMenuItem(data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    isAvailable?: boolean;
    imageUrl?: string;
  }): Promise<MenuItem> {
    const response = await this.request<ApiResponse<MenuItem>>('/menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to create menu item');
    }
    return response.data;
  }

  async getWalletBalance(): Promise<WalletBalance> {
    const response = await this.request<ApiResponse<WalletBalance>>('/wallet/balance');
    if (!response.data) {
      return { availableBalance: 0, pendingBalance: 0, totalBalance: 0 };
    }
    return response.data;
  }

  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<{ transactions: Transaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    const response = await this.request<ApiResponse<Transaction[]>>(`/wallet/transactions${query ? `?${query}` : ''}`);
    return {
      transactions: response.data || [],
      pagination: (response as any)?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  async getPayouts(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ payouts: Payout[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    const response = await this.request<ApiResponse<Payout[]>>(`/payouts${query ? `?${query}` : ''}`);
    return {
      payouts: response.data || [],
      pagination: (response as any)?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  async createPayout(amount: number): Promise<Payout> {
    const response = await this.request<ApiResponse<Payout>>('/payouts', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (!response.data) {
      throw new Error('Failed to create payout');
    }
    return response.data;
  }

  async createBranch(name: string, address?: string): Promise<Branch> {
    const response = await this.request<ApiResponse<Branch>>('/restaurant/branches', {
      method: 'POST',
      body: JSON.stringify({ name, address }),
    });
    if (!response.data) throw new Error('Failed to create branch');
    return response.data;
  }

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const response = await this.request<ApiResponse<Branch>>(`/restaurant/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.data) throw new Error('Failed to update branch');
    return response.data;
  }

  async deleteBranch(id: string): Promise<void> {
    await this.request(`/restaurant/branches/${id}`, { method: 'DELETE' });
  }

  async addUser(data: { name: string; email: string; password: string; role: string }): Promise<any> {
    const response = await this.request<ApiResponse<any>>('/restaurant/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }
}

export const api = new ApiClient();
