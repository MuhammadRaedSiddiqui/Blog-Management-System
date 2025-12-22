import { Suspense } from 'react';
import { getPublishedPosts } from '@/actions/posts';
import { PostList } from '@/components/posts/post-list';
import { Skeleton } from '@/components/ui/skeleton';

interface PostsPageProps {
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

async function PostListContent({ page }: { page: number }) {
  const result = await getPublishedPosts({ page, limit: 12 });

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

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <section className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">All Posts</h1>
        <p className="text-muted-foreground">
          Browse all published articles from our community of writers.
        </p>
      </section>

      {/* Posts Grid */}
      <Suspense fallback={<PostListSkeleton />}>
        <PostListContent page={page} />
      </Suspense>
    </div>
  );
}
