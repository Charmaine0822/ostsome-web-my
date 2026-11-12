// Client for the Netlify member functions (points, referral code, vouchers).
export type MemberVoucher = { label: string; code: string; amount: number; minSpend?: number; endsAt: string };
export type MemberInfo = {
  points: number; holdPoints: number; referralCode: string; birthMonth: number | null; vouchers: MemberVoucher[];
};

async function post<T>(fn: string, body: object): Promise<T> {
  const res = await fetch(`/.netlify/functions/${fn}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const fetchMember = (token: string) => post<MemberInfo>('member-info', { customerAccessToken: token });

export const initMember = (token: string, input: { birthMonth?: number; referralCode?: string }) =>
  post<{ success: boolean; referral?: string }>('member-init', { customerAccessToken: token, ...input });

export const redeemPoints = (token: string, items: { id: string; qty: number }[]) =>
  post<{ code: string; pointsUsed: number; amount: number; balance: number }>('redeem-points', { customerAccessToken: token, action: 'redeem', items });

export const releasePoints = (token: string) =>
  post<{ balance: number }>('redeem-points', { customerAccessToken: token, action: 'release' });
