"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, User, Globe, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoading from '@/components/AdminLoading';
import { uploadImageWithRetry } from '@/utils/robustUpload';

export default function EditSellerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatar_url: '',
    location: '',
    member_since: '',
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
        });
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
    if (name === 'name') {
      setFormData(prev => {
        const next = { ...prev, name: value };
        if (!usernameDirty) {
          next.username = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        return next;
      });
    } else if (name === 'username') {
      setUsernameDirty(true);
      const cleanUsername = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData({ ...formData, [name]: cleanUsername });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const username = formData.username || 'seller';
      const fileName = `${username}-avatar-${Date.now()}.${ext}`;
      
      const result = await uploadImageWithRetry({
        file,
        path: `sellers/${fileName}`,
        folder: 'sellers',
      });

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, avatar_url: result.url || '' }));
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/sellers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update seller');
      }

      setSuccess('Seller updated successfully!');
      setTimeout(() => {
        router.push('/admin/sellers');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <AdminLoading message="Loading seller..." />;

  return (
    <AdminLayout>
      <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/sellers" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-semibold text-[#262626] truncate">Edit Seller</h1>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#090A28] text-white text-sm font-medium rounded-xl hover:bg-[#1c2070] disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {(error || success) && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'} max-w-2xl mx-auto`}>
          {error ? <AlertCircle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
          <span className={error ? 'text-red-700' : 'text-green-700'}>{error || success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#090A28]/10 flex items-center justify-center">
              <User className="h-4 w-4 text-[#090A28]" />
            </div>
            <h2 className="font-semibold text-[#262626]">Seller Profile</h2>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Roxanne Joiner"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="roxanne-joiner"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Used for profile URL: /sellers/<b>{formData.username || 'username'}</b></p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="relative group">
                {formData.avatar_url ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 bg-gray-50">
                    <img src={formData.avatar_url} alt="Avatar preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full flex-shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                    <User className="h-6 w-6" />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                    <Loader2 className="h-5 w-5 animate-spin text-[#090A28]" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Avatar Image</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#090A28]">
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                  {formData.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar_url: '' }))}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Upload a profile picture for the seller. It will be stored securely.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="A short biography about the seller..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. New York, NY"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Member Since</label>
                <input
                  type="text"
                  name="member_since"
                  value={formData.member_since}
                  onChange={handleChange}
                  placeholder="e.g. 2023 or March 2023"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
