"use client";

import { Star } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Ana Carolina S.",
    city: "São Paulo, SP",
    rating: 5,
    text: "Recebi meu Chanel N°5 em perfeito estado, embalado com muito cuidado. A autenticidade é inegável, o cheiro é exatamente o que eu esperava de um produto importado. Já fiz 3 compras e sempre fico encantada!",
    product: "Chanel N°5 EDP",
    initials: "AC",
  },
  {
    name: "Roberto M.",
    city: "Rio de Janeiro, RJ",
    rating: 5,
    text: "O Dior Sauvage é incrível e chegou muito rápido. Sempre tive medo de comprar perfumes online, mas a Maison Parfums me surpreendeu. 100% original, sem dúvidas. Recomendo a todos!",
    product: "Dior Sauvage EDP",
    initials: "RM",
  },
  {
    name: "Fernanda L.",
    city: "Belo Horizonte, MG",
    rating: 5,
    text: "Finalmente uma loja de confiança para perfumes importados! O Tom Ford Black Orchid superou minhas expectativas. Atendimento impecável e entrega super rápida. Já estou olhando o próximo!",
    product: "Tom Ford Black Orchid",
    initials: "FL",
  },
  {
    name: "Marcos A.",
    city: "Curitiba, PR",
    rating: 5,
    text: "O Creed Aventus é um sonho que realizei graças à Maison Parfums. Preço justo para um perfume desse nível, muito abaixo do que encontrei em outras lojas. Fixação extraordinária!",
    product: "Creed Aventus EDP",
    initials: "MA",
  },
  {
    name: "Patricia K.",
    city: "Porto Alegre, RS",
    rating: 5,
    text: "Comprei o YSL Libre como presente e foi um sucesso total! Chegou embalado como se fosse um presente de luxo. O perfume é simplesmente divino. Voltarei a comprar com certeza!",
    product: "YSL Libre EDP",
    initials: "PK",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="section-subtitle mb-4">Nossos Clientes</p>
          <h2 className="section-title mb-4">
            O Que Dizem Sobre <span className="gold-text italic">Nós</span>
          </h2>
          <div className="divider-gold" />
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((t, i) => (
            <div
              key={t.name}
              className={`bg-dark-100 border p-8 transition-all duration-500 ${i === current % 3 ? "border-gold/40 shadow-[0_0_30px_rgba(201,168,76,0.1)]" : "border-dark-300"}`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array(t.rating).fill(0).map((_, j) => (
                  <Star key={j} size={14} className="text-gold fill-gold" />
                ))}
              </div>

              <p className="text-white/70 text-sm font-sans leading-relaxed mb-6 italic">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-dark-300">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold text-sm font-semibold">{t.initials}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.city}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-gold/60 text-[10px] tracking-wide uppercase font-sans">{t.product}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slide dots */}
        <div className="flex justify-center gap-2 mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${i % 3 === current % 3 ? "w-6 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
