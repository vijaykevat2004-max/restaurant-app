import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  restaurantId: string;
  branchId?: string | null;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type LedgerType = 'CREDIT' | 'DEBIT' | 'FEE' | 'PAYOUT';
export type Role = 'OWNER' | 'MANAGER' | 'STAFF';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: { name: string; price: number }[];
  notes?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
