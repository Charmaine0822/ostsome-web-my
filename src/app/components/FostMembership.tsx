import { useProducts } from '../hooks/useProducts';
import { CRUSHER_HANDLE, MTW5_HANDLE } from '../data/homeFeatured';
import { getFostPrice } from '../data/pricing';
import { Crown, Tag, Zap, Users, Gift, CalendarHeart, Heart } from 'lucide-react';

const perks = [
  { icon: Tag, title: 'Member-only pricing', description: 'Unlock exclusive prices on selected products.' },
  { icon: Zap, title: 'Early access to launches', description: 'Be the first to shop new drops & restocks.' },
  { icon: Users, title: 'Product testing opportunities', description: "Test upcoming products and help shape what's next." },
  { icon: Gift, title: 'Surprise member flash sales', description: 'Enjoy surprise deals and member-only offers.' },
  { icon: CalendarHeart, title: 'Invitations to exclusive events', description: 'Get invites to launch events, collabs and behind-the-scenes access.' },
];

export function FostMembership({ onJoin, onLearnMore, onLogin }: { onJoin?: () => void; onLearnMore?: () => void; onLogin?: () => void }) {
  const { products } = useProducts();
  const crusher = products.find(p => p.handle === CRUSHER_HANDLE);
  const mtw5 = products.find(p => p.handle === MTW5_HANDLE);
  const sennheiserFOST = crusher?.images[0];
  const firstAccessFOST = '/home-featured/looki-l1.jpg';
  const newSeasonFOST = mtw5?.images[0];
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#F16C10]/10 border border-[#F16C10]/30 px-4 py-2 rounded-full mb-6">
              <Crown className="text-[#F16C10]" size={16} />
              <span className="text-[#F16C10] font-semibold text-xs uppercase tracking-wider">FOST Membership</span>
            </div>

            <h2 className="text-[32px] lg:text-5xl font-bold text-black mb-4 leading-tight">
              Friends Get More.
            </h2>

            <p className="text-[15px] text-neutral-600 mb-8 leading-relaxed">
              The people who hear about it first, pay less, and get access before everyone else.
            </p>

            <div className="flex flex-col gap-5 mb-8">
              {perks.map((perk) => {
                const Icon = perk.icon;
                return (
                  <div key={perk.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                      <Icon className="text-[#F16C10]" size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-black font-bold text-sm mb-0.5">{perk.title}</p>
                      <p className="text-neutral-500 text-sm leading-snug">{perk.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-2 border border-neutral-200 px-4 py-2 rounded-full mb-8">
              <Heart className="text-[#F16C10]" size={14} />
              <span className="text-black text-sm font-medium">Free to join. Always.</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button onClick={onJoin} className="bg-[#F16C10] hover:bg-[#d65f0e] text-white px-8 py-4 rounded-xl font-bold text-base transition w-full sm:w-auto">
                Join FOST
              </button>
              <button onClick={onLearnMore} className="border-2 border-neutral-200 hover:border-neutral-400 text-black px-8 py-4 rounded-xl font-semibold text-base transition w-full sm:w-auto">
                Learn More
              </button>
            </div>

            <p className="text-neutral-400 text-xs">
              Already a member?{' '}
              <button onClick={onLogin} className="text-[#F16C10] font-semibold hover:underline">Log in</button>{' '}
              to unlock your perks.
            </p>
          </div>

          {/* Product cards flow naturally: no overlaps or cropped product photos. */}
          <div className="grid grid-cols-2 gap-4 min-w-0">
            <article className="col-span-2 grid grid-cols-1 sm:grid-cols-2 bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-[4/3] sm:aspect-auto sm:min-h-[220px] bg-white flex items-center justify-center p-8">
                {sennheiserFOST && <img src={sennheiserFOST} alt="Skullcandy Crusher 720" className="w-full h-full max-h-[190px] object-contain" />}
              </div>
              <div className="p-5 sm:py-7 flex flex-col justify-center items-start">
                <p className="text-[#F16C10] text-[10px] font-bold uppercase tracking-widest mb-2">Member Pricing</p>
                <h3 className="text-black text-sm font-bold mb-4 leading-snug">Skullcandy Crusher 720 Sensory Bass Headphones</h3>
                <p className="text-neutral-500 text-xs mb-1">Public Price</p>
                <p className="text-neutral-400 text-sm line-through mb-3">{crusher ? `RM ${crusher.price.toFixed(2)}` : 'Loading…'}</p>
                <p className="text-[#F16C10] text-[10px] font-bold uppercase tracking-wider mb-1">FOST Price</p>
                <p className="text-[#F16C10] text-2xl font-bold mb-3">{crusher ? `RM ${getFostPrice(crusher.price).toFixed(2)}` : 'Loading…'}</p>
                {crusher && <p className="bg-[#F16C10]/10 text-[#F16C10] text-[10px] font-bold px-3 py-1.5 rounded-full">You save RM {(crusher.price - getFostPrice(crusher.price)).toFixed(2)}</p>}
              </div>
            </article>
            <article className="min-w-0 grid grid-rows-[auto_1fr] bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-[4/3] overflow-hidden bg-neutral-50">
                <img src={firstAccessFOST} alt="Looki L1" className="w-full h-full object-cover object-center" />
              </div>
              <div className="p-4 min-h-[132px]">
                <p className="text-[#F16C10] text-[10px] font-bold uppercase tracking-wider mb-2">First Access</p>
                <h3 className="text-black text-sm font-bold leading-snug">Looki L1</h3>
                <p className="text-neutral-500 text-xs mt-2">Members saw it first.</p>
              </div>
            </article>
            <article className="min-w-0 grid grid-rows-[auto_1fr] bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-white p-3 sm:p-5">
                {newSeasonFOST && <img src={newSeasonFOST} alt="Sennheiser MOMENTUM True Wireless 5" className="w-full h-full object-contain" />}
              </div>
              <div className="p-4 min-h-[132px]">
                <p className="text-[#F16C10] text-[10px] font-bold uppercase tracking-wider mb-2">New This Season</p>
                <h3 className="text-black text-sm font-bold leading-snug">Sennheiser MOMENTUM True Wireless 5</h3>
                <p className="text-neutral-500 text-xs mt-2">Now in the OSTSOME lineup.</p>
              </div>
            </article>
            <div className="col-span-2 rounded-2xl overflow-hidden">
              <img src="/home-featured/fost-membership.svg" alt="FOST — Friends Get More. Free to join. Member pricing, early access and exclusive events." className="block w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}