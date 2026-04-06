"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, User, MapPin, AlertCircle, CheckCircle,
  Upload, Camera, Globe, Calendar, AtSign, FileText, Eye, Trash2
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoading from '@/components/AdminLoading';
import { uploadImageWithRetry } from '@/utils/robustUpload';
import AdminSellerReviewsEditor from '@/components/AdminSellerReviewsEditor';
import type { Review } from '@/types/product';

function FormField({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

export default function EditSellerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatar_url: '',
    location: '',
    member_since: '',
    nativeReviews: [] as Review[],
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usernameDirty, setUsernameDirty] = useState(false);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`/api/admin/sellers/${id}`, {
          headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
        });
        if (!res.ok) throw new Error('Failed to load seller');
        const data = await res.json();
        setFormData({
          name: data.name || '',
          username: data.username || '',
          bio: data.bio || '',
          avatar_url: data.avatarUrl || data.avatar_url || '',
          location: data.location || '',
          member_since: data.memberSince || data.member_since || '',
          nativeReviews: data.nativeReviews || [],
        });
        setUsernameDirty(true); // username already exists — don't auto-derive
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'username') {
      setUsernameDirty(true);
      setFormData({ ...formData, username: value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${formData.username || 'seller'}-avatar-${Date.now()}.${ext}`;
      const result = await uploadImageWithRetry({ file, path: `sellers/${fileName}`, folder: 'sellers' });
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, avatar_url: result.url || '' }));
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/sellers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update seller');
      }
      setSuccess('Seller updated successfully!');
      setTimeout(() => router.push('/admin/sellers'), 1400);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/sellers/${id}`, {
        method: 'DELETE',
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
      });
      if (!res.ok) throw new Error('Failed to delete seller');
      router.push('/admin/sellers');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const avatarInitials = formData.name?.slice(0, 2).toUpperCase() || '?';

  if (loading) return <AdminLoading message="Loading seller…" />;

  return (
    <AdminLayout>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/sellers" className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-3 min-w-0">
              {formData.avatar_url && (
                <img src={formData.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-none mb-0.5">Editing</p>
                <h1 className="font-semibold text-[#262626] leading-none truncate">{formData.name || 'Seller'}</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/sellers/${formData.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Profile
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#090A28] text-white text-sm font-medium rounded-xl hover:bg-[#1c2070] disabled:opacity-50 shadow-sm transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {(error || success) && (
        <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          {error ? <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" /> : <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
          <span className={`text-sm ${error ? 'text-red-700' : 'text-green-700'}`}>{error || success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section 1: Identity ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#090A28]/8 flex items-center justify-center">
              <User className="h-4 w-4 text-[#090A28]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#262626] text-sm">Seller Identity</h2>
              <p className="text-xs text-gray-400">Name, username, and profile photo</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Avatar + name row */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                <div className="relative group w-20 h-20">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#090A28]/10 to-[#090A28]/5 border-2 border-gray-200 flex items-center justify-center">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-[#090A28]/30">{avatarInitials}</span>
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                      <Loader2 className="h-5 w-5 animate-spin text-[#090A28]" />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-5 w-5 text-white" />
                    <input type="file" className="sr-only" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
                {formData.avatar_url ? (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar_url: '' }))}
                    className="mt-1.5 text-xs text-red-500 hover:text-red-600 font-medium w-full text-center"
                  >
                    Remove
                  </button>
                ) : (
                  <p className="text-[10px] text-gray-400 text-center mt-1.5">Hover to change</p>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Full Name" required>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    placeholder="e.g. Roxanne Joiner"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                  />
                </FormField>
                <FormField
                  label="Username"
                  required
                  hint={`Profile URL: /sellers/${formData.username || 'username'}`}
                >
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text" name="username" value={formData.username} onChange={handleChange} required
                      placeholder="roxanne-joiner"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                    />
                  </div>
                </FormField>
              </div>
            </div>

            <FormField label="Bio">
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                <textarea
                  name="bio" value={formData.bio} onChange={handleChange} rows={3}
                  placeholder="A short biography about this seller…"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm resize-y"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* ── Section 2: Details ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#090A28]/8 flex items-center justify-center">
              <Globe className="h-4 w-4 text-[#090A28]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#262626] text-sm">Location & History</h2>
              <p className="text-xs text-gray-400">Shown on the public seller profile</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Location">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text" name="location" value={formData.location} onChange={handleChange}
                    placeholder="e.g. New York, NY"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                  />
                </div>
              </FormField>
              <FormField label="Member Since" hint="e.g. 2022 or March 2022">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text" name="member_since" value={formData.member_since} onChange={handleChange}
                    placeholder="e.g. 2022 or March 2022"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                  />
                </div>
              </FormField>
            </div>
          </div>
        </div>

        {/* ── Section 3: Reviews ──────────────────────────────────────────── */}
        <AdminSellerReviewsEditor
          reviews={formData.nativeReviews}
          onChange={(reviews) => setFormData(prev => ({ ...prev, nativeReviews: reviews }))}
        />

        {/* Bottom action row */}
        <div className="flex items-center justify-between pb-8">
          {/* Danger zone */}
          <div>
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Seller
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#090A28] text-white font-medium rounded-xl hover:bg-[#1c2070] disabled:opacity-50 shadow-sm transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
