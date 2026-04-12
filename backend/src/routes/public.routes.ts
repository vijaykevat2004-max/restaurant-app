import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';

const router = Router();

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
