import { notFound } from 'next/navigation';
import { getPostById } from '@/actions/posts';
import { getCategories } from '@/actions/categories';
import { getTags } from '@/actions/tags';
import { PostForm } from '@/components/forms/post-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  const [postResult, categoriesResult, tagsResult] = await Promise.all([
    getPostById(id),
    getCategories(),
    getTags(),
  ]);

  if (postResult.error || !postResult.data) {
    notFound();
  }

  const post = postResult.data;
  const categories = categoriesResult.data || [];
  const tags = tagsResult.data || [];

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Post</CardTitle>
          <CardDescription>
            Update your blog post. Changes will be reflected immediately if published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm
            categories={categories}
            tags={tags}
            initialData={{
              id: post.id,
              title: post.title,
              content: post.content,
              excerpt: post.excerpt,
              coverImage: post.coverImage,
              categoryId: post.categoryId,
              status: post.status,
              tags: post.tags,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
