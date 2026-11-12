// Called once right after FOST sign-up: stores birthday month and applies an optional referral code.
const { CFG, respond, authCustomer, getProfile, saveProfile, createVoucher, addVoucher, customerIdFromCode } = require('./lib/shopify');
const DAY = 86400000;

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
  try {
    const { customerAccessToken, birthMonth, referralCode } = JSON.parse(event.body || '{}');
    const me = await authCustomer(customerAccessToken);
    if (!me) return respond(401, { error: 'Customer login required' });
    const p = await getProfile(me.id);
    if (!p) return respond(404, { error: 'Customer not found' });
    if (p.init) return respond(200, { success: true, alreadyInitialised: true });

    const patch = { init: '1', points: p.points };
    const m = parseInt(birthMonth, 10);
    if (m >= 1 && m <= 12) patch.birth_month = m;

    let referral = 'none';
    const referrerId = customerIdFromCode(referralCode);
    if (referralCode && !referrerId) referral = 'invalid';
    else if (referrerId && referrerId !== me.id) {
      const referrer = await getProfile(referrerId).catch(() => null);
      if (!referrer || !referrer.tags.includes('fost-member')) referral = 'invalid';
      else {
        patch.referred_by = referrerId;
        const v = await createVoucher({
          prefix: 'REF', title: 'FOST referral welcome', amount: CFG.REFERRAL_RM, customerId: me.id,
          endsAt: new Date(Date.now() + 90 * DAY).toISOString(), minSpend: CFG.REFERRAL_MIN_SPEND,
        });
        await saveProfile(me.id, patch);
        await addVoucher(me.id, { kind: 'referral', label: 'Referral welcome voucher', code: v.code, amount: CFG.REFERRAL_RM, minSpend: CFG.REFERRAL_MIN_SPEND, endsAt: new Date(Date.now() + 90 * DAY).toISOString() });
        return respond(200, { success: true, referral: 'applied' });
      }
    } else if (referrerId === me.id) referral = 'invalid';

    await saveProfile(me.id, patch);
    return respond(200, { success: true, referral });
  } catch (e) { console.error('member-init error:', e.message); return respond(500, { error: 'Unable to set up membership perks.' }); }
};
