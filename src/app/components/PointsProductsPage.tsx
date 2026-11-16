import { useEffect, useState } from 'react';
import { ChevronLeft, Coins } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from './AuthContext';
import { fetchMember } from '../data/member';
import type { Product } from '../data/products';

type Props = { onBack?: () => void; onSelectProduct?: (p: Product) => void; onJoinFost?: () => void };

export function PointsProductsPage({ onBack, onSelectProduct, onJoinFost }: Props) {
  const { products, loading } = useProducts();
  const { user, shopifyToken } = useAuth();
  const [points, setPoints] = useState<number | null>(null);
  useEffect(() => { if (shopifyToken) fetchMember(shopifyToken).then(m => setPoints(m.points)).catch(() => {}); }, [shopifyToken]);

  const eligible = products.filter(p => p.tags?.includes('points-eligible'));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
          {onBack && <button onClick={onBack} className="flex items-center gap-1 text-neutral-400 hover:text-white text-sm mb-6"><ChevronLeft size={16} /> Back</button>}
          <div className="inline-flex items-center gap-1.5 bg-[#F16C10] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"><Coins size={12} /> FOST Points</div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3">Use your points on these products</h1>
          <p className="text-neutral-400 text-sm md:text-base max-w-xl">Spend RM1, earn 1 point. Every 10 points = RM1 off the products below. Apply your points at the cart. Orders paid with points don’t earn new points.</p>
          <div className="mt-5">
            {user
              ? <p className="text-sm text-white">Your balance: <span className="font-bold text-[#F16C10]">{points === null ? '…' : `${points.toLocaleString()} pts`}</span></p>
              : <button onClick={onJoinFost} className="bg-[#F16C10] hover:bg-orange-600 text-white font-bold text-sm px-6 py-2.5 rounded-full">Join FOST — it's free</button>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-neutral-100 rounded-2xl aspect-[3/4] animate-pulse" />)}</div>
        ) : eligible.length === 0 ? (
          <p className="text-center text-neutral-500 py-16">Points-eligible products are coming soon.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {eligible.map(p => (
              <div key={p.handle} onClick={() => onSelectProduct?.(p)} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-500" />
                  <div className="absolute top-2 left-2 bg-[#F16C10] text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full">Points OK</div>
                </div>
                <div className="p-3 md:p-4">
                  <p className="text-[9px] font-bold text-[#F16C10] uppercase tracking-widest mb-1">{p.vendor}</p>
                  <h3 className="text-xs md:text-sm font-bold text-black line-clamp-2 mb-2">{p.title}</h3>
                  <span className="text-base font-black text-black">RM {p.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
