import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Star, ImagePlus, X, Upload, ChevronDown, ChevronUp, CalendarDays, ArrowUpDown } from 'lucide-react';
import type { Review } from '@/types/product';

interface Props {
  reviews: Review[];
  onChange: (reviews: Review[]) => void;
}

export default function AdminSellerReviewsEditor({ reviews, onChange }: Props) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');

  // collapsed[id] === false means OPEN; undefined/true means CLOSED (default)
  const toggleCollapse = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));

  const addReview = () => {
    const newReview: Review = {
      id: Math.random().toString(36).substring(2, 11),
      author: '',
      rating: 5,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      title: '',
      content: '',
      productTitle: '',
      images: [],
    };
    onChange([...reviews, newReview]);
  };

  const removeReview = (id: string) => onChange(reviews.filter(r => r.id !== id));

  const updateReview = (id: string, field: keyof Review, value: any) =>
    onChange(reviews.map(r => (r.id === id ? { ...r, [field]: value } : r)));

  const addImageSlot = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    updateReview(reviewId, 'images', [...(review.images || []), '']);
  };

  const updateImageUrl = (reviewId: string, imgIndex: number, url: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    const imgs = [...(review.images || [])];
    imgs[imgIndex] = url;
    updateReview(reviewId, 'images', imgs);
  };

  const removeImageSlot = (reviewId: string, imgIndex: number) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    updateReview(reviewId, 'images', (review.images || []).filter((_, i) => i !== imgIndex));
  };

  const handleImageUpload = async (reviewId: string, imgIndex: number, file: File) => {
    setUploadingFor(`${reviewId}-${imgIndex}`);
    try {
      const formData = new FormData();
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
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingFor(null);
    }
  };

  // Format date string for display in the date input (expects YYYY-MM-DD)
  const toInputDate = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try { return new Date(dateStr).toISOString().split('T')[0]; } catch { return ''; }
  };

  // Sorted view for rendering — does NOT mutate the underlying array
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return dateSort === 'newest' ? db - da : da - db;
    });
  }, [reviews, dateSort]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-[#262626] text-sm">Native Reviews</h2>
            <p className="text-xs text-gray-400">
              {reviews.length === 0
                ? 'No reviews yet'
                : `${reviews.length} review${reviews.length !== 1 ? 's' : ''} — merged with product reviews on the listing page`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort by date toggle */}
          {reviews.length > 1 && (
            <button
              type="button"
              onClick={() => setDateSort(d => d === 'newest' ? 'oldest' : 'newest')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title={`Sorted: ${dateSort === 'newest' ? 'Newest first' : 'Oldest first'}`}
            >
              <ArrowUpDown className="h-3 w-3" />
              {dateSort === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          )}
          <button
            type="button"
            onClick={addReview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#090A28] text-white text-xs font-medium rounded-xl hover:bg-[#1c2070] transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Review
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {reviews.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-amber-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No native reviews yet</p>
            <p className="text-xs text-gray-400 mt-1">Click &quot;Add Review&quot; to create one.</p>
          </div>
        ) : (
          sortedReviews.map((review, index) => {
            const isCollapsed = collapsed[review.id] !== false; // default: collapsed
            return (
              <div key={review.id} className="group">
                {/* Review header row — always visible */}
                <div
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                  onClick={() => toggleCollapse(review.id)}
                >
                  {/* Star rating pills */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                      />
                    ))}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#262626] truncate">
                      {review.author || <span className="text-gray-400 italic">Unnamed reviewer</span>}
                    </span>
                    {review.title && (
                      <span className="ml-2 text-xs text-gray-400 truncate">— {review.title}</span>
                    )}
                  </div>

                  {review.date && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                      <CalendarDays className="h-3 w-3" />
                      {toInputDate(review.date)}
                    </span>
                  )}

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeReview(review.id); }}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
                      title="Remove review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {isCollapsed
                      ? <ChevronDown className="h-4 w-4 text-gray-400" />
                      : <ChevronUp className="h-4 w-4 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Collapsible body */}
                {!isCollapsed && (
                  <div className="px-5 pb-5 pt-1 space-y-4 bg-[#fafafa] border-t border-gray-100">

                    {/* Row 1: Author + Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Author Name
                        </label>
                        <input
                          type="text"
                          value={review.author || ''}
                          onChange={(e) => updateReview(review.id, 'author', e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                          Review Date
                        </label>
                        <input
                          type="date"
                          value={toInputDate(review.date)}
                          onChange={(e) => updateReview(review.id, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                        />
                      </div>
                    </div>

                    {/* Row 2: Listing title + Rating */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Listing Title <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={review.productTitle || ''}
                          onChange={(e) => updateReview(review.id, 'productTitle', e.target.value)}
                          placeholder="e.g. Vintage Camera"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Rating</label>
                        <div className="flex items-center gap-1 h-[38px]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => updateReview(review.id, 'rating', star)}
                              className="p-1 transition-all hover:scale-110"
                            >
                              <Star
                                className={`h-5 w-5 transition-colors ${
                                  star <= (review.rating || 0)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-200 fill-gray-200 hover:text-amber-300 hover:fill-amber-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm font-medium text-gray-600">{review.rating}/5</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Review Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Review Title</label>
                      <input
                        type="text"
                        value={review.title || ''}
                        onChange={(e) => updateReview(review.id, 'title', e.target.value)}
                        placeholder="e.g. Great quality!"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Row 4: Content */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Review Content</label>
                      <textarea
                        value={review.content || ''}
                        onChange={(e) => updateReview(review.id, 'content', e.target.value)}
                        rows={3}
                        placeholder="The actual review text..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm resize-y"
                      />
                    </div>

                    {/* Row 5: Images */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                          <ImagePlus className="h-3.5 w-3.5 text-gray-400" />
                          Review Images
                          <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => addImageSlot(review.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#090A28] hover:text-[#1c2070] transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Image
                        </button>
                      </div>

                      {(review.images || []).length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-1">
                          No images — click &quot;Add Image&quot; to attach photos.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {(review.images || []).map((imgUrl, imgIndex) => {
                            const slotKey = `${review.id}-${imgIndex}`;
                            const isUploading = uploadingFor === slotKey;
                            return (
                              <div key={imgIndex} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl overflow-hidden p-1.5">
                                {/* Thumbnail */}
                                <div className="w-10 h-10 flex-shrink-0 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                                  {typeof imgUrl === 'string' && imgUrl.length > 0 ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={imgUrl} alt={`Preview ${imgIndex + 1}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImagePlus className="h-4 w-4 text-gray-300" />
                                  )}
                                </div>
                                {/* URL input */}
                                <input
                                  type="url"
                                  value={typeof imgUrl === 'string' ? imgUrl : ''}
                                  onChange={(e) => updateImageUrl(review.id, imgIndex, e.target.value)}
                                  placeholder="https://… or upload →"
                                  className="flex-1 px-2.5 py-1.5 border-0 bg-transparent focus:outline-none text-sm text-gray-700 placeholder:text-gray-300"
                                />
                                {/* Upload button */}
                                <label
                                  className={`relative flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                                    isUploading
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-[#090A28]/8 text-[#090A28] hover:bg-[#090A28]/15'
                                  }`}
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
                                {/* Remove */}
                                <button
                                  type="button"
                                  onClick={() => removeImageSlot(review.id, imgIndex)}
                                  className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
