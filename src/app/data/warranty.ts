// Client for the warranty Netlify function (submit / list / update / tracking).
export type WarrantyClaim = {
  claimId: string; orderId: string; name: string; phone: string; address: string; issue: string;
  status: string; submittedAt: string; updatedAt: string; trackingNumber: string;
  hasInvoice: boolean; editable: boolean;
};

// Keep these in sync with the Status dropdown in the Google Sheet (warranty-apps-script.gs).
export const WARRANTY_STATUS_STYLE: Record<string, string> = {
  'Submitted': 'bg-neutral-100 text-neutral-600',
  'Received': 'bg-blue-50 text-blue-600',
  'In Progress': 'bg-amber-50 text-amber-600',
  'Completed': 'bg-green-50 text-green-600',
  'Rejected': 'bg-red-50 text-red-600',
};

export async function warrantyPost<T = any>(body: object): Promise<T> {
  const res = await fetch('/.netlify/functions/warranty-submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data as T;
}

// Shrinks the invoice screenshot so it uploads quickly on mobile data.
export async function compressImage(file: File) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return { mime: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.75).split(',')[1] };
}

export const listClaims = (token: string) =>
  warrantyPost<{ claims: WarrantyClaim[] }>({ customerAccessToken: token, action: 'list' });

export type ClaimFields = { orderId: string; name: string; phone: string; address: string; issue: string };
export const updateClaim = (token: string, claimId: string, f: ClaimFields, invoice?: { mime: string; data: string }) =>
  warrantyPost({ customerAccessToken: token, action: 'update', claimId, ...f, invoice });

export const sendClaimTracking = (token: string, claimId: string, orderId: string, trackingNumber: string) =>
  warrantyPost({ customerAccessToken: token, action: 'tracking', claimId, orderId, trackingNumber });
