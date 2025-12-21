import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/posts/(.*)',
  '/categories/(.*)',
  '/tags/(.*)',
  '/search(.*)',
  '/authors/(.*)',
  '/api/uploadthing(.*)',
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

// Define author routes (author or admin can access)
const isAuthorRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) {
    return;
  }

  // Protect all other routes - require authentication
  const { userId, sessionClaims } = await auth.protect();

  // Check role for admin routes
  if (isAdminRoute(req)) {
    const role = sessionClaims?.metadata?.role as string | undefined;
    if (role !== 'Admin') {
      // Redirect non-admins away from admin routes
      const url = new URL('/dashboard', req.url);
      return Response.redirect(url);
    }
  }

  // Author routes accessible by both Author and Admin roles
  if (isAuthorRoute(req)) {
    const role = sessionClaims?.metadata?.role as string | undefined;
    if (!role || (role !== 'Author' && role !== 'Admin')) {
      // User has no role assigned, redirect to complete profile
      const url = new URL('/', req.url);
      return Response.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
