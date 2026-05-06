import Link from "next/link";
import { Category } from "@/types";
import Image from "next/image";

interface Props {
  categories: Category[];
}

export function Categories({ categories }: Props) {
  return (
    <section className="py-24 bg-dark-100">
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
              className="group relative aspect-[3/4] overflow-hidden bg-dark-200 block"
            >
              {/* Background image */}
              {category.image && (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />

              {/* Gold shimmer border */}
              <div className="absolute inset-0 border border-transparent group-hover:border-gold/50 transition-all duration-300" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-serif text-xl text-white mb-1 group-hover:text-gold transition-colors">
                  {category.name}
                </h3>
                <div className="h-px w-0 group-hover:w-8 bg-gold transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
