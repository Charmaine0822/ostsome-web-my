import { useProducts } from '../hooks/useProducts';
import { CRUSHER_HANDLE, MTW5_HANDLE } from '../data/homeFeatured';
import { getFostPrice } from '../data/pricing';
import { Crown, Tag, Zap, Users, Gift, CalendarHeart, Truck, Heart, ChevronLeft, LogIn } from 'lucide-react';
const layoutImg = '/home-featured/momentum-5.jpg';

const perks = [
  {
    icon: Tag,
    title: 'Exclusive FOST Pricing',
    description: "Log in as a FOST member and unlock member-only prices across the site. Your FOST price shows up automatically wherever you see a product — no codes, no waiting for a sale.",
  },
  {
    icon: Truck,
    title: 'Free Shipping in Malaysia',
    description: 'FOST members get free shipping on every order delivered within Malaysia — no minimum spend required. Everyone else needs to spend RM 400 to qualify; members never have to.',
  },
  {
    icon: Zap,
    title: 'Early Access to Launches',
    description: 'New drops and restocks go to FOST members first. Be first in line before things sell out — or before everyone else even knows they exist.',
  },
  {
    icon: Users,
    title: 'Product Testing Opportunities',
    description: "Get invited to test upcoming products before they launch. Your feedback genuinely shapes what we bring in next.",
  },
  {
    icon: Gift,
    title: 'Surprise Member Flash Sales',
    description: 'Random, member-only flash sales that pop up with no warning — another reason to keep an eye on your inbox.',
  },
  {
    icon: CalendarHeart,
    title: 'Invitations to Exclusive Events',
    description: 'Get invited to launch events, brand collabs, and behind-the-scenes experiences you won\u2019t see advertised anywhere else.',
  },
];

const faqs = [
  {
    q: 'How do I get the FOST price on products?',
    a: 'Just log in to your FOST account before you shop. Once you\u2019re signed in, member pricing shows automatically on every eligible product page, your cart, and checkout — there\u2019s nothing extra to enter.',
  },
  {
    q: 'Does free shipping really have no minimum?',
    a: 'Correct — for deliveries within Malaysia, FOST members get free shipping on every order, regardless of order size. Non-members still need to hit RM 400 to qualify.',
  },
  {
    q: 'Does it cost anything to join?',
    a: 'No. FOST is free to join, always. There\u2019s no subscription fee and no catch.',
  },
  {
    q: 'I\u2019m already a member — why don\u2019t I see member pricing?',
    a: 'Make sure you\u2019re logged in. If you\u2019re still not seeing FOST prices after logging in, try refreshing the page or reach out to our support team.',
  },
];

type FostMembershipPageProps = {
  onBack?: () => void;
  onJoin?: () => void;
  onLogin?: () => void;
};

export function FostMembershipPage({ onBack, onJoin, onLogin }: FostMembershipPageProps) {
  const { products } = useProducts();
  const crusher = products.find(p => p.handle === CRUSHER_HANDLE);
  const mtw5 = products.find(p => p.handle === MTW5_HANDLE);
  const sennheiserFOST = crusher?.images[0];
  const firstAccessFOST = '/home-featured/looki-l1.jpg';
  const newSeasonFOST = mtw5?.images[0];
  return (
    <section className="bg-white">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#F16C10] transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#F16C10]/10 border border-[#F16C10]/30 px-4 py-2 rounded-full mb-6">
          <Crown className="text-[#F16C10]" size={16} />
          <span className="text-[#F16C10] font-semibold text-xs uppercase tracking-wider">FOST Membership</span>
        </div>
        <h1 className="text-[36px] lg:text-6xl font-bold text-black mb-5 leading-tight">
          Friends Get More.
        </h1>
        <p className="text-base lg:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-8">
          The people who hear about it first, pay less, and get access before everyone else.
          FOST is Ostsome's free membership — log in, and the perks apply themselves.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-5">
          <button
            onClick={onJoin}
            className="bg-[#F16C10] hover:bg-[#d65f0e] text-white px-8 py-4 rounded-xl font-bold text-base transition w-full sm:w-auto"
          >
            Join FOST — It's Free
          </button>
          <button
            onClick={onLogin}
            className="border-2 border-neutral-200 hover:border-neutral-400 text-black px-8 py-4 rounded-xl font-semibold text-base transition w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            Log In
          </button>
        </div>
        <div className="inline-flex items-center gap-2 border border-neutral-200 px-4 py-2 rounded-full">
          <Heart className="text-[#F16C10]" size={14} />
          <span className="text-black text-sm font-medium">Free to join. Always.</span>
        </div>
      </div>

      {/* Pricing highlight strip */}
      <div className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[#F16C10] text-xs font-bold uppercase tracking-widest mb-2">Member Pricing, Automatically</p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3 leading-snug">
              Log in, and every price on the site quietly gets better.
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
              FOST prices appear the moment you sign in — on product pages, in your cart, and at checkout.
              No promo codes, no waiting for a sale event, no fine print.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-black max-w-sm w-full">
            <p className="text-[#F16C10] text-[10px] font-bold uppercase tracking-widest mb-2">Member Pricing</p>
            <p className="text-black text-sm font-bold mb-3 leading-snug">Skullcandy Crusher 720 Sensory Bass Headphones</p>
            <p className="text-neutral-400 text-[11px] mb-0.5">Public Price</p>
            <p className="text-neutral-400 text-base line-through mb-2">{crusher ? `RM ${crusher.price.toFixed(2)}` : 'Loading…'}</p>
            <p className="text-[#F16C10] text-[10px] font-bold uppercase tracking-wider mb-0.5">FOST Price</p>
            <p className="text-[#F16C10] text-3xl font-bold mb-3">{crusher ? `RM ${getFostPrice(crusher.price).toFixed(2)}` : 'Loading…'}</p>
            <div className="bg-[#F16C10]/10 text-[#F16C10] text-xs font-bold px-3 py-1.5 rounded-full inline-block">
              {crusher ? `You save RM ${(crusher.price - getFostPrice(crusher.price)).toFixed(2)}` : 'Member pricing'}
            </div>
          </div>
        </div>
      </div>

      {/* Full perks grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl lg:text-3xl font-bold text-black text-center mb-2">Everything you get as a member</h2>
        <p className="text-neutral-500 text-center text-sm mb-12">All free. All automatic the moment you log in.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {perks.map((perk) => {
            const Icon = perk.icon;
            return (
              <div key={perk.title} className="border border-neutral-100 rounded-2xl p-6 hover:border-[#F16C10]/40 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#F16C10]/10 flex items-center justify-center mb-4">
                  <Icon className="text-[#F16C10]" size={22} strokeWidth={1.5} />
                </div>
                <p className="text-black font-bold text-base mb-1.5">{perk.title}</p>
                <p className="text-neutral-500 text-sm leading-relaxed">{perk.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lifestyle photo strip */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: '200px' }}>
            <img src={sennheiserFOST} alt="Skullcandy Crusher 720" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: '200px' }}>
            <img src={firstAccessFOST} alt="Looki L1" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: '200px' }}>
            <img src={newSeasonFOST} alt="Sennheiser MOMENTUM True Wireless 5" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: '200px' }}>
            <img src={layoutImg} alt="FOST products" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-neutral-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-black text-center mb-10">Common questions</h2>
          <div className="flex flex-col gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white border border-neutral-100 rounded-2xl p-6">
                <p className="text-black font-bold text-sm mb-2">{faq.q}</p>
                <p className="text-neutral-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold text-black mb-3">Ready to pay less and see more first?</h2>
        <p className="text-neutral-500 text-sm mb-8">Join FOST in seconds. No fees, no fine print — just better access.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onJoin}
            className="bg-[#F16C10] hover:bg-[#d65f0e] text-white px-8 py-4 rounded-xl font-bold text-base transition w-full sm:w-auto"
          >
            Join FOST — It's Free
          </button>
          <button
            onClick={onLogin}
            className="border-2 border-neutral-200 hover:border-neutral-400 text-black px-8 py-4 rounded-xl font-semibold text-base transition w-full sm:w-auto"
          >
            Already a member? Log in
          </button>
        </div>
      </div>
    </section>
  );
}