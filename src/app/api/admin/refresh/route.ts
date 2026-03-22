import { NextRequest, NextResponse } from 'next/server';
import { verify, sign } from 'jsonwebtoken';
import { getAdminRole } from '@/lib/supabase/admin-auth';

// JWT secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
    try {
        // Get the current token from cookie
        const token = request.cookies.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'No token found' },
                { status: 401 }
            );
        }

        // Verify and decode the current token
        let decoded: any;
        try {
            decoded = verify(token, JWT_SECRET);
        } catch (err) {
            // Token is invalid or expired
            const response = NextResponse.json(
                { error: 'Session expired. Please login again.' },
                { status: 401 }
            );
            response.cookies.delete('admin_token');
            response.cookies.delete('admin_role');
            response.cookies.delete('admin_email');
            return response;
        }

        // Verify user is still an admin in the database
        const adminRole = await getAdminRole(decoded.email);
        if (!adminRole) {
            const response = NextResponse.json(
                { error: 'Access denied. Admin access required.' },
                { status: 403 }
            );
            response.cookies.delete('admin_token');
            response.cookies.delete('admin_role');
            response.cookies.delete('admin_email');
            return response;
        }

        // Create a new token with extended expiry
        const newToken = sign(
            {
                id: decoded.id,
                email: decoded.email,
                role: adminRole,
                isActive: true,
            },
            JWT_SECRET,
            { expiresIn: '30d' } // Token expires in 30 days
        );

        // Create response with new token
        const response = NextResponse.json({
            token: newToken,
            user: {
                id: decoded.id,
                email: decoded.email,
                role: adminRole,
            },
        });

        // Update access token cookie
        response.cookies.set('admin_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        // Update role cookie
        response.cookies.set('admin_role', adminRole, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        // Update email cookie
        response.cookies.set('admin_email', decoded.email, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'Failed to refresh session' },
            { status: 500 }
        );
    }
}
