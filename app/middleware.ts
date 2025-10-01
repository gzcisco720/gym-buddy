import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
    const isCompleteRegistrationPage = req.nextUrl.pathname === "/auth/complete-registration";

    // Debug logging
    // if (isAuth && process.env.NODE_ENV === "development") {
    //   console.log("Middleware - Path:", req.nextUrl.pathname);
    //   console.log("Middleware - needsRegistration:", token?.needsRegistration);
    //   console.log("Middleware - registrationCompleted:", token?.registrationCompleted);
    // }

    // If user is not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // If user is authenticated but account is inactive
    if (isAuth && !token.isActive) {
      return NextResponse.redirect(new URL("/auth/inactive", req.url));
    }

    // If user is authenticated but hasn't completed registration (OAuth users)
    if (isAuth && token.needsRegistration && !isCompleteRegistrationPage) {
      // console.log("Redirecting to complete-registration page");
      return NextResponse.redirect(new URL("/auth/complete-registration", req.url));
    }

    // If user is authenticated, has completed registration, and trying to access complete-registration page
    if (isAuth && !token.needsRegistration && isCompleteRegistrationPage) {
      return NextResponse.redirect(new URL("/overview", req.url));
    }

    // If user is authenticated and trying to access other auth pages (login/signup), redirect to dashboard
    if (isAuth && isAuthPage && !isCompleteRegistrationPage) {
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