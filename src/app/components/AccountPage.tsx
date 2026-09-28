import { useState } from 'react';
import { useState as useStateAlt, useEffect } from 'react';
import { getCustomer, updateCustomerProfile, saveCustomerAddress } from '../data/shopify';
import {
  ChevronLeft, Package, User, Heart, Crown, Tag, Zap, Users, Gift,
  CalendarHeart, ChevronRight, Edit2, Save, X, MapPin, Phone, Mail,
  Lock, Check, Truck, RotateCcw, Star, ShoppingBag
} from 'lucide-react';
import { useAuth } from './AuthContext';
import type { Product } from '../data/products';
import { getFostPrice } from '../data/pricing';

export type Tab = 'orders' | 'profile' | 'saved' | 'perks';

type AccountPageProps = {
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  initialTab?: Tab;
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_SAVED = [
  {
    handle: 'hohem-isteady-mt3-pro-and-mt3-pro-kit',
    title: 'Hohem iSteady MT3 Pro and MT3 Pro Kit',
    vendor: 'Hohem',
    type: 'Camera Accessories',
    category: 'Cameras & Photography',
    navCategory: 'Mobile Creator',
    price: 639.00,
    comparePrice: null,
    images: ['https://cdn.shopify.com/s/files/1/0348/4948/9034/files/MT3Pro_6851fbef-3a4a-4731-a005-d6a68f292946.jpg?v=1780906764'],
    bodyHtml: '',
  },
  {
    handle: 'kospet-tank-m4-smartwatch',
    title: 'KOSPET TANK M4 Smartwatch',
    vendor: 'Kospet',
    type: 'Smart Watch',
    category: 'Smart Wearables',
    navCategory: 'Health and Beauty',
    price: 298.00,
    comparePrice: 298.00,
    images: ['https://cdn.shopify.com/s/files/1/0348/4948/9034/files/TankM4.jpg?v=1780900598'],
    bodyHtml: '',
  },
  {
    handle: 'turtle-beach-stealth-700-wireless-gaming-headset-playstation',
    title: 'Turtle Beach Stealth 700 Wireless Gaming Headset',
    vendor: 'Turtle Beach',
    type: 'Gaming Audio',
    category: 'Gaming',
    navCategory: 'Gaming',
    price: 299.90,
    comparePrice: null,
    images: ['https://cdn.shopify.com/s/files/1/0348/4948/9034/files/Stealth700.jpg?v=1780900598'],
    bodyHtml: '',
  },
];

const STATUS_STYLES: Record<string, string> = {
  Delivered: 'bg-green-50 text-green-600 border-green-200',
  Shipped:   'bg-blue-50 text-blue-600 border-blue-200',
  Processing:'bg-amber-50 text-amber-600 border-amber-200',
  Cancelled: 'bg-red-50 text-red-400 border-red-200',
};

const STATUS_ICONS: Record<string, typeof Truck> = {
  Delivered: Check,
  Shipped:   Truck,
  Processing:Package,
  Cancelled: X,
};

// ─── MY ORDERS ────────────────────────────────────────────────────────────────
function MyOrders() {
  const { shopifyToken, logout } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'expired' | 'error'>('loading');

  useEffect(() => {
    if (!shopifyToken) {
      // No token at all — same practical situation as an expired one: we
      // can't prove who this customer is, so we can't show order history.
      setStatus('expired');
      return;
    }
    getCustomer(shopifyToken)
      .then(customer => {
        // Shopify's Storefront API doesn't throw for an invalid/expired
        // access token — it just resolves with customer: null. Catching
        // that here is what lets us tell "your session expired" apart
        // from "you genuinely have zero orders" instead of both silently
        // rendering the same empty state.
        if (!customer) {
          setStatus('expired');
          return;
        }
        const raw = customer.orders?.edges?.map((e: any) => {
          const o = e.node;
          return {
            id: o.name,
            date: new Date(o.processedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: o.fulfillmentStatus === 'FULFILLED' ? 'Delivered'
              : o.fulfillmentStatus === 'IN_TRANSIT' ? 'Shipped'
              : o.financialStatus === 'PAID' ? 'Processing'
              : 'Processing',
            total: parseFloat(o.totalPrice.amount),
            items: o.lineItems.edges.map((le: any) => ({
              title: le.node.title,
              vendor: '',
              qty: le.node.quantity,
              price: parseFloat(le.node.variant?.price?.amount ?? '0'),
              image: le.node.variant?.image?.url ?? '',
            })),
          };
        }) ?? [];
        setOrders(raw);
        setStatus('loaded');
      })
      // A genuine network/API failure — not the same as an expired token,
      // and customers should never see fake demo orders that aren't
      // theirs, so this now shows an honest retry state instead.
      .catch(() => setStatus('error'));
  }, [shopifyToken]);

  function handleReLogin() {
    // Clears the stale token/user so the app's normal logged-out flow
    // (login modal/page) takes over from here.
    logout();
  }

  if (status === 'loading') return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#F16C10] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (status === 'expired') {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center">
        <Lock size={48} className="text-neutral-200" />
        <div>
          <p className="text-base font-semibold text-black mb-1">Your session has expired</p>
          <p className="text-sm text-neutral-400 max-w-xs">Log in again to see your order history.</p>
        </div>
        <button
          onClick={handleReLogin}
          className="bg-[#F16C10] hover:bg-[#d65f0e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
        >
          Log In Again
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center">
        <Package size={48} className="text-neutral-200" />
        <div>
          <p className="text-base font-semibold text-black mb-1">Couldn't load your orders</p>
          <p className="text-sm text-neutral-400 max-w-xs">Something went wrong on our end. Please try again.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="border border-neutral-200 text-sm font-semibold text-black px-5 py-2.5 rounded-xl hover:bg-neutral-50 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center">
        <ShoppingBag size={48} className="text-neutral-200" />
        <p className="text-base font-semibold text-neutral-400">No orders yet</p>
        <p className="text-sm text-neutral-400">Your order history will appear here once you make a purchase.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map(order => {
        const isOpen = expanded === order.id;
        const StatusIcon = STATUS_ICONS[order.status] ?? Package;
        return (
          <div key={order.id} className="border border-neutral-100 rounded-2xl overflow-hidden hover:border-neutral-200 transition">
            {/* Order header */}
            <button
              onClick={() => setExpanded(isOpen ? null : order.id)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-neutral-50 transition text-left"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${STATUS_STYLES[order.status]}`}>
                  <StatusIcon size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-black font-mono">{order.id}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{order.date} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-bold text-black">RM {order.total.toFixed(2)}</p>
                <ChevronRight size={16} className={`text-neutral-300 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {/* Expanded items */}
            {isOpen && (
              <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4">
                <div className="flex flex-col gap-3 mb-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-white border border-neutral-100 overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-contain p-1.5"
                          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#F16C10] uppercase tracking-widest">{item.vendor}</p>
                        <p className="text-sm font-semibold text-black line-clamp-1">{item.title}</p>
                        <p className="text-xs text-neutral-400">Qty: {item.qty}</p>
                      </div>
                      <p className="text-sm font-bold text-black shrink-0">RM {item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {order.status === 'Delivered' && (
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 border border-neutral-200 px-3 py-2 rounded-lg hover:bg-white transition">
                      <RotateCcw size={12} /> Reorder
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 border border-neutral-200 px-3 py-2 rounded-lg hover:bg-white transition">
                    <Star size={12} /> Leave a Review
                  </button>
                  {order.status === 'Shipped' && (
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-[#F16C10] border border-[#F16C10]/30 px-3 py-2 rounded-lg hover:bg-[#F16C10]/5 transition">
                      <Truck size={12} /> Track Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MY PROFILE ───────────────────────────────────────────────────────────────
function MyProfile() {
  const { user, login, shopifyToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [addressId, setAddressId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: '',
    dob: '',
    address: '',
    postal: '',
  });
  const [saved, setSaved] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  // Load the customer's real saved data from Shopify (name, phone, address)
  // instead of showing placeholder mock values.
  useEffect(() => {
    if (!shopifyToken) { setLoading(false); return; }
    getCustomer(shopifyToken)
      .then(customer => {
        if (!customer) return;
        const addr = customer.defaultAddress;
        setAddressId(addr?.id ?? null);
        setForm(f => ({
          ...f,
          firstName: customer.firstName ?? f.firstName,
          lastName: customer.lastName ?? f.lastName,
          email: customer.email ?? f.email,
          phone: customer.phone ?? '',
          address: addr ? [addr.address1, addr.address2].filter(Boolean).join(', ') : '',
          postal: addr?.zip ?? '',
        }));
      })
      .catch(() => { /* keep defaults if this fails */ })
      .finally(() => setLoading(false));
  }, [shopifyToken]);

  async function handleSave() {
    if (!shopifyToken) {
      // No Shopify session — just update local display state
      login({ firstName: form.firstName, lastName: form.lastName, email: form.email });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const profileResult = await updateCustomerProfile(shopifyToken, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
      });
      if (!profileResult.success) {
        setSaveError(profileResult.errors[0] ?? 'Could not save profile');
        setSaving(false);
        return;
      }

      // Only touch the address if there's something to save
      if (form.address.trim() || form.postal.trim()) {
        const addressResult = await saveCustomerAddress(shopifyToken, addressId, {
          address1: form.address,
          city: 'Singapore',
          zip: form.postal,
          country: 'Singapore',
        });
        if (!addressResult.success) {
          setSaveError(addressResult.errors[0] ?? 'Could not save address');
          setSaving(false);
          return;
        }
      }

      login({ firstName: form.firstName, lastName: form.lastName, email: form.email, shopifyToken });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError('Something went wrong saving your profile. Please try again.');
    }
    setSaving(false);
  }

  function handlePwSave() {
    if (!pwForm.current) { setPwError('Enter your current password'); return; }
    if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setPwError('');
    setChangingPw(false);
    setPwForm({ current: '', next: '', confirm: '' });
  }

  const Field = ({ label, value, editKey, type = 'text' }: { label: string; value: string; editKey: keyof typeof form; type?: string }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</label>
      {editing ? (
        <input
          type={type}
          value={form[editKey]}
          onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
          className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#F16C10] transition text-black"
        />
      ) : (
        <p className="text-sm text-black font-medium">{value || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
        <div className="w-16 h-16 rounded-full bg-[#F16C10] text-white text-xl font-bold flex items-center justify-center shrink-0">
          {(user?.firstName ?? 'M').charAt(0).toUpperCase()}{(user?.lastName ?? '').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-bold text-black">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-neutral-400">{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5 bg-[#F16C10]/10 border border-[#F16C10]/20 rounded-full px-2.5 py-0.5 w-fit">
            <Crown size={10} className="text-[#F16C10]" />
            <span className="text-[9px] font-bold text-[#F16C10] uppercase tracking-wider">FOST Member</span>
          </div>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl">
          <Check size={15} /> Profile updated successfully
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
          <X size={15} /> {saveError}
        </div>
      )}

      {/* Personal info */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-black">Personal Information</h3>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-black border border-neutral-200 px-3 py-1.5 rounded-lg transition">
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 text-xs text-white bg-[#F16C10] hover:bg-[#d65f0e] disabled:opacity-60 px-3 py-1.5 rounded-lg transition"
              >
                <Save size={12} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-black border border-neutral-200 px-3 py-1.5 rounded-lg transition">
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" value={form.firstName} editKey="firstName" />
          <Field label="Last Name" value={form.lastName} editKey="lastName" />
          <Field label="Email" value={form.email} editKey="email" type="email" />
          <Field label="Phone" value={form.phone} editKey="phone" type="tel" />
          <div className="flex flex-col gap-1">
            <Field label="Date of Birth" value={form.dob} editKey="dob" type="date" />
            {editing && <p className="text-[10px] text-neutral-400">Not saved yet — coming soon</p>}
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#F16C10]" />
            <h3 className="text-sm font-bold text-black">Default Delivery Address</h3>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-black border border-neutral-200 px-3 py-1.5 rounded-lg transition">
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Address" value={form.address} editKey="address" />
          </div>
          <Field label="Postal Code" value={form.postal} editKey="postal" />
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-[#F16C10]" />
            <h3 className="text-sm font-bold text-black">Password</h3>
          </div>
          <button
            onClick={() => setChangingPw(c => !c)}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-black border border-neutral-200 px-3 py-1.5 rounded-lg transition"
          >
            <Edit2 size={12} /> Change
          </button>
        </div>
        {changingPw ? (
          <div className="px-5 py-4 flex flex-col gap-3">
            {(['current', 'next', 'confirm'] as const).map(k => (
              <div key={k} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {k === 'current' ? 'Current Password' : k === 'next' ? 'New Password' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  value={pwForm[k]}
                  onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))}
                  className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#F16C10] transition text-black"
                />
              </div>
            ))}
            {pwError && <p className="text-xs text-red-500">{pwError}</p>}
            <div className="flex gap-2 mt-1">
              <button onClick={() => { setChangingPw(false); setPwError(''); }} className="flex-1 text-sm text-neutral-400 border border-neutral-200 py-2.5 rounded-xl hover:bg-neutral-50 transition">Cancel</button>
              <button onClick={handlePwSave} className="flex-1 text-sm text-white bg-[#F16C10] hover:bg-[#d65f0e] py-2.5 rounded-xl font-bold transition">Update Password</button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4">
            <p className="text-sm text-neutral-400">••••••••••••</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SAVED ITEMS ──────────────────────────────────────────────────────────────
function SavedItems({ onSelectProduct }: { onSelectProduct: (p: Product) => void }) {
  const [saved, setSaved] = useState(MOCK_SAVED);

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center">
        <Heart size={48} className="text-neutral-200" />
        <p className="text-base font-semibold text-neutral-400">Nothing saved yet</p>
        <p className="text-sm text-neutral-400">Tap the heart on any product to save it here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {saved.map(product => (
        <div key={product.handle} className="group bg-white border border-neutral-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-neutral-200 transition-all cursor-pointer flex flex-col">
          <div
            className="relative bg-neutral-50 overflow-hidden"
            style={{ aspectRatio: '1/1' }}
            onClick={() => onSelectProduct(product as Product)}
          >
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'; }}
            />
            <button
              onClick={e => { e.stopPropagation(); setSaved(s => s.filter(p => p.handle !== product.handle)); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-red-400 hover:bg-white shadow transition"
              aria-label="Remove from saved"
            >
              <Heart size={13} className="fill-red-400" />
            </button>
          </div>
          <div className="p-3 flex flex-col flex-1" onClick={() => onSelectProduct(product as Product)}>
            <p className="text-[9px] font-bold text-[#F16C10] uppercase tracking-widest mb-0.5">{product.vendor}</p>
            <p className="text-xs font-semibold text-black line-clamp-2 flex-1 leading-snug mb-2">{product.title}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-[#F16C10]">RM {getFostPrice(product.price).toFixed(2)}</p>
              <p className="text-[10px] text-neutral-400 line-through">RM {product.price.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MEMBER PERKS ─────────────────────────────────────────────────────────────
function MemberPerks() {
  const perks = [
    {
      icon: Tag,
      title: 'Member-only Pricing',
      desc: 'Unlock exclusive prices on selected products — visible only when logged in.',
      status: 'Active',
      color: 'bg-orange-50 border-orange-100',
      iconColor: 'text-[#F16C10]',
    },
    {
      icon: Zap,
      title: 'Early Access to Launches',
      desc: 'Be first to shop new drops and restocks, 48 hours before the public.',
      status: 'Active',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-500',
    },
    {
      icon: Users,
      title: 'Product Testing',
      desc: 'Test upcoming products and share your feedback before they go on sale.',
      status: 'Eligible',
      color: 'bg-purple-50 border-purple-100',
      iconColor: 'text-purple-500',
    },
    {
      icon: Gift,
      title: 'Flash Sales & Surprise Deals',
      desc: 'Member-only flash sales dropped directly to your email. No public announcements.',
      status: 'Active',
      color: 'bg-pink-50 border-pink-100',
      iconColor: 'text-pink-500',
    },
    {
      icon: CalendarHeart,
      title: 'Exclusive Events',
      desc: 'Invitations to launch events, brand collabs, and behind-the-scenes access.',
      status: 'Invite-eligible',
      color: 'bg-green-50 border-green-100',
      iconColor: 'text-green-500',
    },
  ];

  const statusStyle: Record<string, string> = {
    Active: 'bg-green-50 text-green-600 border-green-200',
    Eligible: 'bg-purple-50 text-purple-600 border-purple-200',
    'Invite-eligible': 'bg-blue-50 text-blue-600 border-blue-200',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Member card */}
      <div className="bg-gradient-to-br from-[#F16C10] to-[#d65f0e] text-white rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">FOST Member</span>
          </div>
          <p className="text-2xl font-bold mb-1">All Perks Active</p>
          <p className="text-white/70 text-sm">Member since June 2026</p>
        </div>
      </div>

      {perks.map(perk => {
        const Icon = perk.icon;
        return (
          <div key={perk.title} className={`flex items-start gap-4 p-4 rounded-2xl border ${perk.color}`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Icon size={18} className={perk.iconColor} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-bold text-black">{perk.title}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[perk.status]}`}>
                  {perk.status}
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">{perk.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ACCOUNT PAGE ────────────────────────────────────────────────────────
export function AccountPage({ onBack, onSelectProduct, initialTab = 'orders' }: AccountPageProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const { user } = useAuth();

  const tabs: { key: Tab; label: string; icon: typeof Package; count?: number }[] = [
    { key: 'orders',  label: 'My Orders',     icon: Package },
    { key: 'profile', label: 'My Profile',    icon: User },
    { key: 'perks',   label: 'Member Perks',  icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-black transition mb-6"
        >
          <ChevronLeft size={16} /> Back to Shop
        </button>

        {/* Page header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#F16C10] text-white text-base font-bold flex items-center justify-center shrink-0">
            {(user?.firstName ?? 'M').charAt(0).toUpperCase()}{(user?.lastName ?? '').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">{user?.firstName} {user?.lastName}</h1>
            <p className="text-sm text-neutral-400">{user?.email}</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition flex-1 justify-center ${
                  active ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Icon size={14} />
                {t.label}
                {t.count !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-[#F16C10] text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === 'orders'  && <MyOrders />}
        {tab === 'profile' && <MyProfile />}
        {tab === 'perks'   && <MemberPerks />}
      </div>
    </div>
  );
}