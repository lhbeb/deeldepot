import React, { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import type { Review } from '@/types/product';

interface Props {
  reviews: Review[];
  onChange: (reviews: Review[]) => void;
}

export default function AdminSellerReviewsEditor({ reviews, onChange }: Props) {
  const addReview = () => {
    const newReview: Review = {
      id: Math.random().toString(36).substring(2, 11),
      author: 'Anonymous',
      rating: 5,
      date: new Date().toISOString(),
      title: 'Great product',
      content: '',
      productTitle: '',
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

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Review Content</label>
                <textarea
                  value={review.content || ''}
                  onChange={(e) => updateReview(review.id, 'content', e.target.value)}
                  rows={3}
                  placeholder="The actual review text..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] outline-none transition-all text-sm resize-y"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
