import Link from 'next/link';
import { getAuthorPosts } from '@/actions/posts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DeletePostButton } from './delete-post-button';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPostsPage() {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch posts
  let posts: any[] = [];
  let error: string | null = null;

  try {
    const result = await getAuthorPosts({ limit: 50 });

    if (result.error) {
      error = 'Failed to load posts. Please try again.';
      console.error('[Dashboard] Error loading posts:', result.error);
    } else {
      posts = result.data?.posts || [];
    }
  } catch (err) {
    error = 'An unexpected error occurred.';
    console.error('[Dashboard] Unexpected error:', err);
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Posts</h1>
            <p className="text-muted-foreground">Manage your blog posts</p>
          </div>
          <Link href="/dashboard/posts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive mb-2">{error}</p>
              <p className="text-sm text-muted-foreground">
                Make sure your database is running and properly configured.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Posts</h1>
          <p className="text-muted-foreground">Manage your blog posts</p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{posts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {posts.filter((p) => p.status === 'PUBLISHED').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {posts.filter((p) => p.status === 'DRAFT').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t created any posts yet.
              </p>
              <Link href="/dashboard/posts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <span className="line-clamp-1">{post.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{post.category.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          post.status === 'PUBLISHED' ? 'default' : 'outline'
                        }
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{post._count.comments}</TableCell>
                    <TableCell>{formatDate(post.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === 'PUBLISHED' && (
                          <Link href={`/posts/${post.slug}`}>
                            <Button variant="ghost" size="icon" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/dashboard/posts/${post.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DeletePostButton postId={post.id} postTitle={post.title} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
