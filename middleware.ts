import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Temporarily disable middleware protection for testing
  // Authentication is handled in client-side in admin pages
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
