import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { WalletService } from './wallet.service.js';
import { OrderService } from './order.service.js';
import { config } from '../config/index.js';

interface RazorpayPaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export class PaymentService {
  static generateOrderId(amount: number, receipt: string): string {
    return `order_${Date.now()}_${receipt}`;
  }

  static async verifyPayment(data: RazorpayPaymentData): Promise<boolean> {
    if (!config.razorpay.keySecret) {
      console.warn('Razorpay secret not configured, skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest('hex');

    return expectedSignature === data.razorpay_signature;
  }

  static async processPayment(orderId: string, restaurantId: string, paymentId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.paymentStatus === 'COMPLETED') {
      throw new Error('Payment already processed');
    }

    const total = parseFloat(String(order.total));

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'COMPLETED',
          paymentId,
          status: 'CONFIRMED',
        },
      });

      const wallet = await tx.wallet.findUnique({
        where: { restaurantId },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: { increment: total },
          },
        });

        await tx.ledger.create({
          data: {
            walletId: wallet.id,
            restaurantId,
            type: 'CREDIT',
            amount: total,
            reference: paymentId,
            description: `Order #${order.orderNumber} payment`,
            metadata: JSON.stringify({ orderId, orderNumber: order.orderNumber }),
          },
        });
      }
    });

    const updatedOrder = await OrderService.getOrder(orderId, restaurantId);

    return updatedOrder;
  }

  static async handleWebhook(
    event: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
    switch (event) {
      case 'payment.captured': {
        const payment = payload as {
          id: string;
          order_id: string;
          amount: number;
          notes?: Record<string, string>;
        };

        const orderIdFromNotes = payment.notes?.orderId;

        if (orderIdFromNotes) {
          await this.processPaymentFromWebhook(orderIdFromNotes, payment.id);
        }

        return { success: true, message: 'Payment captured processed' };
      }

      case 'payment.failed': {
        const payment = payload as { id: string };

        await prisma.order.updateMany({
          where: { paymentId: payment.id },
          data: { paymentStatus: 'FAILED' },
        });

        return { success: true, message: 'Payment failure noted' };
      }

      default:
        return { success: true, message: `Event ${event} acknowledged` };
    }
  }

  private static async processPaymentFromWebhook(orderId: string, paymentId: string) {
    const order = await prisma.order.findFirst({
      where: { paymentId },
    });

    if (order) {
      return;
    }

    const foundOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!foundOrder) {
      throw new Error(`Order not found: ${orderId}`);
    }

    await this.processPayment(orderId, foundOrder.restaurantId, paymentId);
  }
}
