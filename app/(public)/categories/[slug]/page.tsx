import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublishedPosts } from '@/actions/posts';
import { db } from '@/lib/db';
import { PostList } from '@/components/posts/post-list';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function PostListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

async function CategoryPostList({ slug, page }: { slug: string; page: number }) {
  const result = await getPublishedPosts({ categorySlug: slug, page, limit: 12 });

  if (result.error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load posts</p>
      </div>
    );
  }

  const { posts, pagination } = result.data!;

  return (
    <PostList
      posts={posts}
      pagination={pagination}
      emptyMessage="No posts found in this category yet."
    />
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10);

  // Get category info
  const category = await db.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <section className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
      </section>

      {/* Posts Grid */}
      <Suspense fallback={<PostListSkeleton />}>
        <CategoryPostList slug={slug} page={page} />
      </Suspense>
    </div>
  );
}
