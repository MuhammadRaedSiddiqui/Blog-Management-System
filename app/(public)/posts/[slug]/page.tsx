import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPostBySlug } from '@/actions/posts';
import { PostContent } from '@/components/posts/post-editor';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const result = await getPostBySlug(slug);

  if (result.error || !result.data) {
    notFound();
  }

  const post = result.data;

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Posts
        </Button>
      </Link>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Category */}
      <Link href={`/categories/${post.category.slug}`}>
        <Badge className="mb-4">{post.category.name}</Badge>
      </Link>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
        <Link
          href={`/authors/${post.author.id}`}
          className="flex items-center gap-2 hover:text-foreground"
        >
          <User className="h-4 w-4" />
          <span>{post.author.name || post.author.email}</span>
        </Link>
        {post.publishedAt && (
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(post.publishedAt)}
          </span>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map(({ tag }) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge variant="outline">#{tag.name}</Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-12">
        <PostContent content={post.content} />
      </div>

      {/* Author Card */}
      <Card className="mb-12">
        <CardHeader>
          <h3 className="text-lg font-semibold">About the Author</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <Link
                href={`/authors/${post.author.id}`}
                className="font-semibold hover:text-primary"
              >
                {post.author.name || post.author.email}
              </Link>
              {post.author.bio && (
                <p className="text-muted-foreground mt-1">{post.author.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section Placeholder */}
      <section className="border-t pt-8">
        <h3 className="text-2xl font-bold mb-6">
          Comments ({post.comments.length})
        </h3>
        {post.comments.length === 0 ? (
          <p className="text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-sm mb-2">
                    {formatDate(comment.createdAt)}
                  </p>
                  <p>{comment.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
