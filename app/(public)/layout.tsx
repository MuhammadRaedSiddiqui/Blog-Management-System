import Link from 'next/link';
import { CategoryNav } from '@/components/posts/category-nav';
import { Navbar } from '@/components/layout/navbar';
import { PenSquare } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar />

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <main className="lg:col-span-9">{children}</main>

          {/* Sidebar */}
          {/* <aside className="lg:col-span-3 space-y-6">
            <CategoryNav />
          </aside> */}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <PenSquare className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                InsightInk &copy; {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              A modern blog platform built with Next.js, Prisma, and Clerk
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
