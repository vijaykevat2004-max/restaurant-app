import pg from 'pg';

const { Client } = pg;

const supabaseUrl = 'https://ghgilnuwkbiqmdhzzznq.supabase.co';
const dbPassword = 'mnbvcxzlkjhgfdsa0987654321)(*&^%$#@!';

const demoItems = [
  {
    category: 'Starters',
    items: [
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese marinated in spices', price: 249, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400' },
      { name: 'Crispy Corn', description: 'Golden fried corn kernels with spicy seasoning', price: 179, image: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?w=400' },
      { name: 'Hara Bhara Kebab', description: 'Spinach and green pea patties', price: 199, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400' },
    ]
  },
  {
    category: 'Main Course',
    items: [
      { name: 'Butter Chicken', description: 'Creamy tomato curry with tender chicken', price: 349, image: 'https://images.unsplash.com/photo-1603894584373-5ac82a2b2f19?w=400' },
      { name: 'Dal Makhani', description: 'Slow-cooked black lentils in butter and cream', price: 229, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400' },
      { name: 'Biryani Hyderabadi', description: 'Fragrant rice with aromatic spices and raita', price: 399, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
      { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato gravy', price: 279, image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400' },
    ]
  },
  {
    category: 'Breads',
    items: [
      { name: 'Butter Naan', description: 'Soft leavened bread brushed with butter', price: 59, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400' },
      { name: 'Garlic Roti', description: 'Whole wheat flatbread with garlic', price: 49, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },
      { name: 'Cheese Kulcha', description: 'Stuffed bread with melted cheese', price: 89, image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400' },
    ]
  },
  {
    category: 'Beverages',
    items: [
      { name: 'Mango Lassi', description: 'Chilled yogurt drink with fresh mango', price: 99, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400' },
      { name: 'Masala Chai', description: 'Traditional spiced Indian tea', price: 39, image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400' },
      { name: 'Fresh Lime Soda', description: 'Refreshing lime with soda water', price: 69, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400' },
    ]
  },
  {
    category: 'Desserts',
    items: [
      { name: 'Gulab Jamun', description: 'Sweet milk dumplings in sugar syrup', price: 99, image: 'https://images.unsplash.com/photo-1666190077635-a0f767dda78b?w=400' },
      { name: 'Rasmalai', description: 'Soft cheese patties in sweet saffron milk', price: 129, image: 'https://images.unsplash.com/photo-1571006682359-07895345efc2?w=400' },
      { name: 'Ice Cream Sundae', description: 'Vanilla ice cream with chocolate sauce', price: 149, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
    ]
  }
];

async function seed() {
  const client = new Client({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get restaurant ID
    const restRes = await client.query('SELECT id FROM restaurants LIMIT 1');
    if (restRes.rows.length === 0) {
      console.log('No restaurant found. Please create a restaurant first.');
      return;
    }
    const restaurantId = restRes.rows[0].id;
    console.log('Restaurant ID:', restaurantId);

    // Create categories and items
    for (const cat of demoItems) {
      // Create category
      const catRes = await client.query(
        'INSERT INTO menu_categories (restaurant_id, name, display_order, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT DO NOTHING RETURNING id',
        [restaurantId, cat.category, demoItems.indexOf(cat)]
      );
      
      if (catRes.rows.length === 0) {
        const existing = await client.query(
          'SELECT id FROM menu_categories WHERE restaurant_id = $1 AND name = $2',
          [restaurantId, cat.category]
        );
        if (existing.rows.length > 0) {
          console.log(`Category "${cat.category}" already exists, skipping`);
          continue;
        }
      }
      
      const categoryId = catRes.rows[0]?.id;
      if (!categoryId) continue;
      
      console.log(`Created category: ${cat.category} (${categoryId})`);

      // Add items to category
      for (const item of cat.items) {
        await client.query(
          `INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [categoryId, item.name, item.description, item.price, item.image]
        );
        console.log(`  - Added: ${item.name} (₹${item.price})`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await client.end();
  }
}

seed();
