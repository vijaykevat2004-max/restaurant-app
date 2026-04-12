import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireOwner } from '../middleware/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../services/supabase-admin.js';

const router = Router();

const createPayoutSchema = z.object({
  amount: z.number().positive().min(100),
});

router.use(authenticate);
router.use(requireOwner);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseAdmin
      .from('Payout')
      .select('*', { count: 'exact' })
      .eq('restaurantId', req.user.restaurantId)
      .order('createdAt', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payouts, error, count } = await query.range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      payouts: payouts || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const body = createPayoutSchema.parse(req.body);

    const { data: wallet } = await supabaseAdmin
      .from('Wallet')
      .select('*')
      .eq('restaurantId', req.user.restaurantId)
      .single();

    if (!wallet || Number(wallet.availableBalance) < body.amount) {
      res.status(400).json({ success: false, error: 'Insufficient balance' });
      return;
    }

    const { data: payout, error } = await supabaseAdmin
      .from('Payout')
      .insert({
        restaurantId: req.user.restaurantId,
        amount: body.amount,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        ...payout,
        amount: Number(payout.amount),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    console.error('Error creating payout:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
