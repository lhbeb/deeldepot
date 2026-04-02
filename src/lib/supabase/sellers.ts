import 'server-only';
import { supabaseAdmin } from './server';
import type { Seller } from '@/types/seller';

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
  };
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

    return data ? transformSeller(data) : null;
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

    return data ? transformSeller(data) : null;
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

    // Only return published products
    return (data || []).filter((p: any) => {
      const meta = p.meta || {};
      return meta.published !== false;
    });
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
