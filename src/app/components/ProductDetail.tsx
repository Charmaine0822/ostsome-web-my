import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Star, Shield, Truck, RefreshCw, Check, X } from 'lucide-react';
import type { Product } from '../data/products';
import { getVariants, type ProductVariant } from '../data/productVariants';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { fetchProductByHandle } from '../data/shopify';
import { getFostPrice } from '../data/pricing';
import luckyDrawImg from '../../imports/rubyoung-lucky-draw.jpg';
import { useFlashSaleActive, getFlashPrice, FLASH_SALE_VARIANT_SCOPE } from '../data/flashSale';
import { getCampaignDeal } from '../data/campaignDeals';

// Variant lookups are keyed by SKU, not by option display values. Option
// values (e.g. a colour name) can drift between the static
// productVariants.ts snapshot and live Shopify — one Edizard product had
// its Black option cleaned up in Shopify Admin from a broken "black-1" to
// "Black" after productVariants.ts was last generated, so the static file
// still says "black-1" while live Shopify says "Black". Matching on that
// string silently fails and the item gets added to cart with no
// shopifyVariantId at all ("Variant not linked to Shopify"). SKU doesn't
// have this problem — it's the one identifier both sides are expected to
// agree on, and changing it would break Shopify's own inventory tracking,
// so it's for practical purposes stable. `sku.ts` in both shopify.ts's
// GraphQL queries and productVariants.ts's static data now carry it.
function skuKey(sku: string | null | undefined): string {
  return sku && sku.trim() !== '' ? sku : 'default';
}

type ProductDetailProps = {
  product: Product;
  onBack: () => void;
  onCheckout?: () => void;
};

const RUBYOUNG_SPIN_HANDLES = ['rubyoung-spin'];

export function ProductDetail({ product, onBack, onCheckout }: ProductDetailProps) {
  const { user } = useAuth();
  const isFostMember = Boolean(user);
  const flashSaleActive = useFlashSaleActive();
  const flashSalePrice = getFlashPrice(product.handle);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedOption1, setSelectedOption1] = useState<string | null>(null);
  const [selectedOption2, setSelectedOption2] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showLuckyDraw, setShowLuckyDraw] = useState(false);

  // If this product's flash deal is scoped to one specific variant (e.g.
  // Hohem's Kit, not the base MT3 Pro), only show the flash price once
  // that exact variant is selected. Products with no scope entry (e.g.
  // Looki L1) behave as before — the deal applies regardless of variant.
  const requiredVariantForFlash = FLASH_SALE_VARIANT_SCOPE[product.handle];
  const variantMatchesFlashScope = !requiredVariantForFlash || selectedOption1 === requiredVariantForFlash;
  const showFlashPrice = isFostMember && flashSaleActive && flashSalePrice !== undefined && variantMatchesFlashScope;
  const campaignDeal = getCampaignDeal(product.handle);
  const showCampaignPrice = !showFlashPrice && Boolean(campaignDeal);

  const { addItem, items: cartItems } = useCart();
  const [shopifyVariants, setShopifyVariants] = useState<Record<string, string>>({});
  const [shopifyAvailability, setShopifyAvailability] = useState<Record<string, boolean>>({});
  const [shopifyQuantity, setShopifyQuantity] = useState<Record<string, number | null>>({});
  // Live per-variant price/compareAtPrice, keyed by SKU — the static
  // productVariants.ts price field goes stale the moment a price is
  // changed in Shopify (e.g. via the campaign price-update script) without
  // that static snapshot being regenerated. This mirrors the same
  // SKU-based approach used for shopifyVariants above, for the same
  // reason: SKU is stable, the static file is not.
  const [shopifyPrices, setShopifyPrices] = useState<Record<string, number>>({});
  const [shopifyCompareAtPrices, setShopifyCompareAtPrices] = useState<Record<string, number | null>>({});
  // Fallback variant list built from live Shopify data (selectedOptions),
  // used only when this product's handle has no entry in the static
  // productVariants.ts snapshot — see the "Variant not linked to Shopify"
  // root-cause note in the fetch effect below.
  const [liveVariantsFallback, setLiveVariantsFallback] = useState<ProductVariant[]>([]);
  const [shopifyFetchError, setShopifyFetchError] = useState(false);
  const [variantsLoaded, setVariantsLoaded] = useState(false);
  const [stockWarning, setStockWarning] = useState<{ requested: number; available: number; intent: 'cart' | 'checkout' } | null>(null);

  // Show lucky draw popup if arrived via QR (URL contains /products/)
  useEffect(() => {
    const isRubyoungSpin = RUBYOUNG_SPIN_HANDLES.includes(product.handle);
    if (isRubyoungSpin) {
      const timer = setTimeout(() => setShowLuckyDraw(true), 500);
      return () => clearTimeout(timer);
    }
  }, [product.handle]);

  // Fetch Shopify variant GIDs + live stock status + live price for
  // checkout, sold-out display, and accurate pricing. The static
  // productVariants.ts data doesn't carry current stock OR current price —
  // both go stale independently of each other, so both need a live
  // override, not just availability.
  useEffect(() => {
    let cancelled = false;
    setVariantsLoaded(false);
    setShopifyFetchError(false);
    setLiveVariantsFallback([]);
    setShopifyPrices({});
    setShopifyCompareAtPrices({});
    fetchProductByHandle(product.handle).then(sp => {
      if (cancelled) return;
      if (!sp) { setShopifyFetchError(true); setVariantsLoaded(true); return; }
      const idMap: Record<string, string> = {};
      const availMap: Record<string, boolean> = {};
      const qtyMap: Record<string, number | null> = {};
      const priceMap: Record<string, number> = {};
      const compareAtMap: Record<string, number | null> = {};
      // Built alongside the maps above from the SAME live Shopify response —
      // used only as a fallback when productVariants.ts has no static entry
      // for this handle (e.g. a MY-only product like Theragun PRO Plus that
      // was never added to that SG-originated snapshot). Without this,
      // any product missing from the static file with more than one real
      // Shopify variant renders no option-selector UI at all, so
      // selectedVariant/shopifyVariantId can never resolve — that's the
      // "Variant not linked to Shopify" bug. selectedOptions was already
      // being fetched here and simply unused until now.
      const fallbackVariants: ProductVariant[] = [];
      const curatedVariants = getVariants(product.handle);
      sp.variants.edges.forEach(({ node }) => {
        // Some Shopify variants have no SKU. Use their GID as a unique
        // lookup key so two blank SKUs cannot overwrite each other.
        const key = skuKey(node.sku || node.id);
        idMap[key] = node.id;
        availMap[key] = node.availableForSale;
        qtyMap[key] = node.quantityAvailable ?? null;
        priceMap[key] = parseFloat(node.price.amount);
        compareAtMap[key] = node.compareAtPrice ? parseFloat(node.compareAtPrice.amount) : null;

        const [opt1, opt2] = node.selectedOptions ?? [];
        fallbackVariants.push({
          option1Name: opt1?.name ?? null,
          option1Value: opt1?.value ?? 'Default Title',
          option2Name: opt2?.name,
          option2Value: opt2?.value,
          price: parseFloat(node.price.amount),
          image: node.image?.url ?? curatedVariants.find(v => v.sku && v.sku === node.sku)?.image,
          sku: node.sku || node.id,
        });
      });
      // Single-variant products (no colour/size choices) are often absent
      // from productVariants.ts entirely, so selectedVariant never gets
      // set and the app-side lookup always falls back to the literal key
      // 'default'. The live SKU keying above alone can't satisfy that
      // fallback, since Shopify assigns a real SKU even to a lone
      // "Default Title" variant — so also register that one variant under
      // 'default' explicitly, letting both fallback paths agree the same
      // way they used to before matching switched to SKU-based keys.
      if (sp.variants.edges.length === 1) {
        const only = sp.variants.edges[0].node;
        idMap['default'] = only.id;
        availMap['default'] = only.availableForSale;
        qtyMap['default'] = only.quantityAvailable ?? null;
        priceMap['default'] = parseFloat(only.price.amount);
        compareAtMap['default'] = only.compareAtPrice ? parseFloat(only.compareAtPrice.amount) : null;
      }
      setShopifyVariants(idMap);
      setShopifyAvailability(availMap);
      setShopifyQuantity(qtyMap);
      setShopifyPrices(priceMap);
      setShopifyCompareAtPrices(compareAtMap);
      setLiveVariantsFallback(fallbackVariants);
      setVariantsLoaded(true);
    }).catch(() => {
      if (!cancelled) { setShopifyFetchError(true); setVariantsLoaded(true); }
    });
    return () => { cancelled = true; };
  }, [product.handle]);

  // Static productVariants.ts is preferred when it has an entry (it carries
  // hand-curated image assignments per colour that the live fetch doesn't
  // replicate as reliably) — but when a handle is missing from that static
  // snapshot entirely, fall back to the live-derived list above instead of
  // silently rendering no option selector. See the fetch effect above for
  // why this fallback exists.
  const staticVariants = getVariants(product.handle);
  const variants = liveVariantsFallback.length > 0 ? liveVariantsFallback : staticVariants;

  // Default to the first listed variant option so the price shown reflects
  // an actual variant right away, instead of falling back to the base
  // product.price until the customer manually picks one.
  useEffect(() => {
    if (variants.length > 0 && (!selectedOption1 || !variants.some(v => v.option1Value === selectedOption1 && (!selectedOption2 || v.option2Value === selectedOption2)))) {
      setSelectedOption1(variants[0].option1Value);
      setSelectedOption2(variants[0].option2Value ?? null);
    }
  }, [variants]);

  const option1Name = variants[0]?.option1Name ?? null;
  const option2Name = variants[0]?.option2Name ?? null;

  const option1Values = useMemo(() =>
    [...new Set(variants.map(v => v.option1Value))] as string[],
    [variants]
  );

  const option2Values = useMemo(() => {
    const base = selectedOption1
      ? variants.filter(v => v.option1Value === selectedOption1)
      : variants;
    return [...new Set(
      base.map(v => v.option2Value).filter((v): v is string => Boolean(v))
    )] as string[];
  }, [variants, selectedOption1]);

  const selectedVariant = useMemo(() => {
    if (!selectedOption1) return null;
    return variants.find(v =>
      v.option1Value === selectedOption1 &&
      (!selectedOption2 || v.option2Value === selectedOption2)
    ) ?? null;
  }, [variants, selectedOption1, selectedOption2]);

  // Live price always wins once loaded — the static productVariants.ts
  // price field is a point-in-time snapshot and goes stale the moment a
  // price changes in Shopify (exactly what happened after the campaign
  // price-update script ran: static file still said $35, live Shopify
  // already said $19). Before the live fetch resolves, fall back to the
  // static/base price so something reasonable shows immediately rather
  // than a blank state.
  const liveVariantKey = skuKey(selectedVariant?.sku);
  const livePrice = shopifyPrices[liveVariantKey];
  const liveCompareAtPrice = shopifyCompareAtPrices[liveVariantKey];
  const activePrice = livePrice ?? (selectedVariant ? selectedVariant.price : product.price);

  // Same live-wins-over-stale-static logic for the strikethrough/discount
  // shown in the default (non-flash, non-campaign, non-FOST) price
  // branch — previously always compared product.comparePrice/product.price
  // (the base product's default variant, ignoring whichever variant the
  // customer actually has selected), which had the same staleness problem
  // as activePrice did.
  const effectiveComparePrice = Object.prototype.hasOwnProperty.call(shopifyCompareAtPrices, liveVariantKey)
    ? liveCompareAtPrice : product.comparePrice;
  const hasDiscount = Boolean(effectiveComparePrice && effectiveComparePrice > activePrice);
  const discountPct = hasDiscount
    ? Math.round(((effectiveComparePrice! - activePrice) / effectiveComparePrice!) * 100)
    : 0;

  const allImages = useMemo(() => {
    const variantImgs = variants
      .map(v => v.image)
      .filter((img): img is string => Boolean(img));
    const combined = [...product.images, ...variantImgs];
    return [...new Set(combined)] as string[];
  }, [product.images, variants]);

  const isColourOption = (name: string | null) =>
    name?.toLowerCase().includes('color') || name?.toLowerCase().includes('colour');

  // A swatch is "sold out" only once we've actually loaded live Shopify data
  // and confirmed every combo containing this value is unavailable — before
  // the fetch resolves, we treat everything as available to avoid a flash
  // of grey swatches on first paint.
  function isOption1ValueAvailable(val: string): boolean {
    if (!variantsLoaded || Object.keys(shopifyAvailability).length === 0) return true;
    const matching = variants.filter(v => v.option1Value === val);
    return matching.some(v => shopifyAvailability[skuKey(v.sku)] ?? shopifyAvailability['default'] ?? true);
  }

  function isOption2ValueAvailable(val: string): boolean {
    if (!variantsLoaded || Object.keys(shopifyAvailability).length === 0) return true;
    const matching = variants.filter(v =>
      (!selectedOption1 || v.option1Value === selectedOption1) && v.option2Value === val
    );
    return matching.some(v => shopifyAvailability[skuKey(v.sku)] ?? shopifyAvailability['default'] ?? true);
  }

  // Whether the exact currently-selected combo is in stock — this is what
  // gates the Add to Cart / Buy Now buttons.
  const selectedVariantAvailable = useMemo(() => {
    if (!variantsLoaded || Object.keys(shopifyAvailability).length === 0) return true;
    const key = skuKey(selectedVariant?.sku);
    return shopifyAvailability[key] ?? shopifyAvailability['default'] ?? true;
  }, [selectedVariant, shopifyAvailability, variantsLoaded]);

  // The actual stock count for the selected variant, if Shopify exposes it
  // (requires "quantity available" visibility enabled on the Storefront API
  // channel in Shopify Admin — Settings → Apps and sales channels →
  // Headless → Configure). `null` means "not tracked / not exposed", in
  // which case we don't block on it and let Shopify's cart be the final
  // check, same as before.
  const maxQtyAvailable = useMemo(() => {
    const key = skuKey(selectedVariant?.sku);
    return shopifyQuantity[key] ?? shopifyQuantity['default'] ?? null;
  }, [selectedVariant, shopifyQuantity]);

  // How many of this exact product + variant combo are already sitting in
  // the cart from a previous add. Without this, two separate adds of 1
  // each would both pass the stock check individually, even though
  // together they exceed what's actually in stock — the check needs to
  // look at the total, not just the newly-requested amount in isolation.
  const alreadyInCartQty = useMemo(() => {
    return cartItems
      .filter(i =>
        i.product.handle === product.handle &&
        i.selectedOption1 === selectedOption1 &&
        i.selectedOption2 === selectedOption2
      )
      .reduce((sum, i) => sum + i.qty, 0);
  }, [cartItems, product.handle, selectedOption1, selectedOption2]);

  function handleOption1Select(val: string) {
    setSelectedOption1(val);
    setSelectedOption2(null);
    if (isColourOption(option1Name)) {
      const v = variants.find(vv => vv.option1Value === val && vv.image);
      if (v?.image) {
        const idx = allImages.indexOf(v.image);
        if (idx !== -1) setActiveImg(idx);
      }
    }
  }

  function handleOption2Select(val: string) {
    setSelectedOption2(val);
    const v = variants.find(vv =>
      (!selectedOption1 || vv.option1Value === selectedOption1) &&
      vv.option2Value === val &&
      vv.image
    );
    if (v?.image) {
      const idx = allImages.indexOf(v.image);
      if (idx !== -1) setActiveImg(idx);
    }
  }

  const needsOption1 = variants.length > 0 && option1Name && option1Name !== 'Title';
  const needsOption2 = option2Values.length > 0 && option2Name;

  function getMissingOptionsMessage(): string | null {
    if (needsOption1 && !selectedOption1 && needsOption2 && !selectedOption2) {
      return `Please select a ${option1Name} and ${option2Name} before adding to cart.`;
    }
    if (needsOption1 && !selectedOption1) {
      return `Please select a ${option1Name} before adding to cart.`;
    }
    if (needsOption2 && !selectedOption2) {
      return `Please select a ${option2Name} before adding to cart.`;
    }
    if (!selectedVariantAvailable) {
      return 'Sorry, this option is currently out of stock.';
    }
    return null;
  }

  function handleAddToCart() {
    if (!variantsLoaded || shopifyFetchError || !shopifyVariants[skuKey(selectedVariant?.sku)] && !shopifyVariants['default']) return;
    const error = getMissingOptionsMessage();
    if (error) {
      setValidationError(error);
      setTimeout(() => setValidationError(null), 3500);
      return;
    }
    // Check actual stock before adding — previously the quantity selector
    // had no idea how many units were really in stock, so a customer could
    // request more than was available; Shopify's real cart would then
    // silently cap the quantity down with no explanation shown anywhere.
    // We also have to account for what's already in the cart from a prior
    // add — otherwise two separate adds of 1 each could each individually
    // pass the check while together exceeding actual stock.
    const remainingStock = maxQtyAvailable !== null ? Math.max(0, maxQtyAvailable - alreadyInCartQty) : null;
    if (remainingStock !== null && qty > remainingStock) {
      setStockWarning({ requested: qty, available: remainingStock, intent: 'cart' });
      return;
    }
    setValidationError(null);
    addItem({
      product,
      selectedOption1,
      selectedOption2,
      variantPrice: activePrice,
      variantImage: selectedVariant?.image ?? product.images[0],
      shopifyVariantId: (() => {
        const key = skuKey(selectedVariant?.sku);
        return shopifyVariants[key] || shopifyVariants['default'] || null;
      })(),
      qty,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function handleBuyNow() {
    if (!variantsLoaded || shopifyFetchError || !shopifyVariants[skuKey(selectedVariant?.sku)] && !shopifyVariants['default']) return;
    const error = getMissingOptionsMessage();
    if (error) {
      setValidationError(error);
      setTimeout(() => setValidationError(null), 3500);
      return;
    }
    const remainingStock = maxQtyAvailable !== null ? Math.max(0, maxQtyAvailable - alreadyInCartQty) : null;
    if (remainingStock !== null && qty > remainingStock) {
      setStockWarning({ requested: qty, available: remainingStock, intent: 'checkout' });
      return;
    }
    setValidationError(null);
    addItem({
      product,
      selectedOption1,
      selectedOption2,
      variantPrice: activePrice,
      variantImage: selectedVariant?.image ?? product.images[0],
      shopifyVariantId: (() => {
        const key = skuKey(selectedVariant?.sku);
        return shopifyVariants[key] || shopifyVariants['default'] || null;
      })(),
      qty,
    });
    onCheckout?.();
  }

  // After the customer confirms the popup, either lower the quantity to
  // what's actually available and proceed, or cancel entirely.
  function confirmAddAvailableQty() {
    if (!stockWarning) return;
    const clampedQty = stockWarning.available;
    const intent = stockWarning.intent;
    setStockWarning(null);
    if (clampedQty < 1) return; // nothing left to add
    setQty(clampedQty);
    addItem({
      product,
      selectedOption1,
      selectedOption2,
      variantPrice: activePrice,
      variantImage: selectedVariant?.image ?? product.images[0],
      shopifyVariantId: (() => {
        const key = skuKey(selectedVariant?.sku);
        return shopifyVariants[key] || shopifyVariants['default'] || null;
      })(),
      qty: clampedQty,
    });
    if (intent === 'checkout') onCheckout?.();
    else {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  }

  const PRODUCT_VIDEOS: Record<string, { videoId: string; title: string; start?: number }> = {
    'looki-l1': { videoId: 'KHjibXAMLxI', title: 'Looki L1 video', start: 1 },
    'dometic-cfx5-35-performance-compressor-cooler': { videoId: 'YV7fcGkof0I', title: 'Dometic CFX5 35 video' },
    'polaroid-now-instant-camera-gen3': { videoId: 'IeAajXkrRgQ', title: 'Polaroid Now+ Gen3 video' },
    'skullcandy-crusher-anc-2-wireless-headphones': { videoId: 'uOqvYKwIeP4', title: 'Skullcandy Crusher ANC 2 video' },
    'pre-order-larq-bottle-purevis-2-self-cleaning-1000ml': { videoId: 'Lmi5XBA-PhA', title: 'LARQ Bottle PureVis 2 video' },
    'arzopa-d10-10-1-digital-photo-frame': { videoId: '_Hbar0aUjis', title: 'Arzopa D10 video' },
    'kospet-tank-t4-smartwatch-black-silver': { videoId: 'bQnmql1c3W0', title: 'KOSPET Tank T4 video' },
    'skullcandy-aivator-900-anc-wireless-over-ear': { videoId: 'kV191TVHsJo', title: 'Skullcandy Aviator 900 ANC video' },
  };
  const productVideo = PRODUCT_VIDEOS[product.handle];

  return (
    <div className="min-h-screen bg-white">

      {/* Stock warning popup — shown instead of silently letting Shopify
          cap the quantity down at checkout with no explanation */}
      {stockWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <button
              onClick={() => setStockWarning(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center transition"
            >
              <X size={16} className="text-neutral-600" />
            </button>
            <h2 className="text-lg font-bold text-black mb-2">Limited stock</h2>
            {stockWarning.available > 0 ? (
              <p className="text-sm text-neutral-600 mb-5">
                You asked for {stockWarning.requested}, but only {stockWarning.available} {stockWarning.available === 1 ? 'is' : 'are'} currently in stock. Would you like to add {stockWarning.available} instead?
              </p>
            ) : (
              <p className="text-sm text-neutral-600 mb-5">
                Sorry, this option just sold out and can't be added right now.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStockWarning(null)}
                className="flex-1 text-sm font-semibold text-neutral-600 border border-neutral-200 py-2.5 rounded-xl hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              {stockWarning.available > 0 && (
                <button
                  onClick={confirmAddAvailableQty}
                  className="flex-1 text-sm font-bold text-white bg-[#F16C10] hover:bg-[#d9610e] py-2.5 rounded-xl transition"
                >
                  Add {stockWarning.available}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lucky Draw Popup */}
      {showLuckyDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
            <button
              onClick={() => setShowLuckyDraw(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition"
            >
              <X size={16} className="text-neutral-600" />
            </button>

            {/* Promo image */}
            <img
              src={luckyDrawImg}
              alt="Exclusive Offers"
              className="w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />

            <div className="p-5">
              <h2 className="text-lg font-bold text-black mb-1">🎉 Congratulations!</h2>
              <p className="text-sm font-semibold text-[#F16C10] mb-3">Welcome to the OSTSOME × Rubyoung Lucky Draw! 🎟️</p>

              <p className="text-sm text-neutral-600 mb-3">We have 4 exciting prizes waiting for you:</p>
              <ul className="text-sm text-neutral-700 space-y-1 mb-4">
                <li>🎁 Free Gift</li>
                <li>🛍️ 1-for-1 Deal (Please select two items, then enter the code to redeem the offer)</li>
                <li>💵 $100 Voucher</li>
                <li>💳 $60 Voucher</li>
              </ul>

              <p className="text-sm font-semibold text-neutral-700 mb-2">Simply follow these steps:</p>
              <ol className="text-sm text-neutral-600 space-y-1 mb-5">
                <li>1. Scan the QR code.</li>
                <li>2. You'll be directed to the Rubyoung homepage.</li>
                <li>3. Tap <strong>Buy Now</strong>.</li>
                <li>4. Enter your shipping details and complete your order.</li>
              </ol>

              <button
                onClick={() => { setShowLuckyDraw(false); handleBuyNow(); }}
                className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-3.5 rounded-xl transition-colors text-sm uppercase tracking-wide"
              >
                Buy Now
              </button>
              <button
                onClick={() => setShowLuckyDraw(false)}
                className="w-full mt-2 text-xs text-neutral-400 hover:text-neutral-600 py-2 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#F16C10] transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Products
        </button>
      </div>

      {productVideo && (
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-50" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${productVideo.videoId}?${productVideo.start ? `start=${productVideo.start}&` : ''}autoplay=1&mute=1&playsinline=1`}
              title={productVideo.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-100 group" style={{ aspectRatio: '1 / 1' }}>
              <img
                src={allImages[activeImg] ?? product.images[0]}
                alt={product.title}
                className="w-full h-full object-contain p-8 transition-opacity duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'; }}
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow rounded-full flex items-center justify-center text-black transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImg((i) => (i + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow rounded-full flex items-center justify-center text-black transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-[#F16C10] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  -{discountPct}% OFF
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-[#F16C10]' : 'border-neutral-200 hover:border-neutral-400'}`}
                  >
                    <img
                      src={img}
                      alt={`View ${i + 1}`}
                      className="w-full h-full object-contain bg-neutral-50 p-1"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-[#F16C10] uppercase tracking-widest">{product.vendor}</span>
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{product.category}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-black leading-tight mb-4">{product.title}</h1>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={14} className={s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 fill-neutral-200'} />
                ))}
              </div>
              <span className="text-xs text-neutral-400">(24 reviews)</span>
            </div>

            {!variantsLoaded || shopifyFetchError ? (
              <p className="mb-2 text-sm text-neutral-600">{shopifyFetchError ? 'Price unavailable. Please refresh the page.' : 'Loading current price…'}</p>
            ) : showFlashPrice ? (
              <div className="mb-1">
                <div className="mb-1.5">
                  <span className="text-[10px] font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                    Flash Deal — Ends 8PM
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                    RM {flashSalePrice!.toFixed(2)}
                  </span>
                  <span className="text-lg text-neutral-400 line-through">RM {activePrice.toFixed(2)}</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  FOST Friday Flash Deal price — applied automatically at checkout, while stock lasts.
                </p>
              </div>
            ) : showCampaignPrice ? (
              <div className="mb-1">
                <div className="mb-1.5">
                  <span className="text-[10px] font-bold text-white bg-[#F16C10] px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {campaignDeal!.campaign === 'launch' ? 'Early Bird' : 'Clearance'}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-[#F16C10]">
                    RM {(isFostMember ? getFostPrice(campaignDeal!.promo) : campaignDeal!.promo).toFixed(2)}
                  </span>
                  <span className="text-lg text-neutral-400 line-through">
                    RM {(isFostMember ? campaignDeal!.promo : campaignDeal!.srp).toFixed(2)}
                  </span>
                </div>
                {isFostMember && (
                  <p className="text-xs text-neutral-400 mt-1">Original price RM {campaignDeal!.srp.toFixed(2)} — now with an extra 5% FOST member discount</p>
                )}
              </div>
            ) : isFostMember ? (
              <div className="mb-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-[#F16C10]">RM {getFostPrice(activePrice).toFixed(2)}</span>
                  <span className="text-lg text-neutral-400 line-through">RM {activePrice.toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-white bg-[#F16C10] px-2 py-0.5 rounded-full uppercase tracking-wide">FOST Price</span>
                </div>
                {hasDiscount && (
                  <p className="text-xs text-neutral-400 mt-1">Original price RM {effectiveComparePrice!.toFixed(2)} — now with an extra 5% FOST member discount</p>
                )}
              </div>
            ) : (
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-bold text-black">RM {activePrice.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-lg text-neutral-400 line-through">RM {effectiveComparePrice!.toFixed(2)}</span>
                )}
              </div>
            )}
            {!isFostMember && (
              <p className="text-xs text-[#F16C10] font-semibold mb-5">
                FOST members save an extra 5% — join free to unlock this price.
              </p>
            )}
            {isFostMember && <div className="mb-5" />}

            <p className="text-xs text-neutral-500 mb-6 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
              Or 3 payments of <strong className="text-black">RM {((showFlashPrice ? flashSalePrice! : showCampaignPrice ? (isFostMember ? getFostPrice(campaignDeal!.promo) : campaignDeal!.promo) : isFostMember ? getFostPrice(activePrice) : activePrice) / 3).toFixed(2)}</strong> with Atome. Taxes included.
            </p>

            {/* Option 1 */}
            {variants.length > 0 && option1Name && option1Name !== 'Title' && (
              <div className="mb-5">
                <label className={`text-xs font-semibold uppercase tracking-wide block mb-2 ${validationError && !selectedOption1 ? 'text-red-500' : 'text-neutral-600'}`}>
                  {option1Name}
                  {selectedOption1 && (
                    <span className="text-black normal-case tracking-normal font-normal ml-1">: {selectedOption1}</span>
                  )}
                  {validationError && !selectedOption1 && (
                    <span className="text-red-500 normal-case tracking-normal font-normal ml-1">— required</span>
                  )}
                </label>
                {isColourOption(option1Name) ? (
                  <div className="flex flex-wrap gap-2">
                    {option1Values.map((val) => {
                      const v = variants.find(vv => vv.option1Value === val && vv.image);
                      const available = isOption1ValueAvailable(val);
                      return (
                        <button
                          key={val}
                          onClick={() => handleOption1Select(val)}
                          title={available ? val : `${val} — Sold out`}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                            selectedOption1 === val
                              ? 'border-[#F16C10] scale-110'
                              : 'border-neutral-200 hover:border-neutral-400'
                          } ${!available ? 'opacity-40 grayscale' : ''}`}
                        >
                          {v?.image ? (
                            <img src={v.image} alt={val} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400 p-0.5 text-center leading-tight">
                              {val}
                            </div>
                          )}
                          {!available && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                              <div className="w-full h-px bg-neutral-500 rotate-45" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {option1Values.map((val) => {
                      const available = isOption1ValueAvailable(val);
                      return (
                        <button
                          key={val}
                          onClick={() => handleOption1Select(val)}
                          title={available ? undefined : `${val} — Sold out`}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            selectedOption1 === val
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                          } ${!available ? 'opacity-40 line-through' : ''}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Option 2 */}
            {option2Values.length > 0 && option2Name && (
              <div className="mb-5">
                <label className={`text-xs font-semibold uppercase tracking-wide block mb-2 ${validationError && !selectedOption2 ? 'text-red-500' : 'text-neutral-600'}`}>
                  {option2Name}
                  {selectedOption2 && (
                    <span className="text-black normal-case tracking-normal font-normal ml-1">: {selectedOption2}</span>
                  )}
                  {validationError && !selectedOption2 && (
                    <span className="text-red-500 normal-case tracking-normal font-normal ml-1">— required</span>
                  )}
                </label>
                {isColourOption(option2Name) ? (
                  <div className="flex flex-wrap gap-2">
                    {option2Values.map((val) => {
                      const v = variants.find(vv =>
                        (!selectedOption1 || vv.option1Value === selectedOption1) &&
                        vv.option2Value === val
                      );
                      const available = isOption2ValueAvailable(val);
                      return (
                        <button
                          key={val}
                          onClick={() => handleOption2Select(val)}
                          title={available ? val : `${val} — Sold out`}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                            selectedOption2 === val
                              ? 'border-[#F16C10] scale-110'
                              : 'border-neutral-200 hover:border-neutral-400'
                          } ${!available ? 'opacity-40 grayscale' : ''}`}
                        >
                          {v?.image ? (
                            <img src={v.image} alt={val} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400 p-0.5 text-center leading-tight">
                              {val}
                            </div>
                          )}
                          {!available && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                              <div className="w-full h-px bg-neutral-500 rotate-45" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {option2Values.map((val) => {
                      const available = isOption2ValueAvailable(val);
                      return (
                        <button
                          key={val}
                          onClick={() => setSelectedOption2(val)}
                          title={available ? undefined : `${val} — Sold out`}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            selectedOption2 === val
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                          } ${!available ? 'opacity-40 line-through' : ''}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-2">Quantity</label>
              <div className="flex items-center border border-neutral-200 rounded-lg w-fit">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-black transition text-xl font-light">−</button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-black transition text-xl font-light">+</button>
              </div>
            </div>

            {validationError && (
              <div className="mb-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-3 rounded-xl animate-pulse">
                <span className="text-base leading-none mt-0.5">⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 mb-8">
              {(!product.availableForSale || (selectedOption1 !== null && !selectedVariantAvailable)) ? (
                <div className="w-full bg-neutral-100 text-neutral-400 font-bold py-4 rounded-xl flex items-center justify-center text-sm uppercase tracking-wide">
                  Sold Out
                </div>
              ) : !variantsLoaded || shopifyFetchError ? (
                <div className="w-full bg-neutral-100 text-neutral-500 py-4 rounded-xl text-center text-sm">
                  {shopifyFetchError ? 'Unable to load current product details. Please refresh.' : 'Loading product details…'}
                </div>
              ) : (
                <>
                  <button
                    onClick={handleAddToCart}
                    className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm uppercase tracking-wide ${
                      addedToCart
                        ? 'bg-green-500 text-white'
                        : 'bg-[#F16C10] hover:bg-[#d9610e] text-white'
                    }`}
                  >
                    {addedToCart ? (
                      <><Check size={18} /> Added to Cart</>
                    ) : (
                      <><ShoppingCart size={18} /> Add to Cart</>
                    )}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-4 rounded-xl transition-colors text-sm uppercase tracking-wide"
                  >
                    Buy Now
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Truck, label: 'Free shipping', sub: 'Orders over RM 400' },
                { icon: Shield, label: 'Warranty', sub: '1-year coverage' },
                { icon: RefreshCw, label: 'Easy returns', sub: '30-day policy' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 bg-neutral-50 rounded-xl">
                  <Icon size={18} className="text-[#F16C10] mb-1.5" />
                  <span className="text-xs font-semibold text-black">{label}</span>
                  <span className="text-[10px] text-neutral-400 leading-tight">{sub}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-100 mb-6" />

            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wide mb-4">About this product</h2>
              <div
                className="text-sm text-neutral-600 leading-relaxed product-description"
                dangerouslySetInnerHTML={{ __html: product.bodyHtml }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .product-description ul { list-style: disc; padding-left: 1.25rem; margin: 0.75rem 0; }
        .product-description li { margin-bottom: 0.25rem; }
        .product-description p { margin-bottom: 0.75rem; }
        .product-description h3 { font-weight: 700; margin: 1rem 0 0.5rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .product-description strong { color: #111; font-weight: 600; }
      `}</style>
    </div>
  );
}
