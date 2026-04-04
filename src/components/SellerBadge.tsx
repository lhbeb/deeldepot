"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, ShieldCheck, Star } from 'lucide-react';
import type { Seller } from '@/types/seller';

interface SellerBadgeProps {
  sellerId?: string | null;
  size?: 'sm' | 'md';
}

export default function SellerBadge({ sellerId, size = 'sm' }: SellerBadgeProps) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(!!sellerId);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    fetch(`/api/sellers/id/${sellerId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSeller(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 mt-2 animate-pulse">
        <div className="w-4 h-4 rounded-full bg-gray-200" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  const displaySeller = seller || {
    id: 'deeldepot',
    name: 'DeelDepot',
    username: 'deeldepot',
    avatarUrl: '/images/deeldepot-logo.png',
  };

  const isDeelDepot = displaySeller.username === 'deeldepot';
  const href = isDeelDepot ? '/' : `/sellers/${displaySeller.username}`;
  const hasAvatar = displaySeller.avatarUrl && displaySeller.avatarUrl !== '/images/deeldepot-logo.png';

  /* ── sm (product cards) ─────────────────────────────────────────────────── */
  if (size === 'sm') {
    return (
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 mt-2 group w-fit"
      >
        <span className="text-[11px] text-gray-400">Sold by</span>
        <span className="text-[11px] font-medium text-gray-600 group-hover:text-[#090A28] transition-colors">
          {displaySeller.name}
        </span>
        {isDeelDepot ? (
          <ShieldCheck className="w-3 h-3 flex-shrink-0 text-[#090A28]/50" />
        ) : (
          <Star className="w-3 h-3 flex-shrink-0 text-orange-400 fill-orange-400" />
        )}
      </Link>
    );
  }

  /* ── md (product detail page) ───────────────────────────────────────────── */
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 mt-2 group w-fit"
    >
      {/* Avatar / icon */}
      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200 group-hover:ring-[#090A28]/30 transition-all">
        {hasAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displaySeller.avatarUrl} alt={displaySeller.name} className="w-full h-full object-cover" />
        ) : isDeelDepot ? (
          <ShieldCheck className="w-3 h-3 text-[#090A28]" />
        ) : (
          <User className="w-3 h-3 text-gray-400" />
        )}
      </div>

      {/* Label + name */}
      <span className="text-sm text-gray-400">Sold by</span>
      <span className="text-sm font-medium text-gray-700 group-hover:text-[#090A28] transition-colors">
        {displaySeller.name}
      </span>

      {/* Verified tick */}
      <div className="relative group flex items-center">
        {isDeelDepot ? (
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-[#090A28]/50" />
        ) : (
          <Star className="w-3.5 h-3.5 flex-shrink-0 text-orange-400 fill-orange-400 cursor-help" />
        )}
        
        {/* Tooltip for md size only if not DeelDepot */}
        {!isDeelDepot && (
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-72 p-4 bg-white text-gray-600 text-sm leading-relaxed rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top translate-y-2 group-hover:translate-y-0 text-left">
            <div className="font-bold mb-1.5 flex items-center gap-1.5 text-[#262626]">
              <Star className="w-4 h-4 text-orange-500 fill-orange-500" /> Star Seller
            </div>
            Star Sellers have an outstanding track record for providing a great customer experience – they consistently earned 5-star reviews, dispatched orders on time, and replied quickly to any messages they received.
          </div>
        )}
      </div>
    </Link>
  );
}
