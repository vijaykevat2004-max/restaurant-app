import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { supabaseAdmin } from '../services/supabase-admin.js';

const router = Router();

// Get all restaurants (public)
router.get('/restaurants', async (req: Request, res: Response) => {
  try {
    const { data: restaurants } = await supabaseAdmin
      .from('Restaurant')
      .select('id, name, slug, address');

    res.json({ success: true, data: restaurants || [] });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        menuCategories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    const menu = restaurant.menuCategories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        price: parseFloat(String(item.price)),
        modifiers: item.modifiers ? JSON.parse(item.modifiers) : null,
      })),
    }));

    res.json({
      success: true,
      data: menu,
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
      },
    });
  } catch (error) {
    console.error('Error fetching public menu:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
