import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/index.js';
import crypto from 'crypto';

const router = Router();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

router.post('/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!RAZORPAY_WEBHOOK_SECRET || !signature) {
      res.status(400).json({ success: false, error: 'Missing webhook secret or signature' });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Invalid webhook signature');
      res.status(400).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body);
    const event = body.event;
    const payload = body.payload;

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
