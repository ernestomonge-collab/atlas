import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // This function is called for all matched routes
    // You can add custom logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        const publicRoutes = [
          '/login',
          '/register',
          '/forgot-password',
          '/accept-invitation',
        ]

        // API routes for authentication
        const publicApiRoutes = [
          '/api/auth',
          '/api/register',
          '/api/invitations/accept',
        ]

        // Check if the route is public
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
        const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

        // Allow access to public routes
        if (isPublicRoute || isPublicApiRoute) {
          return true
        }

        // For all other routes, require authentication
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Configure which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - icon.png
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
