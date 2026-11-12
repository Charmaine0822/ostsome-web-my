// Returns the logged-in member's points, referral code and vouchers. Issues the birthday voucher when due.
const { CFG, respond, authCustomer, getProfile, saveProfile, createVoucher, releaseHold, referralCodeFor } = require('./lib/shopify');

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
  try {
    const { customerAccessToken } = JSON.parse(event.body || '{}');
    const me = await authCustomer(customerAccessToken);
    if (!me) return respond(401, { error: 'Customer login required' });
    let p = await getProfile(me.id);
    if (!p) return respond(404, { error: 'Customer not found' });
    p = await releaseHold(p, false);

    // Birthday voucher: once per year, only during the birthday month (Malaysia time, UTC+8).
    const kl = new Date(Date.now() + 8 * 3600e3);
    const year = kl.getUTCFullYear(), month = kl.getUTCMonth() + 1;
    let vouchers = p.vouchers.filter(v => new Date(v.endsAt).getTime() > Date.now());
    if (p.birth_month === month && !p.vouchers.some(v => v.kind === 'birthday' && v.year === year)) {
      const endsAt = new Date(Date.UTC(year, month, 1) - 8 * 3600e3 - 1000).toISOString();
      const v = await createVoucher({ prefix: 'BDAY', title: 'FOST birthday voucher', amount: CFG.BIRTHDAY_RM, customerId: me.id, endsAt });
      vouchers.push({ kind: 'birthday', year, label: 'Birthday voucher', code: v.code, amount: CFG.BIRTHDAY_RM, endsAt });
    }
    if (vouchers.length !== p.vouchers.length) await saveProfile(me.id, { vouchers });

    return respond(200, {
      points: p.points, referralCode: referralCodeFor(me.id), birthMonth: p.birth_month,
      holdPoints: p.hold?.pts || 0,
      vouchers: vouchers.map(({ label, code, amount, minSpend, endsAt }) => ({ label, code, amount, minSpend, endsAt })),
    });
  } catch (e) { console.error('member-info error:', e.message); return respond(500, { error: 'Unable to load member perks.' }); }
};
