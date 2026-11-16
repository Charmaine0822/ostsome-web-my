import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import { fetchMember } from '../data/member';
import type { MemberInfo } from '../data/member';

type Props = { onBack?: () => void; onShopWithPoints?: () => void; onJoin?: () => void; onLogin?: () => void };

const SITE = 'https://ostsome.com.my';

export function RewardsPage({ onBack, onShopWithPoints, onJoin, onLogin }: Props) {
  const { user, shopifyToken } = useAuth();
  const [info, setInfo] = useState<MemberInfo | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [copied, setCopied] = useState('');

  const load = useCallback(() => {
    if (!shopifyToken) return;
    setState('loading');
    fetchMember(shopifyToken).then(m => { setInfo(m); setState('idle'); }).catch(() => setState('error'));
  }, [shopifyToken]);
  useEffect(load, [load]);

  const copy = (text: string) => { navigator.clipboard?.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1600); };
  const shareText = info ? `Join OSTSOME’s FOST (it’s free) with my code ${info.referralCode} and we each get RM30. ${SITE}` : '';
  const points = info?.points;

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-20">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black transition-colors mb-10"><ChevronLeft size={16} /> Back</button>

        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-black">Rewards</h1>
        <p className="text-neutral-500 mt-3 max-w-md">Earn points on every order, and bring a friend along. Both are free for FOST members.</p>

        {/* Balance */}
        <section className="mt-12 border-t border-neutral-200 pt-8">
          {!user ? (
            <>
              <p className="text-lg text-black font-medium">Join FOST to start earning.</p>
              <p className="text-neutral-500 mt-1 text-sm">It takes a minute and costs nothing.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={onJoin} className="bg-black hover:bg-neutral-800 text-white text-sm font-semibold px-6 py-3 rounded-full transition">Join FOST</button>
                <button onClick={onLogin} className="text-sm font-semibold px-6 py-3 rounded-full border border-neutral-300 hover:border-black transition">Log in</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-500">Your points</p>
              <p className="text-6xl font-semibold tracking-tight text-black tabular-nums mt-1">
                {state === 'loading' && !info ? '…' : points == null ? '–' : points.toLocaleString()}
              </p>
              {points != null && <p className="text-sm text-neutral-500 mt-2">Worth RM{Math.floor(points / 10).toLocaleString()} off selected products.{info && info.holdPoints > 0 ? ` ${info.holdPoints} points are reserved in a checkout.` : ''}</p>}
              {(state === 'error' || info?.degraded) && (
                <p className="text-sm text-neutral-500 mt-2">We couldn’t load your points just now. <button onClick={load} className="underline text-black">Try again</button></p>
              )}
              <button onClick={onShopWithPoints} className="mt-6 bg-black hover:bg-neutral-800 text-white text-sm font-semibold px-6 py-3 rounded-full transition">Shop with points</button>
            </>
          )}
        </section>

        {/* How it works */}
        <section className="mt-12 border-t border-neutral-200 pt-8">
          <h2 className="text-lg font-semibold text-black mb-4">How points work</h2>
          <dl className="divide-y divide-neutral-200 text-sm">
            <div className="flex justify-between gap-6 py-3"><dt className="text-neutral-500">Earn</dt><dd className="text-black text-right">RM1 spent = 1 point</dd></div>
            <div className="flex justify-between gap-6 py-3"><dt className="text-neutral-500">Redeem</dt><dd className="text-black text-right">10 points = RM1 off selected products</dd></div>
            <div className="flex justify-between gap-6 py-3"><dt className="text-neutral-500">Good to know</dt><dd className="text-black text-right">Orders paid with points don’t earn new points</dd></div>
          </dl>
        </section>

        {/* Invite */}
        <section className="mt-12 border-t border-neutral-200 pt-8">
          <h2 className="text-lg font-semibold text-black">Invite a friend</h2>
          <p className="text-neutral-500 text-sm mt-1 max-w-md">Your friend enters your code when they join and gets an RM30 voucher. Once they place their first order of RM100 or more, you get RM30 too.</p>
          {!user ? (
            <p className="text-sm text-neutral-500 mt-4">Join FOST to get your own code.</p>
          ) : info ? (
            <div className="mt-5">
              <p className="text-sm text-neutral-500">Your code</p>
              <p className="text-3xl font-semibold tracking-widest text-black mt-1">{info.referralCode}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={() => copy(info.referralCode)} className="text-sm font-semibold px-5 py-2.5 rounded-full border border-neutral-300 hover:border-black transition">{copied === info.referralCode ? 'Copied' : 'Copy code'}</button>
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold px-5 py-2.5 rounded-full border border-neutral-300 hover:border-black transition">Share on WhatsApp</a>
              </div>
            </div>
          ) : state === 'error' ? (
            <p className="text-sm text-neutral-500 mt-4">We couldn’t load your code. <button onClick={load} className="underline text-black">Try again</button></p>
          ) : <p className="text-sm text-neutral-400 mt-4">Loading…</p>}
        </section>

        {/* Vouchers */}
        {info && info.vouchers.length > 0 && (
          <section className="mt-12 border-t border-neutral-200 pt-8">
            <h2 className="text-lg font-semibold text-black mb-4">Your vouchers</h2>
            <ul className="divide-y divide-neutral-200">
              {info.vouchers.map(v => (
                <li key={v.code} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-black">{v.label} · RM{v.amount} off</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Code {v.code}{v.minSpend ? ` · spend RM${v.minSpend}+` : ''} · until {new Date(v.endsAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  <button onClick={() => copy(v.code)} className="text-sm font-semibold px-4 py-2 rounded-full border border-neutral-300 hover:border-black transition shrink-0">{copied === v.code ? 'Copied' : 'Copy'}</button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
