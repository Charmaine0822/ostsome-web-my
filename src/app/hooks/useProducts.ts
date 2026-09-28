import { useState, useEffect } from 'react';
import { fetchAllProducts } from '../data/shopify';
import type { ShopifyProduct } from '../data/shopify';
import type { Product } from '../data/products';

// ─── MODULE-LEVEL CACHE ───────────────────────────────────────────────────────
// Products are fetched once and cached for the lifetime of the app session
let cachedProducts: Product[] | null = null;
let fetchPromise: Promise<Product[]> | null = null;

// ─── CATEGORY MAPPING ─────────────────────────────────────────────────────────

function mapCategory(productType: string): string {
  const t = productType.toLowerCase();
  if (t.includes('headphone') || t.includes('audio') || t.includes('earphone') || t.includes('headset') || t.includes('speaker') || t.includes('earbud')) return 'Audio';
  if (t.includes('camera') || t.includes('gimbal') || t.includes('stabilizer') || t.includes('tripod') || t.includes('lens')) return 'Cameras & Photography';
  if (t.includes('gaming') || t.includes('controller') || t.includes('game') || t.includes('console')) return 'Gaming';
  if (t.includes('watch') || t.includes('wearable') || t.includes('fitness') || t.includes('tracker')) return 'Smart Wearables';
  if (t.includes('smart home') || t.includes('switch') || t.includes('hub') || t.includes('sensor')) return 'Smart Home';
  if (t.includes('power') || t.includes('battery') || t.includes('solar') || t.includes('charger')) return 'Power & Outdoor';
  if (t.includes('travel') || t.includes('carry') || t.includes('bag') || t.includes('mount') || t.includes('case') || t.includes('backpack') || t.includes('duffle')) return 'Travel & Carry';
  if (t.includes('monitor') || t.includes('display') || t.includes('screen')) return 'Monitors & Displays';
  if (t.includes('mobile') || t.includes('phone') || t.includes('iphone') || t.includes('android')) return 'Mobile & Accessories';
  return 'Smart Life';
}

function mapNavCategory(vendor: string, productType: string): string {
  const v = vendor.toLowerCase();
  const t = productType.toLowerCase();
  if (v.includes('therabody')) return 'Health and Beauty';
  if (t.includes('gaming') || t.includes('controller') || v.includes('turtle beach') || v.includes('roccat') || v.includes('skullcandy') && t.includes('gaming')) return 'Gaming';
  if (t.includes('audio') || t.includes('headphone') || t.includes('earphone') || t.includes('speaker') || t.includes('earbud') || v.includes('sennheiser') || v.includes('skullcandy')) return 'Mobile Audio';
  if (t.includes('camera') || t.includes('gimbal') || t.includes('stabilizer') || v.includes('hohem') || v.includes('insta360') || v.includes('obsbot') || v.includes('kandao')) return 'Mobile Creator';
  if (t.includes('watch') || t.includes('fitness') || t.includes('wellness') || v.includes('kospet')) return 'Health and Beauty';
  if (t.includes('travel') || t.includes('carry') || t.includes('mount') || t.includes('backpack') || t.includes('duffle') || t.includes('bag') || v.includes('matador') || v.includes('peak design') || v.includes('sp connect')) return 'Travel & Carry';
  if (t.includes('desk') || t.includes('monitor') || t.includes('keyboard') || v.includes('arzopa')) return 'Desk Setup';
  if (v.includes('switchbot') || t.includes('smart home') || t.includes('smart life')) return 'Smart Life';
  return 'Smart Life';
}

// ─── MAPPER ───────────────────────────────────────────────────────────────────

export function mapShopifyProduct(p: ShopifyProduct): Product {
  const firstVariant = p.variants.edges[0]?.node;
  const comparePrice = firstVariant?.compareAtPrice
    ? parseFloat(firstVariant.compareAtPrice.amount)
    : null;
  // In stock if ANY variant is purchasable — a product with some sold-out
  // colors/sizes but at least one available option shouldn't show as fully
  // sold out.
  const availableForSale = p.variants.edges.some(e => e.node.availableForSale);

  return {
    handle: p.handle,
    title: p.title,
    vendor: p.vendor,
    type: p.productType,
    category: mapCategory(p.productType),
    navCategory: mapNavCategory(p.vendor, p.productType),
    price: parseFloat(firstVariant?.price.amount ?? '0'),
    comparePrice,
    images: p.images.edges.map(e => e.node.url),
    bodyHtml: p.descriptionHtml,
    availableForSale,
  };
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [loading, setLoading] = useState(cachedProducts === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedProducts !== null) {
      setProducts(cachedProducts);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchAllProducts().then(shopifyProducts =>
        shopifyProducts
          .map(mapShopifyProduct)
          // Exclude products with no real price set in Shopify (shows as
          // SGD 0.00) — these are incomplete listings, not actual deals.
          .filter(p => p.price > 0)
      );
    }

    fetchPromise
      .then(mapped => {
        cachedProducts = mapped;
        setProducts(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch Shopify products:', err);
        setError('Failed to load products');
        setLoading(false);
        fetchPromise = null; // allow retry
      });
  }, []);

  return { products, loading, error };
}