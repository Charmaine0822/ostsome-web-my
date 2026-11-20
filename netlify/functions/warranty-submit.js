// Warranty claims for logged-in FOST members, stored in a Google Sheet (through a Google Apps Script web app,
// see warranty-apps-script.gs). Actions: submit, list, update, tracking.
// Env vars needed: WARRANTY_SHEET_URL, WARRANTY_SHEET_SECRET.
const { respond, authCustomer } = require('./lib/shopify');

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

// Shared validation for submit + update. Returns { error } or { f, invoice }.
function readClaim(b) {
  const f = { orderId: clean(b.orderId, 60), name: clean(b.name, 100), phone: clean(b.phone, 30), address: clean(b.address, 300), issue: clean(b.issue, 1000) };
  if (f.orderId.length < 2 || f.name.length < 2 || f.phone.length < 6 || f.address.length < 5 || f.issue.length < 5)
    return { error: 'Please fill in all required fields.' };
  let invoice;
  if (b.invoice?.data) {
    if (!/^image\/(jpeg|png)$/.test(b.invoice.mime) || b.invoice.data.length > 4_000_000) return { error: 'Invoice image is invalid or too large.' };
    invoice = { mime: b.invoice.mime, data: b.invoice.data };
  }
  return { f, invoice };
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
  try {
    const url = process.env.WARRANTY_SHEET_URL, secret = process.env.WARRANTY_SHEET_SECRET;
    if (!url || !secret) return respond(500, { error: 'Warranty form is not configured yet.' });

    const b = JSON.parse(event.body || '{}');
    const me = await authCustomer(b.customerAccessToken);
    if (!me) return respond(401, { error: 'Please log in as a FOST member first.' });

    // The email always comes from the verified login, never from the request body,
    // so a member can only ever see or change their own claims.
    let payload;
    if (b.action === 'list') {
      payload = { action: 'list', email: me.email };
    } else if (b.action === 'tracking') {
      const claimId = clean(b.claimId, 40), orderId = clean(b.orderId, 60), trackingNumber = clean(b.trackingNumber, 60);
      if ((orderId.length < 2 && !claimId) || trackingNumber.length < 3) return respond(400, { error: 'Please enter your Order ID and tracking number.' });
      payload = { action: 'tracking', claimId, orderId, trackingNumber, email: me.email };
    } else if (b.action === 'update') {
      const claimId = clean(b.claimId, 40);
      if (!claimId) return respond(400, { error: 'Missing claim number.' });
      const r = readClaim(b);
      if (r.error) return respond(400, { error: r.error });
      payload = { action: 'update', claimId, ...r.f, email: me.email, invoice: r.invoice };
    } else {
      const r = readClaim(b);
      if (r.error) return respond(400, { error: r.error });
      payload = { action: 'submit', ...r.f, email: me.email, invoice: r.invoice };
    }

    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ secret, ...payload }) });
    const text = await res.text();
    let out; try { out = JSON.parse(text); } catch { out = null; }
    if (!out) { console.error('warranty-submit: bad response from sheet', text.slice(0, 200)); return respond(502, { error: 'Could not save your request. Please try again.' }); }
    if (!out.ok) {
      if (out.notFound) return respond(404, { error: 'We could not find a warranty request with that Order ID under your account.' });
      if (out.locked) return respond(409, { error: 'This request is already being processed and can no longer be edited.' });
      return respond(502, { error: 'Could not save your request. Please try again.' });
    }
    return respond(200, { success: true, claimId: out.claimId, claims: out.claims });
  } catch (e) { console.error('warranty-submit error:', e.message); return respond(500, { error: 'Something went wrong. Please try again.' }); }
};
