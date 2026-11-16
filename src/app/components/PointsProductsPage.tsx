import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-6 pb-20">
        {onBack && <button onClick={onBack} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black transition-colors mb-10"><ChevronLeft size={16} /> Back</button>}
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-black">Shop with points</h1>
        <p className="text-neutral-500 mt-3 max-w-lg">Every 10 points takes RM1 off the products below. Apply your points in the cart.</p>
        <div className="mt-5 text-sm">
          {user
            ? <p className="text-neutral-500">Your balance: <span className="font-semibold text-black">{points === null ? '…' : `${points.toLocaleString()} points`}</span></p>
            : <button onClick={onJoinFost} className="bg-black hover:bg-neutral-800 text-white font-semibold px-6 py-3 rounded-full transition">Join FOST to earn points</button>}
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-10">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-neutral-100 rounded-2xl aspect-[3/4] animate-pulse" />)}</div>
          ) : eligible.length === 0 ? (
            <p className="text-neutral-500 py-10">No products are open for points yet. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 md:gap-x-5">
              {eligible.map(p => (
                <button key={p.handle} onClick={() => onSelectProduct?.(p)} className="text-left group">
                  <div className="aspect-square bg-neutral-50 rounded-2xl overflow-hidden">
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain p-5 group-hover:scale-105 transition duration-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-3">{p.vendor}</p>
                  <h3 className="text-sm font-semibold text-black line-clamp-2 mt-0.5">{p.title}</h3>
                  <p className="text-sm text-black mt-1">RM {p.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
