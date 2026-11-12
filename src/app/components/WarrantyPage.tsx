import { ShieldCheck, Crown, LogIn, MessageCircle, ChevronLeft, Check } from 'lucide-react';
import { useAuth } from './AuthContext';

type WarrantyPageProps = {
  onBack?: () => void;
  onJoin?: () => void;
  onLogin?: () => void;
};

const WHATSAPP = '60108870937';

export function WarrantyPage({ onBack, onJoin, onLogin }: WarrantyPageProps) {
  const { user } = useAuth();

  const message = user
    ? `Hi, I'm a FOST member and would like to claim my +3 months warranty.\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nI'm attaching my order receipt.`
    : '';
  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  return (
    <section className="bg-white min-h-[70vh]">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#F16C10] transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F16C10]/10 flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="text-[#F16C10]" size={28} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-black mb-3 leading-tight">+3 Months Warranty</h1>
        <div className="inline-flex items-center gap-2 bg-[#F16C10]/10 border border-[#F16C10]/30 px-4 py-2 rounded-full mb-6">
          <Crown className="text-[#F16C10]" size={14} />
          <span className="text-[#F16C10] font-semibold text-xs uppercase tracking-wider">FOST members only</span>
        </div>
        <p className="text-neutral-600 text-sm leading-relaxed mb-8">
          Thanks for shopping with OSTSOME. Register as a FOST member (free) to unlock an extra 3 months of warranty on top of the standard warranty.
        </p>

        {!user ? (
          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 text-left">
            <p className="text-black font-bold text-sm mb-4">Step 1: Register as a FOST member first</p>
            <p className="text-neutral-500 text-sm mb-6">Once you're registered and logged in, you can submit your warranty request right here.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={onJoin} className="bg-[#F16C10] hover:bg-[#d65f0e] text-white px-6 py-3 rounded-xl font-bold text-sm transition w-full sm:w-auto">
                Join FOST — It's Free
              </button>
              <button onClick={onLogin} className="border-2 border-neutral-200 hover:border-neutral-400 text-black px-6 py-3 rounded-xl font-semibold text-sm transition w-full sm:w-auto flex items-center justify-center gap-2">
                <LogIn size={16} /> Already a member? Log in
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 text-left">
            <p className="flex items-center gap-2 text-green-600 text-sm font-bold mb-4">
              <Check size={16} /> Welcome, {user.firstName}. You're a FOST member.
            </p>
            <p className="text-black font-bold text-sm mb-2">Submit your warranty request</p>
            <ol className="text-neutral-500 text-sm leading-relaxed list-decimal pl-5 mb-6 space-y-1">
              <li>Tap the button below to message us on WhatsApp.</li>
              <li>Send us a photo or screenshot of your order receipt.</li>
              <li>We'll verify your order and activate your +3 months.</li>
            </ol>
            <a href={waHref} target="_blank" rel="noopener noreferrer"
              className="bg-[#F16C10] hover:bg-[#d65f0e] text-white px-6 py-3 rounded-xl font-bold text-sm transition inline-flex items-center justify-center gap-2 w-full sm:w-auto">
              <MessageCircle size={16} /> Submit via WhatsApp
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
