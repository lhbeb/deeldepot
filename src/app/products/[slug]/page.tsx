import { getProductBySlug } from '@/lib/data';
import { getReviewProduct, isReviewProduct } from '@/lib/reviewProducts';
import { getSellerById } from '@/lib/supabase/sellers';
import { notFound } from 'next/navigation';
import ProductPageClient from './ProductPageClient';
import type { Metadata, ResolvingMetadata } from 'next';

// Hardcoded base URL (no environment variable needed)
const BASE_URL = 'https://DeelDepot.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }, parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const { slug } = await params;
    if (!slug) {
      return {
        title: 'Product Not Found | DeelDepot',
      };
    }
    
    // Check if it's a review product first
    let product = isReviewProduct(slug) ? getReviewProduct(slug) : null;
    
    // If not a review product, try to get from database
    if (!product) {
      product = await getProductBySlug(slug);
    }

    if (!product) {
      return {
        title: 'Product Not Found | DeelDepot',
      };
    }

    const title = `${product.title || 'Product'} - ${product.brand || ''} | ${product.category || ''} | DeelDepot`;
    const description = (product.description || '').substring(0, 155) + '...';
    const canonicalUrl = `${BASE_URL}/products/${product.slug}`;

  return {
    title,
    description,
    keywords: product.meta?.keywords || `${product.title}, ${product.brand}, ${product.category}`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'DeelDepot',
      images: (product.images || []).map(img => ({ url: new URL(img, BASE_URL).toString() })),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: (product.images || []).map(img => new URL(img, BASE_URL).toString()),
    },
  };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Product | DeelDepot',
      description: 'Browse our products on DeelDepot',
    };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    if (!slug || typeof slug !== 'string') {
      notFound();
    }

    // Check if it's a review product first
    let product = isReviewProduct(slug) ? getReviewProduct(slug) : null;
    
    // If not a review product, try to get from database
    if (!product) {
      product = await getProductBySlug(slug);
    }

    if (!product) {
      notFound();
    }

    // ── Review inheritance ─────────────────────────────────────────────────
    // If this product has no own reviews but belongs to a seller,
    // inherit the seller's aggregated reviews from all their products.
    const hasOwnReviews = Array.isArray(product.reviews) && product.reviews.length > 0;
    if (!hasOwnReviews && product.sellerId) {
      try {
        const seller = await getSellerById(product.sellerId);
        if (seller && seller.reviews && seller.reviews.length > 0) {
          // Merge seller reviews into product so ProductPageClient renders them
          product = {
            ...product,
            reviews: seller.reviews,
            rating: product.rating || seller.averageRating || 0,
            reviewCount: product.reviewCount || seller.totalReviews || 0,
            // Mark that these reviews are inherited from seller (for display label)
            meta: {
              ...product.meta,
              _sellerReviews: true,
              _sellerName: seller.name,
              _sellerUsername: seller.username,
            } as any,
          };
        }
      } catch {
        // Silently ignore – don't break product page if seller fetch fails
      }
    }

    // At this point product is guaranteed non-null (notFound() was called above)
    const p = product!;

    // Generate Product Schema for Rich Snippets
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": p.title || 'Product',
      "description": p.description || '',
      "image": (p.images || []).map((img: string) => {
        try {
          return new URL(img, BASE_URL).toString();
        } catch {
          return img;
        }
      }),
      "brand": {
        "@type": "Brand",
        "name": p.brand || ''
      },
      "category": p.category || '',
      "sku": p.slug || slug,
      "condition": p.condition || '',
      "offers": {
        "@type": "Offer",
        "price": p.price || 0,
        "priceCurrency": p.currency || "USD",
        "availability": "https://schema.org/InStock",
        "url": `${BASE_URL}/products/${p.slug}`
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": p.rating || 0,
        "reviewCount": p.reviewCount || 0,
        "bestRating": 5,
        "worstRating": 1
      },
      "review": ((p.reviews || []) as any[]).slice(0, 5).map((review: any) => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": review.author || 'Anonymous'
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating || 0,
          "bestRating": 5,
          "worstRating": 1
        },
        "reviewBody": review.content || '',
        "datePublished": review.date || new Date().toISOString(),
      }))
    };
    
    // Generate Breadcrumb Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": "Products", "item": `${BASE_URL}/#products` },
        { "@type": "ListItem", "position": 3, "name": p.category || 'Category', "item": `${BASE_URL}/#products?category=${encodeURIComponent(p.category || '')}` },
        { "@type": "ListItem", "position": 4, "name": p.title || 'Product', "item": `${BASE_URL}/products/${p.slug}` }
      ]
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <ProductPageClient product={p} />
      </>
    );
  } catch (error) {
    console.error('Error in ProductPage:', error);
    notFound();
  }
}
 