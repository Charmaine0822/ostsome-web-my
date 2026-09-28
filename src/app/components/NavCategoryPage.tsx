import { ChevronLeft } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../data/products';

const categoryMeta: Record<string, { description: string; emoji: string }> = {
  'Mobile Creator': { description: 'Gimbals, cameras, mics & mounting gear for content creators on the move.', emoji: '🎥' },
  'Mobile Audio':   { description: 'Earbuds and headphones for music, calls and everything in between.', emoji: '🎧' },
  'Gaming':         { description: 'Controllers, keyboards and monitors built for serious players.', emoji: '🎮' },
  'Smart Life':     { description: 'Smartwatches and smart home devices that make life easier.', emoji: '⌚' },
  'Health and Beauty':       { description: 'Health, beauty and recovery products to help you feel your best.', emoji: '💪' },
  'Travel & Carry': { description: 'Portable power, compact monitors and action cam gear for life on the go.', emoji: '✈️' },
  'Desk Setup':     { description: 'Monitors, webcams and peripherals to level up your workspace.', emoji: '🖥️' },
};

type NavCategoryPageProps = {
  category: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
};

export function NavCategoryPage({ category, onBack, onSelectProduct }: NavCategoryPageProps) {
  const { products, loading } = useProducts();
  const categoryProducts = products.filter(p => p.navCategory === category);
  const meta = categoryMeta[category];

  return (
    <section className="py-10 md:py-14 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#F16C10] transition-colors mb-8"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{meta?.emoji}</span>
            <h2 className="text-[26px] md:text-4xl font-bold text-black uppercase">{category}</h2>
          </div>
          {meta && <p className="text-sm text-neutral-500 max-w-lg">{meta.description}</p>}
          <p className="text-xs text-neutral-400 mt-1">{loading ? 'Loading…' : `${categoryProducts.length} products`}</p>
        </div>

        <div className="border-t border-neutral-100 mb-8" />

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#F16C10] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {categoryProducts.map(product => (
              <ProductCard key={product.handle} product={product} onClick={onSelectProduct} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-semibold text-black mb-2">Coming soon</p>
            <p className="text-sm text-neutral-500">We're adding more products to this category.</p>
          </div>
        )}
      </div>
    </section>
  );
}