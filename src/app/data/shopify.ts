// ─── SHOPIFY STOREFRONT API ───────────────────────────────────────────────────
// Using the Storefront API to fetch products, collections, and handle cart/checkout

const SHOPIFY_STORE_DOMAIN = '3e43e4-81.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = '20057c94117d9205a670492792aaa6aa';
const SHOPIFY_API_VERSION = '2024-04';

const STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

async function storefrontFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(STOREFRONT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`);
  }

  return json.data as T;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  descriptionHtml: string;
  images: { edges: { node: { url: string; altText: string | null } }[] };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        sku: string;
        price: { amount: string; currencyCode: string };
        compareAtPrice: { amount: string; currencyCode: string } | null;
        availableForSale: boolean;
        quantityAvailable: number | null;
        selectedOptions: { name: string; value: string }[];
        image: { url: string } | null;
      };
    }[];
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          title: string;
          price: { amount: string };
          product: { title: string; handle: string; images: { edges: { node: { url: string } }[] } };
        };
      };
    }[];
  };
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  discountCodes?: { code: string; applicable: boolean }[];
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const query = `
      query GetProducts($cursor: String) @inContext(country: MY) {
        products(first: 250, after: $cursor) {
          edges {
            node {
              id handle title vendor productType descriptionHtml
              images(first: 10) { edges { node { url altText } } }
              variants(first: 20) {
                edges {
                  node {
                    id title sku availableForSale quantityAvailable
                    price { amount currencyCode }
                    compareAtPrice { amount currencyCode }
                    selectedOptions { name value }
                    image { url }
                  }
                }
              }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;

    const data = await storefrontFetch<{
      products: {
        edges: { node: ShopifyProduct }[];
        pageInfo: { hasNextPage: boolean; endCursor: string };
      };
    }>(query, { cursor });

    allProducts.push(...data.products.edges.map(e => e.node));
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return allProducts;
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    query GetProduct($handle: String!) @inContext(country: MY) {
      product(handle: $handle) {
        id handle title vendor productType descriptionHtml
        images(first: 10) { edges { node { url altText } } }
        variants(first: 20) {
          edges {
            node {
              id title sku availableForSale quantityAvailable
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              selectedOptions { name value }
              image { url }
            }
          }
        }
      }
    }
  `;

  const data = await storefrontFetch<{ product: ShopifyProduct | null }>(query, { handle });
  return data.product;
}

// ─── CART ─────────────────────────────────────────────────────────────────────

// Checks whether a previously-created cart still exists. Shopify deletes a
// cart automatically once its checkout completes and becomes an order —
// so if this returns null for a cart ID we created, that's a reliable
// signal the purchase went through (works identically for guests and
// logged-in customers, since it doesn't depend on customer accounts at all).
export async function getCart(cartId: string): Promise<{ id: string } | null> {
  const query = `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) { id }
    }
  `;
  const data = await storefrontFetch<{ cart: { id: string } | null }>(query, { cartId });
  return data.cart;
}

export async function createCart(discountCodes?: string[], customerAccessToken?: string): Promise<ShopifyCart> {
  const query = `
    mutation CreateCart($discountCodes: [String!], $buyerIdentity: CartBuyerIdentityInput) {
      cartCreate(input: { discountCodes: $discountCodes, buyerIdentity: $buyerIdentity }) {
        cart {
          id checkoutUrl totalQuantity
          lines(first: 50) {
            edges {
              node {
                id quantity
                merchandise {
                  ... on ProductVariant {
                    id title
                    price { amount }
                    product { title handle images(first: 1) { edges { node { url } } } }
                  }
                }
              }
            }
          }
          cost {
            subtotalAmount { amount currencyCode }
            totalAmount { amount currencyCode }
          }
          discountCodes { code applicable }
        }
      }
    }
  `;

  const data = await storefrontFetch<{ cartCreate: { cart: ShopifyCart } }>(
    query, {
      discountCodes: discountCodes ?? [],
      // Linking buyerIdentity to the logged-in customer means the resulting
      // order is associated with their Shopify account — this is what makes
      // it show up under "My Orders" with real status, and lets Shopify
      // checkout pre-fill their saved address.
      buyerIdentity: {
        countryCode: 'MY',
        ...(customerAccessToken ? { customerAccessToken } : {}),
      },
    }
  );
  return data.cartCreate.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity: number): Promise<ShopifyCart> {
  const query = `
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id checkoutUrl totalQuantity
          lines(first: 50) {
            edges {
              node {
                id quantity
                merchandise {
                  ... on ProductVariant {
                    id title
                    price { amount }
                    product { title handle images(first: 1) { edges { node { url } } } }
                  }
                }
              }
            }
          }
          cost {
            subtotalAmount { amount currencyCode }
            totalAmount { amount currencyCode }
          }
        }
      }
    }
  `;

  const data = await storefrontFetch<{ cartLinesAdd: { cart: ShopifyCart } }>(
    query, { cartId, lines: [{ merchandiseId: variantId, quantity }] }
  );
  return data.cartLinesAdd.cart;
}

export async function removeFromCart(cartId: string, lineId: string): Promise<ShopifyCart> {
  const query = `
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id checkoutUrl totalQuantity
          lines(first: 50) {
            edges {
              node {
                id quantity
                merchandise {
                  ... on ProductVariant {
                    id title
                    price { amount }
                    product { title handle images(first: 1) { edges { node { url } } } }
                  }
                }
              }
            }
          }
          cost {
            subtotalAmount { amount currencyCode }
            totalAmount { amount currencyCode }
          }
        }
      }
    }
  `;

  const data = await storefrontFetch<{ cartLinesRemove: { cart: ShopifyCart } }>(
    query, { cartId, lineIds: [lineId] }
  );
  return data.cartLinesRemove.cart;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<ShopifyCart> {
  const query = `
    mutation UpdateCart($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id checkoutUrl totalQuantity
          lines(first: 50) {
            edges {
              node {
                id quantity
                merchandise {
                  ... on ProductVariant {
                    id title
                    price { amount }
                    product { title handle images(first: 1) { edges { node { url } } } }
                  }
                }
              }
            }
          }
          cost {
            subtotalAmount { amount currencyCode }
            totalAmount { amount currencyCode }
          }
        }
      }
    }
  `;

  const data = await storefrontFetch<{ cartLinesUpdate: { cart: ShopifyCart } }>(
    query, { cartId, lines: [{ id: lineId, quantity }] }
  );
  return data.cartLinesUpdate.cart;
}

// ─── CUSTOMER AUTH ────────────────────────────────────────────────────────────

export async function customerLogin(email: string, password: string): Promise<{ token: string; expiresAt: string } | null> {
  const query = `
    mutation CustomerLogin($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code field message }
      }
    }
  `;

  const data = await storefrontFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(query, { input: { email, password } });

  const result = data.customerAccessTokenCreate;
  if (result.customerUserErrors.length > 0) return null;
  if (!result.customerAccessToken) return null;
  return { token: result.customerAccessToken.accessToken, expiresAt: result.customerAccessToken.expiresAt };
}

export async function customerRegister(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ success: boolean; errors: string[] }> {
  const query = `
    mutation CustomerRegister($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email }
        customerUserErrors { code field message }
      }
    }
  `;

  const data = await storefrontFetch<{
    customerCreate: {
      customer: { id: string } | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(query, { input });

  const result = data.customerCreate;
  if (result.customerUserErrors.length > 0) {
    return { success: false, errors: result.customerUserErrors.map(e => e.message) };
  }
  return { success: true, errors: [] };
}

export async function customerResetPassword(email: string): Promise<boolean> {
  const query = `
    mutation CustomerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { code field message }
      }
    }
  `;

  const data = await storefrontFetch<{
    customerRecover: { customerUserErrors: { message: string }[] };
  }>(query, { email });

  return data.customerRecover.customerUserErrors.length === 0;
}

export async function getCustomer(token: string) {
  const query = `
    query GetCustomer($token: String!) {
      customer(customerAccessToken: $token) {
        id firstName lastName email phone
        defaultAddress { id address1 address2 city zip country }
        orders(first: 10) {
          edges {
            node {
              id name processedAt financialStatus fulfillmentStatus
              totalPrice { amount currencyCode }
              lineItems(first: 10) {
                edges {
                  node {
                    title quantity
                    variant { price { amount } image { url } }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await storefrontFetch<{ customer: any }>(query, { token });
  return data.customer;
}

// Updates the customer's name and phone (email intentionally excluded —
// changing it via the Storefront API can require re-verification, so
// leave that as a separate flow rather than silently changing login email).
export async function updateCustomerProfile(
  token: string,
  input: { firstName: string; lastName: string; phone?: string }
): Promise<{ success: boolean; errors: string[] }> {
  const query = `
    mutation UpdateCustomer($token: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $token, customer: $customer) {
        customer { id }
        customerUserErrors { code field message }
      }
    }
  `;
  const data = await storefrontFetch<{
    customerUpdate: { customer: { id: string } | null; customerUserErrors: { message: string }[] };
  }>(query, { token, customer: input });

  const errors = data.customerUpdate.customerUserErrors;
  return { success: errors.length === 0, errors: errors.map(e => e.message) };
}

// Saves the customer's default delivery address — creates a new address
// if they don't have one yet (addressId is null), or updates the existing
// one in place. Also sets/keeps it as their default so it pre-fills at
// Shopify checkout automatically for logged-in FOST members.
export async function saveCustomerAddress(
  token: string,
  addressId: string | null,
  address: { address1: string; address2?: string; city: string; zip: string; country?: string }
): Promise<{ success: boolean; errors: string[] }> {
  if (addressId) {
    const query = `
      mutation UpdateAddress($token: String!, $id: ID!, $address: CustomerAddressUpdateInput!) {
        customerAddressUpdate(customerAccessToken: $token, id: $id, address: $address) {
          customerAddress { id }
          customerUserErrors { code field message }
        }
      }
    `;
    const data = await storefrontFetch<{
      customerAddressUpdate: { customerAddress: { id: string } | null; customerUserErrors: { message: string }[] };
    }>(query, { token, id: addressId, address });

    const errors = data.customerAddressUpdate.customerUserErrors;
    return { success: errors.length === 0, errors: errors.map(e => e.message) };
  }

  // No existing address — create one, then mark it as the default
  const createQuery = `
    mutation CreateAddress($token: String!, $address: CustomerAddressInput!) {
      customerAddressCreate(customerAccessToken: $token, address: $address) {
        customerAddress { id }
        customerUserErrors { code field message }
      }
    }
  `;
  const createData = await storefrontFetch<{
    customerAddressCreate: { customerAddress: { id: string } | null; customerUserErrors: { message: string }[] };
  }>(createQuery, { token, address });

  const createErrors = createData.customerAddressCreate.customerUserErrors;
  if (createErrors.length > 0) return { success: false, errors: createErrors.map(e => e.message) };

  const newAddressId = createData.customerAddressCreate.customerAddress?.id;
  if (!newAddressId) return { success: false, errors: ['Address was not created'] };

  const defaultQuery = `
    mutation SetDefaultAddress($token: String!, $id: ID!) {
      customerDefaultAddressUpdate(customerAccessToken: $token, addressId: $id) {
        customer { id }
        customerUserErrors { code field message }
      }
    }
  `;
  const defaultData = await storefrontFetch<{
    customerDefaultAddressUpdate: { customer: { id: string } | null; customerUserErrors: { message: string }[] };
  }>(defaultQuery, { token, id: newAddressId });

  const defaultErrors = defaultData.customerDefaultAddressUpdate.customerUserErrors;
  return { success: defaultErrors.length === 0, errors: defaultErrors.map(e => e.message) };
}
