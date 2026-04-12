import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireOwnerOrManager } from '../middleware/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../services/supabase-admin.js';

const router = Router();

router.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { data: restaurant, error } = await supabaseAdmin
      .from('Restaurant')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    const { data: categories } = await supabaseAdmin
      .from('MenuCategory')
      .select('*, items:MenuItem(*)')
      .eq('restaurantId', restaurant.id)
      .order('sortOrder', { ascending: true });

    const menu = (categories || []).map((category: any) => ({
      ...category,
      items: (category.items || []).map((item: any) => ({
        ...item,
        price: parseFloat(String(item.price)),
      })),
    }));

    res.json({
      success: true,
      data: menu,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        upiId: restaurant.upiId,
        upiName: restaurant.upiName,
        paymentMode: restaurant.paymentMode,
        paytmMid: restaurant.paytmMid,
      },
    });
  } catch (error) {
    console.error('Error fetching public menu:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/public/orders', async (req: Request, res: Response) => {
  try {
    const { items, customerName, tableNumber, slug } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'No items in order' });
      return;
    }

    if (!customerName?.trim()) {
      res.status(400).json({ success: false, error: 'Customer name is required' });
      return;
    }

    const { data: restaurant } = await supabaseAdmin
      .from('Restaurant')
      .select('*, branches:Branch(*)')
      .eq('slug', slug)
      .single();

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
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
      return { menuItemId: menuItem.id, name: menuItem.name, quantity: cartItem.quantity, price: Number(menuItem.price), subtotal };
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
        branchId: restaurant.branches?.[0]?.id || null,
        restaurantId: restaurant.id,
        customerName: customerName.trim(),
        tableNumber: tableNumber?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        restaurantId: order.restaurantId,
      },
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: categories } = await supabaseAdmin
      .from('MenuCategory')
      .select('*, items:MenuItem(*)')
      .eq('restaurantId', req.user.restaurantId)
      .order('sortOrder', { ascending: true });

    res.json({ success: true, data: categories || [] });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/categories', requireOwnerOrManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { name, sortOrder } = req.body;

    const { data: category, error } = await supabaseAdmin
      .from('MenuCategory')
      .insert({ name, restaurantId: req.user.restaurantId, sortOrder: sortOrder || 0 })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.patch('/categories/:id', requireOwnerOrManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { name, sortOrder } = req.body;

    const { data: category, error } = await supabaseAdmin
      .from('MenuCategory')
      .update({ name, sortOrder })
      .eq('id', req.params.id)
      .eq('restaurantId', req.user.restaurantId)
      .select()
      .single();

    if (error) throw error;
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.delete('/categories/:id', requireOwnerOrManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('MenuCategory')
      .delete()
      .eq('id', req.params.id)
      .eq('restaurantId', req.user.restaurantId);

    if (error) throw error;

    res.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.post('/items', requireOwnerOrManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { categoryId, name, description, price, imageUrl, isAvailable = true } = req.body;

    const { data: item, error } = await supabaseAdmin
      .from('MenuItem')
      .insert({
        categoryId,
        name,
        description,
        price,
        imageUrl,
        isAvailable,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.patch('/items/:id', requireOwnerOrManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: item, error } = await supabaseAdmin
      .from('MenuItem')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!item) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.delete('/items/:id', requireOwnerOrManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { error } = await supabaseAdmin.from('MenuItem').delete().eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
