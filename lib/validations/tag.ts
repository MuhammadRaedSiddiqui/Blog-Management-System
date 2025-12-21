import { z } from 'zod';

// Schema for creating or getting a tag
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(30, 'Tag name must be 30 characters or less')
    .transform((val) => val.toLowerCase().trim()), // Normalize tag name
});

// Schema for bulk tag creation/association
export const createTagsSchema = z.object({
  names: z
    .array(
      z
        .string()
        .min(1, 'Tag name is required')
        .max(30, 'Tag name must be 30 characters or less')
    )
    .max(10, 'Maximum 10 tags allowed'),
});

// Type exports
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateTagsInput = z.infer<typeof createTagsSchema>;
