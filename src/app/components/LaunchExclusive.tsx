import { useProducts } from '../hooks/useProducts';
import type { Product } from '../data/products';
import { useAuth } from './AuthContext';
import { getFostPrice } from '../data/pricing';
import { getBestProducts } from '../data/homeFeatured';

type Props = {
  onSelectProduct?: (p: Product) => void;
  onViewAll?: () => void;
};

export function LaunchExclusive({ onSelectProduct, onViewAll }: Props) {
  const { products } = useProducts();
  const { user } = useAuth();
  const isFostMember = Boolean(user);

  const featuredDeals = getBestProducts(products).map(product => {
    
    return { handle: product.handle, name: product.title, label: product.vendor,
      srp: product.price, promo: product.price };
  });

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#F16C10] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                ▶ Get The Best
              </span>
            </div>
            <h2 className="text-[26px] md:text-4xl font-black text-black uppercase leading-tight">
              Get The Best.
            </h2>
            <p className="text-neutral-500 text-sm md:text-base mt-1 max-w-sm">
              Discover our picks in audio, recovery, everyday tech and video conferencing.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end text-right shrink-0 ml-6">
            <span className="text-4xl font-black text-[#F16C10]">New Picks</span>
            <span className="text-xs text-neutral-400 uppercase tracking-widest">Discover More</span>
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="mt-3 text-xs font-bold text-[#F16C10] hover:underline uppercase tracking-wide"
              >
                Shop All Picks →
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {featuredDeals.map(deal => {
            const product = products.find(p => p.handle === deal.handle);
            if (!product) return null;
            const pct = Math.round(((deal.srp - deal.promo) / deal.srp) * 100);
            return (
              <div
                key={deal.handle}
                onClick={() => onSelectProduct?.(product)}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'; }}
                  />
                  <div className="absolute top-2 left-2 bg-[#F16C10] text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full">
                    Featured
                  </div>
                  <div hidden={pct <= 0} className="absolute top-2 right-2 bg-[#E8291C] text-white text-[10px] font-black rounded-full w-9 h-9 flex items-center justify-center leading-none">
                    -{pct}%
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <p className="text-[9px] md:text-[10px] font-bold text-[#F16C10] uppercase tracking-widest mb-1">{deal.label}</p>
                  <h3 className="text-xs md:text-sm font-bold text-black line-clamp-2 mb-2">{product.title}</h3>
                  {isFostMember ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base md:text-lg font-black text-[#F16C10]">RM {getFostPrice(deal.promo).toFixed(2)}</span>
                      <span className="text-xs text-neutral-400 line-through">RM {deal.promo.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base md:text-lg font-black text-black">RM {deal.promo.toFixed(2)}</span>
                      {deal.srp > deal.promo && <span className="text-xs text-neutral-400 line-through">RM {deal.srp.toFixed(2)}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile view-all */}
        {onViewAll && (
          <div className="mt-6 text-center md:hidden">
            <button onClick={onViewAll} className="text-sm font-bold text-[#F16C10] hover:underline uppercase tracking-wide">
              Shop All Picks →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-neutral-400 mt-6">
          Prices and availability follow the selected product.
        </p>
      </div>
    </section>
  );
}