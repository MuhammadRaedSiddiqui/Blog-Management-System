'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PostEditor } from '@/components/posts/post-editor';
import { ImageUpload } from '@/components/forms/image-upload';

import { createPostSchema, type CreatePostInput, type PostStatus } from '@/lib/validations/post';
import { createPost, updatePost } from '@/actions/posts';
import { Loader2, Save, Send } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface PostFormProps {
  categories: Category[];
  tags: Tag[];
  initialData?: {
    id: string;
    title: string;
    content: unknown;
    excerpt?: string | null;
    coverImage?: string | null;
    categoryId: string;
    status: PostStatus;
    tags: Array<{ tag: Tag }>;
  };
}

export function PostForm({ categories, tags, initialData }: PostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags.map((t) => t.tag.id) || []
  );

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || { type: 'doc', content: [] },
      excerpt: initialData?.excerpt || '',
      coverImage: initialData?.coverImage || '',
      categoryId: initialData?.categoryId || '',
      tagIds: initialData?.tags.map((t) => t.tag.id) || [],
      status: initialData?.status || 'DRAFT',
    },
  });

  const handleSubmit = (status: PostStatus) => {
    form.setValue('status', status);
    form.setValue('tagIds', selectedTags);
    form.handleSubmit(onSubmit)();
  };

  const onSubmit = async (data: CreatePostInput) => {
    startTransition(async () => {
      try {
        const result = initialData
          ? await updatePost({ id: initialData.id, ...data })
          : await createPost(data);

        if (result.error) {
          // Handle validation errors
          const errors = result.error as Record<string, string[]>;
          Object.entries(errors).forEach(([key, messages]) => {
            if (key === '_form') {
              toast.error(messages.join(', '));
            } else {
              form.setError(key as keyof CreatePostInput, {
                message: messages.join(', '),
              });
            }
          });
          return;
        }

        toast.success(
          initialData
            ? 'Post updated successfully!'
            : data.status === 'PUBLISHED'
            ? 'Post published successfully!'
            : 'Draft saved successfully!'
        );

        router.push('/dashboard/posts');
        router.refresh();
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-8">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter post title..."
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <PostEditor
                  content={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Excerpt */}
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary of your post..."
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                A short summary displayed on post cards. Max 300 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cover Image */}
        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image (Optional)</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || ''}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <div className="space-y-2">
          <FormLabel>Tags (Optional)</FormLabel>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Button
                key={tag.id}
                type="button"
                variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTag(tag.id)}
                disabled={isPending}
              >
                #{tag.name}
              </Button>
            ))}
          </div>
          <FormDescription>
            Select tags to help readers discover your post.
          </FormDescription>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('DRAFT')}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit('PUBLISHED')}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish
          </Button>
        </div>
      </form>
    </Form>
  );
}
