import { Suspense } from 'react';
import { searchPosts } from '@/actions/posts';
import { PostList } from '@/components/posts/post-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
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

async function SearchResults({ query, page }: { query: string; page: number }) {
  const result = await searchPosts({ query, page, limit: 12 });

  if (result.error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load search results</p>
      </div>
    );
  }

  const { posts, pagination } = result.data!;

  return (
    <PostList
      posts={posts}
      pagination={pagination}
      emptyMessage={`No posts found for "${query}". Try different keywords.`}
    />
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query, page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10);

  // T070: Show prompt if no search query
  if (!query || !query.trim()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <Search className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Search Posts</h2>
              <p className="text-muted-foreground">
                Enter a keyword in the search bar above to find posts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <section>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Search Results
        </h1>
        <p className="text-muted-foreground">
          Showing results for: <span className="font-semibold">&quot;{query}&quot;</span>
        </p>
      </section>

      {/* Search Results */}
      <Suspense fallback={<PostListSkeleton />}>
        <SearchResults query={query} page={page} />
      </Suspense>
    </div>
  );
}
