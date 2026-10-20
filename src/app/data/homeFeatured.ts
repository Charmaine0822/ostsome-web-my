import type { Product } from "./products";

export const HOME_FEATURED_HANDLES = [
  "sennheiser-momentum-5-wireless-noise-canceling-headphones",
  "therabody-theraface-mask-glo-cordless-led-skincare-mask-with-relaxing-massage",
  "looki-l1",
  "satechi-mac-mini-m4-stand-hub-with-ssd-enclosure",
  "arzopa-a1t-15-6-fhd-1080p-portable-monitor-with-touchscreen-arzopa-portable-monitor"
];
export const homeLifestyleImages: Record<string, string> = {
  "arzopa-a1t-15-6-fhd-1080p-portable-monitor-with-touchscreen-arzopa-portable-monitor": "/home-featured/arzopa-a1t.jpg",
  "sennheiser-momentum-5-wireless-noise-canceling-headphones": "/home-featured/momentum-5.jpg",
  "therabody-theraface-mask-glo-cordless-led-skincare-mask-with-relaxing-massage": "/home-featured/mask-glo.jpg",
  "looki-l1": "/home-featured/looki-l1.jpg",
  "satechi-mac-mini-m4-stand-hub-with-ssd-enclosure": "/home-featured/mac-mini.jpg"
};
export const CRUSHER_HANDLE = "skullcandy-crusher®-720-sensory-bass-headphones";
export const MTW5_HANDLE = "sennheiser-momentum-true-wireless-5-earbuds-with-free-pouch-ostsome-website-exclusive🎁";
export function getHomeFeatured(products: Product[]) {
 return HOME_FEATURED_HANDLES.flatMap(handle => { const product = products.find(p => p.handle === handle); return product ? [product] : []; });
}
