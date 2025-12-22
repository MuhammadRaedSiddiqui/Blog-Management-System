import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getDashboardStats } from '@/actions/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
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

  // Get dashboard statistics
  const statsResult = await getDashboardStats();
  const stats = statsResult.data || {
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalComments: 0,
    pendingComments: 0,
    approvedComments: 0,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} published, {stats.draftPosts} drafts
            </p>
          </CardContent>
        </Card>

        {/* Total Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedComments} approved
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingComments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting moderation
            </p>
          </CardContent>
        </Card>

        {/* Approved Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Comments
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedComments}</div>
            <p className="text-xs text-muted-foreground">
              Visible to public
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a
              href="/admin/comments"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <h3 className="font-semibold mb-1">Moderate Comments</h3>
              <p className="text-sm text-muted-foreground">
                Review and approve pending comments ({stats.pendingComments} pending)
              </p>
            </a>
            <a
              href="/admin/posts"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <h3 className="font-semibold mb-1">Manage Posts</h3>
              <p className="text-sm text-muted-foreground">
                View and manage all blog posts
              </p>
            </a>
            <a
              href="/admin/categories"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <h3 className="font-semibold mb-1">Manage Categories</h3>
              <p className="text-sm text-muted-foreground">
                Create and edit post categories
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
