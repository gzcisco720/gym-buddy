import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const pathname = req.nextUrl.pathname;
    const isAuthPage = pathname.startsWith("/auth");
    const isSsoRegistrationPage = pathname === "/auth/sso-registration";
    const isInactivePage = pathname === "/auth/inactive";

    // Debug logging (remove in production)
    if (isAuth) {
      console.log(`[Middleware] Path: ${pathname}, isActive: ${token.isActive}, needsRegistration: ${token.needsRegistration}`);
    }

    // If user is not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // If user is authenticated but account is inactive
    if (isAuth && token.isActive === false && !isInactivePage) {
      return NextResponse.redirect(new URL("/auth/inactive", req.url));
    }

    // If authenticated user is on inactive page but account is active, redirect to overview
    if (isAuth && token.isActive !== false && isInactivePage) {
      return NextResponse.redirect(new URL("/overview", req.url));
    }

    // Handle OAuth users who need to complete registration
    if (isAuth && token.needsRegistration) {
      // Allow access to SSO registration page
      if (isSsoRegistrationPage) {
        return NextResponse.next();
      }
      // Redirect from any other page to SSO registration
      return NextResponse.redirect(new URL("/auth/sso-registration", req.url));
    }

    // If user is fully authenticated, redirect away from auth pages
    if (isAuth && isAuthPage && !isSsoRegistrationPage) {
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
