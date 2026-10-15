import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../data/products";
const banners = [
  { label: "Sennheiser", image: "/home-banners/sennheiser.png", query: "momentum true wireless 5" },
  { label: "Therabody", image: "/home-banners/therabody.png", query: "theragun mini" },
  { label: "Looki", image: "/home-banners/looki.png", query: "looki l1" },
  { label: "Skullcandy", image: "/home-banners/skullcandy.png", query: "crusher 720" },
  { label: "Matador", image: "/home-banners/matador.png", query: "globerider35" },
  { label: "Turtle Beach", image: "/home-banners/turtle-beach.png", query: "velocityone multi-shift" },
  { label: "Satechi", image: "/home-banners/satechi.png", query: "stand & hub with ssd enclosure" },
  { label: "Kandao", image: "/home-banners/kandao.png", query: "meeting pro 2" },
  { label: "Arzopa", image: "/home-banners/arzopa.png", query: "a1t" },
  { label: "SwitchBot", image: "/home-banners/switchbot.png", query: "curtain 3 rod" },
  { label: "Buttons", image: "/home-banners/buttons.png", query: "buttons clip" },
  { label: "Cleer", image: "/home-banners/cleer.png", query: "arc iii sport" }
];

type HeroProps = {
  products: Product[];
  onSelectProduct: (product: Product) => void;
};

export function Hero({ products, onSelectProduct }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const openProduct = (query: string) => {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const target = normalize(query);
    const product = products.find(p => normalize(p.title).includes(target) || normalize(p.handle || "").includes(target));
    if (product) {
      onSelectProduct(product);
    } else {
      // If the live catalog does not contain this product, use the site's product search.
      window.location.assign(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const goToSlide = (index: number) => setCurrentSlide(index);
  const goToPrevious = () =>
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  const goToNext = () =>
    setCurrentSlide((prev) => (prev + 1) % banners.length);

  // Auto-cycle every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-neutral-900 group w-full">
      <div className="relative w-full aspect-[3/1] overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={() => openProduct(banner.query)}
              className="block w-full h-full cursor-pointer relative"
              aria-label={`View ${banner.label} product`}
            >
              <ImageWithFallback
                src={banner.image}
                alt={`${banner.label} product banner`}
                className="w-full h-full object-cover object-center"
              />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition md:opacity-0 md:group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition md:opacity-0 md:group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="h-11 min-w-[44px] flex items-center justify-center"
            aria-label={`Go to slide ${index + 1}`}
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 w-2 hover:bg-white/75"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}