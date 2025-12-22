'use server';

import { db } from '@/lib/db';
import { checkAdmin, getOrCreateUser } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import {
  createCommentSchema,
  approveCommentSchema,
  rejectCommentSchema,
  getCommentsSchema,
  type CreateCommentInput,
  type GetCommentsInput,
} from '@/lib/validations/comment';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

/**
 * Serialize data to plain objects for React server/client boundary
 */
function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Create a new comment on a published post
 * Comments start in PENDING status and require admin approval
 */
export async function createComment(input: CreateCommentInput) {
  // Verify user is authenticated
  const { userId } = await auth();
  if (!userId) {
    return { error: { _form: ['You must be logged in to comment'] } };
  }

  // Validate input
  const validatedData = createCommentSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { content, postId } = validatedData.data;

  // Get or create user in database
  const user = await getOrCreateUser();

  // Verify post exists and is published
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, status: true, slug: true },
  });

  if (!post) {
    return { error: { postId: ['Post not found'] } };
  }

  if (post.status !== 'PUBLISHED') {
    return { error: { _form: ['Comments can only be added to published posts'] } };
  }

  // Create comment with PENDING status
  const comment = await db.comment.create({
    data: {
      content,
      status: 'PENDING',
      userId: user.id,
      postId,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  revalidatePath(`/posts/${post.slug}`);
  revalidatePath('/admin/comments');

  return { data: serialize(comment) };
}

/**
 * Approve a comment (admin only)
 * Changes status from PENDING to APPROVED, making it visible on the post
 */
export async function approveComment(input: { id: string }) {
  // Verify user is admin
  await checkAdmin();

  // Validate input
  const validatedData = approveCommentSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { id } = validatedData.data;

  // Find comment
  const existingComment = await db.comment.findUnique({
    where: { id },
    include: {
      post: {
        select: { slug: true },
      },
    },
  });

  if (!existingComment) {
    return { error: { _form: ['Comment not found'] } };
  }

  // Update status to APPROVED
  const comment = await db.comment.update({
    where: { id },
    data: { status: 'APPROVED' },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      post: {
        select: { id: true, slug: true, title: true },
      },
    },
  });

  revalidatePath(`/posts/${existingComment.post.slug}`);
  revalidatePath('/admin/comments');

  return { data: serialize(comment) };
}

/**
 * Reject a comment (admin only)
 * Deletes the comment from the database per FR-034
 */
export async function rejectComment(input: { id: string }) {
  // Verify user is admin
  await checkAdmin();

  // Validate input
  const validatedData = rejectCommentSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { id } = validatedData.data;

  // Find comment
  const existingComment = await db.comment.findUnique({
    where: { id },
    include: {
      post: {
        select: { slug: true },
      },
    },
  });

  if (!existingComment) {
    return { error: { _form: ['Comment not found'] } };
  }

  // Delete comment (rejection per FR-034)
  await db.comment.delete({
    where: { id },
  });

  revalidatePath(`/posts/${existingComment.post.slug}`);
  revalidatePath('/admin/comments');

  return { data: { success: true } };
}

/**
 * Get comments with optional filters
 * For public use (APPROVED only) and admin use (all statuses)
 */
export async function getComments(input: Partial<GetCommentsInput> = {}) {
  const validatedData = getCommentsSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { postId, status, page, limit } = validatedData.data;

  // Build where clause
  const where: Prisma.CommentWhereInput = {
    ...(postId && { postId }),
    ...(status && { status }),
  };

  // Get total count
  const total = await db.comment.count({ where });

  // Get comments with pagination
  const comments = await db.comment.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      post: {
        select: { id: true, slug: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: serialize({
      comments,
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
 * Get approved comments for a specific post (public)
 */
export async function getApprovedComments(postId: string, page: number = 1, limit: number = 20) {
  return getComments({
    postId,
    status: 'APPROVED',
    page,
    limit,
  });
}

/**
 * Get all pending comments (admin only)
 */
export async function getPendingComments(page: number = 1, limit: number = 20) {
  await checkAdmin();

  return getComments({
    status: 'PENDING',
    page,
    limit,
  });
}
