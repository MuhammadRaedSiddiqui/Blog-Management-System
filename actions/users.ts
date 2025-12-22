'use server';

import { db } from '@/lib/db';
import { checkAdmin, getCurrentUser, getOrCreateUser } from '@/lib/auth';
import {
  updateProfileSchema,
  getUsersSchema,
  type UpdateProfileInput,
  type GetUsersInput,
} from '@/lib/validations/user';
import { revalidatePath } from 'next/cache';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Serialize data to plain objects for React server/client boundary
 */
function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Get all users (admin only)
 * T076: Returns user list with role from Clerk metadata
 */
export async function getUsers(input: Partial<GetUsersInput> = {}) {
  // Verify user is admin
  await checkAdmin();

  const validatedData = getUsersSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { page, limit, search } = validatedData.data;

  // Build where clause
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  // Get total count
  const total = await db.user.count({ where });

  // Get users with pagination
  const users = await db.user.findMany({
    where,
    include: {
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Fetch Clerk metadata for roles
  const client = await clerkClient();
  const usersWithRoles = await Promise.all(
    users.map(async (user) => {
      try {
        const clerkUser = await client.users.getUser(user.clerkId);
        const role = (clerkUser.publicMetadata?.role as string) || 'Author';
        return {
          ...user,
          role,
        };
      } catch {
        // If Clerk user not found, default to Author
        return {
          ...user,
          role: 'Author',
        };
      }
    })
  );

  return {
    data: serialize({
      users: usersWithRoles,
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
 * Get a single user by ID (admin only)
 */
export async function getUserById(id: string) {
  // Verify user is admin
  await checkAdmin();

  const user = await db.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
      posts: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return { error: { _form: ['User not found'] } };
  }

  // Get Clerk metadata for role
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(user.clerkId);
    const role = (clerkUser.publicMetadata?.role as string) || 'Author';

    return {
      data: serialize({
        ...user,
        role,
      }),
    };
  } catch {
    return {
      data: serialize({
        ...user,
        role: 'Author',
      }),
    };
  }
}

/**
 * Update current user's profile
 * T083: Updates User model for current user
 */
export async function updateProfile(input: UpdateProfileInput) {
  // Get current user
  const clerkUser = await getCurrentUser();
  if (!clerkUser) {
    return { error: { _form: ['You must be logged in'] } };
  }

  // Validate input
  const validatedData = updateProfileSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { name, bio } = validatedData.data;

  // Get or create user in database
  const user = await getOrCreateUser();

  // Update user
  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      name,
      bio,
    },
  });

  revalidatePath('/dashboard/profile');
  revalidatePath(`/authors/${user.id}`);

  return { data: serialize(updatedUser) };
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile() {
  const user = await getOrCreateUser();

  return { data: serialize(user) };
}

/**
 * Get public author profile by ID
 */
export async function getAuthorById(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          posts: {
            where: { status: 'PUBLISHED' },
          },
        },
      },
    },
  });

  if (!user) {
    return { error: { _form: ['Author not found'] } };
  }

  return { data: serialize(user) };
}

/**
 * Get author's published posts
 */
export async function getAuthorPosts(authorId: string, page = 1, limit = 10) {
  const where = {
    authorId,
    status: 'PUBLISHED' as const,
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
