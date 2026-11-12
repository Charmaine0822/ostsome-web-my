import { Coins, ArrowRight, ShoppingBag, Gift } from 'lucide-react';
import { useAuth } from './AuthContext';

// Keep these in sync with CFG in netlify/functions/lib/shopify.js
const EARN_PER_RM = 1;      // spend RM1 → earn this many points
const POINTS_PER_RM_OFF = 10; // this many points = RM1 off

type PointsBannerProps = { onJoin?: () => void; onViewPoints?: () => void };

export function PointsBanner({ onJoin, onViewPoints }: PointsBannerProps) {
  const { user } = useAuth();
  return (
    <section className="bg-gradient-to-r from-[#F16C10] to-[#ff8a3d] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full mb-3">
            <Coins size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">FOST Points</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-2">Shop. Earn points. Pay less.</h2>
          <p className="text-white/90 text-sm lg:text-base">
            Every RM1 you spend earns {EARN_PER_RM} point. Collect {POINTS_PER_RM_OFF} points to take RM1 off <span className="font-bold">Satechi</span> and <span className="font-bold">Looki</span> products.
          </p>
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          <div className="bg-white/15 rounded-2xl px-4 py-4 text-center w-28 lg:w-36">
            <ShoppingBag className="mx-auto mb-1" size={20} />
            <p className="text-lg lg:text-xl font-bold">RM1</p>
            <p className="text-[11px] lg:text-xs text-white/80">you spend</p>
          </div>
          <ArrowRight size={18} className="text-white/70 shrink-0" />
          <div className="bg-white/15 rounded-2xl px-4 py-4 text-center w-28 lg:w-36">
            <Coins className="mx-auto mb-1" size={20} />
            <p className="text-lg lg:text-xl font-bold">{EARN_PER_RM} pt</p>
            <p className="text-[11px] lg:text-xs text-white/80">you earn</p>
          </div>
          <ArrowRight size={18} className="text-white/70 shrink-0" />
          <div className="bg-white text-[#F16C10] rounded-2xl px-4 py-4 text-center w-28 lg:w-36">
            <Gift className="mx-auto mb-1" size={20} />
            <p className="text-lg lg:text-xl font-bold">{POINTS_PER_RM_OFF} pts</p>
            <p className="text-[11px] lg:text-xs">= RM1 off</p>
          </div>
        </div>

        <div className="text-center lg:text-left shrink-0">
          <button
            onClick={user ? onViewPoints : onJoin}
            className="bg-black hover:bg-neutral-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition"
          >
            {user ? 'View my points' : 'Join FOST — it’s free'}
          </button>
          <p className="text-[11px] text-white/80 mt-2 max-w-[200px] mx-auto lg:mx-0">FOST members only. Orders paid with points don’t earn points.</p>
        </div>
      </div>
    </section>
  );
}
