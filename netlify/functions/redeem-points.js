// Turns points into a single-use discount code for Satechi / Looki items in the cart.
// Points are deducted immediately; unused points return automatically (see releaseHold).
const { CFG, respond, admin, authCustomer, getProfile, saveProfile, createVoucher, releaseHold } = require('./lib/shopify');

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
  try {
    const { customerAccessToken, action, items } = JSON.parse(event.body || '{}');
    const me = await authCustomer(customerAccessToken);
    if (!me) return respond(401, { error: 'Customer login required' });
    let p = await getProfile(me.id);
    if (!p) return respond(404, { error: 'Customer not found' });
    p = await releaseHold(p, true);
    if (action === 'release') return respond(200, { success: true, balance: p.points });

    const lines = (Array.isArray(items) ? items : []).filter(i => typeof i.id === 'string' && i.qty > 0).slice(0, 50);
    if (!lines.length) return respond(400, { error: 'No items to apply points to.' });
    const d = await admin('query($ids:[ID!]!){nodes(ids:$ids){... on ProductVariant{id price product{vendor}}}}', { ids: lines.map(l => l.id) });
    const eligible = [];
    let eligibleTotal = 0;
    for (const node of d.nodes || []) {
      if (!node?.product) continue;
      if (!CFG.ELIGIBLE_VENDORS.some(v => node.product.vendor.toLowerCase().includes(v))) continue;
      const qty = Math.min(lines.find(l => l.id === node.id).qty, 99);
      eligible.push(node.id);
      eligibleTotal += parseFloat(node.price) * qty;
    }
    if (!eligible.length) return respond(400, { error: 'Points can only be used on Satechi and Looki products.' });

    // Redeem in whole-RM steps: usable points = min(balance, 10 x eligible RM), rounded down to a multiple of 10.
    const maxPts = Math.min(p.points, Math.floor((Math.round(eligibleTotal * 100) * CFG.POINTS_PER_RM_OFF) / 100));
    const pts = Math.floor(maxPts / CFG.POINTS_PER_RM_OFF) * CFG.POINTS_PER_RM_OFF;
    if (pts < CFG.POINTS_PER_RM_OFF) return respond(400, { error: `You need at least ${CFG.POINTS_PER_RM_OFF} points (= RM1) to redeem.` });
    const amount = pts / CFG.POINTS_PER_RM_OFF;
    const expires = new Date(Date.now() + CFG.HOLD_MINUTES * 60000).toISOString();
    const v = await createVoucher({ prefix: 'PTS', title: 'FOST points redemption', amount, customerId: me.id, endsAt: expires, variantIds: eligible });
    p.points -= pts;
    await saveProfile(me.id, { points: p.points, hold: { code: v.code, pts, expires } });
    return respond(200, { success: true, code: v.code, pointsUsed: pts, amount, balance: p.points });
  } catch (e) { console.error('redeem-points error:', e.message); return respond(500, { error: 'Unable to redeem points. Please retry.' }); }
};
