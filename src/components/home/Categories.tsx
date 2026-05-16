import Link from "next/link";
import { Category } from "@/types";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Props {
  categories: Category[];
}

export function Categories({ categories }: Props) {
  return (
    <section className="py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="section-subtitle mb-4">Encontre Seu Aroma</p>
          <h2 className="section-title mb-4">
            Explore por <span className="gold-text italic">Categoria</span>
          </h2>
          <div className="divider-gold" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/produtos?categoria=${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-cream-100 block"
            >
              {/* Background image */}
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-cream-50 to-cream-100" />
              )}

              {/* Gradient overlay — cream at bottom for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-cream-50/90 via-cream-50/20 to-transparent" />

              {/* Gold hover border */}
              <div className="absolute inset-0 border border-transparent group-hover:border-gold/40 transition-all duration-300" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-serif text-xl text-ink mb-2 group-hover:text-gold-dark transition-colors">
                  {category.name}
                </h3>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  <div className="h-px w-5 bg-gold" />
                  <ArrowRight size={12} className="text-gold" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
