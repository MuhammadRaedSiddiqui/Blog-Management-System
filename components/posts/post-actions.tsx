'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deletePost, updatePost } from '@/actions/posts';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Trash2, FileX, Loader2 } from 'lucide-react';

interface PostActionsProps {
  postId: string;
  postSlug: string;
  postStatus: 'DRAFT' | 'PUBLISHED';
}

export function PostActions({ postId, postSlug, postStatus }: PostActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePost({ id: postId });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Post deleted successfully');
        router.push('/dashboard/posts');
      }
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUpdatingStatus(true);
    try {
      const result = await updatePost({
        id: postId,
        status: 'DRAFT',
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Post moved to drafts');
        router.push('/dashboard/posts');
      }
    } catch {
      toast.error('Failed to update post');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MoreHorizontal className="h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/posts/${postId}/edit`} className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Post
          </Link>
        </DropdownMenuItem>

        {postStatus === 'PUBLISHED' && (
          <DropdownMenuItem
            onClick={handleUnpublish}
            disabled={isUpdatingStatus}
            className="flex items-center gap-2"
          >
            {isUpdatingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileX className="h-4 w-4" />
            )}
            Move to Drafts
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete Post
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
                All comments on this post will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
