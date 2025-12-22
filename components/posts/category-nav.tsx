import Link from 'next/link';
import { getCategories } from '@/actions/categories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen } from 'lucide-react';

export async function CategoryNav() {
  const categoriesResult = await getCategories();
  const categories = categoriesResult.data || [];

  if (categories.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <span className="font-medium">{category.name}</span>
              <Badge variant="secondary" className="text-xs">
                {category._count?.posts || 0}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
