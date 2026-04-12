import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'owner@demo.com' },
  });
  console.log(JSON.stringify(user, null, 2));
  
  const restaurant = await prisma.restaurant.findFirst();
  console.log('Restaurant:', JSON.stringify(restaurant, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());