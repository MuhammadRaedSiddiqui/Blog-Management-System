'use server';

import { db } from '@/lib/db';
import { checkAuthor, checkAdmin, getCurrentUser, getOrCreateUser } from '@/lib/auth';
import {
  createPostSchema,
  updatePostSchema,
  deletePostSchema,
  getPostsSchema,
  searchPostsSchema,
  type CreatePostInput,
  type UpdatePostInput,
  type GetPostsInput,
} from '@/lib/validations/post';
import { generateSlug, generateUniqueSlug } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

/**
 * Serialize data to plain objects for React server/client boundary
 */
function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Create a new blog post
 */
export async function createPost(input: CreatePostInput) {
  // Verify user is authenticated and has Author or Admin role
  await checkAuthor();

  // Validate input
  const validatedData = createPostSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { title, content, excerpt, coverImage, categoryId, tagIds, status } = validatedData.data;

  // Get or create user in database
  const user = await getOrCreateUser();

  // Verify category exists
  const category = await db.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return { error: { categoryId: ['Category not found'] } };
  }

  // Generate unique slug
  const slug = await generateUniqueSlug(title, async (s) => {
    const existing = await db.post.findUnique({ where: { slug: s } });
    return existing !== null;
  });

  // Determine publishedAt based on status
  const publishedAt = status === 'PUBLISHED' ? new Date() : null;

  // Create post
  const post = await db.post.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      status,
      publishedAt,
      authorId: user.id,
      categoryId,
      tags: {
        create: tagIds?.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })) || [],
      },
    },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
    },
  });

  revalidatePath('/');
  revalidatePath('/dashboard/posts');

  return { data: serialize(post) };
}

/**
 * Update an existing blog post
 */
export async function updatePost(input: UpdatePostInput) {
  // Verify user is authenticated
  const { role } = await checkAuthor();

  // Validate input
  const validatedData = updatePostSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { id, title, content, excerpt, coverImage, categoryId, tagIds, status } = validatedData.data;

  // Get or create user in database
  const user = await getOrCreateUser();

  // Get existing post
  const existingPost = await db.post.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!existingPost) {
    return { error: { _form: ['Post not found'] } };
  }

  // Check ownership (Admin can edit any post, Author only own posts)
  if (role !== 'Admin' && existingPost.authorId !== user.id) {
    return { error: { _form: ['You do not have permission to edit this post'] } };
  }

  // Verify category if provided
  if (categoryId) {
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return { error: { categoryId: ['Category not found'] } };
    }
  }

  // Generate new slug if title changed
  let slug = existingPost.slug;
  if (title && title !== existingPost.title) {
    slug = await generateUniqueSlug(title, async (s) => {
      const existing = await db.post.findFirst({
        where: { slug: s, id: { not: id } },
      });
      return existing !== null;
    });
  }

  // Determine publishedAt
  let publishedAt = existingPost.publishedAt;
  if (status === 'PUBLISHED' && existingPost.status === 'DRAFT') {
    publishedAt = new Date();
  }

  // Update post
  const updateData: Prisma.PostUpdateInput = {
    ...(title && { title }),
    ...(title && { slug }),
    ...(content !== undefined && { content }),
    ...(excerpt !== undefined && { excerpt }),
    ...(coverImage !== undefined && { coverImage }),
    ...(categoryId && { category: { connect: { id: categoryId } } }),
    ...(status && { status }),
    ...(status === 'PUBLISHED' && existingPost.status === 'DRAFT' && { publishedAt }),
  };

  // Update tags if provided
  if (tagIds !== undefined) {
    // Remove existing tags
    await db.postTag.deleteMany({
      where: { postId: id },
    });

    // Add new tags
    if (tagIds.length > 0) {
      await db.postTag.createMany({
        data: tagIds.map((tagId) => ({
          postId: id,
          tagId,
        })),
      });
    }
  }

  const post = await db.post.update({
    where: { id },
    data: updateData,
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
    },
  });

  revalidatePath('/');
  revalidatePath('/dashboard/posts');
  revalidatePath(`/posts/${post.slug}`);

  return { data: serialize(post) };
}

/**
 * Delete a blog post
 */
export async function deletePost(input: { id: string }) {
  // Verify user is authenticated
  const { role } = await checkAuthor();

  // Validate input
  const validatedData = deletePostSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { id } = validatedData.data;

  // Get or create user in database
  const user = await getOrCreateUser();

  // Get existing post
  const existingPost = await db.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    return { error: { _form: ['Post not found'] } };
  }

  // Check ownership (Admin can delete any post, Author only own posts)
  if (role !== 'Admin' && existingPost.authorId !== user.id) {
    return { error: { _form: ['You do not have permission to delete this post'] } };
  }

  // Delete post (cascade will handle tags and comments)
  await db.post.delete({
    where: { id },
  });

  revalidatePath('/');
  revalidatePath('/dashboard/posts');

  return { data: { success: true } };
}

/**
 * Get published posts with optional filters
 */
export async function getPublishedPosts(input: Partial<GetPostsInput> = {}) {
  const validatedData = getPostsSchema.safeParse({
    ...input,
    status: 'PUBLISHED',
  });

  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { categorySlug, tagSlug, page, limit } = validatedData.data;

  // Build where clause
  const where: Prisma.PostWhereInput = {
    status: 'PUBLISHED',
    ...(categorySlug && {
      category: { slug: categorySlug },
    }),
    ...(tagSlug && {
      tags: {
        some: {
          tag: { slug: tagSlug },
        },
      },
    }),
  };

  // Get total count
  const total = await db.post.count({ where });

  // Get posts with pagination
  const posts = await db.post.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      category: true,
      tags: {
        include: { tag: true },
      },
      _count: {
        select: { comments: { where: { status: 'APPROVED' } } },
      },
    },
    orderBy: { publishedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: serialize({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),
  };
}

/**
 * Get posts for author dashboard (own posts)
 */
export async function getAuthorPosts(input: Partial<GetPostsInput> = {}) {
  await checkAuthor();

  // Get or create user in database (syncs from Clerk on first access)
  const user = await getOrCreateUser();

  const validatedData = getPostsSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { status, page, limit } = validatedData.data;

  // Build where clause
  const where: Prisma.PostWhereInput = {
    authorId: user.id,
    ...(status && { status }),
  };

  // Get total count
  const total = await db.post.count({ where });

  // Get posts with pagination
  const posts = await db.post.findMany({
    where,
    include: {
      category: true,
      tags: { include: { tag: true } },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: serialize({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),
  };
}

/**
 * Get a single post by slug (public)
 */
export async function getPostBySlug(slug: string) {
  const post = await db.post.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      author: {
        select: { id: true, name: true, email: true, bio: true },
      },
      category: true,
      tags: { include: { tag: true } },
      comments: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!post) {
    return { error: { _form: ['Post not found'] } };
  }

  return { data: serialize(post) };
}

/**
 * Get a single post by ID (for editing)
 */
export async function getPostById(id: string) {
  const { role } = await checkAuthor();
  const user = await getOrCreateUser();

  const post = await db.post.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!post) {
    return { error: { _form: ['Post not found'] } };
  }

  // Check ownership (Admin can access any post, Author only own posts)
  if (role !== 'Admin' && post.authorId !== user.id) {
    return { error: { _form: ['You do not have permission to access this post'] } };
  }

  return { data: serialize(post) };
}

/**
 * Search posts by keyword with relevance ranking
 * T064, T068, T069: MySQL search with sanitization and title/content ranking
 */
export async function searchPosts(input: { query: string; page?: number; limit?: number }) {
  const validatedData = searchPostsSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { query, page, limit } = validatedData.data;

  // T068: Sanitize search query to prevent SQL injection per FR-050
  // Remove special characters, keep only alphanumeric and spaces
  const sanitizedQuery = query.replace(/[^\w\s]/g, '').trim();
  if (!sanitizedQuery) {
    return { data: serialize({ posts: [], pagination: { page, limit, total: 0, totalPages: 0 } }) };
  }

  // T069: Relevance ranking - title matches ranked higher than content matches
  // Search in title first, then excerpt, using case-insensitive matching
  const where: Prisma.PostWhereInput = {
    status: 'PUBLISHED',
    OR: [
      { title: { contains: sanitizedQuery } },
      { excerpt: { contains: sanitizedQuery } },
    ],
  };

  const total = await db.post.count({ where });

  // Get posts with relevance sorting
  // Title matches appear first, then excerpt matches
  const posts = await db.post.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      category: true,
      tags: { include: { tag: true } },
      _count: {
        select: { comments: { where: { status: 'APPROVED' } } },
      },
    },
    orderBy: [
      // Relevance ranking: prioritize title matches
      { publishedAt: 'desc' },
    ],
    skip: (page - 1) * limit,
    take: limit,
  });

  // T069: Client-side relevance ranking (title matches first)
  const rankedPosts = posts.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(sanitizedQuery.toLowerCase());
    const bTitle = b.title.toLowerCase().includes(sanitizedQuery.toLowerCase());

    if (aTitle && !bTitle) return -1;
    if (!aTitle && bTitle) return 1;
    return 0; // Keep original order (by publishedAt desc)
  });

  return {
    data: serialize({
      posts: rankedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),
  };
}

/**
 * Get all posts (admin only)
 */
export async function getAllPosts(input: Partial<GetPostsInput> = {}) {
  await checkAdmin();

  const validatedData = getPostsSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { status, page, limit } = validatedData.data;

  const where: Prisma.PostWhereInput = {
    ...(status && { status }),
  };

  const total = await db.post.count({ where });

  const posts = await db.post.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      category: true,
      tags: { include: { tag: true } },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: serialize({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),
  };
}
