import { useProducts } from '../hooks/useProducts';

// ─── BRAND LOGOS via logo.dev ──────────────────────────────────────────────────
// Just map brand name -> company domain; the actual logo image is generated
// from that domain. Get a free publishable token at https://logo.dev (500K
// free requests/month, no card needed) and drop it in below.
const LOGO_DEV_TOKEN = 'pk_ekXNDhgbQjyVOn0e2m5GyQ';

function logoDevUrl(domain: string): string {
  // fallback=404 makes logo.dev return a real 404 instead of a generic gray
  // monogram when it doesn't have a logo for this domain — that lets our own
  // onError handler below catch it and fall through to BRAND_PRODUCT_IMAGES
  // instead of showing logo.dev's placeholder.
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=200&format=png&fallback=404`;
}

// Manual overrides for brands logo.dev doesn't have a real logo for.
// Edizard: pulled directly from their own official site header (edizard.com).
// Dometic: removed — SeekLogo's CDN has hotlink protection that blocks it
// when embedded cross-site, even though the URL works as a direct fetch.
// Add a line here once you've downloaded their logo and re-uploaded it to
// your own Shopify CDN; until then it falls back to the product photo.
const BRAND_LOGO_OVERRIDES: Record<string, string> = {
  Sennheiser: '/brand-logos/sennheiser.png',
  Skullcandy: '/brand-logos/skullcandy.png',
  'Turtle Beach': '/brand-logos/turtle-beach.png',
  Therabody: '/brand-logos/therabody.png',
  Matador: '/brand-logos/matador.jpeg',
  SWITCHBOT: '/brand-logos/switchbot.png',
  Satechi: '/brand-logos/satechi.png',
  Arzopa: '/brand-logos/arzopa.png',
  Cleer: '/brand-logos/cleer.svg',
  BUTTONS: '/brand-logos/buttons.png',
  Kandao: '/brand-logos/kandao.jpeg',
  Looki: '/brand-logos/looki.png',
};

// Confidence notes: most of these are the obvious .com for the brand, but a
// few (marked below) are best guesses — if one loads the wrong logo or a
// blank image, just swap the domain on that line.
const BRAND_DOMAINS: Record<string, string> = {
  Skullcandy:     'skullcandy.com',
  Sennheiser:     'sennheiser.com',
  Insta360:       'insta360.com',
  Jackery:        'jackery.com',
  'Peak Design':  'peakdesign.com',
  Otterbox:       'otterbox.com',
  SanDisk:        'sandisk.com',
  Apple:          'apple.com',
  Polaroid:       'polaroid.com',
  Obsbot:         'obsbot.com',
  Hohem:          'hohem.com',
  Arzopa:         'arzopa.com',
  Dometic:        'dometic.com',
  'Turtle Beach': 'turtlebeach.com',
  SWITCHBOT:      'switch-bot.com',
  Enabot:         'enabot.com',
  LARQ:           'livelarq.com',
  Cleer:          'cleeraudio.com',      // best guess
  Kospet:         'kospet.com',          // best guess
  'SP Connect':   'sp-connect.com',      // verified — note the hyphen
  Kandao:         'kandaovr.com',        // best guess
  // Looki and LOONA intentionally omitted — Looki is OSTSOME's own in-house
  // brand (no outside company domain). LOONA's manufacturer domain
  // (keyirobot.com) resolves to the parent company's corporate logo, not
  // anything that reads as "Loona" — the product photo fallback is better.
};

// Product image fallbacks per vendor (from products.ts first images)
const BRAND_PRODUCT_IMAGES: Record<string, string> = {
  'ATTO':            'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/ATTO-Front-View-Left_5000x_2d2ea85f-e819-43b8-b1c6-715dcbb44cf2.webp?v=1653307813',
  'Acopower':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/Untitleddesign_8_ce18e927-b69d-43d0-8e1c-494a7067abec.png?v=1587611786',
  'Aiptek':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/DBFlicks.jpg?v=1587120688',
  'Apple':           'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/MHXH3.jpg?v=1623129256',
  'Arzopa':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/OSTsomeArzopaAR-E1Dual-screenmonitor15.6-9.webp?v=1771505808',
  'BUTTONS':         'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/BUTTONSClipAIWirelessOpenEarWirelessEarphone-1.png?v=1767083152',
  'Boundary Supply': 'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/Untitleddesign_1_59dccb1a-7da5-4d85-9034-ffee78f43335.png?v=1737599086',
  'Cleer':           'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/CLEER_ARC_3_SPORT_PRO_1.png?v=1744706171',
  'Click & Grow':    'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/SG3_Lamp_Arm.jpg?v=1728021278',
  'Colop':           'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/e-mark_protectivecase_open_empty.jpg?v=1621492780',
  'Dometic':         'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/Dometic_CFX3_95DZ_-_2_3696f963-f9fd-4ca9-940c-2696e5e36570.png?v=1759220826',
  'Edizard':         'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/mp00756665-1-edizard-1758078604413.webp?v=1762503074',
  'Enabot':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/EnabotEBOXMainPhoto-New.webp?v=1774505819',
  'GoPole':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/34_8c5e239b-33ec-4b79-be92-9ecec281258f.png?v=1587441906',
  'Goal Zero':       'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/d50771e12614d2079e51b973826d3934_1_1050x_44578dd8-150b-4bc3-8e31-979663c467a2.webp?v=1727321180',
  'Hohem':           'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/MT3Pro_6851fbef-3a4a-4731-a005-d6a68f292946.jpg?v=1780906764',
  'Insta360':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/Main_780w_be4c002f-5a3b-45c5-8041-4d44a6d5ba87.png?v=1692263015',
  'Jackery':         'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/JackeryExplorer2000v2PortablePowerStation-MainPhoto.webp?v=1777009156',
  'Kandao':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/E9_A9_AC_E5_B0_8F_E8_B7_AF_1_fcbc1dd3_thumbnail_4096.png?v=1743740796',
  'Kospet':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/Kospet_Tank_M4_Product_Image_Black_-_1.webp?v=1779695820',
  'LARQ':            'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/LARQBottleHandles-1.webp?v=1774430254',
  'LOONA':           'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/LoonaOutfit-MerryChristmasReindeer-3_136f4081-fbc1-401c-8156-d71946d8537a.png?v=1765529448',
  'Looki':           'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/Looki_L1_Main_Photo_-_Black.webp?v=1774946135',
  'Mabot':           'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/Starter_main.png?v=1587628743',
  'Mirfak':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/M1T-1.png?v=1624267662',
  'Mobile Pixels':   'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/MagnetsPI01.png?v=1718852470',
  'Nite Ize':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/1_e0eb164c-a091-43b5-bf5d-394060efe413.jpg?v=1590636979',
  'Nura':            'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/2022-02-2809-59-3874.webp?v=1729234282',
  'Obsbot':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/OST_Obsbot_Vox_SE-_Main_Image.webp?v=1770806420',
  'Octomask':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/101_1024x1024_2af8b8ad-7917-442b-a2b3-59e5c8eb8cd4.jpg?v=1590639369',
  'Otterbox':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/otr57-tumbler-16-xp-1.jpg?v=1587982542',
  'POLAROID':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/006277_Shoulder_Holster_Polaroid_I-2_closed_664fde38-86e5-4c32-8f4a-730d4ce2c84a_png.png?v=1728023975',
  'Pale Blue':       'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/2to1cable_2048x2048_4019a64b-ffa1-4212-ac22-ad80d61b018d.jpg?v=1675059568',
  'Peak Design':     'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/1_be050ab4-130e-4525-a2bc-2cd998ab6968.jpg?v=1589442512',
  'Pictar':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/2_433f2d9b-59e9-4a58-a7bb-80977045cad4.jpg?v=1590636210',
  'Pivo':            'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/71_db86d28e-fc57-4d76-a453-e1b6b83aff5e.png?v=1630902072',
  'PolarPro':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/Osmo-Pocket-ACTION-CAM-MOUNT_1024x1024_d4642f7b-d62d-436f-89a3-cc056c5b0b09.jpg?v=1587440894',
  'Polaroid':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/Polaroid_Now_Instant_Camera_Gen3_-_Arctic_Blue.webp?v=1773219591',
  'RAM Mounts':      'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/RAP-SB-224-2U.jpg?v=1588756496',
  'ROCCAT':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/ROCCAT_Vulcan-Mini-BLK_Standard-Gallery_Front-Perspective_US-Layout_3000x3000_f79d209d-6fb0-4790-a40e-2cc5de026f2d.png?v=1668052453',
  'Roccat':          'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/ROCCAT_Vulcan-Mini-WHT_Standard-Gallery_Front-Perspective_US-Layout_3000x3000_de47dabd-fb97-4645-b778-bb01a036cf09.jpg?v=1681961219',
  'Rubyoung':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/ProductWithWhiteBackground_Cafe.jpg?v=1727245125',
  'SP Connect':      'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/head_moto_stem_mount.jpg?v=1744703741',
  'SP Gadgets':      'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/SU53008.jpg?v=1589526223',
  'SWITCHBOT':       'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/OSTsomeSwitchBotSafetyAlarm_1_9cb7ccc6-4672-4305-83f5-b115fd314491.webp?v=1772182495',
  'SanDisk':         'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/high-endurance-uhs-i-microsd-64g.png?v=1726718365',
  'Sennheiser':      'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/MTWCopperBudsBack.jpg?v=1727144078',
  'Skullcandy':      'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/25B_Aviator_900_ANC_True_Black_S6AVW-T740_Standard_01_Hero.png?v=1773291924',
  'Soundblade':      'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/01_BlueAnt_SoundBlade_Charcoal_Hero.png?v=1716281992',
  'Tapplock':        'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/82_0cedd276-29e0-4dc6-a412-10d445b98e70.png?v=1589877458',
  'Texenergy':       'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/InfiniteSolar24onhand_480x480_4ea352c3-fd61-4e9b-a99f-cefbfb5fdd33.jpg?v=1738910550',
  'Turtle Beach':    'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/1_RematchSuperMarioStarwithlogo.png?v=1779677865',
  'UGEE':            'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/CustomBundles.png?v=1632907139',
  'VAGO':            'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/30_57d8dc41-0e9f-4843-9770-31061f6af07f.png?v=1684133308',
  'Zagg':            'https://cdn.shopify.com/s/files/1/0348/4948/9034/products/8df4c7_587967dbc9f64ca0af2a8fc8deb42605_mv2_d_1236_1519_s_2.jpg?v=1634194370',
  'aXtion5':         'https://cdn.shopify.com/s/files/1/0348/4948/9034/files/6395ffb6d4e08c2da8b71543217d5027.png?v=1729234739',
};

const brandMeta: Record<string, { description: string }> = {
  Skullcandy:        { description: 'Audio gear built for the bold' },
  Sennheiser:        { description: 'Legendary German sound engineering' },
  Obsbot:            { description: 'AI-powered cameras & webcams' },
  Hohem:             { description: 'Pro gimbal stabilizers' },
  Polaroid:          { description: 'Instant cameras & nostalgia' },
  Kandao:            { description: '360° action cameras' },
  Kospet:            { description: 'Rugged smartwatches' },
  Arzopa:            { description: 'Portable monitors' },
  ROCCAT:            { description: 'Gaming peripherals' },
  Roccat:            { description: 'Gaming peripherals' },
  'Turtle Beach':    { description: 'Gaming controllers & headsets' },
  'Peak Design':     { description: 'Camera carry & mounting' },
  'Goal Zero':       { description: 'Off-grid portable power' },
  'SP Connect':      { description: 'Bike & moto phone mounts' },
  Insta360:          { description: '360° action cameras & accessories' },
  SWITCHBOT:         { description: 'Smart home automation' },
  Jackery:           { description: 'Portable power stations' },
  Edizard:           { description: 'Charging & power accessories' },
  BUTTONS:           { description: 'AI open-ear wearables' },
  LOONA:             { description: 'AI pet companion robots' },
  Looki:             { description: "OSTSOME's in-house robotics brand" },
  Cleer:             { description: 'Open-ear wireless audio' },
  Therabody:         { description: 'Wellness & recovery technology' },
  Matador:           { description: 'Performance travel equipment' },
  Satechi:           { description: 'Premium tech & desk accessories' },
  'Mobile Pixels':   { description: 'Portable dual screens' },
  Enabot:            { description: 'Home companion robots' },
  LARQ:              { description: 'Self-cleaning water bottles' },
  Dometic:           { description: 'Portable cooling & outdoor gear' },
};

// Only these 12 brands should appear on the Our Brands page.
// Order follows the requested brand order. Matching is case/spacing-insensitive
// against the live Shopify `vendor` field.
const ALLOWED_BRANDS = [
  'SENNHEISER', 'SKULLCANDY', 'TURTLEBEACH', 'THERABODY', 'MATADOR', 'SWITCHBOT',
  'SATECHI', 'ARZOPA', 'CLEER', 'BUTTONS', 'KANDAO', 'LOOKI',
];
const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

function findByNormalizedKey<T>(record: Record<string, T>, vendor: string): T | undefined {
  const wanted = normalize(vendor);
  const key = Object.keys(record).find(k => normalize(k) === wanted);
  return key ? record[key] : undefined;
}

function getBrandImage(vendor: string): string {
  // Priority: uploaded local logo -> logo.dev domain -> product photo.
  // Normalized matching makes SwitchBot/SWITCHBOT and other casing variants work.
  const localLogo = findByNormalizedKey(BRAND_LOGO_OVERRIDES, vendor);
  if (localLogo) return localLogo;
  const domain = findByNormalizedKey(BRAND_DOMAINS, vendor);
  if (domain) return logoDevUrl(domain);
  return findByNormalizedKey(BRAND_PRODUCT_IMAGES, vendor) || '';
}

type BrandsPageProps = {
  onSelectBrand: (brand: string) => void;
};

export function BrandsPage({ onSelectBrand }: BrandsPageProps) {
  const { products, loading } = useProducts();

  const allowedSet = new Set(ALLOWED_BRANDS.map(normalize));

  // Group by normalized vendor so any casing duplicates (e.g. "DOMETIC" vs
  // "Dometic") always merge into a single card — this no longer depends on
  // products.ts having perfectly consistent casing.
  const brandGroups = new Map<string, { display: string; count: number }>();
  for (const p of products) {
    const key = normalize(p.vendor);
    if (!allowedSet.has(key)) continue;
    const existing = brandGroups.get(key);
    if (!existing) {
      brandGroups.set(key, { display: p.vendor, count: 1 });
    } else {
      existing.count++;
      // Prefer whichever casing is more common as the display name
      const currentCount = products.filter(x => x.vendor === existing.display).length;
      if (products.filter(x => x.vendor === p.vendor).length > currentCount) {
        existing.display = p.vendor;
      }
    }
  }
  const brandOrder = new Map(ALLOWED_BRANDS.map((brand, index) => [normalize(brand), index]));
  const brands = [...brandGroups.entries()]
    .sort(([keyA], [keyB]) => (brandOrder.get(keyA) ?? 999) - (brandOrder.get(keyB) ?? 999))
    .map(([, value]) => value);

  return (
    <section className="py-10 md:py-14 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-[26px] md:text-4xl font-bold text-black uppercase">Our Brands</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {loading ? 'Loading…' : `${brands.length} brands`}
          </p>
        </div>

        <div className="border-t border-neutral-100 mb-8" />

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#F16C10] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {brands.map(({ display: brand, count }) => {
              const meta = findByNormalizedKey(brandMeta, brand);
              const imgSrc = getBrandImage(brand);
              const hasVectorLogo = !!findByNormalizedKey(BRAND_LOGO_OVERRIDES, brand) || !!findByNormalizedKey(BRAND_DOMAINS, brand);
              const productPhotoFallback = findByNormalizedKey(BRAND_PRODUCT_IMAGES, brand);

              return (
                <button
                  key={brand}
                  onClick={() => onSelectBrand(brand)}
                  className="group flex flex-col items-center text-center p-5 border border-neutral-100 rounded-2xl hover:border-[#F16C10] hover:shadow-lg transition-all bg-white"
                >
                  {/* Logo / product image area */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden mb-4 flex items-center justify-center bg-neutral-50 group-hover:bg-neutral-100 transition-colors">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={brand}
                        className={`transition-transform duration-300 group-hover:scale-105 ${hasVectorLogo ? 'w-full h-full object-contain p-2 sm:p-3' : 'w-full h-full object-cover'}`}
                        onError={e => {
                          const target = e.currentTarget;
                          // First failure: if there's a product-photo fallback we haven't
                          // tried yet, swap to it (and switch to cover-fit since it's a
                          // photo, not a logo on transparent background).
                          if (productPhotoFallback && target.src !== productPhotoFallback) {
                            target.src = productPhotoFallback;
                            target.className = 'transition-transform duration-300 group-hover:scale-105 w-full h-full object-cover';
                            return;
                          }
                          // Final fallback: letter monogram
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-4xl font-bold text-neutral-400 group-hover:text-[#F16C10]">${brand.charAt(0)}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-4xl font-bold text-neutral-400 group-hover:text-[#F16C10] transition-colors">
                        {brand.charAt(0)}
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-bold text-black group-hover:text-[#F16C10] transition-colors leading-tight mb-1">
                    {brand}
                  </span>
                  {meta && (
                    <span className="text-[10px] text-neutral-400 leading-tight mb-1">{meta.description}</span>
                  )}
                  <span className="text-xs text-[#F16C10] font-medium">{count} products</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}