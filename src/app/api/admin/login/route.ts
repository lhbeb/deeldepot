import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, logAdminAction } from '@/lib/supabase/admin-auth';
import { sign } from 'jsonwebtoken';

// JWT secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    console.log('🔐 [Admin Login] Login attempt for:', username);

    if (!username || !password) {
      console.error('❌ [Admin Login] Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get IP address and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('🔐 [Admin Login] Authenticating admin...');

    // Authenticate admin using the new RBAC system
    const authResult = await authenticateAdmin(username, password);

    console.log('🔐 [Admin Login] Auth result:', {
      success: authResult.success,
      hasAdmin: !!authResult.admin,
      error: authResult.error
    });

    if (!authResult.success || !authResult.admin) {
      console.error('❌ [Admin Login] Authentication failed:', authResult.error);

      // Log failed attempt
      try {
        await logAdminAction(
          username,
          'LOGIN_FAILED',
          null,
          null,
          { reason: authResult.error || 'Invalid credentials' },
          ipAddress,
          userAgent,
          'FAILED'
        );
      } catch (logError) {
        console.error('❌ [Admin Login] Failed to log failed attempt:', logError);
      }

      return NextResponse.json(
        { error: authResult.error || 'Invalid credentials. Please check your email and password.' },
        { status: 401 }
      );
    }

    const admin = authResult.admin;

    console.log('✅ [Admin Login] Admin authenticated:', {
      email: admin.email,
      role: admin.role
    });

    // Create JWT token with admin data
    const token = sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
      JWT_SECRET,
      { expiresIn: '30d' } // Token expires in 30 days
    );

    console.log('🔑 [Admin Login] JWT token created');

    // Create response with token
    const response = NextResponse.json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        metadata: admin.metadata,
      },
    });

    // Set cookie options - slightly relaxed to prevent login loops
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    };

    // If we are in production but facing issues, maybe try secure: false temporarily to debug
    // Or if behind a proxy that terminates SSL, we might need to trust proxy

    // Set secure HTTP-only cookie for access token
    response.cookies.set('admin_token', token, cookieOptions);

    // Store admin role in a separate cookie (readable by client for UI purposes)
    response.cookies.set('admin_role', admin.role, {
      ...cookieOptions,
      httpOnly: false, // Allow client to read this
    });

    // Store admin email in cookie (for display purposes)
    response.cookies.set('admin_email', admin.email, {
      ...cookieOptions,
      httpOnly: false, // Allow client to read this
    });

    console.log('🍪 [Admin Login] Cookies set');

    // Log successful login (already logged in authenticateAdmin, but log again with IP/UA)
    try {
      await logAdminAction(
        admin.email,
        'LOGIN_SUCCESS',
        null,
        null,
        { role: admin.role },
        ipAddress,
        userAgent,
        'SUCCESS'
      );
      console.log('📝 [Admin Login] Login logged successfully');
    } catch (logError) {
      console.error('❌ [Admin Login] Failed to log successful login:', logError);
    }

    console.log('✅ [Admin Login] Login successful for:', admin.email);
    return response;
  } catch (error) {
    console.error('❌ [Admin Login] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
