// Shared helpers for FOST points / referral / vouchers.
// Data lives on the Shopify customer as metafields (namespace "ostsome"); no extra database.
const crypto = require('crypto');

const DOMAIN = '3e43e4-81.myshopify.com';
const VERSION = '2026-10';
const STOREFRONT_TOKEN = '20057c94117d9205a670492792aaa6aa';
const NS = 'ostsome';

// ── Business rules: change here ──────────────────────────────────────────────
const CFG = {
  EARN_PER_RM: 1,                          // RM1 spent = 1 point
  POINT_VALUE_RM: 1,                       // 1 point = RM1 off when redeeming
  ELIGIBLE_VENDORS: ['satechi', 'looki'],  // points can only be used on these brands
  BIRTHDAY_RM: 20,
  REFERRAL_RM: 30,
  REFERRAL_MIN_SPEND: 100,                 // min spend to use a referral voucher / to trigger the referrer's reward
  HOLD_MINUTES: 120,                       // redeemed points are held this long before returning if unused
};

const respond = (statusCode, payload) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(payload) });

async function gql(url, header, token, query, variables) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', [header]: token }, body: JSON.stringify({ query, variables }) });
  const data = await res.json();
  if (!res.ok || data.errors?.length) throw new Error(`Shopify GraphQL failed (${res.status}): ${data.errors?.[0]?.message || 'request error'}`);
  return data.data;
}

let cached = { token: null, exp: 0 };
async function adminToken() {
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const id = process.env.SHOPIFY_CLIENT_ID, secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Shopify credentials not configured');
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }) });
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error(`Admin authentication failed (${res.status})`);
  cached = { token: json.access_token, exp: Date.now() + 15 * 60 * 1000 };
  return cached.token;
}
const admin = async (q, v) => gql(`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`, 'X-Shopify-Access-Token', await adminToken(), q, v);

// Identify the logged-in customer from their Storefront access token (never trust a supplied id/email).
async function authCustomer(token) {
  if (typeof token !== 'string' || token.length < 8) return null;
  const d = await gql(`https://${DOMAIN}/api/${VERSION}/graphql.json`, 'X-Shopify-Storefront-Access-Token', STOREFRONT_TOKEN,
    'query($t:String!){customer(customerAccessToken:$t){id email}}', { t: token });
  return d?.customer || null;
}

const parseJson = (s, fallback) => { try { return s ? JSON.parse(s) : fallback; } catch { return fallback; } };

async function getProfile(id) {
  const d = await admin(`query($id:ID!){customer(id:$id){id email tags metafields(first:20,namespace:"${NS}"){nodes{key value}}}}`, { id });
  const c = d?.customer;
  if (!c) return null;
  const m = Object.fromEntries(c.metafields.nodes.map(n => [n.key, n.value]));
  const tags = Array.isArray(c.tags) ? c.tags : String(c.tags || '').split(',').map(t => t.trim());
  return {
    id: c.id, email: c.email, tags,
    points: parseInt(m.points || '0', 10) || 0,
    birth_month: m.birth_month ? parseInt(m.birth_month, 10) : null,
    referred_by: m.referred_by || null,
    referral_rewarded: m.referral_rewarded === '1',
    init: m.init === '1',
    vouchers: parseJson(m.vouchers, []),
    hold: parseJson(m.hold, {}),
  };
}

const TYPES = { points: 'number_integer', birth_month: 'number_integer', vouchers: 'json', hold: 'json' };
async function saveProfile(id, patch) {
  const metafields = Object.entries(patch).map(([key, val]) => ({
    ownerId: id, namespace: NS, key, type: TYPES[key] || 'single_line_text_field',
    value: typeof val === 'string' ? val : JSON.stringify(val),
  }));
  const d = await admin('mutation($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){userErrors{message}}}', { m: metafields });
  const errs = d?.metafieldsSet?.userErrors;
  if (errs?.length) throw new Error(errs.map(e => e.message).join('; '));
}

// Referral code is derived from the customer id, so it needs no storage and old members get one automatically.
const numericId = gid => String(gid).split('/').pop();
const referralCodeFor = gid => 'OST' + parseInt(numericId(gid), 10).toString(36).toUpperCase();
function customerIdFromCode(code) {
  const m = /^OST([0-9A-Z]{3,12})$/.exec(String(code || '').trim().toUpperCase());
  if (!m) return null;
  const n = parseInt(m[1], 36);
  return Number.isFinite(n) && n > 0 ? `gid://shopify/Customer/${n}` : null;
}

const rand = (len = 6) => Array.from(crypto.randomBytes(len), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

async function createVoucher({ prefix, title, amount, customerId, endsAt, minSpend, variantIds }) {
  const code = `${prefix}-${rand(7)}`;
  const d = await admin('mutation($d:DiscountCodeBasicInput!){discountCodeBasicCreate(basicCodeDiscount:$d){codeDiscountNode{id} userErrors{message}}}', {
    d: {
      title: `${title} ${code}`, code, startsAt: new Date().toISOString(), endsAt,
      usageLimit: 1, appliesOncePerCustomer: true,
      customerSelection: { customers: { add: [customerId] } },
      customerGets: {
        value: { discountAmount: { amount: Number(amount).toFixed(2), appliesOnEachItem: false } },
        items: variantIds?.length ? { products: { productVariantsToAdd: variantIds } } : { all: true },
      },
      ...(minSpend ? { minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: Number(minSpend).toFixed(2) } } } : {}),
      combinesWith: { orderDiscounts: true, productDiscounts: true, shippingDiscounts: true },
    },
  });
  const errs = d?.discountCodeBasicCreate?.userErrors;
  if (errs?.length) throw new Error(errs.map(e => e.message).join('; '));
  return { code, nodeId: d.discountCodeBasicCreate.codeDiscountNode.id };
}

async function addVoucher(customerId, voucher) {
  const p = await getProfile(customerId);
  const now = Date.now();
  const vouchers = [...p.vouchers.filter(v => new Date(v.endsAt).getTime() > now), voucher];
  await saveProfile(customerId, { vouchers });
}

// Returns held points to the balance if the redemption code was never used.
// force=false only releases holds that have expired.
async function releaseHold(p, force) {
  const h = p.hold;
  if (!h?.code) return p;
  const expired = new Date(h.expires).getTime() <= Date.now();
  if (!force && !expired) return p;
  const d = await admin('query($c:String!){codeDiscountNodeByCode(code:$c){id codeDiscount{... on DiscountCodeBasic{asyncUsageCount}}}}', { c: h.code });
  const node = d?.codeDiscountNode ?? d?.codeDiscountNodeByCode;
  const used = node?.codeDiscount?.asyncUsageCount > 0;
  if (!used) {
    if (node?.id) await admin('mutation($id:ID!){discountCodeDelete(id:$id){userErrors{message}}}', { id: node.id });
    p.points += h.pts;
  }
  p.hold = {};
  await saveProfile(p.id, { points: p.points, hold: {} });
  return p;
}

module.exports = { CFG, respond, gql, admin, authCustomer, getProfile, saveProfile, createVoucher, addVoucher, releaseHold, referralCodeFor, customerIdFromCode, numericId };
