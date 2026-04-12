const SUPABASE_URL = 'https://ghgilnuwkbiqmdhzzznq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZ2lsbnV3a2JpcW1kaHp6em5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg5MDA3OCwiZXhwIjoyMDkxNDY2MDc4fQ.p6c9Ut9Or37IY14H-eIHc6_-ouSBAbutkW4zBoZuA1g';

async function supabaseRequest(table, endpoint, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`API Error:`, data);
    throw new Error(data.message || 'API error');
  }
  return data;
}

const demoItems = [
  {
    category: 'Starters',
    sortOrder: 0,
    items: [
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese marinated in spices', price: 249, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400' },
      { name: 'Crispy Corn', description: 'Golden fried corn kernels with spicy seasoning', price: 179, imageUrl: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?w=400' },
      { name: 'Hara Bhara Kebab', description: 'Spinach and green pea patties', price: 199, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400' },
    ]
  },
  {
    category: 'Main Course',
    sortOrder: 1,
    items: [
      { name: 'Butter Chicken', description: 'Creamy tomato curry with tender chicken', price: 349, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82a2b2f19?w=400' },
      { name: 'Dal Makhani', description: 'Slow-cooked black lentils in butter and cream', price: 229, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400' },
      { name: 'Biryani Hyderabadi', description: 'Fragrant rice with aromatic spices and raita', price: 399, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
      { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato gravy', price: 279, imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400' },
    ]
  },
  {
    category: 'Breads',
    sortOrder: 2,
    items: [
      { name: 'Butter Naan', description: 'Soft leavened bread brushed with butter', price: 59, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400' },
      { name: 'Garlic Roti', description: 'Whole wheat flatbread with garlic', price: 49, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },
      { name: 'Cheese Kulcha', description: 'Stuffed bread with melted cheese', price: 89, imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400' },
    ]
  },
  {
    category: 'Beverages',
    sortOrder: 3,
    items: [
      { name: 'Mango Lassi', description: 'Chilled yogurt drink with fresh mango', price: 99, imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400' },
      { name: 'Masala Chai', description: 'Traditional spiced Indian tea', price: 39, imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400' },
      { name: 'Fresh Lime Soda', description: 'Refreshing lime with soda water', price: 69, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400' },
    ]
  },
  {
    category: 'Desserts',
    sortOrder: 4,
    items: [
      { name: 'Gulab Jamun', description: 'Sweet milk dumplings in sugar syrup', price: 99, imageUrl: 'https://images.unsplash.com/photo-1666190077635-a0f767dda78b?w=400' },
      { name: 'Rasmalai', description: 'Soft cheese patties in sweet saffron milk', price: 129, imageUrl: 'https://images.unsplash.com/photo-1571006682359-07895345efc2?w=400' },
      { name: 'Ice Cream Sundae', description: 'Vanilla ice cream with chocolate sauce', price: 149, imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
    ]
  }
];

async function seed() {
  console.log('Starting seed...\n');

  const restaurants = await supabaseRequest('Restaurant', 'Restaurant?select=id&limit=1');
  if (!restaurants || restaurants.length === 0) {
    console.log('No restaurant found. Please create one first.');
    return;
  }
  const restaurantId = restaurants[0].id;
  console.log('Restaurant ID:', restaurantId);

  // Clear existing menu items and categories
  console.log('\nClearing existing menu...');
  await supabaseRequest('MenuItem', 'MenuItem?id=gt.0', 'DELETE');
  await supabaseRequest('MenuCategory', 'MenuCategory?id=gt.0', 'DELETE');

  // Create categories and items
  for (const cat of demoItems) {
    console.log(`\nCreating category: ${cat.category}`);
    
    const catResult = await supabaseRequest('MenuCategory', 'MenuCategory', 'POST', {
      name: cat.category,
      restaurantId: restaurantId,
      sortOrder: cat.sortOrder
    });
    
    const categoryId = catResult[0]?.id || catResult.id;
    console.log(`  Category ID: ${categoryId}`);

    for (const item of cat.items) {
      await supabaseRequest('MenuItem', 'MenuItem', 'POST', {
        categoryId: categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: true
      });
      console.log(`  ✓ ${item.name} (₹${item.price})`);
    }
  }

  console.log('\n========================================');
  console.log('✅ Seed completed successfully!');
  console.log('========================================');
  console.log(`Categories: ${demoItems.length}`);
  console.log(`Items: ${demoItems.reduce((sum, cat) => sum + cat.items.length, 0)}`);
}

seed().catch(console.error);
