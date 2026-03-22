import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import ClientHeader from "@/components/ClientHeader";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";
import InstagramSection from "@/components/InstagramSection";
import ErrorBoundaryWrapper from "@/components/ErrorBoundary";
import CookieConsent from "@/components/CookieConsent";
import Script from "next/script";
import { Suspense } from "react";
import VisitNotifier from "@/components/VisitNotifier";
import { AdminRouteCheck, PublicRouteOnly, AdminRouteOnly, CheckoutRouteOnly } from "@/components/AdminRouteCheck";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeelDepot - Everything You Want, One Marketplace.",
  description: "Shop millions of products at DeelDepot: electronics, fashion, home, collectibles, toys, beauty, gadgets, and more. Discover unbeatable deals, fast shipping, and a secure shopping experience—just like eBay, but happier!",
  keywords: "DeelDepot, online marketplace, general store, electronics, fashion, home, collectibles, toys, beauty, gadgets, deals, shopping, eBay alternative, secure checkout, fast shipping",
  authors: [{ name: "DeelDepot" }],
  creator: "DeelDepot",
  publisher: "DeelDepot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://DeelDepot.com"),
  openGraph: {
    title: "DeelDepot - Everything You Want, One Marketplace.",
    description: "Shop millions of products at DeelDepot: electronics, fashion, home, collectibles, toys, beauty, gadgets, and more. Discover unbeatable deals, fast shipping, and a secure shopping experience—just like eBay, but happier!",
    url: "https://DeelDepot.com",
    siteName: "DeelDepot",
    images: [
      {
        url: "/g7x.jpeg",
        width: 1200,
        height: 630,
        alt: "DeelDepot - Online Marketplace for Everything",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeelDepot - Everything You Want, One Marketplace.",
    description: "Shop millions of products at DeelDepot: electronics, fashion, home, collectibles, toys, beauty, gadgets, and more. Discover unbeatable deals, fast shipping, and a secure shopping experience—just like eBay, but happier!",
    images: ["/g7x.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "aGkqoI_eCG0h2qF377pXezPaxovx1V-MeOiyeYD5Ngg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="preload" href="/logosvg.svg" as="image" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning className={`${dmSans.variable} font-sans antialiased text-[#262626]`}>
        <PublicRouteOnly>
          <VisitNotifier />
        </PublicRouteOnly>
        {/* Organization Schema */}
        <AdminRouteCheck>
          <Script
            id="organization-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "DeelDepot",
                "url": "https://DeelDepot.com",
                "logo": "https://DeelDepot.com/logosvg.svg",
                "description": "DeelDepot - Where Savings Make You Smile. Discover premium cameras and photography equipment at unbeatable prices.",
                "sameAs": [
                  "https://twitter.com/DeelDepot",
                  "https://facebook.com/DeelDepot",
                  "https://instagram.com/DeelDepot"
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "email": "support@DeelDepot.com"
                },
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1420 N McKinley Ave",
                  "addressLocality": "Los Angeles",
                  "addressRegion": "CA",
                  "postalCode": "90059",
                  "addressCountry": "US"
                }
              })
            }}
          />
        </AdminRouteCheck>

        {/* WebSite Schema */}
        <AdminRouteCheck>
          <Script
            id="website-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "DeelDepot",
                "url": "https://DeelDepot.com",
                "description": "DeelDepot - Where Savings Make You Smile. Discover premium cameras and photography equipment at unbeatable prices.",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://DeelDepot.com/api/products/search?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              })
            }}
          />
        </AdminRouteCheck>

        <ErrorBoundaryWrapper>
          {/* Public website with header, footer, etc. */}
          <PublicRouteOnly>
            <div className="min-h-screen flex flex-col">
              <Suspense fallback={null}>
                <ClientHeader />
              </Suspense>
              <main className="flex-grow">
                {children}
              </main>
              <Suspense fallback={null}>
                <InstagramSection />
              </Suspense>
              <NewsletterSection />
              <Footer />
            </div>
            <CookieConsent />
          </PublicRouteOnly>

          {/* Checkout page - navbar only, no distractions */}
          <CheckoutRouteOnly>
            <div className="min-h-screen flex flex-col">
              <Suspense fallback={null}>
                <ClientHeader />
              </Suspense>
              <main className="flex-grow">
                {children}
              </main>
            </div>
          </CheckoutRouteOnly>

          {/* Admin dashboard - clean, no public UI */}
          <AdminRouteOnly>
            {children}
          </AdminRouteOnly>
        </ErrorBoundaryWrapper>

        {/* Tidio Live Chat Widget - strictly for public site */}
        <AdminRouteCheck>
          <Script
            src="//code.tidio.co/9ximyjwjwmobhbw5vz7ps0vn84xhxtsr.js"
            async
          />
        </AdminRouteCheck>
        <AdminRouteCheck>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-6ELCP7YFYP"
            strategy="afterInteractive"
            async
          />
          <Script
            id="gtag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-6ELCP7YFYP');
              `,
            }}
          />
        </AdminRouteCheck>
        {/* Google Ads Conversion Tracking */}
        <AdminRouteCheck>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=AW-17682444096"
            strategy="afterInteractive"
            async
          />
          <Script
            id="google-ads-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-17682444096');
              `,
            }}
          />
        </AdminRouteCheck>
        {/* Analytics Tracker - strictly for public site */}
        <AdminRouteCheck>
          <Script
            src="https://analyticsapp-five.vercel.app/tracker.js"
            strategy="afterInteractive"
            async
          />
        </AdminRouteCheck>
      </body>
    </html>
  );
}
