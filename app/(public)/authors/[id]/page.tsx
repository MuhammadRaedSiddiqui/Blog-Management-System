import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAuthorById, getAuthorPosts } from '@/actions/users';
import { PostList } from '@/components/posts/post-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Calendar, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuthorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

function AuthorPostsSkeleton() {
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

async function AuthorPosts({
  authorId,
  page,
}: {
  authorId: string;
  page: number;
}) {
  const result = await getAuthorPosts(authorId, page, 9);

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
      emptyMessage="This author hasn't published any posts yet."
    />
  );
}

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10);

  // Get author info
  const authorResult = await getAuthorById(id);

  if (authorResult.error) {
    notFound();
  }

  const author = authorResult.data!;

  return (
    <div className="space-y-8">
      {/* Author Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {author.name || 'Anonymous Author'}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDistanceToNow(new Date(author.createdAt), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {author._count.posts} published post{author._count.posts !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        {author.bio && (
          <CardContent>
            <p className="text-muted-foreground">{author.bio}</p>
          </CardContent>
        )}
      </Card>

      {/* Author's Posts */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Published Posts</h2>
        <Suspense fallback={<AuthorPostsSkeleton />}>
          <AuthorPosts authorId={id} page={page} />
        </Suspense>
      </section>
    </div>
  );
}
