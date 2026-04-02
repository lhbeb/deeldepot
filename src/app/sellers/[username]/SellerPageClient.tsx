"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, ShieldCheck, Mail, Star, Package, HelpCircle } from 'lucide-react';
import type { Seller } from '@/types/seller';
import type { Product } from '@/types/product';
import ProductCard from '@/components/ProductCard';

interface Props {
  seller: Seller;
}

export default function SellerPageClient({ seller }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      try {
        // We'll create a new endpoint just for fetching a seller's products by ID, or we fetch all and filter client side.
        // It's more efficient to create a quick endpoint, or just do it inside a server action or API route.
        // Let's call our existing products API and filter for now (until we hit scale), 
        // to avoid rewriting too many API routes. Actually, let's just make a dedicated route /api/sellers/[id]/products
        
        const res = await fetch(`/api/sellers/id/${seller.id}/products`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        } else {
          // Fallback: fetch all and filter
          const fallbackRes = await fetch('/api/admin/products');
          if (fallbackRes.ok) {
            const allProducts = await fallbackRes.json();
            setProducts(allProducts.filter((p: any) => p.sellerId === seller.id || p.seller_id === seller.id));
          }
        }
      } catch (err) {
        console.error('Failed to load seller products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProducts();
  }, [seller.id]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Hero Section */}
      <div className="bg-[#090A28] text-white pt-24 pb-12 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-[500px] height-[500px] bg-purple-600 rounded-full filter blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 overflow-hidden flex-shrink-0 bg-white/5 relative z-20 shadow-2xl">
              {seller.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#090A28] to-purple-800 flex items-center justify-center text-5xl font-bold">
                  {seller.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{seller.name}</h1>
                <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-green-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Seller
                </div>
              </div>
              
              <p className="text-gray-300 font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
                @{seller.username}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6 text-sm text-gray-300 mb-6">
                {(seller.location || 'United States') && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{seller.location || 'United States'}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Joined {seller.memberSince || new Date(seller.createdAt || Date.now()).getFullYear()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>{products.length} Items Listed</span>
                </div>
              </div>

              {seller.bio && (
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-gray-200 text-sm md:text-base leading-relaxed max-w-2xl">
                  {seller.bio}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar Details / Policies */}
            <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-[#262626] mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#F5970C]" />
                  Seller Policies
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#262626] mb-1">Shipping</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Fast and fully tracked shipping worldwide. Processed within 24 hours of payment. Packages are carefully wrapped to ensure maximum protection during transit.</p>
                  </div>
                  <div className="h-px bg-gray-100 w-full" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#262626] mb-1">Returns</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Returns accepted within 14 days of delivery. The item must be returned in the same condition it was received. Buyer pays return shipping.</p>
                  </div>
                  <div className="h-px bg-gray-100 w-full" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#262626] mb-1">Authenticity</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">100% genuine products. Backed by the DeelDepot Guarantee.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-[#262626] mb-2">Have a question?</h3>
                <p className="text-sm text-gray-600 mb-4">You can reach out to our dedicated support team regarding any items sold by {seller.name}.</p>
                <Link href="/contact" className="w-full px-4 py-2.5 bg-white border border-gray-200 text-[#262626] font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm">
                  Contact Support
                </Link>
              </div>
            </div>

            {/* Main Content / Listings */}
            <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col min-h-[50vh]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#262626]">
                  Listings <span className="text-gray-400 text-lg font-medium ml-2">({products.length})</span>
                </h2>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white h-72 rounded-2xl border border-gray-100"></div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center p-12 text-center">
                  <Package className="w-16 h-16 text-gray-200 mb-4" />
                  <h3 className="text-xl font-semibold text-[#262626] mb-2">No active listings</h3>
                  <p className="text-gray-500 max-w-sm">{seller.name} currently doesn&apos;t have any items for sale. Check back later!</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
