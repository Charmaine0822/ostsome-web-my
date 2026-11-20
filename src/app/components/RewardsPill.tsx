import { Gift } from 'lucide-react';

// Always-available entry to the Rewards page, so closing the pop-up never hides it.
// Brand-orange so it stands out from the page; a small pulsing dot draws the eye.
export function RewardsPill({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Open FOST Rewards"
      className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-[900] flex items-center gap-2 bg-[#F16C10] hover:bg-[#d65f0e] text-white shadow-xl shadow-[#F16C10]/30 rounded-full pl-4 pr-5 py-3.5 text-[15px] font-bold transition-colors">
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-60" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-black" />
      </span>
      <Gift size={18} strokeWidth={2.25} />
      Rewards
    </button>
  );
}
