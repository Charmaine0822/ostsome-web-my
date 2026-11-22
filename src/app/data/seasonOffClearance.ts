// src/app/data/seasonOffClearance.ts
//
// Products for the "Season Off Clearance Price" menu page (/season-off-clearance).
// Intentionally EMPTY for now — products not decided yet. To add one, append an
// entry with the Shopify handle, the live SRP (struck-through) and the clearance
// price, e.g.
//
//   { handle: 'some-product-handle', name: 'Some Product', label: 'Season Off', srp: 299, promo: 199 },
//
// The page shows a "coming soon" state while the list is empty.
import type { CampaignDeal } from './campaignDeals';

export const SEASON_OFF_CLEARANCE_DEALS: CampaignDeal[] = [];
