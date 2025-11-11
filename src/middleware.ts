import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const start = Date.now()

  // Clone the request to allow modifications
  const response = NextResponse.next()

  // Log the request after it completes
  response.headers.set('x-request-start', start.toString())

  return response
}

// Only run on API routes
export const config = {
  matcher: '/api/:path*',
}
