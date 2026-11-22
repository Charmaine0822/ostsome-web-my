import { useCallback, useEffect, useState } from 'react';
import { Check, Clock, Edit2, Truck, Upload, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { compressImage, listClaims, sendClaimTracking, updateClaim, WARRANTY_STATUS_STYLE } from '../data/warranty';
import type { WarrantyClaim } from '../data/warranty';

const inputCls = 'w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F16C10] transition text-black bg-white';
const fmt = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };

function ClaimCard({ claim, token, onChanged }: { claim: WarrantyClaim; token: string; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ orderId: claim.orderId, name: claim.name, phone: claim.phone, address: claim.address, issue: claim.issue });
  const [file, setFile] = useState<File | null>(null);
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const closed = claim.status === 'Completed' || claim.status === 'Rejected';

  const save = async () => {
    setError('');
    if (!f.orderId.trim() || !f.name.trim() || !f.phone.trim() || !f.address.trim() || !f.issue.trim()) { setError('Please fill in all required fields.'); return; }
    setBusy(true);
    try {
      const invoice = file ? await compressImage(file) : undefined;
      await updateClaim(token, claim.claimId, f, invoice);
      setEditing(false); setFile(null); setMsg('Changes saved.');
      onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    setBusy(false);
  };

  const saveTracking = async () => {
    setError(''); setBusy(true);
    try { await sendClaimTracking(token, claim.claimId, claim.orderId, tracking); setTracking(''); setMsg('Tracking number saved.'); onChanged(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    setBusy(false);
  };

  return (
    <div className="border border-neutral-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-black">{claim.claimId}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Order {claim.orderId}{fmt(claim.submittedAt) ? ` · Submitted ${fmt(claim.submittedAt)}` : ''}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${WARRANTY_STATUS_STYLE[claim.status] ?? WARRANTY_STATUS_STYLE.Submitted}`}>{claim.status || 'Submitted'}</span>
      </div>

      {!editing ? (
        <>
          <p className="text-sm text-neutral-600 mt-3 whitespace-pre-line">{claim.issue}</p>
          <p className="text-xs text-neutral-400 mt-2">{claim.hasInvoice ? 'Invoice attached' : 'No invoice attached'}{claim.trackingNumber ? ` · Tracking: ${claim.trackingNumber}` : ''}</p>
          {fmt(claim.updatedAt) && <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1"><Clock size={11} /> Last updated {fmt(claim.updatedAt)}</p>}

          {claim.editable ? (
            <button onClick={() => { setEditing(true); setMsg(''); }} className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#F16C10] hover:underline"><Edit2 size={14} /> Edit request</button>
          ) : (
            <p className="text-xs text-neutral-400 mt-4">Our team has started processing this request, so it can no longer be edited here. Please contact us if something needs to change.</p>
          )}

          {!claim.trackingNumber && !closed && (
            <div className="border-t border-neutral-100 mt-4 pt-4">
              <p className="text-sm font-semibold text-black flex items-center gap-1.5 mb-2"><Truck size={14} /> Shipped out your item?</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input className={inputCls} placeholder="Tracking number" value={tracking} onChange={e => setTracking(e.target.value)} />
                <button onClick={saveTracking} disabled={busy || tracking.trim().length < 3} className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 shrink-0">Submit</button>
              </div>
            </div>
          )}
          {msg && <p className="text-green-600 text-sm font-semibold mt-3 flex items-center gap-1"><Check size={14} /> {msg}</p>}
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </>
      ) : (
        <div className="grid gap-3 mt-4">
          <label className="text-sm font-semibold">Order ID *<input className={`${inputCls} mt-1 font-normal`} value={f.orderId} onChange={set('orderId')} /></label>
          <label className="text-sm font-semibold">Name *<input className={`${inputCls} mt-1 font-normal`} value={f.name} onChange={set('name')} /></label>
          <label className="text-sm font-semibold">Contact Number *<input className={`${inputCls} mt-1 font-normal`} value={f.phone} onChange={set('phone')} inputMode="tel" /></label>
          <label className="text-sm font-semibold">Address *<textarea className={`${inputCls} mt-1 font-normal`} rows={3} value={f.address} onChange={set('address')} /></label>
          <label className="text-sm font-semibold">Reason / Issue *<textarea className={`${inputCls} mt-1 font-normal`} rows={4} value={f.issue} onChange={set('issue')} /></label>
          <div>
            <p className="text-sm font-semibold mb-1">Invoice screenshot {claim.hasInvoice ? '(upload a new one to replace the current)' : ''}</p>
            <label className="flex items-center gap-2 border border-dashed border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-500 cursor-pointer hover:border-[#F16C10]">
              <Upload size={16} /> {file ? file.name : 'Choose an image'}
              <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={save} disabled={busy} className="bg-[#F16C10] hover:bg-[#d65f0e] disabled:opacity-60 text-white px-6 py-3 rounded-xl font-bold text-sm transition">{busy ? 'Saving…' : 'Save changes'}</button>
            <button onClick={() => { setEditing(false); setError(''); setFile(null); }} disabled={busy} className="border border-neutral-200 hover:border-neutral-400 px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-1.5"><X size={14} /> Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MyWarranty() {
  const { shopifyToken } = useAuth();
  const [claims, setClaims] = useState<WarrantyClaim[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!shopifyToken) return;
    setError('');
    listClaims(shopifyToken).then(r => setClaims(r.claims)).catch(e => setError(e instanceof Error ? e.message : 'Could not load your requests.'));
  }, [shopifyToken]);
  useEffect(load, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-black">My extended warranty requests</h2>
        <a href="/warranty" className="text-sm font-semibold text-[#F16C10] hover:underline">New request</a>
      </div>
      {error ? (
        <p className="text-sm text-neutral-500">{error} <button onClick={load} className="underline text-black">Try again</button></p>
      ) : claims === null ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : claims.length === 0 ? (
        <p className="text-sm text-neutral-500">You haven’t submitted any extended warranty requests yet.</p>
      ) : (
        <div className="grid gap-4">
          {claims.map(c => <ClaimCard key={c.claimId} claim={c} token={shopifyToken!} onChanged={load} />)}
        </div>
      )}
    </div>
  );
}
