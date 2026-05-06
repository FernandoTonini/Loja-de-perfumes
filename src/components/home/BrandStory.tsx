import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BrandStory() {
  return (
    <section className="py-24 bg-dark-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image collage */}
          <div className="relative h-[600px] hidden lg:block">
            <div className="absolute top-0 left-0 w-64 h-80 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&q=80"
                alt="Perfume"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-20 right-0 w-56 h-72 overflow-hidden border-4 border-dark">
              <img
                src="https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=400&q=80"
                alt="Perfume"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-20 w-72 h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80"
                alt="Perfume"
                className="w-full h-full object-cover opacity-70"
              />
            </div>
            {/* Gold accent */}
            <div className="absolute bottom-10 right-10 w-40 h-40 border border-gold/30 -z-0" />
            <div className="absolute top-10 left-[30%] text-gold/20 font-serif text-[120px] font-light leading-none select-none">M</div>
          </div>

          {/* Content */}
          <div>
            <p className="section-subtitle mb-4">Nossa História</p>
            <h2 className="section-title mb-6">
              A Paixão por <span className="gold-text italic">Fragrâncias</span>{" "}
              que Move Tudo
            </h2>
            <div className="h-px w-16 bg-gold mb-8" />

            <div className="space-y-4 text-white/60 font-sans text-sm leading-relaxed mb-8">
              <p>
                A Maison Parfums nasceu da paixão profunda pelo mundo das fragrâncias.
                Acreditamos que um perfume vai muito além de um simples aroma — é uma
                extensão da personalidade, uma memória afetiva, uma declaração silenciosa.
              </p>
              <p>
                Selecionamos meticulosamente cada fragrância que entra em nosso catálogo,
                garantindo a autenticidade absoluta de cada frasco. Trabalhamos com os
                melhores fornecedores do mundo para trazer a você o que há de mais
                exclusivo na perfumaria internacional.
              </p>
              <p>
                Do clássico atemporal ao lançamento mais recente, nosso compromisso
                é entregar uma experiência de compra tão sofisticada quanto as
                fragrâncias que oferecemos.
              </p>
            </div>

            <Link
              href="/sobre"
              className="btn-outline-gold inline-flex items-center gap-3 px-8 py-3 text-sm tracking-[0.2em] uppercase"
            >
              Conheça Nossa História
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
