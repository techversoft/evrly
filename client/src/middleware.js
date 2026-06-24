import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Route-level protection for Admin Dashboard
    if (path.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?error=AccessDenied', req.url));
    }

    // Route-level protection for Seller Dashboard
    if (path.startsWith('/seller') && token?.role !== 'seller') {
      return NextResponse.redirect(new URL('/login?error=AccessDenied', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/seller/:path*',
    '/cart',
    '/checkout',
    '/orders/:path*',
    '/profile',
  ],
};
