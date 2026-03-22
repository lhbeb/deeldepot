import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// JWT secret - must match the one in login route
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔒 [MIDDLEWARE] Request to:', pathname);

  // Import shouldBypassAuth dynamically to avoid issues
  const { shouldBypassAuth } = await import('@/lib/supabase/auth');
  const bypassAuth = shouldBypassAuth();

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // Bypass authentication in development if enabled
    // CRITICAL: Only allow bypass in development, never in production
    if (bypassAuth && process.env.NODE_ENV === 'development') {
      console.warn('⚠️⚠️⚠️ [MIDDLEWARE] AUTH BYPASS ENABLED - DEVELOPMENT ONLY ⚠️⚠️⚠️');
      console.log('🔓 [MIDDLEWARE] Bypassing authentication for:', pathname);
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      return response;
    }

    // If bypass is attempted in production, log critical warning and continue with auth
    if (bypassAuth && process.env.NODE_ENV === 'production') {
      console.error('🚨 [MIDDLEWARE] AUTH BYPASS BLOCKED IN PRODUCTION! Proceeding with normal auth...');
    }

    const token = request.cookies.get('admin_token')?.value;

    console.log('🔒 [MIDDLEWARE] All cookies:', request.cookies.getAll().map(c => c.name).join(', '));
    console.log('🔒 [MIDDLEWARE] Checking token:', token ? 'exists and starts with ' + token.substring(0, 10) : 'missing');

    if (!token) {
      // No token, redirect to login
      console.log('🚫 [MIDDLEWARE] No token found, redirecting to login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      // Verify the JWT token using jose (Edge-compatible)
      console.log('🔒 [MIDDLEWARE] Verifying JWT token...');

      const { payload } = await jwtVerify(token, getSecretKey());

      const decoded = payload as {
        id: string;
        email: string;
        role: string;
        isActive: boolean;
      };

      console.log('✅ [MIDDLEWARE] Token verified for:', decoded.email);

      // Check if admin is active
      if (!decoded.isActive) {
        console.log('🚫 [MIDDLEWARE] Admin account is deactivated');
        const url = new URL('/admin/login', request.url);
        url.searchParams.set('error', 'Account deactivated');
        const response = NextResponse.redirect(url);
        response.cookies.delete('admin_token');
        response.cookies.delete('admin_role');
        response.cookies.delete('admin_email');
        return response;
      }

      // Authenticated admin, allow access
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      response.headers.set('x-admin-email', decoded.email);
      response.headers.set('x-admin-role', decoded.role);
      return response;
    } catch (error) {
      console.error('❌ [MIDDLEWARE] Error verifying token:', error);

      // Invalid or expired token, redirect to login
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('error', 'Session expired or invalid');
      const response = NextResponse.redirect(url);
      response.cookies.delete('admin_token');
      response.cookies.delete('admin_role');
      response.cookies.delete('admin_email');
      return response;
    }
  }

  // For non-admin routes, just add pathname header
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
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
};
