import React, { Suspense } from 'react';
import ProductGrid from '@/components/ProductGrid';
import { getProductsByCollection } from '@/lib/supabase/products';
import ScrollToTop from '@/components/ScrollToTop';

export default async function HobbiesCollectiblesPage() {
  try {
    // Use database-level query for efficient filtering by collection
    const hobbiesProducts = await getProductsByCollection('hobbies-collectibles');

    return (
      <>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        
        <div className="min-h-screen bg-gray-50">
          {/* Page Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#262626] mb-2">Hobbies & Collectibles</h1>
              <p className="text-gray-600">
                Discover our curated selection of hobbies and collectibles products
              </p>
            </div>
          </div>

          {/* Products Grid */}
          <div className="container mx-auto px-4 py-8">
            <Suspense fallback={null}>
              <ProductGrid products={hobbiesProducts} showHeader={false} />
            </Suspense>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading hobbies-collectibles page:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#262626] mb-4">Unable to load products</h2>
          <p className="text-gray-600">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }
}

