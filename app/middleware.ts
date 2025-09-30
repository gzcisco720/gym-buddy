import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

    // If user is not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // If user is authenticated but account is inactive
    if (isAuth && !token.isActive) {
      return NextResponse.redirect(new URL("/auth/inactive", req.url));
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/overview", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith("/auth")) {
          return true;
        }
        // Require token for all other protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|$).*)",
  ],
};