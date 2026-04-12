import type { Order, OrderItem } from '../types';

export function parseOrderItems(items: string | OrderItem[] | null | undefined): OrderItem[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseOrder(order: any): Order {
  return {
    ...order,
    items: parseOrderItems(order.items),
  };
}

export function parseOrders(orders: any[]): Order[] {
  return orders.map(parseOrder);
}
