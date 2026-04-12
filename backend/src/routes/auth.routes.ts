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

const registerSchema = z.object({
  restaurantName: z.string().min(1),
  restaurantAddress: z.string().optional(),
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  console.log('=== REGISTER REQUEST ===');
  try {
    const body = registerSchema.parse(req.body);
    console.log('Registration for:', body.ownerEmail);

    const bcrypt = require('bcrypt');

    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', body.ownerEmail)
      .single();

    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    const slug = body.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const restaurantId = `rest-${Date.now()}`;

    const { error: restaurantError } = await supabaseAdmin.from('Restaurant').insert({
      id: restaurantId,
      name: body.restaurantName,
      slug,
    });

    if (restaurantError) {
      console.error('Restaurant insert error:', restaurantError);
      res.status(500).json({ success: false, error: 'Failed to create restaurant: ' + restaurantError.message });
      return;
    }

    const branchId = `branch-${Date.now()}`;
    const { error: branchError } = await supabaseAdmin.from('Branch').insert({
      id: branchId,
      name: 'Main Branch',
      restaurantId,
      address: body.restaurantAddress || null,
    });

    if (branchError) {
      console.error('Branch insert error:', branchError);
      res.status(500).json({ success: false, error: 'Failed to create branch: ' + branchError.message });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const userId = `user-${Date.now()}`;

    const { error: userError } = await supabaseAdmin.from('User').insert({
      id: userId,
      email: body.ownerEmail,
      name: body.ownerName,
      passwordHash,
      role: 'OWNER',
      restaurantId,
      branchId,
    });

    if (userError) {
      console.error('User insert error:', userError);
      res.status(500).json({ success: false, error: 'Failed to create user: ' + userError.message });
      return;
    }

    console.log('Registration success for:', body.ownerEmail);

    res.json({
      success: true,
      data: { message: 'Restaurant registered successfully', restaurantId, userId },
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
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
