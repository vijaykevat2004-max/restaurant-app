import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/index.js';
import { authenticate } from '../middleware/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../services/supabase-admin.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  console.log('=== LOGIN REQUEST ===');
  try {
    const body = loginSchema.parse(req.body);
    console.log('Login attempt for:', body.email);
    
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('email', body.email)
      .single();

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    const isValid = await bcrypt.compare(body.password, user.passwordHash);

    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, restaurantId: user.restaurantId, branchId: user.branchId, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' }
    );

    console.log('Login success for:', body.email);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurantId,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/logout', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
