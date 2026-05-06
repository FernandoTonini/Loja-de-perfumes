"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Heart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, parseImages } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const images = parseImages(product.images as unknown as string);
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: images[0] || "",
      ml: product.ml,
    });
  };

  return (
    <Link href={`/produtos/${product.slug}`} className={cn("group block", className)}>
      <div className="bg-dark-100 border border-dark-300 product-card-hover overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-dark-200 overflow-hidden">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-4xl text-dark-400">{product.brand[0]}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="bg-gold text-dark text-[10px] font-bold px-2 py-1 tracking-wide">
                -{discount}%
              </span>
            )}
            {product.featured && (
              <span className="bg-white/10 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 tracking-wide uppercase">
                Destaque
              </span>
            )}
            {!product.inStock && (
              <span className="bg-dark-300/90 text-white/60 text-[10px] px-2 py-1 tracking-wide">
                Esgotado
              </span>
            )}
          </div>

          {/* Quick add button */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            {product.inStock ? (
              <button
                onClick={handleAddToCart}
                className="btn-gold w-full py-3 flex items-center justify-center gap-2 text-xs tracking-[0.15em] uppercase font-semibold"
              >
                <ShoppingBag size={14} />
                Adicionar ao Carrinho
              </button>
            ) : (
              <div className="bg-dark-300 w-full py-3 text-center text-xs text-white/40 tracking-wide uppercase">
                Indisponível
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-gold/70 text-[10px] tracking-[0.25em] uppercase font-sans font-medium mb-1">
            {product.brand}
          </p>
          <h3 className="font-sans text-white/90 text-sm font-medium leading-tight mb-1 group-hover:text-gold transition-colors line-clamp-2">
            {product.name}
          </h3>
          {product.ml && (
            <p className="text-white/30 text-xs mb-3">{product.ml}ml</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gold text-base">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-white/30 text-xs line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
