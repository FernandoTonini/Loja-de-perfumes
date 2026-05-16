import { prisma } from "@/lib/prisma";
import { parseImages, formatPrice, GENDER_LABELS } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";
import { ProductCard } from "@/components/products/ProductCard";
import { Product } from "@/types";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: `${product.name} - ${product.brand}`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const rawProduct = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });

  if (!rawProduct) notFound();

  const product: Product = {
    ...rawProduct,
    images: parseImages(rawProduct.images),
    createdAt: rawProduct.createdAt.toISOString(),
    updatedAt: rawProduct.updatedAt.toISOString(),
    category: rawProduct.category ? {
      ...rawProduct.category,
      createdAt: rawProduct.category.createdAt.toISOString(),
    } : undefined,
  };

  const rawRelated = await prisma.product.findMany({
    where: {
      categoryId: rawProduct.categoryId,
      id: { not: rawProduct.id },
      inStock: true,
    },
    include: { category: true },
    take: 4,
  });

  const related: Product[] = rawRelated.map((p) => ({
    ...p,
    images: parseImages(p.images),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    category: {
      ...p.category,
      createdAt: p.category.createdAt.toISOString(),
    },
  }));

  return (
    <div className="min-h-screen bg-cream">
      <ProductDetailClient product={product} />

      {/* Related products */}
      {related.length > 0 && (
        <section className="py-20 border-t border-cream-200 bg-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="section-subtitle mb-3">Da Mesma Categoria</p>
              <h2 className="font-serif text-3xl text-ink font-light">
                Você Também Pode <span className="gold-text italic">Gostar</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
