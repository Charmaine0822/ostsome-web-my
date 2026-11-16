import { useEffect, useState } from 'react';
import { X, Coins, UserPlus } from 'lucide-react';
import { useAuth } from './AuthContext';

type Props = { onSeeProducts: () => void; onJoin: () => void };

const PERKS = [
  { icon: Coins, title: 'Earn points', text: 'Spend RM1, earn 1 point. Every 10 points = RM1 off selected exclusive products.' },
  { icon: UserPlus, title: 'Invite a friend', text: 'You get RM30, your friend gets RM30.' },
];

// Shown once per visit; closed with the X, the Esc key, or by clicking outside.
export function WelcomePopup({ onSeeProducts, onJoin }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const skip = /^\/(warranty|checkout|admin)/.test(window.location.pathname);
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
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={close}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={close} aria-label="Close" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"><X size={18} /></button>
        <div className="bg-[#F16C10] text-white px-6 pt-8 pb-6 rounded-t-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">Friends of Ostsome · Free to join</p>
          <h2 className="text-2xl font-bold leading-tight">Earn points. Invite friends.</h2>
        </div>
        <ul className="px-6 py-5 grid gap-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F16C10]/10 flex items-center justify-center shrink-0"><Icon size={18} className="text-[#F16C10]" /></div>
              <div><p className="text-sm font-bold text-black">{title}</p><p className="text-xs text-neutral-500 leading-relaxed">{text}</p></div>
            </li>
          ))}
        </ul>
        <div className="px-6 pb-6 grid gap-2">
          <button onClick={() => { close(); onSeeProducts(); }} className="bg-black hover:bg-neutral-800 text-white py-3 rounded-xl font-bold text-sm transition">See products you can use points on</button>
          {!user && <button onClick={() => { close(); onJoin(); }} className="border-2 border-[#F16C10] text-[#F16C10] hover:bg-[#F16C10]/5 py-3 rounded-xl font-bold text-sm transition">Join FOST — it's free</button>}
        </div>
      </div>
    </div>
  );
}
