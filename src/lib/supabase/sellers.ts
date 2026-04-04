import 'server-only';
import { supabaseAdmin } from './server';
import type { Seller } from '@/types/seller';
import type { Review } from '@/types/product';
import { transformProduct } from './products';

// Transform Supabase row to Seller type
function transformSeller(row: any): Seller {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    bio: row.bio || '',
    avatarUrl: row.avatar_url || '',
    location: row.location || '',
    memberSince: row.member_since || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    nativeReviews: row.reviews || [],
  };
}

/**
 * Fetch all reviews from a seller's products and compute aggregate stats.
 * Returns reviews array, averageRating, and totalReviews.
 */
async function getSellerReviews(sellerId: string): Promise<{
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('reviews, rating, review_count')
      .eq('seller_id', sellerId);

    if (error || !data) {
      return { reviews: [], averageRating: 0, totalReviews: 0 };
    }

    // Collect all reviews from all products
    const allReviews: Review[] = [];
    for (const product of data) {
      const productReviews: Review[] = Array.isArray(product.reviews) ? product.reviews : [];
      allReviews.push(...productReviews);
    }

    // Sort by date (newest first)
    allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Compute average rating
    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    return { reviews: allReviews, averageRating, totalReviews };
  } catch {
    return { reviews: [], averageRating: 0, totalReviews: 0 };
  }
}


/**
 * Get all sellers
 */
export async function getSellers(): Promise<Seller[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sellers:', error);
      return [];
    }

    return (data || []).map(transformSeller);
  } catch (error) {
    console.error('Error loading sellers:', error);
    return [];
  }
}

/**
 * Get a single seller by ID
 */
export async function getSellerById(id: string): Promise<Seller | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error(`Error fetching seller ${id}:`, error);
      }
      return null;
    }

    if (!data) return null;
    const seller = transformSeller(data);
    const reviewData = await getSellerReviews(seller.id);
    
    // Merge native and aggregated reviews
    const allReviews = [...(seller.nativeReviews || []), ...reviewData.reviews];
    allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const combinedTotalReviews = allReviews.length;
    const combinedAverageRating = combinedTotalReviews > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / combinedTotalReviews) * 10) / 10
      : 0;

    return { 
      ...seller, 
      reviews: allReviews, 
      averageRating: combinedAverageRating, 
      totalReviews: combinedTotalReviews 
    };
  } catch (error) {
    console.error(`Error loading seller ${id}:`, error);
    return null;
  }
}

/**
 * Get a single seller by username (for public profile pages)
 */
export async function getSellerByUsername(username: string): Promise<Seller | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error(`Error fetching seller by username ${username}:`, error);
      }
      return null;
    }

    if (!data) return null;
    const seller = transformSeller(data);
    const reviewData = await getSellerReviews(seller.id);

    // Merge native and aggregated reviews
    const allReviews = [...(seller.nativeReviews || []), ...reviewData.reviews];
    allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const combinedTotalReviews = allReviews.length;
    const combinedAverageRating = combinedTotalReviews > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / combinedTotalReviews) * 10) / 10
      : 0;

    return { 
      ...seller, 
      reviews: allReviews, 
      averageRating: combinedAverageRating, 
      totalReviews: combinedTotalReviews 
    };
  } catch (error) {
    console.error(`Error loading seller by username ${username}:`, error);
    return null;
  }
}


/**
 * Get published products for a seller
 */
export async function getProductsBySeller(sellerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products by seller:', error);
      return [];
    }

    // Only return published products, mapped to proper Product interfaces
    return (data || [])
      .map((row: any) => transformProduct(row))
      .filter((p: any) => p.published !== false);
  } catch (error) {
    console.error('Error loading products by seller:', error);
    return [];
  }
}

/**
 * Create a new seller
 */
export async function createSeller(sellerData: {
  name: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  member_since?: string;
  nativeReviews?: Review[];
}): Promise<Seller | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .insert({
        name: sellerData.name,
        username: sellerData.username.toLowerCase().trim(),
        bio: sellerData.bio || '',
        avatar_url: sellerData.avatar_url || '',
        location: sellerData.location || '',
        member_since: sellerData.member_since || '',
        reviews: sellerData.nativeReviews || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating seller:', error);
      return null;
    }

    return transformSeller(data);
  } catch (error) {
    console.error('Error creating seller:', error);
    return null;
  }
}

/**
 * Update a seller by ID
 */
export async function updateSeller(
  id: string,
  updates: {
    name?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
    location?: string;
    member_since?: string;
    nativeReviews?: Review[];
  }
): Promise<Seller | null> {
  try {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.username !== undefined) updateData.username = updates.username.toLowerCase().trim();
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.member_since !== undefined) updateData.member_since = updates.member_since;
    if (updates.nativeReviews !== undefined) updateData.reviews = updates.nativeReviews;

    const { data, error } = await supabaseAdmin
      .from('sellers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating seller:', error);
      return null;
    }

    return transformSeller(data);
  } catch (error) {
    console.error('Error updating seller:', error);
    return null;
  }
}

/**
 * Delete a seller by ID
 */
export async function deleteSeller(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('sellers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting seller:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting seller:', error);
    return false;
  }
}
