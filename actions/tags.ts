'use server';

import { db } from '@/lib/db';
import { checkAuthor } from '@/lib/auth';
import { createTagSchema, createTagsSchema, type CreateTagInput } from '@/lib/validations/tag';
import { generateSlug } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

/**
 * Get all tags (public)
 */
export async function getTags() {
  const tags = await db.tag.findMany({
    include: {
      _count: {
        select: {
          posts: {
            where: {
              post: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return { data: tags };
}

/**
 * Get a single tag by slug (public)
 */
export async function getTagBySlug(slug: string) {
  const tag = await db.tag.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          posts: {
            where: {
              post: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
    },
  });

  if (!tag) {
    return { error: { _form: ['Tag not found'] } };
  }

  return { data: tag };
}

/**
 * Create or get an existing tag
 * Tags are normalized (lowercase, trimmed)
 */
export async function createOrGetTag(input: CreateTagInput) {
  // Verify user is authenticated author
  await checkAuthor();

  // Validate input
  const validatedData = createTagSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { name } = validatedData.data;
  const normalizedName = name.toLowerCase().trim();
  const slug = generateSlug(normalizedName);

  // Try to find existing tag
  let tag = await db.tag.findUnique({
    where: { name: normalizedName },
  });

  // Create if doesn't exist
  if (!tag) {
    tag = await db.tag.create({
      data: {
        name: normalizedName,
        slug,
      },
    });
  }

  revalidatePath('/');

  return { data: tag };
}

/**
 * Create or get multiple tags at once
 */
export async function createOrGetTags(input: { names: string[] }) {
  // Verify user is authenticated author
  await checkAuthor();

  // Validate input
  const validatedData = createTagsSchema.safeParse(input);
  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  const { names } = validatedData.data;

  // Normalize all tag names
  const normalizedNames = [...new Set(names.map((n) => n.toLowerCase().trim()))];

  // Find existing tags
  const existingTags = await db.tag.findMany({
    where: {
      name: { in: normalizedNames },
    },
  });

  const existingNames = new Set(existingTags.map((t) => t.name));

  // Create new tags
  const newTagNames = normalizedNames.filter((n) => !existingNames.has(n));

  if (newTagNames.length > 0) {
    await db.tag.createMany({
      data: newTagNames.map((name) => ({
        name,
        slug: generateSlug(name),
      })),
      skipDuplicates: true,
    });
  }

  // Get all tags (existing + newly created)
  const allTags = await db.tag.findMany({
    where: {
      name: { in: normalizedNames },
    },
  });

  revalidatePath('/');

  return { data: allTags };
}

/**
 * Search tags by name (for autocomplete)
 */
export async function searchTags(query: string) {
  if (!query || query.length < 1) {
    return { data: [] };
  }

  const normalizedQuery = query.toLowerCase().trim();

  const tags = await db.tag.findMany({
    where: {
      name: { contains: normalizedQuery },
    },
    take: 10,
    orderBy: { name: 'asc' },
  });

  return { data: tags };
}
