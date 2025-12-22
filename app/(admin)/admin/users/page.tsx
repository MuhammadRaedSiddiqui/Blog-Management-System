import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getUsers } from '@/actions/users';
import { DataTable, Column } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
  _count: {
    posts: number;
    comments: number;
  };
}

function UsersTableSkeleton() {
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

async function UsersTable() {
  const result = await getUsers({ limit: 100 });

  if (result.error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load users</p>
      </div>
    );
  }

  const { users: rawUsers } = result.data!;
  
  // Serialize dates to strings
  const users = rawUsers.map(user => ({
    ...user,
    createdAt: user.createdAt.toString(),
    updatedAt: user.updatedAt.toString(),
  }));

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (user) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{user.name || 'Unnamed User'}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => (
        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'posts',
      header: 'Posts',
      render: (user) => (
        <span className="text-muted-foreground">{user._count?.posts || 0}</span>
      ),
    },
    {
      key: 'comments',
      header: 'Comments',
      render: (user) => (
        <span className="text-muted-foreground">{user._count?.comments || 0}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      searchKey="email"
      searchPlaceholder="Search users by email..."
      pageSize={10}
      emptyMessage="No users found"
    />
  );
}

export default async function AdminUsersPage() {
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
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">
            View all registered users on the platform
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UsersTableSkeleton />}>
            <UsersTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
