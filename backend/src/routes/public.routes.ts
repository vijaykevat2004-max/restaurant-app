import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase-admin.js';

const router = Router();

router.get('/restaurants', async (_req: Request, res: Response) => {
  try {
    const { data: restaurants } = await supabaseAdmin
      .from('Restaurant')
      .select('id, name, slug');

    res.json({ success: true, data: restaurants || [] });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
