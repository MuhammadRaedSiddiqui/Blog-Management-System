import { getCategories } from '@/actions/categories';
import { getTags } from '@/actions/tags';
import { PostForm } from '@/components/forms/post-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function NewPostPage() {
  const [categoriesResult, tagsResult] = await Promise.all([
    getCategories(),
    getTags(),
  ]);

  const categories = categoriesResult.data || [];
  const tags = tagsResult.data || [];

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Write and publish a new blog post. You can save as draft and publish later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm categories={categories} tags={tags} />
        </CardContent>
      </Card>
    </div>
  );
}
