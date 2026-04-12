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

    const parsedOrders = (orders || []).map((order: any) => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    }));

    res.json({
      success: true,
      data: parsedOrders,
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
    
    const parsedOrders = (orders || []).map((order: any) => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    }));

    res.json({ success: true, data: parsedOrders });
  } catch (error: any) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { items, branchId, customerName, tableNumber } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'No items provided' });
      return;
    }

    const menuItemIds = items.map((i: any) => i.menuItemId);
    const { data: menuItems } = await supabaseAdmin
      .from('MenuItem')
      .select('*')
      .in('id', menuItemIds);

    let total = 0;
    const orderItems = items.map((cartItem: { menuItemId: string; quantity: number }) => {
      const menuItem = menuItems?.find((i: any) => i.id === cartItem.menuItemId);
      if (!menuItem) throw new Error(`Item not found: ${cartItem.menuItemId}`);
      const subtotal = Number(menuItem.price) * cartItem.quantity;
      total += subtotal;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: cartItem.quantity,
        price: Number(menuItem.price),
        subtotal,
      };
    });

    const orderNumber = Math.floor(Math.random() * 9000) + 1000;

    const { data: order, error } = await supabaseAdmin
      .from('Order')
      .insert({
        orderNumber,
        total,
        subtotal: total,
        tax: 0,
        items: JSON.stringify(orderItems),
        status: 'PENDING',
        branchId: branchId || null,
        restaurantId: req.user.restaurantId,
        customerName: customerName || 'Counter Order',
        tableNumber: tableNumber || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        ...order,
        items: orderItems,
      },
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
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
        pendingOrders: orders?.filter((o: any) => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length || 0,
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

    const parsedOrder = {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    };

    res.json({ success: true, data: parsedOrder });
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
