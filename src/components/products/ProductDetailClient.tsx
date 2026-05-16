"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, ChevronLeft, ChevronRight, Check, Minus, Plus, Package, Shield, Truck } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, GENDER_LABELS } from "@/lib/utils";
import { useCart } from "@/store/cart";
import toast from "react-hot-toast";
import Link from "next/link";

interface Props {
  product: Product;
}

export function ProductDetailClient({ product }: Props) {
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const images = Array.isArray(product.images) ? product.images : [product.images];
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: images[0] || "",
        ml: product.ml,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted font-sans mb-10">
        <Link href="/" className="hover:text-gold-dark transition-colors">Início</Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-gold-dark transition-colors">Perfumes</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/produtos?categoria=${product.category.slug}`} className="hover:text-gold-dark transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink/70 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
        {/* Images */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative aspect-square bg-cream-50 overflow-hidden group border border-cream-200">
            {images[currentImage] ? (
              <Image
                src={images[currentImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-8xl text-cream-200">{product.brand[0]}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="absolute top-4 left-4 bg-gold text-cream text-xs font-bold px-3 py-1.5 tracking-wide">
                -{discount}% OFF
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-gold-dark shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-gold-dark shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`relative w-20 h-20 overflow-hidden flex-shrink-0 border-2 transition-all ${
                    i === currentImage ? "border-gold" : "border-cream-200 hover:border-gold/50"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gold-dark text-xs tracking-[0.3em] uppercase font-sans font-medium">
                {product.brand}
              </span>
              <span className="text-ink-muted text-xs font-sans">
                {GENDER_LABELS[product.gender]}
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-ink font-light mb-2">
              {product.name}
            </h1>
            {product.ml && (
              <p className="text-ink-muted text-sm font-sans">{product.ml}ml — Eau de Parfum</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end gap-4 mb-8 pb-8 border-b border-cream-200">
            <span className="font-serif text-4xl text-ink font-light">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && (
              <div className="flex flex-col">
                <span className="text-ink-muted text-sm line-through">{formatPrice(product.comparePrice)}</span>
                <span className="text-green-600 text-xs font-sans">Você economiza {formatPrice(product.comparePrice - product.price)}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-ink-muted font-sans text-sm leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Scent notes */}
          {(product.topNotes || product.heartNotes || product.baseNotes) && (
            <div className="mb-8 p-5 bg-cream-50 border border-cream-200">
              <h3 className="text-ink/60 text-xs tracking-[0.3em] uppercase font-sans mb-4">Notas Olfativas</h3>
              <div className="space-y-3">
                {product.topNotes && (
                  <div className="flex items-start gap-4">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-[10px] tracking-wide uppercase text-gold-dark font-sans">Topo</span>
                    </div>
                    <p className="text-ink-muted text-sm font-sans">{product.topNotes}</p>
                  </div>
                )}
                {product.heartNotes && (
                  <div className="flex items-start gap-4">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-[10px] tracking-wide uppercase text-gold-dark font-sans">Coração</span>
                    </div>
                    <p className="text-ink-muted text-sm font-sans">{product.heartNotes}</p>
                  </div>
                )}
                {product.baseNotes && (
                  <div className="flex items-start gap-4">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-[10px] tracking-wide uppercase text-gold-dark font-sans">Base</span>
                    </div>
                    <p className="text-ink-muted text-sm font-sans">{product.baseNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity & Add to cart */}
          {product.inStock ? (
            <div className="flex items-center gap-4 mb-6">
              {/* Quantity */}
              <div className="flex items-center border border-cream-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-12 flex items-center justify-center text-ink/40 hover:text-gold-dark transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 h-12 flex items-center justify-center text-ink font-sans">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-12 flex items-center justify-center text-ink/40 hover:text-gold-dark transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-3 py-4 font-semibold text-sm tracking-[0.15em] uppercase transition-all duration-300 ${
                  added ? "bg-green-600 text-white" : "btn-gold"
                }`}
              >
                {added ? (
                  <>
                    <Check size={18} />
                    Adicionado!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    Adicionar ao Carrinho
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-cream-50 border border-cream-200 py-4 text-center text-ink-muted text-sm font-sans mb-6">
              Produto temporariamente indisponível
            </div>
          )}

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-cream-200">
            {[
              { icon: <Shield size={18} />, title: "100% Original", desc: "Garantia de autenticidade" },
              { icon: <Truck size={18} />, title: "Entrega Segura", desc: "Embalagem especial" },
              { icon: <Package size={18} />, title: "7 dias para troca", desc: "Política facilitada" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-gold flex justify-center mb-2">{item.icon}</div>
                <p className="text-ink text-xs font-semibold font-sans">{item.title}</p>
                <p className="text-ink-muted text-[10px] font-sans mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
