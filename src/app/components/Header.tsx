import { Search, ShoppingCart, User, ChevronLeft, ChevronRight, X, LogOut, Crown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import logoImg from '../../imports/logo_circle.png';
import type { Product } from '../data/products';
import { useCart } from './CartContext';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from './AuthContext';
import { getFostPrice } from '../data/pricing';

type HeaderProps = {
  onNavToProducts?: () => void;
  onNavToHome?: () => void;
  onNavToBrands?: () => void;
  onNavToCategory?: (category: string) => void;
  onSelectProduct?: (product: Product) => void;
  onSearchNavigate?: (query: string) => void;
  onNavToLogin?: () => void;
  onNavToAccount?: (tab?: string) => void;
  onLogout?: () => void;
  currentPage?: string;
  currentNavCategory?: string | null;
};

const announcementMessages = [
  "🇲🇾 Malaysia's home for tech gadgets, audio & lifestyle gear",
  "⚡ Be The First To Get What's Next",
  "🔥 Latest of the Latest",
];

export function Header({ onNavToProducts, onNavToHome, onNavToBrands, onNavToCategory, onSelectProduct, onSearchNavigate, onNavToLogin, onNavToAccount, onLogout, currentPage, currentNavCategory }: HeaderProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [notifIndex, setNotifIndex] = useState(0);
  const [notifVisible, setNotifVisible] = useState(true);

  const notificationFeed = [
    {
      icon: '👑',
      label: 'FOST Rewards',
      title: 'Log in as a FOST member',
      sub: 'Unlock exclusive FOST prices →',
      isFost: true,
    },
    {
      icon: '🔥',
      label: 'Deal · 31% Off',
      title: 'Sennheiser ACCENTUM Plus Wireless',
      sub: 'RM 899 · Shop now →',
      productHandle: 'accentum-plus-wireless',
    },
    {
      icon: '🔥',
      label: 'Deal · 19% Off',
      title: 'Theragun PRO Plus Percussive Massage Device',
      sub: 'RM 2899 · Shop now →',
      productHandle: 'theragun-pro-plus-6th-generation',
    },
  ];

  function handleNotifClick(n: typeof notificationFeed[number]) {
    if (n.isFost) {
      onNavToLogin?.();
      return;
    }
    if (n.productHandle) {
      const match = products.find(p => p.handle === n.productHandle);
      if (match) onSelectProduct?.(match);
    }
  }

  const { totalItems, openCart } = useCart();
  const { products } = useProducts();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementVisible(false);
      setTimeout(() => {
        setAnnouncementIndex(i => (i + 1) % announcementMessages.length);
        setAnnouncementVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifVisible(false);
      setTimeout(() => {
        setNotifIndex(i => (i + 1) % 3);
        setNotifVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const searchResults = (() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed.length < 2) return [];

    // Split into individual words so word order, extra words, and spacing
    // differences (e.g. "skull candy" vs "Skullcandy") don't block a match —
    // every word in the query just needs to appear *somewhere* in the
    // product's searchable text, not as one exact contiguous phrase.
    const words = trimmed.split(/\s+/).filter(Boolean);
    const queryNoSpace = trimmed.replace(/\s+/g, '');

    return products
      .filter(p => {
        const haystack = `${p.title} ${p.vendor} ${p.category ?? ''} ${p.type ?? ''}`.toLowerCase();
        const wordsMatch = words.every(word => haystack.includes(word));
        // Covers the reverse case too — a query typed as one run-together
        // word (e.g. "turtlebeach") should still match a spaced title like
        // "Turtle Beach", so also compare with spaces stripped from both sides.
        const noSpaceMatch = queryNoSpace.length >= 2 && haystack.replace(/\s+/g, '').includes(queryNoSpace);
        return wordsMatch || noSpaceMatch;
      })
      .slice(0, 6);
  })();

  const scrollNav = (direction: 'left' | 'right') => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: direction === 'right' ? 150 : -150, behavior: 'smooth' });
    }
  };

  const navLinks = [
    'Mobile Creator', 'Mobile Audio', 'Gaming', 'Smart Life', 'Health and Beauty', 'Travel & Carry', 'Desk Setup',
  ];

  function handleSelectProduct(product: Product) {
    setSearchOpen(false);
    setSearchQuery('');
    onSelectProduct?.(product);
  }

  function handleSearchEnter() {
    if (searchQuery.trim()) {
      onSearchNavigate?.(searchQuery.trim());
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  return (
    <>
      <header className="w-full">
        {/* Logo + Icons Row */}
        <div className="bg-white text-black border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-24 md:h-28">

            {/* Logo + Tagline */}
            <button
              className="flex items-center gap-3 h-full py-3"
              onClick={onNavToHome}
            >
              <img
                src={logoImg}
                alt="OSTSOME"
                className="h-full w-auto object-contain object-left"
              />
              {/* Mobile tagline — visible only on small screens */}
              <div className="flex md:hidden flex-col justify-center gap-0">
                <span className="text-[11px] font-bold text-black tracking-tight leading-none">
                  The Tech You Choose.
                </span>
                <span className="text-[11px] font-bold text-[#F16C10] tracking-tight leading-none mt-0.5">
                  The Support You Deserve.
                </span>
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest mt-1">
                  Powered by Streamcast Asia
                </span>
              </div>
              {/* Desktop tagline — hidden on small screens */}
              <div className="hidden md:flex flex-col justify-center border-l-2 border-neutral-200 pl-5 gap-0">
                <span className="text-[15px] font-bold text-black tracking-tight leading-none">
                  The Tech You Choose.
                </span>
                <span className="text-[15px] font-bold text-[#F16C10] tracking-tight leading-none">
                  The Support You Deserve.
                </span>
                <span className="text-[12px] text-neutral-500 leading-snug mt-2 max-w-[280px]">
                  Curated products, expert advice and after-sales support from people who know the gear.
                </span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">
                  Powered by Streamcast Asia
                </span>
              </div>
            </button>


            <div className="flex items-center gap-4">
              {/* Notification Feed — sits just left of icons */}
              <div className="hidden lg:block relative w-[260px] h-[68px] shrink-0">
                {notificationFeed.map((n, i) => (
                  <div
                    key={i}
                    onClick={() => handleNotifClick(n)}
                    style={{
                      opacity: notifVisible && i === notifIndex ? 1 : 0,
                      transform: notifVisible && i === notifIndex ? 'translateY(0)' : 'translateY(-4px)',
                      transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s ease',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      pointerEvents: i === notifIndex ? 'auto' : 'none',
                      background: '#FFF8F1',
                    }}
                    className={`group flex items-start gap-3 rounded-xl px-4 py-3 w-[260px] border border-[#F16C10]/30 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(241,108,16,0.18)] hover:-translate-y-0.5 cursor-pointer`}
                  >
                    <span className="relative text-xl leading-none mt-0.5">
                      {n.icon}
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F16C10] animate-pulse" />
                    </span>
                    <div className="min-w-0">
                      <span className="inline-block text-[9px] font-black uppercase tracking-widest text-white bg-[#F16C10] rounded-full px-2 py-0.5 mb-1">
                        {n.label}
                      </span>
                      <p className="text-[13px] font-bold text-black leading-snug line-clamp-2">{n.title}</p>
                      <p className="text-[11px] text-[#F16C10] font-semibold mt-0.5">{n.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSearchOpen(true)}
                className="hover:text-[#F16C10] transition-colors"
              >
                <Search size={24} />
              </button>

              {/* Cart icon with badge */}
              <button
                onClick={openCart}
                className="relative hover:text-[#F16C10] transition-colors"
                aria-label={`Cart (${totalItems} items)`}
              >
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F16C10] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* User / Profile */}
              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setProfileOpen(o => !o)}
                      className="w-9 h-9 rounded-full bg-[#F16C10] text-white text-xs font-bold flex items-center justify-center hover:bg-[#d65f0e] transition"
                      aria-label="My account"
                    >
                      {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
                    </button>

                    {profileOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                        <div className="absolute right-0 top-12 z-40 w-64 bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden">
                          <div className="bg-[#F16C10]/5 px-4 py-4 border-b border-neutral-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#F16C10] text-white text-sm font-bold flex items-center justify-center shrink-0">
                                {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-black truncate">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 bg-[#F16C10]/10 border border-[#F16C10]/20 rounded-full px-3 py-1 w-fit">
                              <Crown size={11} className="text-[#F16C10]" />
                              <span className="text-[10px] font-bold text-[#F16C10] uppercase tracking-wider">FOST Member</span>
                            </div>
                          </div>

                          <div className="py-2">
                            {[
                              { label: 'My Orders',    emoji: '📦', tab: 'orders'  },
                              { label: 'My Profile',   emoji: '👤', tab: 'profile' },
                              { label: 'Saved Items',  emoji: '❤️', tab: 'saved'   },
                              { label: 'Member Perks', emoji: '🏷️', tab: 'perks'   },
                            ].map(item => (
                              <button
                                key={item.label}
                                onClick={() => { setProfileOpen(false); onNavToAccount?.(item.tab); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition text-left"
                              >
                                <span>{item.emoji}</span>
                                {item.label}
                              </button>
                            ))}
                          </div>

                          <div className="border-t border-neutral-100 py-2">
                            <button
                              onClick={() => { logout(); setProfileOpen(false); onLogout?.(); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition text-left font-medium"
                            >
                              <LogOut size={14} />
                              Log out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    onClick={onNavToLogin}
                    className="hover:text-[#F16C10] transition-colors"
                    aria-label="Login / Account"
                  >
                    <User size={24} />
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Orange Announcement Bar — rotating messages */}
        <div className="bg-[#F16C10] text-white">
          <div className="max-w-7xl mx-auto px-4 py-2.5 text-center text-sm font-semibold tracking-wide uppercase">
            <span
              style={{
                display: 'inline-block',
                transition: 'opacity 0.4s ease',
                opacity: announcementVisible ? 1 : 0,
              }}
            >
              {announcementMessages[announcementIndex]}
            </span>
          </div>
        </div>

        {/* Mobile Notification Strip — below announcement bar, hidden on desktop */}
        <div
          onClick={() => handleNotifClick(notificationFeed[notifIndex])}
          className="lg:hidden bg-[#FFF8F1] border-b border-[#F16C10]/30 transition-shadow cursor-pointer"
        >
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="relative text-sm">
              {notificationFeed[notifIndex].icon}
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#F16C10] animate-pulse" />
            </span>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[9px] font-black uppercase tracking-widest text-white bg-[#F16C10] rounded-full px-2 py-0.5 mr-1.5">
                {notificationFeed[notifIndex].label}
              </span>
              <span
                className="text-[11px] font-bold text-black"
                style={{ transition: 'opacity 0.4s ease', opacity: notifVisible ? 1 : 0 }}
              >
                {notificationFeed[notifIndex].title}
              </span>
            </div>
            <span className="text-[11px] text-[#F16C10] font-semibold shrink-0 whitespace-nowrap">
              {notificationFeed[notifIndex].sub.split('·')[1]?.trim() || 'View →'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b bg-white">
          <div className="max-w-7xl mx-auto relative flex items-center">
            <button
              onClick={() => scrollNav('left')}
              className="md:hidden shrink-0 px-1 py-4 text-neutral-400 hover:text-[#F16C10] transition-colors z-10"
            >
              <ChevronLeft size={18} />
            </button>
            <div
              ref={navRef}
              className="flex items-center gap-6 text-sm text-neutral-700 overflow-x-auto scrollbar-hide px-2 md:px-4 py-4 scroll-smooth"
            >
              <button
                onClick={onNavToHome}
                className={`whitespace-nowrap hover:text-[#F16C10] transition-colors ${currentPage === 'home' ? 'text-[#F16C10] font-semibold' : ''}`}
              >
                New & Trending
              </button>
              <button
                onClick={onNavToProducts}
                className={`whitespace-nowrap hover:text-[#F16C10] transition-colors ${currentPage === 'products' ? 'text-[#F16C10] font-semibold' : ''}`}
              >
                All Products
              </button>
              {navLinks.map(cat => (
                <button
                  key={cat}
                  onClick={() => onNavToCategory?.(cat)}
                  className={`whitespace-nowrap hover:text-[#F16C10] transition-colors ${
                    currentPage === 'nav-category' && currentNavCategory === cat ? 'text-[#F16C10] font-semibold' : ''
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                onClick={onNavToBrands}
                className={`whitespace-nowrap hover:text-[#F16C10] transition-colors ${
                  currentPage === 'brands' || currentPage === 'brand-detail' ? 'text-[#F16C10] font-semibold' : ''
                }`}
              >
                Brands
              </button>
            </div>
            <button
              onClick={() => scrollNav('right')}
              className="md:hidden shrink-0 px-1 py-4 text-neutral-400 hover:text-[#F16C10] transition-colors z-10"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
          />
          <div className="relative z-10 bg-white w-full shadow-2xl">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSearchEnter();
                }}
              >
                <div className="flex items-center gap-3">
                  <Search size={20} className="text-neutral-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search products, brands…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 text-base outline-none py-2 text-black placeholder-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="text-neutral-400 hover:text-black transition"
                  >
                    <X size={22} />
                  </button>
                </div>
              </form>
            </div>

            {searchResults.length > 0 && (
              <div className="max-w-3xl mx-auto px-4 pb-4 border-t border-neutral-100">
                {searchResults.map(product => (
                  <button
                    key={product.handle}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full flex items-center gap-4 py-3 hover:bg-neutral-50 rounded-xl px-2 transition text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#F16C10] uppercase tracking-wider mb-0.5">{product.vendor}</p>
                      <p className="text-sm font-medium text-black truncate">{product.title}</p>
                    </div>
                    {Boolean(user) ? (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-sm font-bold text-[#F16C10]">RM {getFostPrice(product.price).toFixed(2)}</span>
                        <span className="text-[10px] text-neutral-400 line-through">RM {product.price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-black shrink-0">RM {product.price.toFixed(2)}</span>
                    )}
                  </button>
                ))}
                <button
                  onClick={handleSearchEnter}
                  className="w-full text-center text-sm text-[#F16C10] font-semibold py-3 hover:underline"
                >
                  See all results for "{searchQuery}" →
                </button>
              </div>
            )}

            {searchQuery.trim().length > 1 && searchResults.length === 0 && (
              <div className="max-w-3xl mx-auto px-4 pb-6 border-t border-neutral-100 pt-4 text-center text-sm text-neutral-400">
                No products found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}