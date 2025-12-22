import { z } from 'zod';

/**
 * Validation schema for creating a comment
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),
  postId: z.string().cuid('Invalid post ID'),
});

/**
 * Validation schema for approving a comment (admin only)
 */
export const approveCommentSchema = z.object({
  id: z.string().cuid('Invalid comment ID'),
});

/**
 * Validation schema for rejecting a comment (admin only)
 */
export const rejectCommentSchema = z.object({
  id: z.string().cuid('Invalid comment ID'),
});

/**
 * Validation schema for getting comments with filters
 */
export const getCommentsSchema = z.object({
  postId: z.string().cuid().optional(),
  status: z.enum(['PENDING', 'APPROVED']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Type exports for use in components and actions
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ApproveCommentInput = z.infer<typeof approveCommentSchema>;
export type RejectCommentInput = z.infer<typeof rejectCommentSchema>;
export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
