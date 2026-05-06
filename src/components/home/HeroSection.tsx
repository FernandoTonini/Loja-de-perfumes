"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    title: "A Arte das",
    titleHighlight: "Grandes Fragrâncias",
    subtitle: "Perfumes Importados Originais",
    description: "Descubra o universo das fragrâncias mais exclusivas do mundo. De Paris a Dubai, entregamos luxo diretamente na sua porta.",
    cta: "Explorar Coleção",
    bg: "from-[#0a0a0a] via-[#1a0f0f] to-[#0a0a0a]",
    accent: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
  },
  {
    title: "Elegância que",
    titleHighlight: "Define Momentos",
    subtitle: "Novos Lançamentos",
    description: "As fragrâncias mais desejadas da temporada. Expresse sua personalidade com aromas únicos que deixam marcas inesquecíveis.",
    cta: "Ver Lançamentos",
    bg: "from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]",
    accent: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600&q=80",
  },
  {
    title: "Fragrâncias",
    titleHighlight: "Orientais e de Nicho",
    subtitle: "Exclusividade em Cada Frasco",
    description: "Perfumes raros e exclusivos que poucos conhecem. Uma experiência olfativa extraordinária para quem busca o diferente.",
    cta: "Descobrir Raridades",
    bg: "from-[#0a0a0a] via-[#100a0a] to-[#0a0a0a]",
    accent: "https://images.unsplash.com/photo-1547887538-047f814d2d24?w=600&q=80",
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className={`relative min-h-screen bg-gradient-to-br ${slide.bg} overflow-hidden transition-all duration-1000`}>
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gold blur-[80px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Slide image */}
      <div className="absolute right-0 top-0 h-full w-1/2 hidden lg:block opacity-20">
        <img
          src={slide.accent}
          alt=""
          className="w-full h-full object-cover transition-opacity duration-1000"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, black 40%, black 80%, transparent 100%)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center min-h-screen">
        <div className="max-w-3xl py-32">
          {/* Subtitle badge */}
          <div
            className={`inline-flex items-center gap-3 mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="h-px w-8 bg-gold" />
            <span className="text-gold text-xs tracking-[0.4em] uppercase font-sans font-medium">
              {slide.subtitle}
            </span>
          </div>

          {/* Title */}
          <h1
            className={`font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-white leading-[1.05] mb-6 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            {slide.title}{" "}
            <span className="gold-text italic">{slide.titleHighlight}</span>
          </h1>

          {/* Description */}
          <p
            className={`text-white/60 text-base sm:text-lg font-sans font-light leading-relaxed max-w-xl mb-10 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {slide.description}
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Link
              href="/produtos"
              className="btn-gold inline-flex items-center justify-center gap-3 px-10 py-4 text-sm tracking-[0.2em] uppercase"
            >
              {slide.cta}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/produtos?featured=true"
              className="btn-outline-gold inline-flex items-center justify-center px-10 py-4 text-sm tracking-[0.2em] uppercase"
            >
              Ver Destaques
            </Link>
          </div>

          {/* Stats */}
          <div
            className={`flex gap-10 mt-16 pt-8 border-t border-white/10 transition-all duration-700 delay-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          >
            {[
              { value: "500+", label: "Fragrâncias" },
              { value: "50+", label: "Marcas Importadas" },
              { value: "10k+", label: "Clientes Satisfeitos" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-serif text-3xl text-gold font-light">{stat.value}</div>
                <div className="text-white/40 text-xs tracking-wide uppercase font-sans mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-8 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"}`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 right-8 hidden md:flex flex-col items-center gap-2 z-10">
        <span className="text-white/30 text-[10px] tracking-[0.3em] uppercase font-sans writing-mode-vertical rotate-90">
          Scroll
        </span>
        <ChevronDown size={16} className="text-white/30 animate-bounce" />
      </div>
    </section>
  );
}
