import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getAllPosts } from '@/actions/posts';
import { DataTable, Column } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Edit, ExternalLink, FileText } from 'lucide-react';
import { DeletePostButton } from '@/components/posts/delete-post-button';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    comments: number;
  };
}

function PostsTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="rounded-md border">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function PostsTable() {
  const result = await getAllPosts({ limit: 100 });

  if (result.error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load posts</p>
      </div>
    );
  }

  const { posts: rawPosts } = result.data!;
  
  // Serialize dates to strings
  const posts = rawPosts.map(post => ({
    ...post,
    createdAt: post.createdAt.toString(),
    updatedAt: post.updatedAt.toString(),
  }));

  const columns: Column<Post>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (post) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium line-clamp-1">{post.title}</span>
          <span className="text-xs text-muted-foreground">
            by {post.author?.name || post.author?.email || 'Unknown'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (post) => (
        <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
          {post.status}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (post) => (
        <Badge variant="outline">{post.category?.name || 'None'}</Badge>
      ),
    },
    {
      key: 'comments',
      header: 'Comments',
      render: (post) => (
        <span className="text-muted-foreground">{post._count?.comments || 0}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (post) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (post) => (
        <div className="flex items-center gap-2">
          {post.status === 'PUBLISHED' && (
            <Link href={`/posts/${post.slug}`} target="_blank">
              <Button variant="ghost" size="icon" title="View post">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/posts/${post.id}/edit`}>
            <Button variant="ghost" size="icon" title="Edit post">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <DeletePostButton postId={post.id} postTitle={post.title} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={posts}
      columns={columns}
      searchKey="title"
      searchPlaceholder="Search posts by title..."
      pageSize={10}
      emptyMessage="No posts found"
    />
  );
}

export default async function AdminPostsPage() {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Check admin role
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;

  if (role !== 'Admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Manage All Posts</h1>
            <p className="text-muted-foreground">
              View and manage all posts across the platform
            </p>
          </div>
        </div>
        <Link href="/dashboard/posts/new">
          <Button>Create New Post</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PostsTableSkeleton />}>
            <PostsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
