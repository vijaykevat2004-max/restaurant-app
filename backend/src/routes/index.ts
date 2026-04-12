import { Router } from 'express';
import authRoutes from './auth.routes.js';
import orderRoutes from './order.routes.js';
import walletRoutes from './wallet.routes.js';
import payoutRoutes from './payout.routes.js';
import menuRoutes from './menu.routes.js';
import restaurantRoutes from './restaurant.routes.js';
import webhookRoutes from './webhook.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/wallet', walletRoutes);
router.use('/payouts', payoutRoutes);
router.use('/menu', menuRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/payments', paymentRoutes);

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'API Routes',
    routes: ['auth', 'orders', 'wallet', 'payouts', 'menu', 'restaurant', 'webhooks', 'payments'],
  });
});

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ServeFlow API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
