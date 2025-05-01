import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check for session cookie
  const session = request.cookies.get('session')?.value;

  // Redirect unauthenticated users trying to access protected routes
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply middleware to specific routes
export const config = {
  matcher: ['/dashboard/:path*'], // Restrict middleware to dashboard routes
};