import { Suspense } from 'react';
import { getPublishedPosts } from '@/actions/posts';
import { PostList } from '@/components/posts/post-list';
import { Skeleton } from '@/components/ui/skeleton';

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

function PostListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
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

async function PostListContent({ page }: { page: number }) {
  const result = await getPublishedPosts({ page, limit: 9 });

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
      emptyMessage="No posts published yet. Check back soon!"
    />
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to InsightInk
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover insightful articles on technology, lifestyle, and education.
          Written by passionate authors for curious minds.
        </p>
      </section>

      {/* Latest Posts */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
        <Suspense fallback={<PostListSkeleton />}>
          <PostListContent page={page} />
        </Suspense>
      </section>
    </div>
  );
}
