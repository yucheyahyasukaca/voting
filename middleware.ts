import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple middleware for basic route protection
// In production, implement proper authentication
export function middleware(request: NextRequest) {
  // Allow all routes for now
  // You can add authentication logic here later
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

