'use server';

import { db } from '@/lib/db';
import { checkAdmin } from '@/lib/auth';

/**
 * Get dashboard statistics for admin overview
 * Counts total posts, comments, and pending approvals
 */
export async function getDashboardStats() {
  // Verify user is admin
  await checkAdmin();

  // Get all counts in parallel
  const [totalPosts, publishedPosts, draftPosts, totalComments, pendingComments, approvedComments] =
    await Promise.all([
      db.post.count(),
      db.post.count({ where: { status: 'PUBLISHED' } }),
      db.post.count({ where: { status: 'DRAFT' } }),
      db.comment.count(),
      db.comment.count({ where: { status: 'PENDING' } }),
      db.comment.count({ where: { status: 'APPROVED' } }),
    ]);

  return {
    data: {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalComments,
      pendingComments,
      approvedComments,
    },
  };
}
