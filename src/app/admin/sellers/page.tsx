"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, User, MapPin, Eye, Calendar, Star, Users } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoading from '@/components/AdminLoading';
import type { Seller } from '@/types/seller';

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/sellers', {
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
      });
      if (!res.ok) throw new Error('Failed to fetch sellers');
      const data = await res.json();
      setSellers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchSellers(); 
    // Check admin role from cookies for authorization rules
    if (typeof document !== 'undefined') {
      const roleMatch = document.cookie.split('; ').find(row => row.startsWith('admin_role='));
      if (roleMatch) {
        setAdminRole(roleMatch.split('=')[1]);
      }
    }
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/sellers/${id}`, {
        method: 'DELETE',
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
      });
      if (!res.ok) throw new Error('Failed to delete seller');
      setSellers(sellers.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <AdminLoading message="Loading sellers..." />;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#262626]">Manage Sellers</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {sellers.length} seller{sellers.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/admin/sellers/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#090A28] text-white text-sm font-medium rounded-xl hover:bg-[#1c2070] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Seller
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Sellers', value: sellers.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'With Avatars', value: sellers.filter(s => s.avatarUrl).length, icon: User, color: 'bg-purple-50 text-purple-600' },
          { label: 'With Location', value: sellers.filter(s => s.location).length, icon: MapPin, color: 'bg-green-50 text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#262626]">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or username…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="px-5 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        {filteredSellers.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredSellers.map((seller) => (
              <div
                key={seller.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200 shadow-sm">
                  {seller.avatarUrl ? (
                    <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#262626] truncate">{seller.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">@{seller.username}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {seller.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" /> {seller.location}
                      </span>
                    )}
                    {seller.memberSince && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" /> {seller.memberSince}
                      </span>
                    )}
                    {(seller as any).nativeReviews?.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {(seller as any).nativeReviews.length} review{(seller as any).nativeReviews.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions — always visible */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link
                    href={`/sellers/${seller.username}`}
                    target="_blank"
                    title="Preview public profile"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                  <Link
                    href={`/admin/sellers/${seller.id}/edit`}
                    title="Edit seller"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  {adminRole === 'SUPER_ADMIN' && (
                    deleteConfirm === seller.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(seller.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(seller.id)}
                        title="Delete seller"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">No sellers found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm ? 'Try a different search term.' : 'Add a new seller to get started.'}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
