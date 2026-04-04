import type { Review } from './product';

export interface Seller {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  memberSince?: string;
  createdAt?: string;
  updatedAt?: string;
  // Reviews added specifically to this seller via Admin dashboard
  nativeReviews?: Review[];
  // Aggregated reviews from all of this seller's products (and native reviews)
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
}
