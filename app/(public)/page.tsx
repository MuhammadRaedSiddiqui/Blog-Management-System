import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts } from '@/actions/posts';
import { PostList } from '@/components/posts/post-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { PenLine, Sparkles, Users, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'InsightInk - Discover Insightful Articles',
  description:
    'Discover insightful articles on technology, lifestyle, and education. Written by passionate authors for curious minds.',
  openGraph: {
    title: 'InsightInk - Discover Insightful Articles',
    description:
      'Discover insightful articles on technology, lifestyle, and education. Written by passionate authors for curious minds.',
    type: 'website',
  },
};

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
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative px-6 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Share Your Ideas with the World
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Welcome to InsightInk
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover insightful articles on technology, lifestyle, and education.
            Written by passionate authors for curious minds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedIn>
              <Link href="/dashboard/posts/new">
                <Button size="lg" className="gap-2 text-base">
                  <PenLine className="h-5 w-5" />
                  Start Writing
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  <BookOpen className="h-5 w-5" />
                  View Dashboard
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="gap-2 text-base">
                  <PenLine className="h-5 w-5" />
                  Start Writing
                </Button>
              </SignInButton>
              <Link href="#latest-posts">
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  <BookOpen className="h-5 w-5" />
                  Explore Articles
                </Button>
              </Link>
            </SignedOut>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-primary/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                <Users className="h-5 w-5" />
                <span>100+</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Writers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                <BookOpen className="h-5 w-5" />
                <span>500+</span>
              </div>
              <p className="text-sm text-muted-foreground">Articles Published</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section id="latest-posts">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Latest Posts</h2>
          <Link href="/categories">
            <Button variant="ghost" size="sm">
              View All Categories
            </Button>
          </Link>
        </div>
        <Suspense fallback={<PostListSkeleton />}>
          <PostListContent page={page} />
        </Suspense>
      </section>
    </div>
  );
}
