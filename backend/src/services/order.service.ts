import { prisma } from '../config/database.js';
import { OrderItem, OrderStatus, PaymentStatus } from '../types/index.js';

const TAX_RATE = 0.08;

export class OrderService {
  static async getNextOrderNumber(restaurantId: string, branchId: string): Promise<number> {
    const lastOrder = await prisma.order.findFirst({
      where: { restaurantId, branchId },
      orderBy: { orderNumber: 'desc' },
    });

    return (lastOrder?.orderNumber || 0) + 1;
  }

  static async createOrder(
    restaurantId: string,
    branchId: string,
    items: OrderItem[]
  ) {
    const orderNumber = await this.getNextOrderNumber(restaurantId, branchId);

    const subtotal = items.reduce((sum, item) => {
      const itemPrice = item.price * item.quantity;
      const modifiersPrice = (item.modifiers || []).reduce((m, mod) => m + mod.price, 0);
      return sum + itemPrice + modifiersPrice * item.quantity;
    }, 0);

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId,
        branchId,
        items: JSON.stringify(items),
        subtotal,
        tax,
        total,
        status: 'NEW',
        paymentStatus: 'PENDING',
      },
    });

    return {
      ...order,
      items: JSON.parse(order.items),
      subtotal: parseFloat(String(order.subtotal)),
      tax: parseFloat(String(order.tax)),
      total: parseFloat(String(order.total)),
    };
  }

  static async getOrder(orderId: string, restaurantId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: { branch: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      ...order,
      items: JSON.parse(order.items),
      subtotal: parseFloat(String(order.subtotal)),
      tax: parseFloat(String(order.tax)),
      total: parseFloat(String(order.total)),
    };
  }

  static async getOrders(
    restaurantId: string,
    options: {
      branchId?: string;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { branchId, status, paymentStatus, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { restaurantId };

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { branch: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        ...order,
        items: JSON.parse(order.items),
        subtotal: parseFloat(String(order.subtotal)),
        tax: parseFloat(String(order.tax)),
        total: parseFloat(String(order.total)),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getActiveOrders(restaurantId: string, branchId?: string) {
    const where: Record<string, unknown> = {
      restaurantId,
      status: { in: ['NEW', 'CONFIRMED', 'PREPARING', 'READY'] },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: { branch: true },
      orderBy: { createdAt: 'asc' },
    });

    return orders.map((order) => ({
      ...order,
      items: JSON.parse(order.items),
      subtotal: parseFloat(String(order.subtotal)),
      tax: parseFloat(String(order.tax)),
      total: parseFloat(String(order.total)),
    }));
  }

  static async updateOrderStatus(
    orderId: string,
    restaurantId: string,
    status: OrderStatus
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return {
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items),
      subtotal: parseFloat(String(updatedOrder.subtotal)),
      tax: parseFloat(String(updatedOrder.tax)),
      total: parseFloat(String(updatedOrder.total)),
    };
  }

  static async updatePaymentStatus(
    orderId: string,
    restaurantId: string,
    paymentStatus: PaymentStatus,
    paymentId?: string
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const data: Record<string, unknown> = { paymentStatus };

    if (paymentId) {
      data.paymentId = paymentId;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data,
    });

    return {
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items),
      subtotal: parseFloat(String(updatedOrder.subtotal)),
      tax: parseFloat(String(updatedOrder.tax)),
      total: parseFloat(String(updatedOrder.total)),
    };
  }

  static async cancelOrder(orderId: string, restaurantId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new Error('Cannot cancel this order');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    return {
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items),
      subtotal: parseFloat(String(updatedOrder.subtotal)),
      tax: parseFloat(String(updatedOrder.tax)),
      total: parseFloat(String(updatedOrder.total)),
    };
  }

  static async getOrderStats(restaurantId: string, branchId?: string) {
    const where: Record<string, unknown> = { restaurantId };

    if (branchId) {
      where.branchId = branchId;
    }

    const [totalOrders, todayOrders, pendingOrders, completedToday] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.count({
        where: {
          ...where,
          status: { in: ['NEW', 'CONFIRMED', 'PREPARING'] },
        },
      }),
      prisma.order.count({
        where: {
          ...where,
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const revenueResult = await prisma.order.aggregate({
      where: {
        ...where,
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { total: true },
    });

    return {
      totalOrders,
      todayOrders,
      pendingOrders,
      completedToday,
      todayRevenue: revenueResult._sum.total || 0,
    };
  }
}
