import { useState, useEffect, useRef } from 'react';
import { useAuth } from './components/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FridayFlashDeals } from './components/FridayFlashDeals';
import { LaunchExclusive } from './components/LaunchExclusive';
import { OneSeasonOff } from './components/OneSeasonOff';
import { OneSeasonOffPage } from './components/OneSeasonOffPage';
import { WhatsNewThisWeek } from './components/WhatsNewThisWeek';
import { ShoppableSetup } from './components/ShoppableSetup';
import { DiscoveryByLifestyle } from './components/DiscoveryByLifestyle';
import { WhyEnthusiasts } from './components/WhyEnthusiasts';
import { OurStory } from './components/OurStory';
import { ContactAndTrust } from './components/ContactAndTrust';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { FostMembership } from './components/FostMembership';
import { FostMembershipPage } from './components/FostMembershipPage';
import { ProductListing } from './components/ProductListing';
import { ProductDetail } from './components/ProductDetail';
import { BrandsPage } from './components/BrandsPage';
import { BrandDetail } from './components/BrandDetail';
import { NavCategoryPage } from './components/NavCategoryPage';
import { StudyModePage } from './components/StudyModePage';
import { TravelReadyPage } from './components/TravelReadyPage';
import { SmartHomePage } from './components/SmartHomePage';
import { CartProvider, useCart } from './components/CartContext';
import { AuthProvider } from './components/AuthContext';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { FostAuthModal } from './components/FostAuthModal';
import { AccountPage } from './components/AccountPage';
import { AdminDashboard } from './components/AdminDashboard';
import { LaunchExclusivePage } from './components/LaunchExclusivePage';
import type { Tab as AccountTab } from './components/AccountPage';
import { useProducts } from './hooks/useProducts';
import type { Product } from './data/products';

type Page = 'home' | 'products' | 'product-detail' | 'brands' | 'brand-detail' | 'nav-category' | 'checkout' | 'account' | 'admin' | 'launch-exclusive' | 'one-season-off' | 'fost-membership' | 'study-mode' | 'travel-ready' | 'smart-home';

// Everything needed to fully restore a screen — this is what gets stored in
// browser history so the back/forward buttons can actually move between
// in-app pages instead of leaving the site entirely (the app previously
// used plain React state with no History API integration, so there was
// no history stack for the browser to navigate within).
type NavState = {
  page: Page;
  productHandle: string | null;
  brand: string | null;
  navCategory: string | null;
  search: string;
  accountTab: AccountTab;
};

function buildUrl(state: NavState): string {
  switch (state.page) {
    case 'product-detail':
      return state.productHandle ? `/products/${state.productHandle}` : '/products';
    case 'products':
      return state.search ? `/products?q=${encodeURIComponent(state.search)}` : '/products';
    case 'brands':
      return '/brands';
    case 'brand-detail':
      return state.brand ? `/brands/${encodeURIComponent(state.brand)}` : '/brands';
    case 'nav-category':
      return state.navCategory ? `/category/${encodeURIComponent(state.navCategory)}` : '/';
    case 'account':
      return state.accountTab ? `/account?tab=${state.accountTab}` : '/account';
    case 'admin':
      return '/admin';
    case 'launch-exclusive':
      return '/launch';
    case 'one-season-off':
      return '/clearance';
    case 'fost-membership':
      return '/fost';
    case 'study-mode':
      return '/study-mode';
    case 'travel-ready':
      return '/travel-ready';
    case 'smart-home':
      return '/smart-home';
    case 'checkout':
      return '/checkout';
    case 'home':
    default:
      return '/';
  }
}

function AppInner() {
  const { user } = useAuth();
  const { openCart } = useCart();
  const [page, setPage] = useState<Page>('home');
  const [authModal, setAuthModal] = useState<{ open: boolean; view: 'login' | 'signup' }>({ open: false, view: 'login' });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedNavCategory, setSelectedNavCategory] = useState<string | null>(null);
  const [initialSearch, setInitialSearch] = useState<string>('');
  const [accountTab, setAccountTab] = useState<AccountTab>('orders');

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const { products: liveProducts } = useProducts();
  const heshAncProduct = liveProducts.find(p => p.handle === 'skullcandy-hesh-anc-noise-canceling-wireless-headphones');
  const lookiProduct = liveProducts.find(p => p.handle === 'looki-l1');

  // Friday flash deal products, in the order they should display in the
  // FridayFlashDeals homepage section. Keep this handle list in sync with
  // FLASH_SALE_PRICES in src/app/data/flashSale.ts — if a handle is added or
  // removed there for a future sale, update it here too.
  const flashDealHandles = [
    'pre-order-cleer-arc-iii-music-open-ear-wireless-earbuds',
    'skullcandy-dime-evo-true-wireless-earbuds',
    'skullcandy-push-ultra-anc-true-wireless-earbuds',
    'skullcandy-hesh-evo-wireless-headphones',
    'skullcandy-crusher-3-0-wireless-headphones',
  ];
  const flashDealProducts = flashDealHandles
    .map(handle => liveProducts.find(p => p.handle === handle))
    .filter((p): p is Product => Boolean(p));

  // Mirrors current nav-relevant state without triggering re-renders — used
  // so goTo() always has the latest values even though React state updates
  // are asynchronous (avoids stale-closure bugs when building history state).
  const navRef = useRef<NavState>({
    page: 'home', productHandle: null, brand: null, navCategory: null, search: '', accountTab: 'orders',
  });

  // Central navigation function: updates React state AND pushes a real
  // browser history entry, so the back/forward buttons have something to
  // actually navigate between.
  function goTo(
    next: {
      page: Page;
      product?: Product | null;
      brand?: string | null;
      navCategory?: string | null;
      search?: string;
      accountTab?: AccountTab;
    },
    options: { scroll?: boolean; replace?: boolean } = {}
  ) {
    const { scroll = true, replace = false } = options;

    setPage(next.page);
    if ('product' in next) setSelectedProduct(next.product ?? null);
    if ('brand' in next) setSelectedBrand(next.brand ?? null);
    if ('navCategory' in next) setSelectedNavCategory(next.navCategory ?? null);
    if ('search' in next) setInitialSearch(next.search ?? '');
    if ('accountTab' in next) setAccountTab(next.accountTab ?? 'orders');

    const historyState: NavState = {
      page: next.page,
      productHandle: 'product' in next ? (next.product?.handle ?? null) : navRef.current.productHandle,
      brand: 'brand' in next ? (next.brand ?? null) : navRef.current.brand,
      navCategory: 'navCategory' in next ? (next.navCategory ?? null) : navRef.current.navCategory,
      search: next.search ?? '',
      accountTab: next.accountTab ?? navRef.current.accountTab,
    };
    navRef.current = historyState;

    const url = buildUrl(historyState);
    if (replace) window.history.replaceState(historyState, '', url);
    else window.history.pushState(historyState, '', url);

    if (scroll) scrollTop();
  }

  // Restores the screen from a history entry when the user presses the
  // browser's back/forward buttons (does NOT push a new entry — just syncs
  // React state to whatever the browser is now pointing at).
  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const state = event.state as NavState | null;

      if (!state) {
        // No state means we've gone back past our first pushed entry —
        // treat it as home rather than leaving state stuck on the old page.
        navRef.current = { page: 'home', productHandle: null, brand: null, navCategory: null, search: '', accountTab: 'orders' };
        setPage('home');
        setSelectedProduct(null);
        setSelectedBrand(null);
        setSelectedNavCategory(null);
        setInitialSearch('');
        window.scrollTo({ top: 0 });
        return;
      }

      navRef.current = state;
      setPage(state.page);
      setSelectedBrand(state.brand);
      setSelectedNavCategory(state.navCategory);
      setInitialSearch(state.search);
      setAccountTab(state.accountTab);

      if (state.page === 'product-detail' && state.productHandle) {
        const found = liveProducts.find(p => p.handle === state.productHandle);
        setSelectedProduct(found ?? null);
      } else {
        setSelectedProduct(null);
      }

      window.scrollTo({ top: 0 });
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [liveProducts]);

  // Secret admin access: navigate to /#admin or press Ctrl+Shift+A
  // Also handles /products/[handle] URL routing for QR codes and direct links
  useEffect(() => {
    if (window.location.hash === '#admin') {
      goTo({ page: 'admin' }, { replace: true, scroll: false });
    }
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') goTo({ page: 'admin' });
    };
    window.addEventListener('keydown', handler);

    // Handle deep links / refreshes for every page type buildUrl() can produce
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);

    const productMatch = path.match(/^\/products\/([^?]+)/);
    const brandMatch = path.match(/^\/brands\/([^?]+)/);
    const categoryMatch = path.match(/^\/category\/([^?]+)/);

    if (productMatch) {
      // We're on a /products/[handle] URL. liveProducts may still be
      // loading (starts as an empty array on first mount) — if we fell
      // through to the "no match, reset to home" branch below while it
      // was still empty, we'd wipe out the URL before products even had
      // a chance to load, permanently losing the deep link (this is
      // exactly what broke QR code landings on a fresh, uncached visit).
      // So: only act once liveProducts has actually loaded; until then,
      // do nothing and let this effect re-run when it does.
      if (liveProducts.length > 0) {
        const handle = decodeURIComponent(productMatch[1]);
        const found = liveProducts.find(p => p.handle === handle);
        if (found) {
          goTo({ page: 'product-detail', product: found }, { replace: true, scroll: false });
        }
        // If genuinely not found even after products loaded, leave the
        // URL as-is rather than forcing a redirect — avoids false
        // negatives from a slow/partial fetch being mistaken for "product
        // doesn't exist".
      }
    } else if (path === '/account' || path.startsWith('/account/')) {
      // Deep link used by the Shopify order-confirmation email's "View your
      // order" button, so customers land on our own account/orders page
      // instead of Shopify's default hosted order-status page.
      const tab = (search.get('tab') as AccountTab) || 'orders';
      goTo({ page: 'account', accountTab: tab }, { replace: true, scroll: false });
    } else if (path === '/products') {
      goTo({ page: 'products', search: search.get('q') ?? '' }, { replace: true, scroll: false });
    } else if (path === '/brands') {
      goTo({ page: 'brands' }, { replace: true, scroll: false });
    } else if (brandMatch) {
      goTo({ page: 'brand-detail', brand: decodeURIComponent(brandMatch[1]) }, { replace: true, scroll: false });
    } else if (categoryMatch) {
      goTo({ page: 'nav-category', navCategory: decodeURIComponent(categoryMatch[1]) }, { replace: true, scroll: false });
    } else if (path === '/launch') {
      goTo({ page: 'launch-exclusive' }, { replace: true, scroll: false });
    } else if (path === '/clearance') {
      goTo({ page: 'one-season-off' }, { replace: true, scroll: false });
    } else if (path === '/fost') {
      goTo({ page: 'fost-membership' }, { replace: true, scroll: false });
    } else if (path === '/study-mode') {
      goTo({ page: 'study-mode' }, { replace: true, scroll: false });
    } else if (path === '/travel-ready') {
      goTo({ page: 'travel-ready' }, { replace: true, scroll: false });
    } else if (path === '/smart-home') {
      goTo({ page: 'smart-home' }, { replace: true, scroll: false });
    } else if (window.location.hash !== '#admin') {
      // Establish an initial history entry for the home page so that
      // pressing "back" from the very first navigation has somewhere
      // defined to land, rather than an entry with no state at all.
      window.history.replaceState(navRef.current, '', '/');
    }

    return () => window.removeEventListener('keydown', handler);
  }, [liveProducts]);

  const handleSelectProduct = (product: Product) => {
    goTo({ page: 'product-detail', product });
  };

  const handleSelectBrand = (brand: string) => {
    goTo({ page: 'brand-detail', brand });
  };

  const handleNavToNavCategory = (category: string) => {
    goTo({ page: 'nav-category', navCategory: category });
  };

  const handleNavToLifestylePage = (lifestylePage: 'study-mode' | 'travel-ready' | 'smart-home') => {
    goTo({ page: lifestylePage });
  };

  const handleNavToProducts = () => goTo({ page: 'products', search: '' });
  const handleNavToHome = () => goTo({ page: 'home' });
  const handleNavToBrands = () => goTo({ page: 'brands' });

  const handleSearchNavigate = (query: string) => {
    goTo({ page: 'products', search: query });
  };

  const handleBackFromProduct = () => {
    if (selectedBrand) goTo({ page: 'brand-detail', brand: selectedBrand });
    else if (selectedNavCategory) goTo({ page: 'nav-category', navCategory: selectedNavCategory });
    else goTo({ page: 'products' });
  };

  const handleGoToCheckout = () => { openCart(); };
  const handleOrderComplete = (_orderNum: string) => {};
  const handleBackFromCheckout = () => goTo({ page: 'home' });

  const showHeader = page !== 'checkout';

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {authModal.open && (
        <FostAuthModal
          initialView={authModal.view}
          onClose={() => setAuthModal({ open: false, view: 'login' })}
        />
      )}

      <CartDrawer />
      {showHeader && <FloatingWhatsApp />}

      {showHeader && (
        <Header
          onNavToProducts={handleNavToProducts}
          onNavToHome={handleNavToHome}
          onNavToBrands={handleNavToBrands}
          onNavToCategory={handleNavToNavCategory}
          onSelectProduct={handleSelectProduct}
          onSearchNavigate={handleSearchNavigate}
          onNavToLogin={() => {
            if (user) goTo({ page: 'account', accountTab: 'orders' });
            else setAuthModal({ open: true, view: 'login' });
          }}
          onNavToAccount={(tab) => {
            goTo({ page: 'account', accountTab: (tab as AccountTab) ?? 'orders' });
          }}
          onLogout={() => goTo({ page: 'home' })}
          currentPage={page}
          currentNavCategory={selectedNavCategory}
        />
      )}

      {page === 'home' && (
        <>
          <Hero
            products={liveProducts}
            onSelectProduct={handleSelectProduct}
          />
          <FridayFlashDeals
            products={flashDealProducts}
            isFostMember={Boolean(user)}
            onSelectProduct={handleSelectProduct}
            onJoinFost={() => setAuthModal({ open: true, view: 'signup' })}
          />
          <WhatsNewThisWeek onShopAll={handleNavToProducts} onSelectProduct={handleSelectProduct} />
          <DiscoveryByLifestyle onNavToLifestylePage={handleNavToLifestylePage} />
          <FostMembership
            onJoin={() => setAuthModal({ open: true, view: 'signup' })}
            onLogin={() => setAuthModal({ open: true, view: 'login' })}
            onLearnMore={() => goTo({ page: 'fost-membership' })}
          />
          <LaunchExclusive
            onSelectProduct={handleSelectProduct}
            onViewAll={() => goTo({ page: 'launch-exclusive' })}
          />
          <WhyEnthusiasts />
          <OneSeasonOff
            onSelectProduct={handleSelectProduct}
            onViewAll={() => goTo({ page: 'one-season-off' })}
          />
          <ShoppableSetup onSelectProduct={handleSelectProduct} />
          <OurStory />
          <ContactAndTrust />
        </>
      )}

      {page === 'products' && (
        <ProductListing
          key={initialSearch}
          onSelectProduct={handleSelectProduct}
          initialSearch={initialSearch}
        />
      )}

      {page === 'product-detail' && selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onBack={handleBackFromProduct}
          onCheckout={handleGoToCheckout}
        />
      )}

      {page === 'brands' && (
        <BrandsPage onSelectBrand={handleSelectBrand} />
      )}

      {page === 'brand-detail' && selectedBrand && (
        <BrandDetail
          brand={selectedBrand}
          onBack={() => goTo({ page: 'brands' })}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {page === 'nav-category' && selectedNavCategory && (
        <NavCategoryPage
          category={selectedNavCategory}
          onBack={() => goTo({ page: 'home' })}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {page === 'study-mode' && (
        <StudyModePage
          onBack={() => goTo({ page: 'home' })}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {page === 'travel-ready' && (
        <TravelReadyPage
          onBack={() => goTo({ page: 'home' })}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {page === 'smart-home' && (
        <SmartHomePage
          onBack={() => goTo({ page: 'home' })}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {page === 'checkout' && (
        <CheckoutPage
          onBack={handleBackFromCheckout}
          onOrderComplete={handleOrderComplete}
        />
      )}

      {page === 'admin' && <AdminDashboard />}

      {page === 'launch-exclusive' && (
        <LaunchExclusivePage
          onBack={() => goTo({ page: 'home' })}
          onSelectProduct={handleSelectProduct}
          onJoinFost={() => setAuthModal({ open: true, view: 'signup' })}
        />
      )}

      {page === 'one-season-off' && (
        <OneSeasonOffPage
          onBack={() => goTo({ page: 'home' })}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {page === 'fost-membership' && (
        <FostMembershipPage
          onBack={() => goTo({ page: 'home' })}
          onJoin={() => setAuthModal({ open: true, view: 'signup' })}
          onLogin={() => setAuthModal({ open: true, view: 'login' })}
        />
      )}

      {page === 'account' && (
        <AccountPage
          key={accountTab}
          onBack={() => goTo({ page: 'home' })}
          onSelectProduct={handleSelectProduct}
          initialTab={accountTab}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </AuthProvider>
  );
}