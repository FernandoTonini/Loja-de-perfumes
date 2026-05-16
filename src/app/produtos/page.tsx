import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";
import { Product, Category } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

interface SearchParams {
  categoria?: string;
  genero?: string;
  ordem?: string;
  busca?: string;
  page?: string;
}

async function getData(params: SearchParams) {
  const { categoria, genero, ordem, busca } = params;

  const where: Record<string, unknown> = { inStock: true };

  if (categoria) {
    where.category = { slug: categoria };
  }
  if (genero) {
    where.gender = genero.toUpperCase();
  }
  if (busca) {
    where.OR = [
      { name: { contains: busca } },
      { brand: { contains: busca } },
      { description: { contains: busca } },
    ];
  }

  const orderBy: Record<string, string> = {};
  if (ordem === "preco-asc") orderBy.price = "asc";
  else if (ordem === "preco-desc") orderBy.price = "desc";
  else if (ordem === "nome") orderBy.name = "asc";
  else orderBy.createdAt = "desc";

  const [rawProducts, rawCategories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const products: Product[] = rawProducts.map((p) => ({
    ...p,
    images: parseImages(p.images),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    category: {
      ...p.category,
      createdAt: p.category.createdAt.toISOString(),
    },
  }));

  const categories: Category[] = rawCategories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return { products, categories };
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { products, categories } = await getData(searchParams);
  const activeCategory = categories.find((c) => c.slug === searchParams.categoria);

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="section-subtitle mb-3">Nossa Coleção</p>
          <h1 className="section-title">
            {activeCategory ? activeCategory.name : "Todos os"}{" "}
            <span className="gold-text italic">Perfumes</span>
          </h1>
          <div className="h-px w-16 bg-gold mt-4" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="sticky top-28">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal size={16} className="text-gold" />
                <h3 className="text-ink/70 text-sm font-sans font-medium tracking-wide uppercase">Filtros</h3>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <h4 className="text-ink-muted text-[10px] tracking-[0.3em] uppercase font-sans mb-3">Categoria</h4>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/produtos"
                      className={`block py-2 px-3 text-sm font-sans transition-colors ${
                        !searchParams.categoria ? "text-gold-dark bg-gold/10" : "text-ink-muted hover:text-gold-dark"
                      }`}
                    >
                      Todos
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/produtos?categoria=${cat.slug}`}
                        className={`block py-2 px-3 text-sm font-sans transition-colors ${
                          searchParams.categoria === cat.slug ? "text-gold-dark bg-gold/10" : "text-ink-muted hover:text-gold-dark"
                        }`}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gender */}
              <div className="mb-8">
                <h4 className="text-ink-muted text-[10px] tracking-[0.3em] uppercase font-sans mb-3">Gênero</h4>
                <ul className="space-y-1">
                  {[
                    { label: "Todos", value: "" },
                    { label: "Masculino", value: "masculino" },
                    { label: "Feminino", value: "feminino" },
                    { label: "Unissex", value: "unisex" },
                  ].map((g) => (
                    <li key={g.value}>
                      <Link
                        href={`/produtos?${searchParams.categoria ? `categoria=${searchParams.categoria}&` : ""}genero=${g.value}`}
                        className={`block py-2 px-3 text-sm font-sans transition-colors ${
                          searchParams.genero === g.value || (!searchParams.genero && !g.value)
                            ? "text-gold-dark bg-gold/10"
                            : "text-ink-muted hover:text-gold-dark"
                        }`}
                      >
                        {g.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sort */}
              <div>
                <h4 className="text-ink-muted text-[10px] tracking-[0.3em] uppercase font-sans mb-3">Ordenar</h4>
                <ul className="space-y-1">
                  {[
                    { label: "Mais Recentes", value: "" },
                    { label: "Menor Preço", value: "preco-asc" },
                    { label: "Maior Preço", value: "preco-desc" },
                    { label: "Nome A-Z", value: "nome" },
                  ].map((o) => (
                    <li key={o.value}>
                      <Link
                        href={`/produtos?${searchParams.categoria ? `categoria=${searchParams.categoria}&` : ""}ordem=${o.value}`}
                        className={`block py-2 px-3 text-sm font-sans transition-colors ${
                          (searchParams.ordem || "") === o.value ? "text-gold-dark bg-gold/10" : "text-ink-muted hover:text-gold-dark"
                        }`}
                      >
                        {o.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-ink-muted text-sm font-sans">
                {products.length} {products.length === 1 ? "produto" : "produtos"} encontrados
              </p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-serif text-3xl text-ink/20 mb-4">Nenhum produto encontrado</p>
                <p className="text-ink-muted text-sm font-sans mb-8">Tente remover os filtros ou buscar por outro termo.</p>
                <Link href="/produtos" className="btn-outline-gold px-8 py-3 text-sm">
                  Ver todos os produtos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
