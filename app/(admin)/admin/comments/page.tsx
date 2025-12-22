import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getComments } from '@/actions/comments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { CommentActions } from './comment-actions';

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage() {
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

  // Get all comments (both pending and approved)
  const commentsResult = await getComments({ limit: 100 });
  const comments = commentsResult.data?.comments || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Comment Moderation</h1>

      {comments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                No comments yet. Comments will appear here when users submit them.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell className="font-medium">
                      <a
                        href={`/posts/${comment.post.slug}`}
                        className="hover:underline line-clamp-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {comment.post.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      {comment.user.name || comment.user.email}
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2">{comment.content}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          comment.status === 'APPROVED' ? 'default' : 'secondary'
                        }
                      >
                        {comment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <CommentActions
                        commentId={comment.id}
                        status={comment.status as 'PENDING' | 'APPROVED'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
