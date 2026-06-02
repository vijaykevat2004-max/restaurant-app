import crypto from 'crypto';
import { supabaseAdmin } from './supabase-admin.js';
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

        await supabaseAdmin
          .from('Order')
          .update({ paymentStatus: 'FAILED' })
          .eq('paymentId', payment.id);

        return { success: true, message: 'Payment failure noted' };
      }

      default:
        return { success: true, message: `Event ${event} acknowledged` };
    }
  }

  private static async processPaymentFromWebhook(orderId: string, paymentId: string) {
    const { data: existing } = await supabaseAdmin
      .from('Order')
      .select('id')
      .eq('paymentId', paymentId)
      .single();

    if (existing) return;

    const { data: foundOrder } = await supabaseAdmin
      .from('Order')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!foundOrder) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const total = Number(foundOrder.total);

    const { data: wallet } = await supabaseAdmin
      .from('Wallet')
      .select('*')
      .eq('restaurantId', foundOrder.restaurantId)
      .single();

    if (wallet) {
      await supabaseAdmin
        .from('Wallet')
        .update({ availableBalance: Number(wallet.availableBalance) + total })
        .eq('id', wallet.id);

      await supabaseAdmin.from('Ledger').insert({
        walletId: wallet.id,
        restaurantId: foundOrder.restaurantId,
        type: 'CREDIT',
        amount: total,
        reference: paymentId,
        description: `Order #${foundOrder.orderNumber} payment`,
      });
    }

    await supabaseAdmin
      .from('Order')
      .update({
        paymentStatus: 'COMPLETED',
        paymentId,
        status: 'CONFIRMED',
      })
      .eq('id', orderId);
  }
}
