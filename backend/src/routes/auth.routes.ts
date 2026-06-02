import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/index.js';
import { authenticate } from '../middleware/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../services/supabase-admin.js';
import { config } from '../config/index.js';

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

    let slug = body.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug already exists and add suffix if needed
    const { data: existingSlug } = await supabaseAdmin
      .from('Restaurant')
      .select('slug')
      .eq('slug', slug)
      .single();
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
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

    // Auto-create demo menu for new restaurant
    try {
      const demoMenu = [
        { name: 'Starters', items: [
          { name: 'Paneer Tikka', price: 249, description: 'Grilled cottage cheese marinated in spices', isVeg: true },
          { name: 'Crispy Corn', price: 179, description: 'Golden fried corn kernels with spicy seasoning', isVeg: true },
          { name: 'Hara Bhara Kebab', price: 199, description: 'Spinach and green pea patties', isVeg: true },
        ]},
        { name: 'Main Course', items: [
          { name: 'Butter Chicken', price: 349, description: 'Creamy tomato curry with tender chicken', isVeg: false },
          { name: 'Dal Makhani', price: 229, description: 'Slow-cooked black lentils in butter and cream', isVeg: true },
          { name: 'Biryani Hyderabadi', price: 399, description: 'Fragrant rice with aromatic spices', isVeg: true },
          { name: 'Paneer Butter Masala', price: 279, description: 'Cottage cheese in rich tomato gravy', isVeg: true },
        ]},
        { name: 'Breads', items: [
          { name: 'Butter Naan', price: 59, description: 'Soft leavened bread brushed with butter', isVeg: true },
          { name: 'Garlic Roti', price: 49, description: 'Whole wheat flatbread with garlic', isVeg: true },
          { name: 'Cheese Kulcha', price: 89, description: 'Stuffed bread with melted cheese', isVeg: true },
        ]},
        { name: 'Beverages', items: [
          { name: 'Mango Lassi', price: 99, description: 'Chilled yogurt drink with fresh mango', isVeg: true },
          { name: 'Masala Chai', price: 39, description: 'Traditional spiced Indian tea', isVeg: true },
          { name: 'Fresh Lime Soda', price: 69, description: 'Refreshing lime with soda water', isVeg: true },
        ]},
        { name: 'Desserts', items: [
          { name: 'Gulab Jamun', price: 99, description: 'Sweet milk dumplings in sugar syrup', isVeg: true },
          { name: 'Rasmalai', price: 129, description: 'Soft cheese patties in sweet saffron milk', isVeg: true },
          { name: 'Ice Cream Sundae', price: 149, description: 'Vanilla ice cream with chocolate sauce', isVeg: true },
        ]},
      ];

      for (let i = 0; i < demoMenu.length; i++) {
        const categoryId = `cat-${Date.now()}-${i}`;
        await supabaseAdmin.from('MenuCategory').insert({
          id: categoryId,
          name: demoMenu[i].name,
          sortOrder: i,
          restaurantId,
        });

        for (const item of demoMenu[i].items) {
          await supabaseAdmin.from('MenuItem').insert({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            categoryId,
            name: item.name,
            description: item.description,
            price: item.price,
            isAvailable: true,
            isVeg: item.isVeg,
            restaurantId,
          });
        }
      }
      console.log('Demo menu created for:', restaurantId);
    } catch (menuError) {
      console.error('Menu creation error:', menuError);
    }

    console.log('Registration success for:', body.ownerEmail);

    res.json({
      success: true,
      data: { message: 'Restaurant registered successfully', restaurantId, userId, slug },
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
      config.jwt.secret,
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
