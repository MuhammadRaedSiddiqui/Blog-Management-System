'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCommentSchema, type CreateCommentInput } from '@/lib/validations/comment';
import { createComment } from '@/actions/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CommentFormProps {
  postId: string;
  onSuccess?: () => void;
}

export function CommentForm({ postId, onSuccess }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: '',
      postId,
    },
  });

  async function onSubmit(data: CreateCommentInput) {
    setIsSubmitting(true);

    try {
      const result = await createComment(data);

      if (result.error) {
        if (result.error._form) {
          toast.error(result.error._form[0]);
        } else if (result.error.content) {
          form.setError('content', { message: result.error.content[0] });
        } else if (result.error.postId) {
          toast.error(result.error.postId[0]);
        }
      } else {
        toast.success('Comment submitted! It will appear after admin approval.');
        form.reset();
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Failed to submit comment. Please try again.');
      console.error('Comment submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Comment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your thoughts..."
                  className="min-h-[100px] resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit Comment'}
        </Button>
      </form>
    </Form>
  );
}
