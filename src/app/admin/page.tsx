import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/supabase/auth';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  // If no token, redirect to login
  if (!token) {
    redirect('/admin/login');
  }

  try {
    // Verify the token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      // Invalid token, redirect to login
      redirect('/admin/login');
    }

    // Check if user is admin
    const adminStatus = await isAdmin(user.email || '');
    if (!adminStatus) {
      // Not an admin, redirect to login
      redirect('/admin/login');
    }

    // Authenticated admin, redirect to products page (default admin page)
    redirect('/admin/products');
  } catch (error) {
    // Error verifying token, redirect to login
    redirect('/admin/login');
  }
}

