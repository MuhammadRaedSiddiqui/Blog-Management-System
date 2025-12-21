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

  return { data: post };
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

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    return { error: { _form: ['User not found'] } };
  }

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

  return { data: post };
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

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    return { error: { _form: ['User not found'] } };
  }

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
    data: {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

/**
 * Get posts for author dashboard (own posts)
 */
export async function getAuthorPosts(input: Partial<GetPostsInput> = {}) {
  await checkAuthor();

  const user = await getCurrentUser();
  if (!user) {
    return { error: { _form: ['User not found'] } };
  }

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
    data: {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
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

  return { data: post };
}

/**
 * Get a single post by ID (for editing)
 */
export async function getPostById(id: string) {
  const { role } = await checkAuthor();
  const user = await getCurrentUser();

  if (!user) {
    return { error: { _form: ['User not found'] } };
  }

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

  return { data: post };
}

/**
 * Search posts by keyword
 */
export async function searchPosts(input: { query: string; page?: number; limit?: number }) {
  const validatedData = searchPostsSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { query, page, limit } = validatedData.data;

  // Sanitize search query to prevent SQL injection
  const sanitizedQuery = query.replace(/[^\w\s]/g, '').trim();
  if (!sanitizedQuery) {
    return { data: { posts: [], pagination: { page, limit, total: 0, totalPages: 0 } } };
  }

  // Use Prisma's built-in search (contains for now, can optimize with raw query later)
  const where: Prisma.PostWhereInput = {
    status: 'PUBLISHED',
    OR: [
      { title: { contains: sanitizedQuery } },
      // Note: For better search, implement MySQL FULLTEXT search with raw query
    ],
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
    },
    orderBy: { publishedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
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
    data: {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}
