import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Categories } from "@/components/home/Categories";
import { Testimonials } from "@/components/home/Testimonials";
import { Newsletter } from "@/components/home/Newsletter";
import { BrandStory } from "@/components/home/BrandStory";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";
import { Product, Category } from "@/types";

async function getData() {
  const [rawProducts, rawCategories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true, inStock: true },
      include: { category: true },
      take: 8,
      orderBy: { createdAt: "desc" },
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

export default async function HomePage() {
  const { products, categories } = await getData();

  return (
    <>
      <HeroSection />
      <FeaturedProducts products={products} />
      <Categories categories={categories} />
      <BrandStory />
      <Testimonials />
      <Newsletter />
    </>
  );
}
