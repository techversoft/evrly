import React from 'react';
import ProductDetailClient from './ProductDetailClient';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Helper to fetch product details on server
async function fetchProduct(slug) {
  try {
    const res = await fetch(`${backendUrl}/products/${slug}`, {
      next: { revalidate: 3600 }, // Cache on server for 1 hour
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed fetching product details on server side:', error);
    return null;
  }
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params: paramsPromise }) {
  const params = await paramsPromise;
  const { slug } = params;
  const data = await fetchProduct(slug);

  if (!data || !data.product) {
    return {
      title: 'Product Not Found | CustomizedGiftStore',
      description: 'The requested personalized gift item could not be found.',
    };
  }

  const { product } = data;
  const title = `Customize ${product.name} | CustomizedGiftStore Premium Gifts`;
  const description = `${product.description?.substring(0, 155)}... Buy custom ${product.name} online at CustomizedGiftStore. Personalized details & premium quality.`;
  const canonicalUrl = `${appUrl}/products/${slug}`;
  const ogImage = product.images?.[0] || `${appUrl}/logo.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'CustomizedGiftStore',
      images: [
        {
          url: ogImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductDetailPage({ params: paramsPromise }) {
  const params = await paramsPromise;
  const { slug } = params;
  const data = await fetchProduct(slug);

  if (!data || !data.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Product Not Found</h2>
      </div>
    );
  }

  const { product, reviews, shopName } = data;

  // JSON-LD Structured Data Schema Markup
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images || [],
    description: product.description,
    sku: product._id,
    mpn: product._id,
    offers: {
      '@type': 'Offer',
      url: `${appUrl}/products/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2028-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'CustomizedGiftStore',
      },
    },
    brand: {
      '@type': 'Brand',
      name: 'CustomizedGiftStore',
    },
    aggregateRating: reviews?.length > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.5,
      reviewCount: reviews.length,
    } : undefined,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: appUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${appUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${appUrl}/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Insert JSON-LD schemas in head injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProductDetailClient
        initialProduct={product}
        initialReviews={reviews}
        initialShopName={shopName}
        slug={slug}
      />
    </>
  );
}
