export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Core static pages
  const staticRoutes = [
    '',
    '/login',
    '/register',
    '/products',
    '/cart',
    '/checkout',
    '/orders',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/refund',
    '/shipping',
    '/seller-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic product routes
  let productRoutes = [];
  try {
    const res = await fetch(`${backendUrl}/products?limit=1000`, { cache: 'no-store' });
    const data = await res.json();
    
    if (data && data.products) {
      productRoutes = data.products.map((prod) => ({
        url: `${baseUrl}/products/${prod.slug}`,
        lastModified: new Date(prod.updatedAt || prod.createdAt || new Date()),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Failed to compile sitemap dynamic paths:', error);
  }

  return [...staticRoutes, ...productRoutes];
}
