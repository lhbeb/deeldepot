import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerByUsername } from '@/lib/supabase/sellers';
import SellerPageClient from './SellerPageClient';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const seller = await getSellerByUsername(username);

  if (!seller) {
    return {
      title: 'Seller Not Found | DeelDepot',
      description: 'The requested seller profile could not be found.',
    };
  }

  return {
    title: `${seller.name} | DeelDepot Seller`,
    description: seller.bio || `Shop products from ${seller.name} on DeelDepot.`,
    openGraph: {
      title: `${seller.name} - DeelDepot`,
      description: seller.bio || `Check out ${seller.name}'s profile and listings on DeelDepot.`,
      images: seller.avatarUrl ? [{ url: seller.avatarUrl }] : [],
    },
  };
}

export default async function SellerPage({ params }: Props) {
  const { username } = await params;
  const seller = await getSellerByUsername(username);

  if (!seller) {
    notFound();
  }

  return <SellerPageClient seller={seller} />;
}
