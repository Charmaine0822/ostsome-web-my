import { useState } from 'react';
import { ShieldCheck, Crown, LogIn, ChevronLeft, Check, Upload, Clock } from 'lucide-react';
import { useAuth } from './AuthContext';
import { warrantyPost as post, compressImage } from '../data/warranty';

type WarrantyPageProps = { onBack?: () => void; onJoin?: () => void; onLogin?: () => void; onViewClaims?: () => void };

const inputCls = 'w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F16C10] transition text-black bg-white';

export function WarrantyPage({ onBack, onJoin, onLogin, onViewClaims }: WarrantyPageProps) {
  const { user, shopifyToken } = useAuth();
  const [f, setF] = useState({ orderId: '', name: user ? `${user.firstName} ${user.lastName}`.trim() : '', phone: '', address: '', issue: '' });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [claimId, setClaimId] = useState('');
  const [tracking, setTracking] = useState('');
  const [trackingDone, setTrackingDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    if (!f.orderId.trim() || !f.name.trim() || !f.phone.trim() || !f.address.trim() || !f.issue.trim()) { setError('Please fill in all required fields.'); return; }
    setBusy(true);
    try {
      const invoice = file ? await compressImage(file) : undefined;
      const r = await post({ customerAccessToken: shopifyToken, action: 'submit', ...f, invoice });
      setClaimId(r.claimId);
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    setBusy(false);
  };

  const sendTracking = async () => {
    setError(''); setBusy(true);
    try { await post({ customerAccessToken: shopifyToken, action: 'tracking', claimId, orderId: f.orderId, trackingNumber: tracking }); setTrackingDone(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    setBusy(false);
  };

  return (
    <section className="bg-white min-h-[70vh]">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#F16C10] transition-colors"><ChevronLeft size={16} /> Back</button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#F16C10]/10 flex items-center justify-center mx-auto mb-5"><ShieldCheck className="text-[#F16C10]" size={28} strokeWidth={1.5} /></div>
          <h1 className="text-3xl lg:text-4xl font-bold text-black mb-3">Extended Warranty Request</h1>
          <div className="inline-flex items-center gap-2 bg-[#F16C10]/10 border border-[#F16C10]/30 px-4 py-2 rounded-full mb-4">
            <Crown className="text-[#F16C10]" size={14} />
            <span className="text-[#F16C10] font-semibold text-xs uppercase tracking-wider">FOST members · +3 months on all brands</span>
          </div>
          <p className="text-neutral-600 text-sm leading-relaxed">Register as a free FOST member to submit an extended warranty request. FOST members get an extra 3 months of extended warranty on all brands: 1 year + 3 months (Satechi: 2 years + 3 months), counted from your order date.</p>
        </div>

        {!user ? (
          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6">
            <p className="text-black font-bold text-sm mb-2">Step 1: Register or log in</p>
            <p className="text-neutral-500 text-sm mb-6">Once you're logged in, the extended warranty form will appear here.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={onJoin} className="bg-[#F16C10] hover:bg-[#d65f0e] text-white px-6 py-3 rounded-xl font-bold text-sm transition">Join FOST — It's Free</button>
              <button onClick={onLogin} className="border-2 border-neutral-200 hover:border-neutral-400 text-black px-6 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"><LogIn size={16} /> Already a member? Log in</button>
            </div>
          </div>
        ) : claimId ? (
          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6">
            <p className="flex items-center gap-2 text-green-600 font-bold mb-2"><Check size={18} /> Request received</p>
            <p className="text-sm text-neutral-600 mb-1">Your claim number is <span className="font-bold text-black">{claimId}</span>. Our team will contact you.</p>
            <p className="text-sm text-neutral-500 flex items-center gap-1.5 mb-6"><Clock size={14} /> Processing time: approximately 1–2 weeks, depending on the situation.</p>
            <button onClick={onViewClaims} className="text-sm font-semibold text-[#F16C10] hover:underline mb-6">View my extended warranty requests</button>
            <div className="border-t border-neutral-200 pt-5">
              <p className="text-black font-bold text-sm mb-1">Shipped out your item?</p>
              <p className="text-neutral-500 text-sm mb-3">Please send us the tracking number after you have shipped it out.</p>
              {trackingDone ? <p className="text-green-600 text-sm font-semibold">Tracking number saved. Thank you!</p> : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input className={inputCls} placeholder="Tracking number" value={tracking} onChange={e => setTracking(e.target.value)} />
                  <button onClick={sendTracking} disabled={busy || tracking.trim().length < 3} className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 shrink-0">Submit</button>
                </div>
              )}
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 grid gap-4">
            <p className="flex items-center gap-2 text-green-600 text-sm font-bold"><Check size={16} /> Logged in as {user.email}</p>
            <button onClick={onViewClaims} className="text-left text-sm font-semibold text-[#F16C10] hover:underline">View my previous extended warranty requests</button>
            <label className="text-sm font-semibold">Order ID *<input className={`${inputCls} mt-1 font-normal`} value={f.orderId} onChange={set('orderId')} placeholder="Shopee / Lazada / website order ID" /></label>
            <label className="text-sm font-semibold">Name *<input className={`${inputCls} mt-1 font-normal`} value={f.name} onChange={set('name')} /></label>
            <label className="text-sm font-semibold">Contact Number *<input className={`${inputCls} mt-1 font-normal`} value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="e.g. 012-3456789" /></label>
            <label className="text-sm font-semibold">Address (for returning purpose) *<textarea className={`${inputCls} mt-1 font-normal`} rows={3} value={f.address} onChange={set('address')} /></label>
            <label className="text-sm font-semibold">Reason / Issue of Warranty *<textarea className={`${inputCls} mt-1 font-normal`} rows={4} value={f.issue} onChange={set('issue')} placeholder="Describe the problem" /></label>
            <div>
              <p className="text-sm font-semibold mb-1">Screenshot of Shopee invoice (if available)</p>
              <label className="flex items-center gap-2 border border-dashed border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-500 cursor-pointer hover:border-[#F16C10]">
                <Upload size={16} /> {file ? file.name : 'Choose an image'}
                <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={submit} disabled={busy} className="bg-[#F16C10] hover:bg-[#d65f0e] disabled:opacity-60 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition">{busy ? 'Submitting…' : 'Submit extended warranty request'}</button>
            <p className="text-xs text-neutral-500">Please send us the tracking number after you have shipped out the item. Warranty processing time: approximately 1–2 weeks, depending on the situation.</p>
          </div>
        )}
      </div>
    </section>
  );
}
