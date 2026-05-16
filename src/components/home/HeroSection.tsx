"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    title: "A Arte das",
    titleHighlight: "Grandes Fragrâncias",
    subtitle: "Perfumes Importados Originais",
    description: "Descubra o universo das fragrâncias mais exclusivas do mundo. De Paris a Dubai, elegância entregue diretamente na sua porta.",
    cta: "Explorar Coleção",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=85",
  },
  {
    title: "Elegância que",
    titleHighlight: "Define Momentos",
    subtitle: "Novos Lançamentos",
    description: "As fragrâncias mais desejadas da temporada. Expresse sua personalidade com aromas únicos que deixam marcas inesquecíveis.",
    cta: "Ver Lançamentos",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=85",
  },
  {
    title: "Fragrâncias",
    titleHighlight: "Raras e de Nicho",
    subtitle: "Exclusividade em Cada Frasco",
    description: "Perfumes raros e exclusivos que poucos conhecem. Uma experiência olfativa extraordinária para quem busca o diferente.",
    cta: "Descobrir Raridades",
    image: "https://images.unsplash.com/photo-1547887538-047f814d2d24?w=800&q=85",
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setTransitioning(false);
      }, 300);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative min-h-screen bg-cream overflow-hidden">
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 70% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Fine grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(28,24,20,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(28,24,20,0.8) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center w-full py-24">

          {/* Left — text content */}
          <div className={`transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${transitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}>
            {/* Category badge */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-gold" />
              <span className="text-gold-dark text-xs tracking-[0.4em] uppercase font-sans font-medium">
                {slide.subtitle}
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-ink leading-[1.08] mb-6">
              {slide.title}
              <br />
              <span className="gold-text italic">{slide.titleHighlight}</span>
            </h1>

            {/* Description */}
            <p className="text-ink-muted text-base sm:text-lg font-sans font-light leading-relaxed max-w-lg mb-10">
              {slide.description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/produtos"
                className="btn-gold inline-flex items-center justify-center gap-3 px-10 py-4 text-sm tracking-[0.18em] uppercase"
              >
                {slide.cta}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/produtos?featured=true"
                className="btn-outline-gold inline-flex items-center justify-center px-10 py-4 text-sm tracking-[0.18em] uppercase"
              >
                Ver Destaques
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-10 mt-16 pt-8 border-t border-cream-200">
              {[
                { value: "500+", label: "Fragrâncias" },
                { value: "50+", label: "Marcas Importadas" },
                { value: "10k+", label: "Clientes Satisfeitos" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-3xl text-ink font-light">{stat.value}</div>
                  <div className="text-ink-muted text-xs tracking-wide uppercase font-sans mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — image */}
          <div className={`relative hidden lg:flex items-center justify-center transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${transitioning ? "opacity-0" : "opacity-100"}`}>
            {/* Main image */}
            <div className="relative w-full max-w-md aspect-[4/5] overflow-hidden">
              <img
                src={slide.image}
                alt={slide.titleHighlight}
                className="w-full h-full object-cover transition-all duration-700"
              />
              {/* Subtle cream vignette at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-24"
                style={{ background: "linear-gradient(to top, rgba(250,250,248,0.3) 0%, transparent 100%)" }}
              />
            </div>

            {/* Decorative frames */}
            <div className="absolute -top-6 -right-6 w-32 h-32 border border-gold/25 pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 border border-gold/15 pointer-events-none" />

            {/* Floating label */}
            <div className="absolute bottom-10 -left-8 bg-white border border-cream-200 shadow-lg px-5 py-3">
              <p className="text-gold-dark text-[10px] tracking-[0.3em] uppercase font-sans font-medium mb-0.5">Autenticidade</p>
              <p className="text-ink text-sm font-serif italic">Garantida em cada frasco</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setTransitioning(true);
              setTimeout(() => { setCurrent(i); setTransitioning(false); }, 300);
            }}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-8 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-ink/20 hover:bg-ink/40"}`}
          />
        ))}
      </div>
    </section>
  );
}
