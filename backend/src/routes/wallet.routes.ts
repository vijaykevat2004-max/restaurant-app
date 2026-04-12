import { Router, Response } from 'express';
import { authenticate } from '../middleware/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../services/supabase-admin.js';

const router = Router();

router.use(authenticate);

router.get('/balance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: wallet } = await supabaseAdmin
      .from('Wallet')
      .select('*')
      .eq('restaurantId', req.user.restaurantId)
      .single();

    if (!wallet) {
      res.json({
        success: true,
        data: { availableBalance: 0, pendingBalance: 0 },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        availableBalance: Number(wallet.availableBalance),
        pendingBalance: Number(wallet.pendingBalance),
      },
    });
  } catch (error: any) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/transactions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { page = 1, limit = 20, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseAdmin
      .from('Ledger')
      .select('*', { count: 'exact' })
      .eq('restaurantId', req.user.restaurantId)
      .order('createdAt', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error, count } = await query.range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      transactions: transactions || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
