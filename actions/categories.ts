'use server';

import { db } from '@/lib/db';
import { checkAdmin } from '@/lib/auth';
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/lib/validations/category';
import { generateSlug, generateUniqueSlug } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

/**
 * Serialize data to plain objects for React server/client boundary
 */
function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Get all categories (public)
 */
export async function getCategories() {
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: {
          posts: {
            where: { status: 'PUBLISHED' },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Serialize data to avoid React client/server boundary issues
  return { data: JSON.parse(JSON.stringify(categories)) };
}

/**
 * Get a single category by slug (public)
 */
export async function getCategoryBySlug(slug: string) {
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          posts: {
            where: { status: 'PUBLISHED' },
          },
        },
      },
    },
  });

  if (!category) {
    return { error: { _form: ['Category not found'] } };
  }

  return { data: serialize(category) };
}

/**
 * Create a new category (admin only)
 */
export async function createCategory(input: CreateCategoryInput) {
  // Verify user is admin
  await checkAdmin();

  // Validate input
  const validatedData = createCategorySchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { name, description } = validatedData.data;

  // Check if category with same name exists
  const existingCategory = await db.category.findUnique({
    where: { name },
  });
  if (existingCategory) {
    return { error: { name: ['A category with this name already exists'] } };
  }

  // Generate unique slug
  const slug = await generateUniqueSlug(name, async (s) => {
    const existing = await db.category.findUnique({ where: { slug: s } });
    return existing !== null;
  });

  // Create category
  const category = await db.category.create({
    data: {
      name,
      slug,
      description,
    },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/');

  return { data: serialize(category) };
}

/**
 * Update an existing category (admin only)
 */
export async function updateCategory(input: UpdateCategoryInput) {
  // Verify user is admin
  await checkAdmin();

  // Validate input
  const validatedData = updateCategorySchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { id, name, description } = validatedData.data;

  // Check if category exists
  const existingCategory = await db.category.findUnique({
    where: { id },
  });
  if (!existingCategory) {
    return { error: { _form: ['Category not found'] } };
  }

  // Check if new name conflicts with another category
  if (name && name !== existingCategory.name) {
    const conflictingCategory = await db.category.findUnique({
      where: { name },
    });
    if (conflictingCategory) {
      return { error: { name: ['A category with this name already exists'] } };
    }
  }

  // Generate new slug if name changed
  let slug = existingCategory.slug;
  if (name && name !== existingCategory.name) {
    slug = await generateUniqueSlug(name, async (s) => {
      const existing = await db.category.findFirst({
        where: { slug: s, id: { not: id } },
      });
      return existing !== null;
    });
  }

  // Update category
  const category = await db.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(name && { slug }),
      ...(description !== undefined && { description }),
    },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/');
  revalidatePath(`/categories/${category.slug}`);

  return { data: serialize(category) };
}

/**
 * Delete a category (admin only)
 * Will fail if posts exist in this category (ON DELETE RESTRICT)
 */
export async function deleteCategory(input: { id: string }) {
  // Verify user is admin
  await checkAdmin();

  // Validate input
  const validatedData = deleteCategorySchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { id } = validatedData.data;

  // Check if category exists
  const existingCategory = await db.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  if (!existingCategory) {
    return { error: { _form: ['Category not found'] } };
  }

  // Check if category has posts (enforce ON DELETE RESTRICT per FR-024)
  if (existingCategory._count.posts > 0) {
    return {
      error: {
        _form: [
          `Cannot delete category with ${existingCategory._count.posts} post(s). Please reassign posts to another category first.`,
        ],
      },
    };
  }

  // Delete category
  await db.category.delete({
    where: { id },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/');

  return { data: { success: true } };
}
