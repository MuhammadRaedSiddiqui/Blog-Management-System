import { z } from 'zod';

// Status enum matching Prisma schema
export const postStatusSchema = z.enum(['DRAFT', 'PUBLISHED']);

// Schema for creating a new post
export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  content: z.any(), // TipTap JSON content
  excerpt: z
    .string()
    .max(300, 'Excerpt must be 300 characters or less')
    .optional()
    .nullable(),
  coverImage: z
    .string()
    .url('Invalid cover image URL')
    .max(500, 'Cover image URL too long')
    .optional()
    .nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  tagIds: z.array(z.string()).optional().default([]),
  status: postStatusSchema.default('DRAFT'),
});

// Schema for updating an existing post
export const updatePostSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  content: z.any().optional(), // TipTap JSON content
  excerpt: z
    .string()
    .max(300, 'Excerpt must be 300 characters or less')
    .optional()
    .nullable(),
  coverImage: z
    .string()
    .url('Invalid cover image URL')
    .max(500, 'Cover image URL too long')
    .optional()
    .nullable(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  tagIds: z.array(z.string()).optional(),
  status: postStatusSchema.optional(),
});

// Schema for deleting a post
export const deletePostSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
});

// Schema for getting posts with filters
export const getPostsSchema = z.object({
  status: postStatusSchema.optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  authorId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(10),
});

// Schema for searching posts
export const searchPostsSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(10),
});

// Type exports
export type PostStatus = z.infer<typeof postStatusSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type DeletePostInput = z.infer<typeof deletePostSchema>;
export type GetPostsInput = z.infer<typeof getPostsSchema>;
export type SearchPostsInput = z.infer<typeof searchPostsSchema>;
