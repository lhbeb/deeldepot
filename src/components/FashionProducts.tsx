"use client";

import React from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types/product';

interface FashionProductsProps {
  products: Product[];
}

const FashionProducts: React.FC<FashionProductsProps> = ({ products }) => {
  // Filter to only show fashion products based directly on database collections
  const fashionProducts = products.filter(product => {
    // Determine product collection directly from database
    const categoryMatch = product.category?.toLowerCase().includes('fashion');
    const collectionMatch = product.collections?.some(c => c.toLowerCase() === 'fashion');

    return categoryMatch || collectionMatch;
  });

  // If no fashion products, don't render the section
  if (fashionProducts.length === 0) {
    return null;
  }

  // Show up to 8 fashion products
  const displayedProducts = fashionProducts.slice(0, 8);

  return (
    <section id="fashion" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#262626] mb-4">
              The Top Shelf Closet
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Top brands. Checked. Ready to wear.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} cardBackground="bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FashionProducts;

