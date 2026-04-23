import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/supabase/auth-server';
import AdminLoginForm from './AdminLoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect('/admin/products');
  }

  return (
    <div className="min-h-screen bg-[#090A28] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F5970C]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5970C]/10 rounded-full blur-3xl"></div>
      <AdminLoginForm />
    </div>
  );
}
