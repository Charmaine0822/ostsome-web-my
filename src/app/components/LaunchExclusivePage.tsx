import { ChevronLeft } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../data/products';
import { useAuth } from './AuthContext';
import { getFostPrice } from '../data/pricing';
import { getBestProducts } from '../data/homeFeatured';

type Props = {
  onBack?: () => void;
  onSelectProduct?: (product: Product) => void;
  onJoinFost?: () => void;
};

export function LaunchExclusivePage({ onBack, onSelectProduct, onJoinFost }: Props) {
  const { products, loading } = useProducts();
  const { user } = useAuth();
  const isFostMember = Boolean(user);

  const allDeals = getBestProducts(products).map(product => {
    
    return { handle: product.handle, name: product.title, label: product.vendor,
      srp: product.price, promo: product.price };
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero banner */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-neutral-400 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#F16C10] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                ▶ Get The Best
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-3">
                Get The Best.
              </h1>
              <p className="text-neutral-400 text-sm md:text-base max-w-lg">
                Explore our latest picks across 5 brands.
                Find your next everyday favourite.
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Discover More</div>
              <div className="text-6xl md:text-7xl font-black text-[#F16C10] leading-none">Latest</div>
              <div className="text-6xl md:text-7xl font-black text-white leading-none">Picks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[#FFF4EC] border-b border-orange-100 py-2 px-4 text-center">
        <p className="text-xs text-[#F16C10] font-medium">
          Explore the latest arrivals. Prices and availability follow the selected product.
        </p>
      </div>

      {/* Flat product grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-neutral-100 rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {allDeals.map((deal, idx) => {
              const product = products.find(p => p.handle === deal.handle);
              if (!product) return null;
              const pct = Math.round(((deal.srp - deal.promo) / deal.srp) * 100);
              const saving = (deal.srp - deal.promo).toFixed(2);
              return (
                <div
                  key={`${deal.handle}-${idx}`}
                  onClick={() => onSelectProduct?.(product)}
                  className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={deal.name}
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
                    <p className="text-[9px] font-bold text-[#F16C10] uppercase tracking-widest mb-1">{deal.label}</p>
                    <h3 className="text-xs md:text-sm font-bold text-black line-clamp-2 mb-2">{deal.name}</h3>
                    {isFostMember ? (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black text-[#F16C10]">RM {getFostPrice(deal.promo).toFixed(2)}</span>
                          <span className="text-xs text-neutral-400 line-through">RM {deal.promo.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-green-600 font-semibold mt-0.5">You save RM {(deal.srp - getFostPrice(deal.promo)).toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black text-black">RM {deal.promo.toFixed(2)}</span>
                          {deal.srp > deal.promo && <span className="text-xs text-neutral-400 line-through">RM {deal.srp.toFixed(2)}</span>}
                        </div>
                        {deal.srp > deal.promo && <p className="text-[10px] text-green-600 font-semibold mt-0.5">You save RM {saving}</p>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOST footer CTA */}
      <div className="bg-black text-white py-14 text-center px-4">
        <p className="text-neutral-400 text-xs mb-2 uppercase tracking-widest font-bold">Friends of Ostsome</p>
        <h2 className="text-2xl md:text-3xl font-black mb-3">FOST Members Get First Dibs</h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto mb-6">
          Join FOST for free and be the first to hear about launch deals, event invites, and member-only pricing.
        </p>
        <button
          onClick={onJoinFost}
          className="bg-[#F16C10] hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest px-8 py-3 rounded-full transition-colors"
        >
          Join FOST — It's Free
        </button>
      </div>
    </div>
  );
}