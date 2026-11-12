// Shopify "orders/paid" webhook: awards points and referral rewards.
// Setup: Shopify admin → Settings → Notifications → Webhooks → Order payment → URL
//   https://ostsome.com.my/.netlify/functions/orders-paid-points
const crypto = require('crypto');
const { CFG, respond, admin, getProfile, saveProfile, createVoucher, addVoucher } = require('./lib/shopify');
const DAY = 86400000;

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
  const secret = process.env.SHOPIFY_POINTS_WEBHOOK_SECRET || process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET;
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body || '';
  const sig = event.headers['x-shopify-hmac-sha256'] || '';
  const expected = crypto.createHmac('sha256', secret || '').update(raw, 'utf8').digest('base64');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (!secret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return respond(401, { error: 'Invalid signature' });

  try {
    const order = JSON.parse(raw);
    if (String(order.tags || '').includes('points-awarded')) return respond(200, { skipped: 'already processed' });
    const customerId = order.customer?.admin_graphql_api_id;
    if (!customerId) return respond(200, { skipped: 'guest order' });
    const p = await getProfile(customerId);
    if (!p || !p.tags.includes('fost-member')) return respond(200, { skipped: 'not a FOST member' });

    const spend = parseFloat(order.subtotal_price) || 0; // after discounts, excl. shipping & tax
    const codes = (order.discount_codes || []).map(d => String(d.code).toUpperCase());
    const usedPoints = codes.some(c => c.startsWith('PTS-'));
    const patch = {};

    if (usedPoints) { if (codes.includes(p.hold?.code)) patch.hold = {}; }   // paid with points → no new points
    else patch.points = p.points + Math.floor(spend * CFG.EARN_PER_RM);

    // Referral: the referrer is rewarded once, when the friend's first qualifying order is paid.
    if (p.referred_by && !p.referral_rewarded && spend >= CFG.REFERRAL_MIN_SPEND) {
      const endsAt = new Date(Date.now() + 90 * DAY).toISOString();
      const v = await createVoucher({ prefix: 'REF', title: 'FOST referral reward', amount: CFG.REFERRAL_RM, customerId: p.referred_by, endsAt, minSpend: CFG.REFERRAL_MIN_SPEND });
      await addVoucher(p.referred_by, { kind: 'referral', label: 'Referral reward', code: v.code, amount: CFG.REFERRAL_RM, minSpend: CFG.REFERRAL_MIN_SPEND, endsAt });
      patch.referral_rewarded = '1';
    }

    if (Object.keys(patch).length) await saveProfile(customerId, patch);
    await admin('mutation($id:ID!,$t:[String!]!){tagsAdd(id:$id,tags:$t){userErrors{message}}}', { id: order.admin_graphql_api_id, t: ['points-awarded'] });
    return respond(200, { success: true });
  } catch (e) { console.error('orders-paid-points error:', e.message); return respond(500, { error: 'processing failed' }); }
};
