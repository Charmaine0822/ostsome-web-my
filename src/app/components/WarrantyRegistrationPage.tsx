import { useState } from 'react';
import { useAuth } from './AuthContext';
import { ShieldCheck, MessageCircle, LockKeyhole } from 'lucide-react';

export function WarrantyRegistrationPage({ onJoin, onLogin }: { onJoin: () => void; onLogin: () => void }) {
  const { user } = useAuth();
  const [order, setOrder] = useState('');
  const [platform, setPlatform] = useState('Shopee');
  const [product, setProduct] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [agreed, setAgreed] = useState(false);
  const ready = !!user && !!order.trim() && !!product.trim() && !!purchaseDate && agreed;
  const message = `Hello OSTSOME, I would like to request FOST +3 months warranty verification.\nFOST email: ${user?.email || ''}\nPlatform: ${platform}\nOrder number: ${order}\nProduct: ${product}\nPurchase date: ${purchaseDate}\nI will attach my receipt / order proof for your review.`;
  return <main className="min-h-[65vh] bg-neutral-50 py-12 px-4"><div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 shadow-sm">
    <div className="flex items-center gap-3 mb-4"><ShieldCheck className="text-[#F16C10]" size={30}/><h1 className="text-3xl font-bold text-black">FOST Extended Warranty</h1></div>
    <p className="text-neutral-600 mb-5">An extra 3 months of warranty, exclusively for eligible FOST members. Registration and purchase verification are required. Scanning the QR card does not automatically activate coverage.</p>
    <div className="bg-orange-50 rounded-xl p-4 mb-6 text-sm text-neutral-700"><strong>Standard warranty:</strong> Satechi — 2 years; other brands — generally 1 year, subject to product terms. Eligible FOST coverage adds 3 months after the original warranty ends, subject to approval.</div>
    {!user && <div className="border border-orange-200 rounded-xl p-5 mb-6"><div className="flex gap-2 items-center font-semibold mb-2"><LockKeyhole size={18}/> FOST membership required</div><p className="text-sm text-neutral-600 mb-4">Create a free FOST account or sign in before requesting verification.</p><div className="flex flex-wrap gap-3"><button onClick={onJoin} className="bg-[#F16C10] text-white rounded-lg px-5 py-2 font-semibold">Join FOST — Free</button><button onClick={onLogin} className="border rounded-lg px-5 py-2">Log in</button></div></div>}
    {user && <p className="text-sm mb-5 text-green-700">Signed in as {user.email}. Complete the details below and send your receipt through WhatsApp.</p>}
    <div className="grid gap-4">
      <label className="text-sm font-semibold">Purchase platform<select value={platform} onChange={e=>setPlatform(e.target.value)} className="mt-1 w-full border rounded-lg p-3 bg-white"><option>Shopee</option><option>Lazada</option><option>OSTSOME Website</option><option>Decathlon</option><option>Other authorised channel</option></select></label>
      <label className="text-sm font-semibold">Order number<input value={order} onChange={e=>setOrder(e.target.value)} placeholder="Enter your order number" className="mt-1 w-full border rounded-lg p-3" /></label>
      <label className="text-sm font-semibold">Product name / model<input value={product} onChange={e=>setProduct(e.target.value)} placeholder="e.g. Satechi USB-C Hub" className="mt-1 w-full border rounded-lg p-3" /></label>
      <label className="text-sm font-semibold">Purchase date<input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} className="mt-1 w-full border rounded-lg p-3" /></label>
      <label className="flex items-start gap-3 text-sm text-neutral-600"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-1"/>I understand that I must send my receipt / proof of purchase through WhatsApp. Coverage is subject to eligibility and manual verification.</label>
      <a href={ready ? `https://wa.me/60108870937?text=${encodeURIComponent(message)}` : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!ready} onClick={e=>{if(!ready)e.preventDefault()}} className={`flex justify-center items-center gap-2 rounded-xl p-4 font-bold ${ready?'bg-[#F16C10] text-white':'bg-neutral-200 text-neutral-500 cursor-not-allowed'}`}><MessageCircle size={19}/> Contact WhatsApp & Send Receipt</a>
      <p className="text-xs text-neutral-500">Your details are prepared as a WhatsApp message. This website does not store a warranty application or automatically approve warranty coverage. Attach the receipt in WhatsApp before sending.</p>
    </div>
  </div></main>;
}
