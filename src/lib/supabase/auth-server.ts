import 'server-only';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

interface AdminJwtPayload {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

/**
 * Get the current admin session from cookies/headers
 * Returns null if not authenticated
 */
export async function getAdminSession(): Promise<{ email: string; userId: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, getSecretKey());
    const decoded = payload as Partial<AdminJwtPayload>;

    if (!decoded.id || !decoded.email || decoded.isActive !== true) {
      return null;
    }

    return {
      email: decoded.email,
      userId: decoded.id,
    };
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

/**
 * Verify admin authentication
 * Throws error if not authenticated (for use in server components)
 */
export async function requireAdmin(): Promise<{ email: string; userId: string }> {
  const session = await getAdminSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}
