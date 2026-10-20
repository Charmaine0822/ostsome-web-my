import { TrendingUp, Star, Sparkles, Zap } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../data/products';
import { useAuth } from './AuthContext';
import { getFostPrice } from '../data/pricing';
import { useFlashSaleActive, getFlashPrice } from '../data/flashSale';
import { HOME_FEATURED_HANDLES, homeLifestyleImages } from '../data/homeFeatured';
const labels = [
  { label: 'New Arrival', labelIcon: Zap, labelColor: 'bg-[#F16C10]' },
  { label: 'Staff Pick', labelIcon: Star, labelColor: 'bg-amber-500' },
  { label: 'Trending', labelIcon: TrendingUp, labelColor: 'bg-pink-500' },
  { label: 'Just Dropped', labelIcon: Sparkles, labelColor: 'bg-cyan-500' },
  { label: 'Staff Pick', labelIcon: Star, labelColor: 'bg-amber-500' },
];
const featured = HOME_FEATURED_HANDLES.map((handle, i) => ({ handle, ...labels[i] }));
const lifestyleImages = homeLifestyleImages;

type FeaturedProduct = Product & { label: string; labelIcon: React.ElementType; labelColor: string };

export function WhatsNewThisWeek({ onShopAll, onSelectProduct }: { onShopAll?: () => void; onSelectProduct?: (p: Product) => void }) {
  const { products } = useProducts();
  const { user } = useAuth();
  const isFostMember = Boolean(user);
  const flashSaleActive = useFlashSaleActive();

  const featuredProducts: FeaturedProduct[] = featured
    .map(({ handle, label, labelIcon, labelColor }) => {
      const p = products.find(p => p.handle === handle);
      return p ? { ...p, label, labelIcon, labelColor } : null;
    })
    .filter(Boolean) as FeaturedProduct[];

  // Show skeleton cards while loading
  if (featuredProducts.length === 0) return (
    <section className="py-12 md:py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 md:mb-10 flex flex-wrap gap-y-3 items-end justify-between">
          <div>
            <h2 className="text-[26px] md:text-4xl font-bold text-black mb-2 uppercase">Latest of the LATEST</h2>
            <p className="text-[14px] md:text-base text-neutral-600">We find it first. You get it first.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-neutral-100 animate-pulse">
              <div className="aspect-square bg-neutral-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-neutral-100 rounded w-1/3" />
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
                <div className="h-5 bg-neutral-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <section className="py-12 md:py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 md:mb-10 flex flex-wrap gap-y-3 items-end justify-between">
          <div className="text-left md:text-center md:flex-1">
            <h2 className="text-[26px] md:text-4xl font-bold text-black mb-2 uppercase">Latest of the LATEST</h2>
            <p className="text-[14px] md:text-base text-neutral-600">We find it first. You get it first.</p>
          </div>
          <button
            onClick={onShopAll}
            className="shrink-0 ml-4 text-sm font-semibold text-[#F16C10] hover:text-black transition-colors whitespace-nowrap"
          >
            Shop All →
          </button>
        </div>

        {/* Top 3 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {featuredProducts.slice(0, 3).map((product, i) => {
            const LabelIcon = product.labelIcon;
            const imgSrc = lifestyleImages[product.handle] ?? product.images[0];
            const isThird = i === 2;
            return (
              <div
                key={product.handle}
                onClick={() => onSelectProduct?.(product)}
                className={`bg-white rounded-xl overflow-hidden border border-neutral-200 hover:shadow-xl transition group cursor-pointer ${isThird ? 'col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={`relative bg-neutral-50 overflow-hidden ${isThird ? 'aspect-[2/1] lg:aspect-[4/3]' : 'aspect-square md:aspect-[4/3]'}`}>
                  <img
                    src={imgSrc}
                    alt={product.title}
                    className="w-full h-full object-cover [image-rendering:auto] group-hover:scale-105 transition duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'; }}
                  />
                  <div className={`absolute top-2 left-2 md:top-4 md:left-4 ${product.labelColor} text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-1.5`}>
                    <LabelIcon size={10} />
                    {product.label}
                  </div>
                </div>
                <div className="p-3 md:p-5">
                  <p className="text-[9px] md:text-[10px] font-semibold text-[#F16C10] uppercase tracking-widest mb-1">{product.vendor}</p>
                  <h3 className="text-sm md:text-base font-bold text-black mb-2 md:mb-3 line-clamp-1">{product.title}</h3>
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    {(() => {
                      const flashSalePrice = getFlashPrice(product.handle);
                      const showFlashPrice = isFostMember && flashSaleActive && flashSalePrice !== undefined;
                      if (showFlashPrice) {
                        return (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-base md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">RM {flashSalePrice.toFixed(2)}</span>
                            <span className="text-[9px] md:text-[10px] text-neutral-400 line-through">RM {product.price.toFixed(2)}</span>
                          </div>
                        );
                      }
                      return isFostMember ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-base md:text-xl font-bold text-[#F16C10]">RM {getFostPrice(product.price).toFixed(2)}</span>
                          <span className="text-[9px] md:text-[10px] text-neutral-400 line-through">RM {product.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-base md:text-xl font-bold text-black">RM {product.price.toFixed(2)}</span>
                      );
                    })()}
                    <button className="text-[#F16C10] hover:text-black font-medium text-xs md:text-sm transition-colors">View →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom 2 */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6 mt-3 md:mt-6">
          {featuredProducts.slice(3).map(product => {
            const LabelIcon = product.labelIcon;
            const imgSrc = lifestyleImages[product.handle] ?? product.images[0];
            return (
              <div
                key={product.handle}
                onClick={() => onSelectProduct?.(product)}
                className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:shadow-xl transition group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row h-full">
                  <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto bg-neutral-50 overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={product.title}
                      className="w-full h-full object-cover [image-rendering:auto] group-hover:scale-105 transition duration-500"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'; }}
                    />
                    <div className={`absolute top-2 left-2 md:top-4 md:left-4 ${product.labelColor} text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-1.5`}>
                      <LabelIcon size={10} />
                      {product.label}
                    </div>
                  </div>
                  <div className="p-3 md:p-5 flex flex-col justify-center w-full md:w-1/2">
                    <p className="text-[9px] md:text-[10px] font-semibold text-[#F16C10] uppercase tracking-widest mb-1">{product.vendor}</p>
                    <h3 className="text-sm md:text-base font-bold text-black mb-2 line-clamp-2">{product.title}</h3>
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      {(() => {
                        const flashSalePrice = getFlashPrice(product.handle);
                        const showFlashPrice = isFostMember && flashSaleActive && flashSalePrice !== undefined;
                        if (showFlashPrice) {
                          return (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-base md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">RM {flashSalePrice.toFixed(2)}</span>
                              <span className="text-[9px] md:text-[10px] text-neutral-400 line-through">RM {product.price.toFixed(2)}</span>
                            </div>
                          );
                        }
                        return isFostMember ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-base md:text-xl font-bold text-[#F16C10]">RM {getFostPrice(product.price).toFixed(2)}</span>
                            <span className="text-[9px] md:text-[10px] text-neutral-400 line-through">RM {product.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-base md:text-xl font-bold text-black">RM {product.price.toFixed(2)}</span>
                        );
                      })()}
                      <button className="text-[#F16C10] hover:text-black font-medium text-xs md:text-sm transition-colors">View →</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}