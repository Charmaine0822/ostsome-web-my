import { ChevronLeft } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../data/products';
import { useAuth } from './AuthContext';
import { getFostPrice } from '../data/pricing';
import { SEASON_OFF_CLEARANCE_DEALS } from '../data/seasonOffClearance';

type Props = {
  onBack?: () => void;
  onSelectProduct?: (product: Product) => void;
};

// Same layout as the other menu pages (NavCategoryPage): white background,
// emoji + uppercase title, short description, product count, grid.
export function SeasonOffClearancePage({ onBack, onSelectProduct }: Props) {
  const { products, loading } = useProducts();
  const { user } = useAuth();
  const isFostMember = Boolean(user);

  // Only deals whose product exists in Shopify are shown.
  const deals = SEASON_OFF_CLEARANCE_DEALS
    .map(deal => ({ deal, product: products.find(p => p.handle === deal.handle) }))
    .filter((d): d is { deal: typeof SEASON_OFF_CLEARANCE_DEALS[number]; product: Product } => Boolean(d.product));

  return (
    <section className="py-10 md:py-14 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#F16C10] transition-colors mb-8"
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏷️</span>
            <h2 className="text-[26px] md:text-4xl font-bold text-black uppercase">Season Off Clearance Price</h2>
          </div>
          <p className="text-sm text-neutral-500 max-w-lg">Selected gear at clearance prices. Brand new, limited stock.</p>
          <p className="text-xs text-neutral-400 mt-1">
            {loading ? 'Loading…' : `${deals.length} product${deals.length !== 1 ? 's' : ''}`}
            {' · '}Clearance prices are final. While stocks last. All prices include SST.
          </p>
        </div>

        <div className="border-t border-neutral-100 mb-8" />

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#F16C10] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deals.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {deals.map(({ deal, product }, idx) => {
              const pct = Math.round(((deal.srp - deal.promo) / deal.srp) * 100);
              return (
                <div
                  key={`${deal.handle}-${idx}`}
                  onClick={() => onSelectProduct?.(product)}
                  className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                    <img
                      src={product.images?.[0]}
                      alt={deal.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-2 left-2 bg-[#F16C10] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      -{pct}%
                    </span>
                  </div>
                  <div className="p-3 md:p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{deal.label}</p>
                    <h3 className="text-xs md:text-sm font-bold text-black line-clamp-2 mb-2">{deal.name}</h3>
                    {isFostMember ? (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black text-[#F16C10]">RM {getFostPrice(deal.promo).toFixed(2)}</span>
                          <span className="text-xs line-through text-neutral-400">RM {deal.promo.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] font-semibold mt-0.5 text-green-600">You save RM {(deal.srp - getFostPrice(deal.promo)).toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black text-black">RM {deal.promo.toFixed(2)}</span>
                          <span className="text-xs line-through text-neutral-400">RM {deal.srp.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] font-semibold mt-0.5 text-green-600">You save RM {(deal.srp - deal.promo).toFixed(2)}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🏷️</p>
            <p className="text-lg font-semibold text-black mb-2">Coming soon</p>
            <p className="text-sm text-neutral-500">Season off clearance deals are on the way. Check back shortly.</p>
          </div>
        )}
      </div>
    </section>
  );
}
