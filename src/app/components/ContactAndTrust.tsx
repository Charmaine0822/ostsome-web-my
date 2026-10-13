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

// Company information opens the official corporate website.
// Customer enquiries use the published OSTSOME Malaysia contact address.
// Policy links are kept as contact enquiries until approved policy text is supplied.
const footerLinkColumns = [
  {
    heading: 'About Us',
    links: [
      { label: 'Company Info', href: 'https://www.streamcastasia.com/', external: true },
      { label: 'Feedback & Complaints', href: 'mailto:ost-my@streamcastasia.com?subject=Customer%20Feedback%20%26%20Complaints' },
    ],
  },
  {
    heading: 'More Info',
    links: [
      { label: 'Warranty Policy', href: 'mailto:ost-my@streamcastasia.com?subject=Warranty%20Policy%20Enquiry' },
      { label: 'Return & Exchange Policy', href: 'mailto:ost-my@streamcastasia.com?subject=Return%20%26%20Exchange%20Policy%20Enquiry' },
      { label: 'Business Partnerships', href: 'mailto:ost-my@streamcastasia.com?subject=Business%20Partnership%20Enquiry' },
    ],
  },
];

export function ContactAndTrust() {
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
                      <a href={link.href} target={"external" in link && link.external ? "_blank" : undefined} rel={"external" in link && link.external ? "noopener noreferrer" : undefined} className="text-sm text-neutral-500 hover:text-[#F16C10] transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
