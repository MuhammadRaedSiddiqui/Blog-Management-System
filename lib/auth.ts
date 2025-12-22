import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from './db';

export type UserRole = 'Author' | 'Admin';

/**
 * Get the current user's role from Clerk metadata
 * Returns 'Author' as default if no role is set (all authenticated users can write)
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await currentUser();
  if (!user) return null;

  const role = user.publicMetadata?.role as UserRole | undefined;
  // Default to 'Author' if no role is set - all authenticated users can create posts
  return role || 'Author';
}

/**
 * Require authentication and optionally specific roles
 * Throws an error if user is not authenticated or doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = await currentUser();
  const role = user?.publicMetadata?.role as UserRole | undefined;

  // Default to 'Author' if no role is set
  const effectiveRole: UserRole = role || 'Author';

  if (!allowedRoles.includes(effectiveRole)) {
    throw new Error('Forbidden');
  }

  return { userId, role: effectiveRole };
}

/**
 * Check if current user is an Author or Admin
 * All authenticated users are treated as Authors by default
 */
export async function checkAuthor() {
  return requireRole(['Author', 'Admin']);
}

/**
 * Check if current user is an Admin
 * Only users with explicit Admin role can access
 */
export async function checkAdmin() {
  return requireRole(['Admin']);
}

/**
 * Get or create a user in our database synced from Clerk
 */
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error('User not found');
  }

  // Try to find existing user
  let user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  // Create user if doesn't exist
  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
          : null,
      },
    });
  }

  return user;
}

/**
 * Get the current user from our database
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  return user;
}

/**
 * Check if user owns a specific post
 */
export async function checkPostOwnership(postId: string) {
  const { userId, role } = await checkAuthor();

  // Admins can access any post
  if (role === 'Admin') {
    return { userId, role, isOwner: true };
  }

  // Get user from database
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not found');
  }

  // Check if post belongs to user
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  if (post.authorId !== user.id) {
    throw new Error('Forbidden');
  }

  return { userId, role, isOwner: true };
}
