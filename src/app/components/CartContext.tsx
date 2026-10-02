import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Product } from '../data/products';
import { createCart, addToCart, getCart } from '../data/shopify';
import { useAuth } from './AuthContext';
import { getFostPrice } from '../data/pricing';
import { isFlashSaleActiveNow, getFlashPriceForItem } from '../data/flashSale';
import { trackMetaEvent } from '../lib/metaPixel';

export type CartItem = {
  product: Product;
  qty: number;
  selectedOption1?: string | null;
  selectedOption2?: string | null;
  variantPrice: number;
  variantImage?: string | null;
  shopifyVariantId?: string | null; // Shopify GID for checkout
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void;
  removeItem: (index: number) => void;
  updateQty: (index: number, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isFostMember: boolean;
  fostSubtotal: number;
  fostSavings: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  goToShopifyCheckout: () => Promise<void>;
  checkoutLoading: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'ostsome_cart_items';
const PENDING_CHECKOUT_KEY = 'ostsome_pending_checkout_cart_id';

function loadPersistedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, shopifyToken } = useAuth();
  const isFostMember = Boolean(user);

  const [items, setItems] = useState<CartItem[]>(() => loadPersistedCart());
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Persist the cart to localStorage on every change, so refreshing the
  // page or navigating back from checkout (via the logo, or the browser's
  // own back button) no longer wipes out items the customer hadn't
  // actually purchased yet — cart state used to live only in memory.
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can fail (private browsing, storage full) — not worth
      // surfacing to the customer, the cart just won't persist that time.
    }
  }, [items]);

  // Universal auto-clear: when checkout was initiated, we stashed the exact
  // Shopify cart ID we created (see goToShopifyCheckout below). On load, if
  // there's a pending cart ID, ask Shopify whether that cart still exists.
  // Shopify automatically deletes a cart the moment its checkout completes
  // and becomes an order — so if the cart is gone, the purchase went
  // through and we can safely clear the local cart. If it still exists,
  // checkout was abandoned, so we leave the local cart untouched. This
  // works identically for guests and logged-in FOST members, since it
  // doesn't depend on a customer account at all.
  useEffect(() => {
    const pendingCartId = localStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!pendingCartId) return;
    let cancelled = false;

    getCart(pendingCartId).then(cart => {
      if (cancelled) return;
      if (!cart) {
        // Cart is gone — checkout completed, safe to clear.
        setItems([]);
      }
      // Either way, we've resolved this pending checkout; stop tracking it.
      localStorage.removeItem(PENDING_CHECKOUT_KEY);
    }).catch(() => {
      // Best-effort — if the check fails, leave everything as-is and try
      // again next time the app loads (don't clear the marker on error).
    });

    return () => { cancelled = true; };
  }, []);

  const addItem = useCallback((incoming: Omit<CartItem, 'qty'> & { qty?: number }) => {
    const qty = incoming.qty ?? 1;
    trackMetaEvent('AddToCart', {
      content_ids: [incoming.product.handle],
      content_name: incoming.product.title,
      content_type: 'product',
      value: incoming.variantPrice * qty,
      currency: 'MYR',
      num_items: qty,
    });
    setItems(prev => {
      const existingIdx = prev.findIndex(
        i =>
          i.product.handle === incoming.product.handle &&
          i.selectedOption1 === incoming.selectedOption1 &&
          i.selectedOption2 === incoming.selectedOption2
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], qty: updated[existingIdx].qty + qty };
        return updated;
      }
      return [...prev, { ...incoming, qty }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQty = useCallback((index: number, qty: number) => {
    if (qty < 1) return;
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], qty };
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // If the customer navigates to checkout, then uses the browser's own Back
  // button (not the logo/continue-shopping links), the browser can restore
  // this page from bfcache exactly as it was mid-navigation — including
  // checkoutLoading stuck at `true` forever, since the code that would
  // normally reset it never got to run (the page had already navigated
  // away to Shopify). That left the checkout button permanently disabled
  // on return. Resetting on `pageshow` (which fires on every bfcache
  // restore) fixes it.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setCheckoutLoading(false);
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Creates a real Shopify cart and redirects to Shopify hosted checkout
  const goToShopifyCheckout = useCallback(async () => {
    if (items.length === 0) return;

    // Check if all items have Shopify variant IDs
    const itemsWithVariants = items.filter(i => i.shopifyVariantId);

    if (itemsWithVariants.length === 0) {
      // No Shopify variant IDs yet — variants are still loading, open cart and wait
      setCheckoutLoading(false);
      return;
    }

    trackMetaEvent('InitiateCheckout', {
      content_ids: itemsWithVariants.map(i => i.product.handle),
      content_type: 'product',
      value: itemsWithVariants.reduce((sum, i) => sum + i.variantPrice * i.qty, 0),
      currency: 'MYR',
      num_items: itemsWithVariants.reduce((sum, i) => sum + i.qty, 0),
    });

    setCheckoutLoading(true);
    try {
      // FOST5 is an automatic order discount, not a discount code.
      // Shopify evaluates eligibility using the customer linked to this cart.
      let cart = await createCart(
        undefined,
        shopifyToken ?? undefined
      );

      // Add all items to the cart
      for (const item of itemsWithVariants) {
        cart = await addToCart(cart.id, item.shopifyVariantId!, item.qty);
      }

      // Stash this exact cart's ID so that on the next app load we can ask
      // Shopify whether it still exists — if it's gone, the checkout
      // completed (see the pending-checkout effect above), and we clear
      // the local cart then. This works the same for guests and logged-in
      // FOST members alike.
      localStorage.setItem(PENDING_CHECKOUT_KEY, cart.id);

      // Navigate to Shopify's hosted checkout in the SAME tab. The cart is
      // now persisted to localStorage (see loadPersistedCart / the save
      // effect above), so this no longer wipes it out if the customer
      // comes back via the logo or the browser's back button without
      // completing the purchase.
      window.location.href = cart.checkoutUrl;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
      setCheckoutLoading(false);
    }
  }, [items, isFostMember, shopifyToken]);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.variantPrice * i.qty, 0);
  const flashActiveNow = isFlashSaleActiveNow();
  const effectivePrice = (i: CartItem) => {
    const flashPrice = getFlashPriceForItem(i.product.handle, i.selectedOption1);
    if (isFostMember && flashActiveNow && flashPrice !== undefined) return flashPrice;
    return isFostMember ? getFostPrice(i.variantPrice) : i.variantPrice;
  };
  const fostSubtotal = isFostMember
    ? items.reduce((sum, i) => sum + effectivePrice(i) * i.qty, 0)
    : subtotal;
  const fostSavings = subtotal - fostSubtotal;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      totalItems, subtotal, isFostMember, fostSubtotal, fostSavings,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
      goToShopifyCheckout, checkoutLoading,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
