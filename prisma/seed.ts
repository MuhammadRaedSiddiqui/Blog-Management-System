import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';

dotenv.config();

// Create Prisma adapter for MySQL/MariaDB
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'raed123-123',
  database: process.env.DATABASE_NAME || 'insightink',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  connectionLimit: 5,
});

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // Create default categories
  const categories = await prisma.category.createMany({
    data: [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles and tutorials'
      },
      {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Lifestyle and wellness'
      },
      {
        name: 'Education',
        slug: 'education',
        description: 'Educational content'
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${categories.count} categories`);

  // Verify categories were created
  const allCategories = await prisma.category.findMany();
  console.log('Categories in database:');
  allCategories.forEach((cat) => {
    console.log(`  - ${cat.name} (${cat.slug})`);
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
