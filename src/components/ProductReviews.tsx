"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ThumbsUp, CheckCircle2, ChevronDown, X, ZoomIn, ExternalLink } from 'lucide-react';
import type { Review } from '@/types/product';
import { lockScroll, unlockScroll } from '@/utils/scrollUtils';

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  /** If reviews were inherited from the seller, pass their name and username */
  sellerName?: string;
  sellerUsername?: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  reviews = [],
  averageRating = 0,
  totalReviews = 0,
  sellerName,
  sellerUsername,
}) => {
  const [sortBy, setSortBy] = useState('recent');
  const [helpfulClicks, setHelpfulClicks] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Placeholder avatar for reviews without custom avatars
  const placeholderAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80";

  // Calculate rating distribution with safety check
  const ratingDistribution = {
    5: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === 5).length / reviews.length) * 100) : 0,
    4: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === 4).length / reviews.length) * 100) : 0,
    3: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === 3).length / reviews.length) * 100) : 0,
    2: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === 2).length / reviews.length) * 100) : 0,
    1: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === 1).length / reviews.length) * 100) : 0,
  };

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return (b.helpful || 0) - (a.helpful || 0);
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default: // recent
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const handleHelpfulClick = (reviewId: string) => {
    setHelpfulClicks(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // Generate random helpful count between 9-27 for each review
  const getRandomHelpful = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const min = 9, max = 27;
    return min + (Math.abs(hash) % (max - min + 1));
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const openImageModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Centralized scroll lock for modal - prevents race conditions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (selectedImage) {
      lockScroll();
    } else {
      unlockScroll();
    }

    return () => {
      unlockScroll();
    };
  }, [selectedImage]);

  // If no reviews, show a message
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-8 w-8 text-gray-300" />
            ))}
          </div>
          <h3 className="text-xl font-semibold text-[#262626] mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">Be the first to share your experience with our products!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Reviews Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Rating Summary */}
            <div>
              <h2 className="text-2xl font-bold text-[#262626] mb-2">
                {sellerName && sellerUsername ? (
                  <>
                    Reviews from{' '}
                    <Link
                      href={`/sellers/${sellerUsername}`}
                      className="text-[#090A28] hover:underline inline-flex items-center gap-1"
                    >
                      {sellerName}
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    &apos;s listings
                  </>
                ) : (
                  'Reviews from this listing or similar other listings on DeelDepot'
                )}
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-[#262626]">{averageRating.toFixed(1)}</div>
                <div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(averageRating) ? 'text-[#090A28] fill-[#090A28]' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Based on {totalReviews} reviews</p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex-grow max-w-sm">
              {Object.entries(ratingDistribution).reverse().map(([rating, percentage]) => (
                <div key={rating} className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600 w-8">{rating}★</span>
                  <div className="flex-grow bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#090A28] rounded-full h-2"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {sortedReviews.length} of {totalReviews} reviews
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="helpful">Most Helpful</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-400" />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-gray-200">
          {sortedReviews.map((review, index) => (
            <div key={`${review.id}-${index}`} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center border border-gray-200">
                  {typeof review.avatar === 'string' && review.avatar.length > 0 ? (
                    // Use next/image with unoptimized=true for arbitrary external/base64 avatars
                    <Image
                      src={review.avatar}
                      alt={review.author}
                      width={48}
                      height={48}
                      unoptimized={true}
                      className="w-12 h-12 object-cover"
                    />
                  ) : (
                    <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-[#262626] flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {review.author}
                        {review.verified && (
                          <span className="flex items-center text-[#090A28] text-sm">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Verified Purchase
                          </span>
                        )}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {review.location && `${review.location} • `}
                        {review.purchaseDate && `Purchased ${review.purchaseDate}`}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(review.date)}</span>
                  </div>

                  {/* Product attribution */}
                  {review.productTitle && (
                    <div
                      className="inline-block text-xs text-[#090A28]/70 hover:text-[#090A28] hover:underline mb-2 cursor-pointer group"
                      onClick={(e) => e.preventDefault()}
                    >
                      {review.productTitle}
                    </div>
                  )}

                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'text-[#090A28] fill-[#090A28]' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>

                  <h4 className="font-medium text-[#262626] mb-2">{review.title}</h4>
                  <p className="text-gray-600 mb-4">{review.content}</p>

                  {/* Review Images */}
                  {review.images && review.images.filter(img => typeof img === 'string' && img.length > 0).length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {review.images.filter(img => typeof img === 'string' && img.length > 0).map((image, imgIndex) => (
                          <button
                            key={imgIndex}
                            onClick={() => openImageModal(image)}
                            className="relative group overflow-hidden rounded-lg border border-gray-200 hover:border-[#090A28] transition-colors duration-200"
                          >
                            <Image
                              src={image}
                              alt={`Review image ${imgIndex + 1} by ${review.author}`}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {review.images.filter(img => typeof img === 'string' && img.length > 0).length === 1 ? '1 customer photo' : `${review.images.filter(img => typeof img === 'string' && img.length > 0).length} customer photos`}
                      </p>
                    </div>
                  )}

                  {review.helpful !== undefined && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleHelpfulClick(review.id)}
                        className={`flex items-center text-sm px-3 py-1.5 rounded-md transition-colors duration-200 ${helpfulClicks[review.id]
                          ? 'bg-[#090A28] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>
                          Helpful ({helpfulClicks[review.id] ? getRandomHelpful(review.id) + 1 : getRandomHelpful(review.id)})
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && selectedImage.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeImageModal}
          style={{ overflow: 'hidden' }}
        >
          <div className="relative flex items-center justify-center w-full h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={selectedImage}
              alt="Review image"
              width={1000}
              height={1000}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProductReviews;