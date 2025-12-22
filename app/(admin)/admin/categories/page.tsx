import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCategories } from '@/actions/categories';
import { DataTable, Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Plus } from 'lucide-react';
import { CategoryActions } from './category-actions';
import { CreateCategoryDialog } from './create-category-dialog';
import { formatDistanceToNow } from 'date-fns';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  _count: {
    posts: number;
  };
}

function CategoriesTableSkeleton() {
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

async function CategoriesTable() {
  const result = await getCategories();
  const categories = result.data || [];

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (category) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{category.name}</span>
          <span className="text-xs text-muted-foreground">/{category.slug}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (category) => (
        <span className="text-muted-foreground line-clamp-2">
          {category.description || 'No description'}
        </span>
      ),
    },
    {
      key: 'posts',
      header: 'Posts',
      sortable: true,
      render: (category) => (
        <span className="font-medium">{category._count?.posts || 0}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (category) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(category.createdAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (category) => (
        <CategoryActions category={category} />
      ),
    },
  ];

  return (
    <DataTable
      data={categories}
      columns={columns}
      searchKey="name"
      searchPlaceholder="Search categories..."
      pageSize={10}
      emptyMessage="No categories found"
    />
  );
}

export default async function AdminCategoriesPage() {
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
          <FolderOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Manage Categories</h1>
            <p className="text-muted-foreground">
              Create and manage post categories
            </p>
          </div>
        </div>
        <CreateCategoryDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </CreateCategoryDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<CategoriesTableSkeleton />}>
            <CategoriesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
