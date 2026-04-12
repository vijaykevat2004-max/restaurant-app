import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireOwnerOrManager, requireOwner } from '../middleware/index.js';
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

    const { data: restaurant } = await supabaseAdmin
      .from('Restaurant')
      .select('*')
      .eq('id', req.user.restaurantId)
      .single();

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.patch('/', requireOwnerOrManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: restaurant, error } = await supabaseAdmin
      .from('Restaurant')
      .update(req.body)
      .eq('id', req.user.restaurantId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: restaurant });
  } catch (error: any) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/branches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: branches } = await supabaseAdmin
      .from('Branch')
      .select('*')
      .eq('restaurantId', req.user.restaurantId);

    res.json({ success: true, data: branches || [] });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/branches', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { name, address } = req.body;

    const { data: branch, error } = await supabaseAdmin
      .from('Branch')
      .insert({ name, address, restaurantId: req.user.restaurantId })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: branch });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.patch('/branches/:id', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: branch, error } = await supabaseAdmin
      .from('Branch')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('restaurantId', req.user.restaurantId)
      .select()
      .single();

    if (error) throw error;
    if (!branch) {
      res.status(404).json({ success: false, error: 'Branch not found' });
      return;
    }

    res.json({ success: true, data: branch });
  } catch (error: any) {
    console.error('Error updating branch:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.delete('/branches/:id', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('Branch')
      .delete()
      .eq('id', req.params.id)
      .eq('restaurantId', req.user.restaurantId);

    if (error) throw error;

    res.json({ success: true, message: 'Branch deleted' });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/users', requireOwnerOrManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: users } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('restaurantId', req.user.restaurantId);

    res.json({ success: true, data: users || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/users', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { email, password, name, role, branchId } = req.body;
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .insert({
        email,
        passwordHash,
        name,
        role,
        branchId,
        restaurantId: req.user.restaurantId,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.delete('/users/:id', requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('User')
      .delete()
      .eq('id', req.params.id)
      .eq('restaurantId', req.user.restaurantId);

    if (error) throw error;

    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
