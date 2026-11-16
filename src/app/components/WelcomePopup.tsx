import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type Props = { onSeeRewards: () => void };

// Shown once per visit. Close with the X, Esc, "Maybe later", or by clicking outside.
// A permanent "Rewards" button (RewardsPill) stays on the site afterwards.
export function WelcomePopup({ onSeeRewards }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const skip = /^\/(warranty|checkout|admin|rewards)/.test(window.location.pathname);
    let seen = false;
    try { seen = sessionStorage.getItem('ost_welcome_seen') === '1'; } catch { /* storage unavailable */ }
    if (skip || seen) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem('ost_welcome_seen', '1'); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={close} role="dialog" aria-modal="true" aria-label="FOST Rewards">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={close} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-black flex items-center justify-center transition"><X size={18} /></button>
        <h2 className="text-2xl font-semibold tracking-tight text-black pr-8">Every order earns points.</h2>
        <p className="text-neutral-500 text-sm mt-2 leading-relaxed">Spend RM1, get 1 point. Collect 10 points for RM1 off selected products.</p>
        <div className="border-t border-neutral-200 mt-6 pt-6">
          <p className="text-sm font-semibold text-black">Bring a friend</p>
          <p className="text-neutral-500 text-sm mt-1 leading-relaxed">You each get RM30 when they join with your code.</p>
        </div>
        <button onClick={() => { close(); onSeeRewards(); }} className="mt-8 w-full bg-black hover:bg-neutral-800 text-white py-3.5 rounded-full text-sm font-semibold transition">See my rewards</button>
        <button onClick={close} className="mt-2 w-full py-2.5 text-sm text-neutral-500 hover:text-black transition">Maybe later</button>
      </div>
    </div>
  );
}
