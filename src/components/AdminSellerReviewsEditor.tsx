import React, { useState } from 'react';
import { Plus, Trash2, Star, ImagePlus, X, Upload } from 'lucide-react';
import type { Review } from '@/types/product';

interface Props {
  reviews: Review[];
  onChange: (reviews: Review[]) => void;
}

export default function AdminSellerReviewsEditor({ reviews, onChange }: Props) {
  // Track uploading state per review slot
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const addReview = () => {
    const newReview: Review = {
      id: Math.random().toString(36).substring(2, 11),
      author: 'Anonymous',
      rating: 5,
      date: new Date().toISOString(),
      title: 'Great product',
      content: '',
      productTitle: '',
      images: [],
    };
    onChange([...reviews, newReview]);
  };

  const removeReview = (id: string) => {
    onChange(reviews.filter((r) => r.id !== id));
  };

  const updateReview = (id: string, field: keyof Review, value: any) => {
    onChange(
      reviews.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  // Add a blank image URL slot
  const addImageSlot = (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;
    updateReview(reviewId, 'images', [...(review.images || []), '']);
  };

  // Update a specific image URL
  const updateImageUrl = (reviewId: string, imgIndex: number, url: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;
    const imgs = [...(review.images || [])];
    imgs[imgIndex] = url;
    updateReview(reviewId, 'images', imgs);
  };

  // Remove a specific image slot
  const removeImageSlot = (reviewId: string, imgIndex: number) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;
    const imgs = (review.images || []).filter((_, i) => i !== imgIndex);
    updateReview(reviewId, 'images', imgs);
  };

  // Handle file upload for a review image
  const handleImageUpload = async (reviewId: string, imgIndex: number, file: File) => {
    setUploadingFor(`${reviewId}-${imgIndex}`);
    try {
      const formData = new FormData();
      // Store review images under a dedicated "review-images" folder
      const path = `review-images/${reviewId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      formData.append('file', file);
      formData.append('path', path);

      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        updateImageUrl(reviewId, imgIndex, data.url);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingFor(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#090A28]/10 flex items-center justify-center">
            <Star className="h-4 w-4 text-[#090A28]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#262626]">Native Reviews</h2>
            <p className="text-xs text-gray-500">Reviews added directly to this seller (merges with product reviews)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={addReview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </button>
      </div>

      <div className="p-5 space-y-6 bg-gray-50/50">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No native reviews yet. Click &quot;Add Review&quot; to create one.
          </div>
        ) : (
          reviews.map((review, index) => (
            <div key={review.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative">
              <button
                type="button"
                onClick={() => removeReview(review.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove review"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <h4 className="font-medium text-sm text-[#262626] mb-4">Review #{index + 1}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Listing Title (Optional)</label>
                  <input
                    type="text"
                    value={review.productTitle || ''}
                    onChange={(e) => updateReview(review.id, 'productTitle', e.target.value)}
                    placeholder="e.g. Vintage Camera"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={review.author || ''}
                    onChange={(e) => updateReview(review.id, 'author', e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Review Title</label>
                  <input
                    type="text"
                    value={review.title || ''}
                    onChange={(e) => updateReview(review.id, 'title', e.target.value)}
                    placeholder="e.g. Great quality!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rating (Stars)</label>
                  <div className="flex items-center gap-1 h-[38px]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateReview(review.id, 'rating', star)}
                        className={`p-1 transition-colors ${
                          star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className={`h-5 w-5 ${star <= (review.rating || 0) ? 'fill-yellow-400' : ''}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{review.rating} / 5</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Review Content</label>
                <textarea
                  value={review.content || ''}
                  onChange={(e) => updateReview(review.id, 'content', e.target.value)}
                  rows={3}
                  placeholder="The actual review text..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm resize-y"
                />
              </div>

              {/* ── Review Images ───────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Review Images
                    <span className="ml-1 text-gray-400 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addImageSlot(review.id)}
                    className="inline-flex items-center gap-1 text-xs text-[#090A28] hover:underline"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Add Image
                  </button>
                </div>

                {(review.images || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No images — reviews are shown without photos.</p>
                ) : (
                  <div className="space-y-2">
                    {(review.images || []).map((imgUrl, imgIndex) => {
                      const slotKey = `${review.id}-${imgIndex}`;
                      const isUploading = uploadingFor === slotKey;

                      return (
                        <div key={imgIndex} className="flex items-center gap-2">
                          {/* Thumbnail preview */}
                          <div className="w-10 h-10 flex-shrink-0 rounded-md border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                            {imgUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imgUrl} alt={`Preview ${imgIndex + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <ImagePlus className="h-4 w-4 text-gray-300" />
                            )}
                          </div>

                          {/* URL input */}
                          <input
                            type="url"
                            value={imgUrl}
                            onChange={(e) => updateImageUrl(review.id, imgIndex, e.target.value)}
                            placeholder="https://… or upload below"
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none text-sm"
                          />

                          {/* File upload button */}
                          <label
                            className={`relative flex-shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors
                              ${isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#090A28]/10 text-[#090A28] hover:bg-[#090A28]/20'}`}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {isUploading ? 'Uploading…' : 'Upload'}
                            {!isUploading && (
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(review.id, imgIndex, file);
                                  e.target.value = '';
                                }}
                              />
                            )}
                          </label>

                          {/* Remove slot */}
                          <button
                            type="button"
                            onClick={() => removeImageSlot(review.id, imgIndex)}
                            className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* ── /Review Images ──────────────────────────────────────────── */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
