"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, ShieldCheck } from 'lucide-react';
import type { Seller } from '@/types/seller';

interface SellerBadgeProps {
  sellerId?: string | null;
  size?: 'sm' | 'md';
}

export default function SellerBadge({ sellerId, size = 'sm' }: SellerBadgeProps) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(!!sellerId);

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    const fetchSeller = async () => {
      try {
        // Use the admin route initially (since it's a UUID).
        // A dedicated public route would be better, but we can just use the admin one
        // and add a public by-id route later, or simply handle it here.
        // Wait, admin API requires auth. We need a public endpoint for sellerId if we fetch client-side.
        // Actually, we can just fetch all products with the seller joined, but we don't have join set up.
        // Let's create a quick public route for getting seller by ID, or just use the seller data if passed.
        // For now, let's create a new public route in `/api/sellers/id/[id]` and call it.
        const res = await fetch(`/api/sellers/id/${sellerId}`);
        if (res.ok) {
          const data = await res.json();
          setSeller(data);
        }
      } catch (error) {
        console.error('Failed to fetch seller for badge:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 mt-2 animate-pulse ${size === 'md' ? 'opacity-70' : 'opacity-60'}`}>
        <div className={`rounded-full bg-gray-200 ${size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'}`}></div>
        <div className={`bg-gray-200 rounded ${size === 'sm' ? 'h-3 w-20' : 'h-4 w-24'}`}></div>
      </div>
    );
  }

  // Define DeelDepot as the default fallback
  const displaySeller = seller || {
    id: 'deeldepot',
    name: 'DeelDepot',
    username: 'deeldepot',
    avatarUrl: '/images/deeldepot-logo.png', // Or null for default icon
  };

  const isDeelDepot = displaySeller.username === 'deeldepot';

  if (size === 'sm') {
    return (
      <Link 
        href={isDeelDepot ? '/' : `/sellers/${displaySeller.username}`}
        className="inline-flex items-center gap-1.5 mt-2 group w-fit"
        onClick={(e) => e.stopPropagation()} // Prevent card clicks if nested
      >
        <span className="text-[11px] text-gray-500 font-medium">Sold by</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 group-hover:border-[#090A28] transition-colors">
            {displaySeller.avatarUrl && displaySeller.avatarUrl !== '/images/deeldepot-logo.png' ? (
               // eslint-disable-next-line @next/next/no-img-element
              <img src={displaySeller.avatarUrl} alt={displaySeller.name} className="w-full h-full object-cover" />
            ) : isDeelDepot ? (
              <ShieldCheck className="w-3 h-3 text-[#090A28] bg-white rounded-full p-0.5" />
            ) : (
              <User className="h-2.5 w-2.5 text-gray-400" />
            )}
          </div>
          <span className="text-xs font-semibold text-[#262626] group-hover:text-blue-600 transition-colors line-clamp-1">
            {displaySeller.name}
          </span>
        </div>
      </Link>
    );
  }

  // Medium size (for product detail page)
  return (
    <Link 
      href={isDeelDepot ? '/' : `/sellers/${displaySeller.username}`}
      className="inline-flex items-center gap-2 mt-3 group w-fit p-1.5 pr-3 rounded-full bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100 transition-all"
    >
      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
        {displaySeller.avatarUrl && displaySeller.avatarUrl !== '/images/deeldepot-logo.png' ? (
           // eslint-disable-next-line @next/next/no-img-element
          <img src={displaySeller.avatarUrl} alt={displaySeller.name} className="w-full h-full object-cover" />
        ) : isDeelDepot ? (
          <ShieldCheck className="w-4 h-4 text-[#090A28]" />
        ) : (
          <User className="h-3.5 w-3.5 text-gray-400" />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] text-gray-500">Sold by</span>
        <span className="text-sm font-semibold text-[#262626] group-hover:text-blue-600 transition-colors">
          {displaySeller.name}
        </span>
        {isDeelDepot && (
          <ShieldCheck className="w-3.5 h-3.5 text-[#F5970C] ml-0.5" />
        )}
      </div>
    </Link>
  );
}
