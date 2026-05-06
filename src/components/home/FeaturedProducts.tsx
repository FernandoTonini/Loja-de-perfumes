import { ProductCard } from "@/components/products/ProductCard";
import { Product } from "@/types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  products: Product[];
}

export function FeaturedProducts({ products }: Props) {
  return (
    <section className="py-24 bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-subtitle mb-4">Selecionados Para Você</p>
          <h2 className="section-title mb-4">
            Fragrâncias em <span className="gold-text italic">Destaque</span>
          </h2>
          <div className="divider-gold" />
          <p className="text-white/50 font-sans text-base max-w-xl mx-auto mt-6 leading-relaxed">
            Os perfumes mais amados da nossa coleção, escolhidos por nossa equipe de especialistas.
          </p>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link
            href="/produtos"
            className="btn-outline-gold inline-flex items-center gap-3 px-10 py-4 text-sm tracking-[0.2em] uppercase"
          >
            Ver Toda a Coleção
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
