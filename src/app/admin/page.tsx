import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/supabase/auth-server';

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  redirect('/admin/products');
}
