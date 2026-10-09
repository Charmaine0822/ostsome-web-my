// FOST tagging: authenticated customer only. Never trust a supplied email.
const DOMAIN = '3e43e4-81.myshopify.com';
const VERSION = '2026-10';
const STOREFRONT_TOKEN = '20057c94117d9205a670492792aaa6aa';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const respond = (statusCode, payload) => ({statusCode, headers: {'Content-Type':'application/json','Cache-Control':'no-store'}, body:JSON.stringify(payload)});
async function gql(url, tokenHeader, token, query, variables) {
  const res = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json',[tokenHeader]:token},body:JSON.stringify({query,variables})});
  const data = await res.json();
  if (!res.ok || data.errors?.length) throw new Error(`Shopify GraphQL failed (${res.status}): ${data.errors?.[0]?.message || 'request error'}`);
  return data.data;
}
exports.handler = async event => {
  if (event.httpMethod !== 'POST') return respond(405,{error:'Method not allowed'});
  try {
    const {customerAccessToken} = JSON.parse(event.body || '{}');
    if (typeof customerAccessToken !== 'string' || customerAccessToken.length < 8) return respond(401,{error:'Customer login required'});
    const customerData = await gql(`https://${DOMAIN}/api/${VERSION}/graphql.json`, 'X-Shopify-Storefront-Access-Token', STOREFRONT_TOKEN,
      'query($token:String!){customer(customerAccessToken:$token){id email orders(first:1){edges{node{id}}}}}',{token:customerAccessToken});
    const authenticated = customerData?.customer;
    if (!authenticated?.email) return respond(401,{error:'Invalid customer session'});
    if (authenticated.orders?.edges?.length) return respond(403,{error:'First-order membership tagging is not available after purchase'});
    const clientId=process.env.SHOPIFY_CLIENT_ID, clientSecret=process.env.SHOPIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) return respond(503,{error:'Membership service not configured'});
    const tokenRes=await fetch(`https://${DOMAIN}/admin/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:clientId,client_secret:clientSecret})});
    const tokenJson=await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) throw new Error(`Admin authentication failed (${tokenRes.status})`);
    const adminUrl=`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`;
    const adminGql=(q,v)=>gql(adminUrl,'X-Shopify-Access-Token',tokenJson.access_token,q,v);
    let customer;
    for (let i=0;i<4;i++) {
      const result=await adminGql('query($q:String!){customers(first:5,query:$q){nodes{id email tags numberOfOrders}}}',{q:`email:${authenticated.email}`});
      customer=result?.customers?.nodes?.find(c=>c.email?.toLowerCase()===authenticated.email.toLowerCase());
      if (customer) break;
      await sleep(800*(i+1));
    }
    if (!customer) return respond(404,{error:'Customer not indexed yet; please retry'});
    if (customer.numberOfOrders > 0) return respond(403,{error:'Not eligible after first order'});
    if (customer.tags?.includes('fost-member')) return respond(200,{success:true,alreadyTagged:true});
    const updated=await adminGql('mutation($id:ID!,$tags:[String!]!){tagsAdd(id:$id,tags:$tags){node{id} userErrors{message}}}',{id:customer.id,tags:['fost-member']});
    const errors=updated?.tagsAdd?.userErrors;
    if (errors?.length) throw new Error(errors.map(e=>e.message).join('; '));
    if (!updated?.tagsAdd?.node) throw new Error('Tag mutation returned no customer');
    return respond(200,{success:true});
  } catch(e) {console.error('FOST tagging error:',e.message);return respond(500,{error:'Unable to activate member discount. Please retry.'});}
};
