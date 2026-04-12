import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../services/supabase-admin.js';

const router = Router();

router.post('/create-qr', async (req: Request, res: Response) => {
  try {
    const { restaurantId, amount, orderId, upiId } = req.body;

    if (!restaurantId || !amount || !orderId) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const { data: restaurant } = await supabaseAdmin
      .from('Restaurant')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    const targetUpiId = upiId || restaurant.upiId;

    if (!targetUpiId) {
      res.status(400).json({ success: false, error: 'UPI ID not configured' });
      return;
    }

    const paymentId = `PAY${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${targetUpiId}&pn=${encodeURIComponent(restaurant.upiName || restaurant.name)}&am=${amount}&cu=INR&tr=${paymentId}`)}`;

    res.json({
      success: true,
      data: {
        paymentId,
        qrCodeUrl,
        upiUrl: `upi://pay?pa=${targetUpiId}&pn=${encodeURIComponent(restaurant.upiName || restaurant.name)}&am=${amount}&cu=INR&tr=${paymentId}`,
        upiId: targetUpiId,
        amount,
        status: 'PENDING',
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { paymentId, orderId, restaurantId, status } = req.body;

    if (!paymentId || !orderId) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const { data: order } = await supabaseAdmin
      .from('Order')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (status === 'SUCCESS' || status === 'success' || status === 'VERIFIED') {
      await supabaseAdmin
        .from('Order')
        .update({
          paymentStatus: 'COMPLETED',
          paymentId,
          status: 'CONFIRMED',
        })
        .eq('id', orderId);

      const { data: wallet } = await supabaseAdmin
        .from('Wallet')
        .select('*')
        .eq('restaurantId', order.restaurantId)
        .single();

      if (wallet) {
        await supabaseAdmin
          .from('Wallet')
          .update({
            availableBalance: Number(wallet.availableBalance) + Number(order.total),
          })
          .eq('id', wallet.id);

        await supabaseAdmin.from('Ledger').insert({
          walletId: wallet.id,
          restaurantId: order.restaurantId,
          type: 'CREDIT',
          amount: order.total,
          reference: paymentId,
          description: `Order #${order.orderNumber} payment`,
        });
      }

      res.json({
        success: true,
        data: { status: 'VERIFIED', orderId, paymentId, message: 'Payment verified successfully' },
      });
    } else {
      res.json({
        success: true,
        data: { status: 'PENDING', message: 'Payment not yet completed' },
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

router.get('/upi-config/:restaurantId', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    const { data: restaurant } = await supabaseAdmin
      .from('Restaurant')
      .select('id, name, logo, upiId, upiName')
      .eq('id', restaurantId)
      .single();

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        hasUpi: !!restaurant.upiId,
        upiId: restaurant.upiId,
        upiName: restaurant.upiName,
        restaurantName: restaurant.name,
        logo: restaurant.logo,
      },
    });
  } catch (error) {
    console.error('Error fetching UPI config:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch UPI config' });
  }
});

export default router;
