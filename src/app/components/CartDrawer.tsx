import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from './CartContext';
import { getFostPrice } from '../data/pricing';
import { useFlashSaleActive, getFlashPriceForItem } from '../data/flashSale';

export function CartDrawer() {
  const {
    items, removeItem, updateQty, subtotal, totalItems, isOpen, closeCart,
    goToShopifyCheckout, checkoutLoading, isFostMember, fostSubtotal, fostSavings,
    pointsApplied, pointsLoading, pointsError, applyPoints, removePoints,
  } = useCart();
  const hasPointsItems = items.some(i => /satechi|looki/i.test(i.product.vendor ?? ''));
  const flashSaleActive = useFlashSaleActive();

  const shippingThreshold = 400;
  const freeShipping = fostSubtotal >= shippingThreshold;
  const shippingGap = shippingThreshold - fostSubtotal;

  async function handleCheckout() {
    closeCart();
    await goToShopifyCheckout();
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-[#F16C10]" />
            <h2 className="text-base font-bold text-black">
              Your Cart {totalItems > 0 && <span className="text-neutral-400 font-normal">({totalItems})</span>}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 transition text-neutral-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free shipping progress */}
        {totalItems > 0 && (
          <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-100">
            {freeShipping ? (
              <p className="text-xs text-green-600 font-semibold text-center">
                🎉 You've unlocked free shipping!
              </p>
            ) : (
              <div>
                <p className="text-xs text-neutral-500 mb-2 text-center">
                  Add <span className="font-bold text-black">RM {shippingGap.toFixed(2)}</span> more for free shipping
                </p>
                <div className="w-full bg-neutral-200 rounded-full h-1.5">
                  <div
                    className="bg-[#F16C10] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((subtotal / shippingThreshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
                <ShoppingBag size={28} className="text-neutral-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-black mb-1">Your cart is empty</p>
                <p className="text-sm text-neutral-400">Add something you love to get started</p>
              </div>
              <button onClick={closeCart} className="text-sm text-[#F16C10] font-semibold hover:underline">
                Continue shopping →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-20 h-20 shrink-0 rounded-xl bg-neutral-50 border border-neutral-100 overflow-hidden">
                    <img
                      src={item.variantImage || item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-contain p-2"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[#F16C10] uppercase tracking-widest mb-0.5">
                      {item.product.vendor}
                    </p>
                    <p className="text-sm font-semibold text-black leading-snug line-clamp-2 mb-1">
                      {item.product.title}
                    </p>
                    {item.selectedOption1 && (
                      <p className="text-xs text-neutral-400 mb-2">
                        {item.selectedOption1}{item.selectedOption2 ? ` / ${item.selectedOption2}` : ''}
                      </p>
                    )}
                    {!item.shopifyVariantId && (
                      <p className="text-[10px] text-amber-500 mb-1">⚠ Variant not linked to Shopify</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 border border-neutral-200 rounded-lg px-2 py-1">
                        <button
                          onClick={() => updateQty(idx, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="text-neutral-400 hover:text-black transition w-5 h-5 flex items-center justify-center disabled:opacity-30"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold text-black w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(idx, item.qty + 1)}
                          className="text-neutral-400 hover:text-black transition w-5 h-5 flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const flashSalePrice = getFlashPriceForItem(item.product.handle, item.selectedOption1);
                          const showFlashPrice = isFostMember && flashSaleActive && flashSalePrice !== undefined;
                          if (showFlashPrice) {
                            return (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                  RM {(flashSalePrice * item.qty).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-neutral-400 line-through">
                                  RM {(item.variantPrice * item.qty).toFixed(2)}
                                </span>
                              </div>
                            );
                          }
                          return isFostMember ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-[#F16C10]">
                                RM {(getFostPrice(item.variantPrice) * item.qty).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-neutral-400 line-through">
                                RM {(item.variantPrice * item.qty).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-black">
                              RM {(item.variantPrice * item.qty).toFixed(2)}
                            </span>
                          );
                        })()}
                        <button onClick={() => removeItem(idx)} className="text-neutral-300 hover:text-red-400 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-neutral-100 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-neutral-500">Subtotal</span>
              <span className={`text-base font-bold ${isFostMember ? 'text-neutral-400 line-through' : 'text-black'}`}>
                RM {subtotal.toFixed(2)}
              </span>
            </div>
            {isFostMember && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#F16C10] font-semibold">FOST member savings (5%)</span>
                <span className="text-sm font-bold text-[#F16C10]">– RM {fostSavings.toFixed(2)}</span>
              </div>
            )}
            {isFostMember && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-black font-semibold">FOST total</span>
                <span className="text-base font-bold text-black">RM {fostSubtotal.toFixed(2)}</span>
              </div>
            )}
            {isFostMember && hasPointsItems && (
              <div className="my-3">
                {pointsApplied ? (
                  <div className="flex items-center justify-between bg-[#F16C10]/10 rounded-xl px-3 py-2">
                    <span className="text-sm text-[#F16C10] font-semibold">{pointsApplied.pointsUsed} pts applied: – RM {pointsApplied.amount.toFixed(2)}</span>
                    <button onClick={removePoints} className="text-xs text-neutral-500 hover:text-black underline">Remove</button>
                  </div>
                ) : (
                  <button onClick={applyPoints} disabled={pointsLoading}
                    className="w-full border border-[#F16C10] text-[#F16C10] hover:bg-[#F16C10]/5 disabled:opacity-60 font-semibold py-2.5 rounded-xl text-sm transition">
                    {pointsLoading ? 'Applying…' : 'Use my points (Satechi / Looki items)'}
                  </button>
                )}
                {pointsError && <p className="text-xs text-red-500 mt-1.5">{pointsError}</p>}
                <p className="text-[11px] text-neutral-400 mt-1.5">Orders paid with points don't earn new points.</p>
              </div>
            )}
            <p className="text-xs text-neutral-400 mb-4">
              {/* ⚠️ 8.90 is the SG shipping fee, unverified for MY — confirm the actual MY courier rate with Kenneth before shipping this. */}
              {freeShipping ? 'Free shipping applied' : `+ RM ${(8.90).toFixed(2)} estimated shipping`}
            </p>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-[#F16C10] hover:bg-[#d65f0e] disabled:opacity-60 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition text-base"
            >
              {checkoutLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Taking you to checkout…</>
              ) : (
                <>Checkout <ArrowRight size={18} /></>
              )}
            </button>
            <button
              onClick={closeCart}
              className="w-full mt-3 text-sm text-neutral-400 hover:text-black transition font-medium"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}