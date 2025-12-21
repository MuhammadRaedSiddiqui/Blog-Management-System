import { z } from 'zod';

// Schema for creating a new category
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be 50 characters or less'),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .optional()
    .nullable(),
});

// Schema for updating an existing category
export const updateCategorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be 50 characters or less')
    .optional(),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .optional()
    .nullable(),
});

// Schema for deleting a category
export const deleteCategorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
});

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
