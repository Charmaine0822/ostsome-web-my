// Always-available entry to the Rewards page, so closing the pop-up never hides it.
export function RewardsPill({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Open FOST Rewards"
      className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-[900] bg-white text-black border border-neutral-200 hover:border-black shadow-lg rounded-full px-5 py-3 text-sm font-semibold transition-colors">
      Rewards
    </button>
  );
}
