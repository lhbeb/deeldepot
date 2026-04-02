"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, User, MapPin, ExternalLink, Calendar } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoading from '@/components/AdminLoading';
import type { Seller } from '@/types/seller';

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;

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
    }
  };

  const filteredSellers = sellers.filter(seller => 
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    seller.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <AdminLoading message="Loading sellers..." />;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#262626]">Manage Sellers</h1>
          <p className="text-gray-500 mt-1">Manage seller profiles indicating who listed each product.</p>
        </div>
        <Link
          href="/admin/sellers/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#090A28] text-white rounded-xl hover:bg-[#1c2070] transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Seller
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sellers by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {filteredSellers.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-medium">Seller</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Member Since</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                          {seller.avatarUrl ? (
                            <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[#262626]">{seller.name}</div>
                          <div className="text-sm text-gray-500">@{seller.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {seller.location ? (
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {seller.location}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {seller.memberSince ? (
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {seller.memberSince}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/sellers/${seller.username}`}
                          target="_blank"
                          title="View public profile"
                          className="p-2 text-gray-500 hover:text-[#262626] hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/sellers/${seller.id}/edit`}
                          title="Edit seller"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(seller.id, seller.name)}
                          title="Delete seller"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">No sellers found</p>
              <p className="mt-1">Add a new seller to start associating them with products.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
