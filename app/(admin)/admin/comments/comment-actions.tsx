'use client';

import { useState, useTransition } from 'react';
import { approveComment, rejectComment } from '@/actions/comments';
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
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommentActionsProps {
  commentId: string;
  status: 'PENDING' | 'APPROVED';
}

export function CommentActions({ commentId, status }: CommentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleApprove() {
    startTransition(async () => {
      try {
        const result = await approveComment({ id: commentId });

        if (result.error) {
          const errorMessage = '_form' in result.error ? result.error._form?.[0] : 'Failed to approve comment';
          toast.error(errorMessage || 'Failed to approve comment');
        } else {
          toast.success('Comment approved successfully');
          router.refresh();
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
        console.error('Approve comment error:', error);
      }
    });
  }

  async function handleReject() {
    setIsDeleting(true);
    try {
      const result = await rejectComment({ id: commentId });

      if (result.error) {
        const errorMessage = '_form' in result.error ? result.error._form?.[0] : 'Failed to reject comment';
        toast.error(errorMessage || 'Failed to reject comment');
      } else {
        toast.success('Comment rejected and deleted');
        router.refresh();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Reject comment error:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  if (status === 'APPROVED') {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the approved comment. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // PENDING status - show both approve and reject
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleApprove}
        disabled={isPending || isDeleting}
        title="Approve"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending || isDeleting}
            title="Reject"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Reject & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
