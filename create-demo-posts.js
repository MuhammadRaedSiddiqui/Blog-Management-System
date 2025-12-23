require('dotenv').config();
const mysql = require('mysql2/promise');

// Parse the DATABASE_URL
const parseDatabaseUrl = (url) => {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/;
  const match = url.match(regex);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    user: decodeURIComponent(match[1]),
    password: decodeURIComponent(match[2]),
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
};

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL || '');

// Demo posts data
const demoPosts = [
  {
    title: 'Understanding Database Normalization: A Complete Guide to 3NF',
    excerpt: 'Learn the fundamentals of database normalization and Third Normal Form (3NF) with practical examples and real-world applications.',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop',
    categoryName: 'Education',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Understanding Database Normalization: A Complete Guide to 3NF' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Database normalization is a fundamental concept in database design that organizes data to reduce redundancy and improve data integrity. In this comprehensive guide, we explore the three normal forms and how they apply to real-world scenarios.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'What is Database Normalization?' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Database normalization is the process of structuring a relational database in accordance with a series of so-called normal forms in order to reduce data redundancy and improve data integrity.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The Three Normal Forms' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'First Normal Form (1NF)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'A table is in 1NF when:' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Each column contains atomic (indivisible) values' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Each column contains values of the same type' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Each column has a unique name' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The order of data storage does not matter' }] }] }
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Second Normal Form (2NF)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'A table is in 2NF when it is in 1NF and all non-key attributes are fully dependent on the primary key.' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Third Normal Form (3NF)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'A table is in 3NF when it is in 2NF and there are no transitive dependencies.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Benefits of Normalization' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Reduced Data Redundancy:' }, { type: 'text', text: ' Information is stored only once' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Improved Data Integrity:' }, { type: 'text', text: ' Consistent data across the database' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Easier Maintenance:' }, { type: 'text', text: ' Updates only need to be made in one place' }] }] }
        ]}
      ]
    }),
    tags: ['database', 'normalization', '3nf', 'education', 'data-design']
  },
  {
    title: 'The Future of Web Development in 2025',
    excerpt: 'Explore the emerging trends and technologies shaping web development, from AI-powered tools to new frameworks and best practices.',
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=630&fit=crop',
    categoryName: 'Technology',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'The Future of Web Development in 2025' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The web development landscape is evolving at breakneck speed. As we move through 2025, several key trends are reshaping how we build, deploy, and maintain web applications.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'AI-Powered Development Tools' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Artificial Intelligence is becoming an integral part of the development workflow:' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Generating boilerplate code automatically' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Suggesting optimal architectures based on requirements' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Identifying bugs before they reach production' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The Rise of Edge Computing' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Edge computing is transforming server-side rendering with faster page loads and reduced latency.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'WebAssembly Maturation' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'WebAssembly (Wasm) is reaching mainstream adoption for high-performance web applications.' }] }
      ]
    }),
    tags: ['web-development', '2025', 'trends', 'technology', 'ai']
  },
  {
    title: 'Mastering TypeScript: Tips for Better Code Quality',
    excerpt: 'Essential TypeScript best practices and advanced techniques to write cleaner, more maintainable, and type-safe code.',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=630&fit=crop',
    categoryName: 'Technology',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Mastering TypeScript: Tips for Better Code Quality' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'TypeScript has become the de facto standard for building scalable JavaScript applications. Here are essential tips to elevate your TypeScript game.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Leverage Strict Mode' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Always enable strict mode in your tsconfig.json. This enforces no implicit any, strict null checks, and strict function types.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. Use Union and Intersection Types' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Union types allow values to be one of several types, while intersection types combine multiple types into one.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '3. Master Utility Types' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'TypeScript provides powerful utility types like Partial, Required, Pick, and Omit to transform types efficiently.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '4. Use Type Guards for Runtime Checks' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Type guards help narrow types at runtime, making your code safer when dealing with unknown types.' }] }
      ]
    }),
    tags: ['typescript', 'javascript', 'code-quality', 'best-practices']
  },
  {
    title: 'Building Scalable Applications with Next.js',
    excerpt: 'Learn how to architect and build high-performance, scalable web applications using Next.js 14+ and modern React patterns.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
    categoryName: 'Technology',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Building Scalable Applications with Next.js' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Next.js has revolutionized how we build React applications with powerful features like Server Components, Route Handlers, and automatic optimization.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Understanding the App Router' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Next.js 14+ introduced the App Router with React Server Components for better performance and simplified data fetching.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Data Fetching Strategies' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Server Components:' }, { type: 'text', text: ' Fetch data on the server' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Server Actions:' }, { type: 'text', text: ' Handle form submissions' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Route Handlers:' }, { type: 'text', text: ' Create API endpoints' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Caching for Performance' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Next.js provides Static Rendering, Dynamic Rendering, and automatic Data Cache for optimal performance.' }] }
      ]
    }),
    tags: ['nextjs', 'react', 'scalability', 'performance', 'web-development']
  }
];

async function createDemoPosts() {
  let connection;
  try {
    console.log('🚀 Creating demo blog posts...\n');

    // Create connection
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      ssl: { rejectUnauthorized: true }
    });

    console.log('✅ Connected to database');

    // Get or create demo user
    let [users] = await connection.query("SELECT * FROM users WHERE clerkId = 'demo-author'");
    let userId;
    if (users.length === 0) {
      await connection.query(
        "INSERT INTO users (id, clerkId, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
        ['demo-user-1', 'demo-author', 'demo@example.com', 'Demo Author']
      );
      userId = 'demo-user-1';
      console.log('👤 Created demo user: Demo Author');
    } else {
      userId = users[0].id;
      console.log('👤 Using existing demo user:', users[0].name);
    }

    // Get categories
    let [categories] = await connection.query('SELECT * FROM categories');
    console.log('📁 Available categories:', categories.length > 0 ? categories.map(c => c.name) : 'None found');

    // Create default categories if they don't exist
    const defaultCategories = [
      { name: 'Technology', slug: 'technology', description: 'Tech news, tutorials, and insights' },
      { name: 'Education', slug: 'education', description: 'Educational content and learning resources' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle and personal development' }
    ];

    for (const cat of defaultCategories) {
      const [existing] = await connection.query("SELECT id FROM categories WHERE slug = ?", [cat.slug]);
      if (existing.length === 0) {
        const catId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await connection.query(
          "INSERT INTO categories (id, name, slug, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
          [catId, cat.name, cat.slug, cat.description]
        );
        console.log(`✅ Created category: ${cat.name}`);
        categories.push({ id: catId, name: cat.name });
      }
    }

    console.log('📁 Categories ready:', categories.map(c => c.name));

    // Create posts
    for (const postData of demoPosts) {
      const category = categories.find(c => c.name === postData.categoryName);

      if (!category) {
        console.log(`❌ Category "${postData.categoryName}" not found. Skipping.`);
        continue;
      }

      // Generate unique slug
      let baseSlug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let slug = baseSlug;
      let counter = 1;

      let [existing] = await connection.query("SELECT id FROM posts WHERE slug = ?", [slug]);
      while (existing.length > 0) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        [existing] = await connection.query("SELECT id FROM posts WHERE slug = ?", [slug]);
      }

      // Create the post
      const postId = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await connection.query(
        `INSERT INTO posts (id, title, slug, content, excerpt, coverImage, status, authorId, categoryId, createdAt, updatedAt, publishedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, NOW(), NOW(), NOW())`,
        [postId, postData.title, slug, postData.content, postData.excerpt, postData.coverImage, userId, category.id]
      );

      console.log(`✅ Created post: "${postData.title}"`);
      console.log(`   📝 Slug: ${slug}`);
      console.log(`   📂 Category: ${postData.categoryName}`);
      console.log(`   🏷️  Tags: ${postData.tags.join(', ')}`);
      console.log('');

      // Create or connect tags
      for (const tagName of postData.tags) {
        const normalizedName = tagName.toLowerCase().trim();
        const tagSlug = normalizedName.replace(/[^a-z0-9]+/g, '-');

        // Check if tag exists
        let [tags] = await connection.query("SELECT id FROM tags WHERE slug = ?", [tagSlug]);
        let tagId;
        if (tags.length === 0) {
          tagId = `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await connection.query(
            "INSERT INTO tags (id, name, slug, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
            [tagId, normalizedName, tagSlug]
          );
        } else {
          tagId = tags[0].id;
        }

        // Create post-tag relationship
        const postTagId = `posttag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await connection.query(
          "INSERT INTO post_tags (id, postId, tagId, createdAt) VALUES (?, ?, ?, NOW())",
          [postTagId, postId, tagId]
        );
      }
    }

    console.log('✨ All demo posts created successfully!\n');

    // Display summary
    const [postCount] = await connection.query("SELECT COUNT(*) as count FROM posts WHERE status = 'PUBLISHED'");
    console.log('📊 Summary:');
    console.log(`   Published posts: ${postCount[0].count}`);

  } catch (error) {
    console.error('❌ Error creating demo posts:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDemoPosts();
