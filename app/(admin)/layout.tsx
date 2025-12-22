import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Shield, MessageSquare, FileText, Users, FolderOpen, Home } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              <span className="font-bold text-xl">Admin Panel</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link
                href="/admin/comments"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Comments</span>
              </Link>
              <Link
                href="/admin/posts"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Posts</span>
              </Link>
              <Link
                href="/admin/categories"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Categories</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </Link>
            </nav>

            {/* User Button */}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
