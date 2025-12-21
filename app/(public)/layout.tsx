import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { PenSquare, LogIn } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <PenSquare className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">InsightInk</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/categories/technology"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Technology
              </Link>
              <Link
                href="/categories/lifestyle"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Lifestyle
              </Link>
              <Link
                href="/categories/education"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Education
              </Link>
            </nav>

            {/* Auth */}
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

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
