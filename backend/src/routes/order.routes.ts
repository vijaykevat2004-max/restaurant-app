import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../services/supabase-admin.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { branchId, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseAdmin
      .from('Order')
      .select('*', { count: 'exact' })
      .eq('restaurantId', req.user.restaurantId);

    if (branchId) {
      query = query.eq('branchId', branchId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query
      .range(offset, offset + Number(limit) - 1)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: orders || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/active', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: orders } = await supabaseAdmin
      .from('Order')
      .select('*')
      .eq('restaurantId', req.user.restaurantId)
      .in('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'])
      .order('createdAt', { ascending: true });

    res.json({ success: true, data: orders || [] });
  } catch (error: any) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orders } = await supabaseAdmin
      .from('Order')
      .select('*')
      .eq('restaurantId', req.user.restaurantId)
      .gte('createdAt', today.toISOString());

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0;

    res.json({
      success: true,
      data: {
        todayOrders: totalOrders,
        todayRevenue: totalRevenue,
        pendingOrders: orders?.filter((o: any) => o.status === 'PENDING').length || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: order } = await supabaseAdmin
      .from('Order')
      .select('*')
      .eq('id', req.params.id)
      .eq('restaurantId', req.user.restaurantId)
      .single();

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { status } = req.body;

    const { data: order, error } = await supabaseAdmin
      .from('Order')
      .update({ status, updatedAt: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('restaurantId', req.user.restaurantId)
      .select()
      .single();

    if (error) throw error;
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('Order')
      .update({ status: 'CANCELLED' })
      .eq('id', req.params.id)
      .eq('restaurantId', req.user.restaurantId);

    if (error) throw error;

    res.json({ success: true, message: 'Order cancelled' });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
