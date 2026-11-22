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

export function SeasonOffClearancePage({ onBack, onSelectProduct }: Props) {
  const { products, loading } = useProducts();
  const { user } = useAuth();
  const isFostMember = Boolean(user);

  // Every Clearance deal entry, pulled from the shared campaign pricing
  // sheet (campaignDeals.ts) — the same source OneSeasonOff.tsx and
  // ProductDetail.tsx use, so this page can no longer drift out of sync
  // with the homepage teaser or the PDP.
  const clearanceDeals = SEASON_OFF_CLEARANCE_DEALS;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Hero banner */}
      <div className="bg-[#111111] text-white">
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#FF1F1F' }}>
                🔥 Clearance Sale
              </p>
              <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-3">
                Season Off
                <br />Clearance Price
              </h1>
              <p className="text-neutral-400 text-sm md:text-base max-w-lg">
                Selected gear at clearance prices. Brand new, limited stock.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-red-50 border-b border-red-100 py-2 px-4 text-center">
        <p className="text-xs font-medium" style={{ color: '#FF1F1F' }}>
          ⚠️ Clearance prices are final. No further discounts apply. While stocks last. All prices include SST.
        </p>
      </div>

      {/* Flat product grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : clearanceDeals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-black mb-2" style={{ color: '#111111' }}>Coming soon</p>
            <p className="text-sm" style={{ color: '#6F6A63' }}>Season off clearance deals are on the way. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {clearanceDeals.map((deal, idx) => {
              const product = products.find(p => p.handle === deal.handle);
              if (!product) return null;
              const pct = Math.round(((deal.srp - deal.promo) / deal.srp) * 100);
              const saving = (deal.srp - deal.promo).toFixed(2);
              return (
                <div
                  key={`${deal.handle}-${idx}`}
                  onClick={() => onSelectProduct?.(product)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                    <img
                      src={product.images?.[0]}
                      alt={deal.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-500"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'; }}
                    />
                    <span
                      className="absolute top-2 left-2 text-white text-[9px] font-black px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#FF1F1F' }}
                    >
                      -{pct}%
                    </span>
                  </div>
                  <div className="p-3 md:p-4">
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6F6A63' }}>{deal.label}</p>
                    <h3 className="text-xs md:text-sm font-bold line-clamp-2 mb-2" style={{ color: '#111111' }}>{deal.name}</h3>
                    {isFostMember ? (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black" style={{ color: '#F16C10' }}>RM {getFostPrice(deal.promo).toFixed(2)}</span>
                          <span className="text-xs line-through" style={{ color: '#6F6A63' }}>RM {deal.promo.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] font-semibold mt-0.5 text-green-600">You save RM {(deal.srp - getFostPrice(deal.promo)).toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black" style={{ color: '#111111' }}>RM {deal.promo.toFixed(2)}</span>
                          <span className="text-xs line-through" style={{ color: '#6F6A63' }}>RM {deal.srp.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] font-semibold mt-0.5 text-green-600">You save RM {saving}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}