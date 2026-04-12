import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'owner@demo.com' },
      include: {
        restaurant: true,
        branch: true,
      },
    });
    console.log('User found:', JSON.stringify(user, null, 2));
    
    if (user && user.restaurant) {
      console.log('Restaurant name:', user.restaurant.name);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());