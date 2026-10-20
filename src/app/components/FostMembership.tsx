import { useProducts } from '../hooks/useProducts';
import { CRUSHER_HANDLE, MTW5_HANDLE } from '../data/homeFeatured';
import { getFostPrice } from '../data/pricing';
import { Crown, Tag, Zap, Users, Gift, CalendarHeart, Heart } from 'lucide-react';
const layoutImg = '/home-featured/momentum-5.jpg';

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

          {/* RIGHT */}
          <div className="relative" style={{ height: '720px' }}>

            {/* Sennheiser photo — narrower so person shows on right side */}
            <div className="absolute top-0 left-0 rounded-2xl overflow-hidden shadow-lg" style={{ width: '50%', zIndex: 1 }}>
              <img
                src={sennheiserFOST}
                alt="Skullcandy Crusher 720"
                className="w-full object-cover object-center"
                style={{ height: '240px' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* Member Pricing card — top right */}
            <div className="absolute top-0 right-0 bg-white border border-neutral-200 rounded-2xl shadow-md p-4" style={{ width: '46%', zIndex: 2 }}>
              <p className="text-[#F16C10] text-[9px] font-bold uppercase tracking-widest mb-2">Member Pricing</p>
              <p className="text-black text-xs font-bold mb-3 leading-snug">Skullcandy Crusher 720 Sensory Bass Headphones</p>
              <p className="text-neutral-400 text-[10px] mb-0.5">Public Price</p>
              <p className="text-neutral-400 text-sm line-through mb-2">{crusher ? `RM ${crusher.price.toFixed(2)}` : 'Loading…'}</p>
              <p className="text-[#F16C10] text-[9px] font-bold uppercase tracking-wider mb-0.5">FOST Price</p>
              <p className="text-[#F16C10] text-2xl font-bold mb-2">{crusher ? `RM ${getFostPrice(crusher.price).toFixed(2)}` : 'Loading…'}</p>
              <div className="bg-[#F16C10]/10 text-[#F16C10] text-[9px] font-bold px-2 py-1 rounded-full inline-block">
                {crusher ? `You save RM ${(crusher.price - getFostPrice(crusher.price)).toFixed(2)}` : 'Member pricing'}
              </div>
            </div>

            {/* First Access photo */}
            <div className="absolute rounded-2xl overflow-hidden shadow-lg" style={{ top: '210px', left: '0', width: '50%', zIndex: 3 }}>
              <img
                src={firstAccessFOST}
                alt="Looki L1"
                className="w-full object-cover"
                style={{ height: '200px' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* First Access card */}
            <div className="absolute bg-white border border-neutral-200 rounded-2xl shadow-md p-3" style={{ top: '418px', left: '0', width: '48%', zIndex: 4 }}>
              <p className="text-[#F16C10] text-[9px] font-bold uppercase tracking-wider mb-1">First Access</p>
              <p className="text-black text-xs font-bold">Looki L1</p>
              <p className="text-neutral-500 text-[10px]">Members saw it first.</p>
            </div>

            {/* New Season photo */}
            <div className="absolute rounded-2xl overflow-hidden shadow-lg" style={{ top: '260px', right: '0', width: '48%', zIndex: 3 }}>
              <img
                src={newSeasonFOST}
                alt="Sennheiser MOMENTUM True Wireless 5"
                className="w-full object-cover"
                style={{ height: '200px' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* Product Testing card */}
            <div className="absolute bg-white border border-neutral-200 rounded-2xl shadow-md p-3" style={{ top: '468px', right: '0', width: '48%', zIndex: 4 }}>
              <p className="text-[#F16C10] text-[9px] font-bold uppercase tracking-wider mb-1">New This Season</p>
              <p className="text-black text-xs font-bold">Sennheiser MOMENTUM True Wireless 5</p>
              <p className="text-neutral-500 text-[10px]">Now in the OSTSOME lineup.</p>
            </div>

            {/* Bottom flat lay */}
            <div className="absolute rounded-2xl overflow-hidden shadow-sm" style={{ top: '560px', left: '0', right: '0', zIndex: 2 }}>
              <img
                src={layoutImg}
                alt="FOST products"
                className="w-full object-cover object-center"
                style={{ height: '160px' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}