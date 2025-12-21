import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
