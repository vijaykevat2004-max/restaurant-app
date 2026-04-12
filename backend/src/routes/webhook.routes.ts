import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/index.js';
import crypto from 'crypto';

const router = Router();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

router.post('/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (RAZORPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('Invalid webhook signature');
        res.status(400).json({ success: false, error: 'Invalid signature' });
        return;
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (!event || !payload) {
      res.status(400).json({ success: false, error: 'Invalid webhook payload' });
      return;
    }

    const result = await PaymentService.handleWebhook(event, payload);

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
