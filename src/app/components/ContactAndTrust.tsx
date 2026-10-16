import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Truck, CreditCard, ShieldCheck, MapPin, Phone, Mail, Calendar, ExternalLink } from 'lucide-react';

const trustBadges = [
  { icon: Truck, title: 'FREE\nSHIPPING', subtitle: 'Free delivery' },
  { icon: CreditCard, title: 'OFFICIAL\nWARRANTY', subtitle: '' },
  { icon: ShieldCheck, title: '24/7\nSUPPORT', subtitle: 'We are here to help' },
];

const contactRows = [
  { icon: MapPin, text: 'No. 93-1, Block H, Jaya One, No. 72A Jalan Universiti, Section 13, 46200 Petaling Jaya, Selangor' },
  { icon: Phone, text: '+60 10-887 0937' },
  { icon: Mail, text: 'ost-my@streamcastasia.com' },
  { icon: Calendar, text: 'Monday to Friday: 9am-6pm\nClosed on Saturdays, Sundays & Public Holidays.' },
];

const MAPS_QUERY = 'Jaya One, 72A Jalan Universiti, Section 13, 46200 Petaling Jaya, Selangor';
const MAPS_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;

const footerLinkColumns = [
  {
    heading: 'About Us',
    links: [
      { label: 'Company Info', href: 'https://www.streamcastasia.com/', external: true },
      { label: 'Feedback & Complaints', href: 'https://wa.me/60108870937?text=Hi%2C%20I%20would%20like%20to%20provide%20feedback%20or%20report%20an%20issue%20regarding%20my%20order.' },
    ],
  },
  {
    heading: 'More Info',
    links: [
      { label: 'Warranty Policy', modal: 'warranty' },
      { label: 'Return & Exchange Policy', modal: 'returns' },
      { label: 'Business Partnerships', href: 'https://wa.me/60108870937?text=Hi%2C%20I%27m%20interested%20in%20exploring%20a%20business%20partnership%20with%20Ostsome%20Malaysia.' },
    ],
  },
];

export function ContactAndTrust() {
  const [activePolicy, setActivePolicy] = useState<'warranty' | 'returns' | null>(null);
  useEffect(() => {
    if (!activePolicy) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setActivePolicy(null); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [activePolicy]);
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* Trust badges row */}
        <div className="grid grid-cols-3 divide-x divide-neutral-200 border-b border-neutral-100 pb-10 mb-10">
          {trustBadges.map(badge => {
            const Icon = badge.icon;
            return (
              <div key={badge.subtitle || badge.title} className="flex flex-col items-center text-center px-2">
                <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#F16C10]/10 flex items-center justify-center mb-4">
                  <Icon className="text-[#F16C10]" size={28} strokeWidth={1.75} />
                </span>
                <h3 className="text-sm md:text-lg font-bold text-black uppercase whitespace-pre-line leading-snug mb-1">
                  {badge.title}
                </h3>
                <p className="text-xs md:text-sm text-neutral-400">{badge.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Contact card */}
        <div className="bg-gradient-to-br from-[#FDF3EA] to-white rounded-3xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-black mb-2">Streamcast Asia (Malaysia)</h3>
            <div className="w-12 h-1 bg-[#F16C10] rounded-full mb-6" />
            <div className="flex flex-col divide-y divide-neutral-200">
              {contactRows.map((row, i) => {
                const Icon = row.icon;
                return (
                  <div key={i} className="flex items-start gap-3 py-3 first:pt-0">
                    <Icon className="text-[#F16C10] shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-neutral-700 whitespace-pre-line leading-snug">{row.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-md" style={{ height: '280px' }}>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 bg-white text-[#F16C10] text-xs font-semibold px-3 py-2 rounded-lg shadow-md hover:bg-neutral-50 transition-colors"
            >
              View on Google Maps <ExternalLink size={12} />
            </a>
            <iframe
              title="OSTSOME Malaysia location"
              src={MAPS_EMBED_SRC}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Footer link columns */}
        <div className="mt-10 bg-neutral-50 border border-neutral-100 rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-12 gap-y-8">
            {footerLinkColumns.map(col => (
              <div key={col.heading}>
                <h4 className="text-sm font-bold text-black mb-3">{col.heading}</h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map(link => (
                    <li key={link.label}>
                      {'modal' in link && link.modal ? (
                        <button type="button" onClick={() => setActivePolicy(link.modal as 'warranty' | 'returns')} className="text-left text-sm text-neutral-500 hover:text-[#F16C10] transition-colors">{link.label}</button>
                      ) : (
                        <a href={'href' in link ? link.href : '#'} target={'href' in link && (link.href.startsWith('https://wa.me/') || ('external' in link && link.external)) ? '_blank' : undefined} rel="noopener noreferrer" className="text-sm text-neutral-500 hover:text-[#F16C10] transition-colors">{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      {activePolicy && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setActivePolicy(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="policy-title" className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl text-neutral-800">
            <button type="button" onClick={() => setActivePolicy(null)} aria-label="Close policy" className="absolute right-4 top-4 rounded-full p-2 hover:bg-neutral-100"><X size={22}/></button>
            {activePolicy === 'warranty' ? (
              <div className="space-y-4 text-sm leading-relaxed pr-2">
                <h2 id="policy-title" className="text-xl font-bold text-black pr-10">Warranty Policy</h2>
                <p>All products come with a <strong>1-year warranty</strong>, except <strong>Satechi products, which come with a 2-year warranty</strong>.</p>
                <p>Please <a className="font-semibold text-[#F16C10] underline" target="_blank" rel="noopener noreferrer" href="https://wa.me/60108870937?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20a%20warranty%20claim.">contact us via WhatsApp</a> before sending or bringing in an item for a warranty claim.</p>
                <h3 className="font-bold text-black">Warranty Method (Please choose one)</h3>
                <ol className="list-decimal pl-5 space-y-2"><li><strong>Self-delivery via courier</strong> — Shipping fees to be borne by buyer.</li><li><strong>Walk-in to our office</strong> — Monday–Friday, 9:30 AM–4:00 PM (except public holidays).</li></ol>
                <h3 className="font-bold text-black">For Self-Delivery (Warranty Claim)</h3>
                <p>Kindly courier the malfunctioning item to our office for a quality check / warranty claim after contacting us.</p>
                <h3 className="font-bold text-black">Office Details</h3>
                <p><strong>StreamCast Asia</strong><br/>No. 93-1, Block H, Jaya One,<br/>No. 72A, Jalan Universiti,<br/>Section 13, 46200 Petaling Jaya, Selangor</p>
                <p><strong>Office Hotline:</strong> +603-7931 5927<br/><strong>Operation Hours:</strong> 9:30 AM–4:00 PM (Mon–Fri, except public holidays)</p>
              </div>
            ) : (
              <div className="space-y-4 text-sm leading-relaxed pr-2">
                <h2 id="policy-title" className="text-xl font-bold text-black pr-10">Return &amp; Refund Policy</h2>
                <p>Only <strong>unsealed and unused products</strong> are eligible for returns and refunds, subject to applicable consumer protection laws.</p>
                <p>Please <a className="font-semibold text-[#F16C10] underline" target="_blank" rel="noopener noreferrer" href="https://wa.me/60108870937?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20a%20return%20or%20refund.">contact us via WhatsApp</a> before arranging a return or refund.</p>
                <p className="text-xs text-neutral-500">This policy does not affect any rights you may have under applicable consumer protection laws.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
