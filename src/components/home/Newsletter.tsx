"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="py-24 bg-cream border-t border-cream-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="section-subtitle mb-4">Fique por Dentro</p>
        <h2 className="section-title mb-4">
          Receba Novidades e <span className="gold-text italic">Ofertas Exclusivas</span>
        </h2>
        <div className="divider-gold" />
        <p className="text-ink-muted font-sans text-sm leading-relaxed max-w-md mx-auto mt-6 mb-10">
          Cadastre-se para receber lançamentos, promoções especiais e dicas do mundo das fragrâncias.
        </p>

        {submitted ? (
          <div className="bg-gold/10 border border-gold/30 px-8 py-6 inline-block">
            <p className="text-gold-dark font-serif text-xl italic">
              Obrigado por se cadastrar!
            </p>
            <p className="text-ink-muted text-sm mt-2 font-sans">
              Em breve você receberá nossas novidades.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              required
              className="flex-1 bg-white border border-cream-200 border-r-0 px-5 py-4 text-ink/80 placeholder-ink/30 text-sm font-sans outline-none focus:border-gold/60 transition-colors"
            />
            <button
              type="submit"
              className="btn-gold px-8 py-4 flex items-center gap-2 text-sm tracking-wider uppercase whitespace-nowrap"
            >
              Cadastrar
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
