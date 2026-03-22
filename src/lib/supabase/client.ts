import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClientInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  // Return cached instance if already created
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file'
    );
  }

  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClientInstance;
}

// Truly lazy initialization - only creates client when properties are accessed
// This Proxy intercepts all property access and lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    // If it's a function, bind it to the client to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    // If it's an object (like 'auth' or 'storage'), return it as-is
    return value;
  }
}) as SupabaseClient;

