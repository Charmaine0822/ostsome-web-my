// New model EDM: emails subscribed customers when a new model goes live.
//
// Trigger: Shopify webhooks "Product creation" AND "Product update"
//   URL: https://ostsome.com.my/.netlify/functions/new-model-edm-background
//   (Shopify admin -> Settings -> Notifications -> Webhooks)
//
// How you use it: in Shopify, tag the product `new-model` and set it to Active.
// The EDM goes out once per product (the product metafield ostsome.edm_sent is
// set afterwards, so later edits never re-send). Products without the tag are ignored.
//
// "-background" in the file name makes this a Netlify background function (up to
// 15 min), so a big customer list will not time out; Shopify gets an instant 202.
//
// Env vars (Netlify -> Site settings -> Environment variables):
//   RESEND_API_KEY   API key from resend.com (or swap sendBatch() for your own email provider)
//   EDM_FROM         e.g. "OSTSOME <hello@ostsome.com.my>" (domain must be verified in Resend)
//   EDM_REPLY_TO     optional, e.g. ost-my@streamcastasia.com
//   EDM_DRY_RUN      set to "1" to log recipients only, without sending (use for the first test)
//   EDM_TEST_EMAIL   optional; if set, ONLY this address receives the email (test mode)
// Shopify app scopes needed: read_products, write_products, read_customers.
// Recipients: customers whose email marketing status is "Subscribed" in Shopify.
const crypto = require('crypto');
const { admin } = require('./lib/shopify');

const SITE = 'https://ostsome.com.my';
const NEW_MODEL_TAG = 'new-model';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function verify(event) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET;
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body || '';
  const sig = event.headers['x-shopify-hmac-sha256'] || '';
  const expected = crypto.createHmac('sha256', secret || '').update(raw, 'utf8').digest('base64');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return { ok: Boolean(secret) && a.length === b.length && crypto.timingSafeEqual(a, b), raw };
}

async function alreadySent(productGid) {
  const d = await admin('query($id:ID!){product(id:$id){metafield(namespace:"ostsome",key:"edm_sent"){value}}}', { id: productGid });
  return d?.product?.metafield?.value === '1';
}
async function markSent(productGid) {
  await admin('mutation($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){userErrors{message}}}', {
    m: [{ ownerId: productGid, namespace: 'ostsome', key: 'edm_sent', type: 'single_line_text_field', value: '1' }],
  });
}

async function getSubscribers() {
  const emails = [];
  let after = null;
  for (;;) {
    const d = await admin(
      'query($after:String){customers(first:250,after:$after,query:"email_marketing_state:subscribed"){pageInfo{hasNextPage endCursor} nodes{email}}}',
      { after }
    );
    for (const c of d.customers.nodes) if (c.email) emails.push(c.email);
    if (!d.customers.pageInfo.hasNextPage) break;
    after = d.customers.pageInfo.endCursor;
  }
  return [...new Set(emails.map(e => e.toLowerCase()))];
}

function buildEmail(p) {
  const url = `${SITE}/products/${p.handle}`;
  const img = p.image?.src || p.images?.[0]?.src || '';
  const title = esc(p.title);
  const vendor = esc(p.vendor || '');
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#F16C10;color:#fff;text-align:center;padding:14px;font-size:12px;font-weight:bold;letter-spacing:2px">NEW ARRIVAL</td></tr>
${img ? `<tr><td style="padding:24px 24px 0"><a href="${url}"><img src="${esc(img)}" alt="${title}" width="512" style="width:100%;height:auto;display:block;border-radius:12px"></a></td></tr>` : ''}
<tr><td style="padding:24px;text-align:center">
${vendor ? `<div style="font-size:12px;font-weight:bold;letter-spacing:2px;color:#F16C10;text-transform:uppercase">${vendor}</div>` : ''}
<h1 style="font-size:24px;margin:8px 0 12px">${title}</h1>
<p style="font-size:14px;color:#555;margin:0 0 20px">Our newest model is now available at OSTSOME. Be among the first to get it.</p>
<a href="${url}" style="display:inline-block;background:#F16C10;color:#fff;text-decoration:none;font-weight:bold;padding:14px 32px;border-radius:12px">Shop now</a>
</td></tr>
<tr><td style="padding:16px 24px 24px;text-align:center;font-size:11px;color:#888;border-top:1px solid #eee">
OSTSOME Malaysia · StreamCast Asia, Jaya One, Petaling Jaya<br>
You are receiving this because you subscribed to OSTSOME updates. To unsubscribe, reply to this email with "Unsubscribe".
</td></tr></table></td></tr></table></body></html>`;
  const text = `New arrival: ${p.title}\nShop now: ${url}\n\nTo unsubscribe, reply with "Unsubscribe".`;
  return { subject: `New arrival: ${p.title}`, html, text };
}

async function sendBatch(from, replyTo, recipients, mail) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(recipients.map(to => ({
      from, to: [to], subject: mail.subject, html: mail.html, text: mail.text,
      ...(replyTo ? { reply_to: replyTo, headers: { 'List-Unsubscribe': `<mailto:${replyTo}?subject=Unsubscribe>` } } : {}),
    }))),
  });
  if (!res.ok) throw new Error(`Email send failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const { ok, raw } = verify(event);
  if (!ok) return { statusCode: 401, body: 'Invalid signature' };

  try {
    const p = JSON.parse(raw);
    const tags = String(p.tags || '').split(',').map(t => t.trim().toLowerCase());
    if (p.status !== 'active') return { statusCode: 200, body: 'skipped: product not active' };
    if (!tags.includes(NEW_MODEL_TAG)) return { statusCode: 200, body: 'skipped: no new-model tag' };

    const gid = p.admin_graphql_api_id || `gid://shopify/Product/${p.id}`;
    if (await alreadySent(gid)) return { statusCode: 200, body: 'skipped: EDM already sent' };

    const from = process.env.EDM_FROM;
    if (!from || !process.env.RESEND_API_KEY) throw new Error('EDM_FROM / RESEND_API_KEY not configured');

    const recipients = process.env.EDM_TEST_EMAIL ? [process.env.EDM_TEST_EMAIL] : await getSubscribers();
    const mail = buildEmail(p);

    if (process.env.EDM_DRY_RUN === '1') {
      console.log(`[DRY RUN] "${mail.subject}" would go to ${recipients.length} recipients`);
      return { statusCode: 200, body: 'dry run' };
    }

    for (let i = 0; i < recipients.length; i += 100) {
      await sendBatch(from, process.env.EDM_REPLY_TO, recipients.slice(i, i + 100), mail);
    }
    if (!process.env.EDM_TEST_EMAIL) await markSent(gid);   // test sends do not lock the product
    console.log(`New-model EDM sent for "${p.title}" to ${recipients.length} recipients`);
    return { statusCode: 200, body: `sent to ${recipients.length}` };
  } catch (e) {
    console.error('new-model-edm error:', e.message);
    return { statusCode: 500, body: 'EDM error' };
  }
};
