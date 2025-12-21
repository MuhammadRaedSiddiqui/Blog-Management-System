import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, truncateText, generateExcerpt } from '@/lib/utils';
import { Calendar, User, MessageSquare } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: unknown;
    coverImage?: string | null;
    publishedAt?: Date | null;
    author: {
      id: string;
      name?: string | null;
      email: string;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    };
    tags: Array<{
      tag: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
    _count?: {
      comments: number;
    };
  };
}

export function PostCard({ post }: PostCardProps) {
  const displayExcerpt = post.excerpt || generateExcerpt(post.content, 150);
  const authorName = post.author.name || post.author.email;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      {post.coverImage && (
        <Link href={`/posts/${post.slug}`}>
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      <CardHeader className="pb-2">
        {/* Category */}
        <Link href={`/categories/${post.category.slug}`}>
          <Badge variant="secondary" className="w-fit hover:bg-secondary/80">
            {post.category.name}
          </Badge>
        </Link>

        {/* Title */}
        <Link href={`/posts/${post.slug}`}>
          <h2 className="text-xl font-semibold hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>
      </CardHeader>

      <CardContent className="pb-2">
        {/* Excerpt */}
        <p className="text-muted-foreground line-clamp-3">{displayExcerpt}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.slice(0, 3).map(({ tag }) => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Badge variant="outline" className="text-xs hover:bg-accent">
                  #{tag.name}
                </Badge>
              </Link>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between w-full">
          {/* Author */}
          <Link
            href={`/authors/${post.author.id}`}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <User className="h-3 w-3" />
            <span>{truncateText(authorName, 20)}</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Date */}
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(post.publishedAt)}
              </span>
            )}

            {/* Comments count */}
            {post._count && post._count.comments > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {post._count.comments}
              </span>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
