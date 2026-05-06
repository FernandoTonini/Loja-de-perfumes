"use client";

import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";

const FREE_SHIPPING = 500;
const SHIPPING_PRICE = 25;

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart();
  const subtotal = getTotalPrice();
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_PRICE;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center py-20">
        <ShoppingBag size={64} className="text-dark-400 mb-6" />
        <h1 className="font-serif text-4xl text-white/40 mb-4">Seu carrinho está vazio</h1>
        <p className="text-white/30 text-sm font-sans mb-8">Explore nossa coleção e encontre a fragrância perfeita.</p>
        <Link href="/produtos" className="btn-gold px-10 py-4 text-sm tracking-wider uppercase flex items-center gap-2">
          <ArrowLeft size={16} />
          Explorar Perfumes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="section-subtitle mb-3">Seu Pedido</p>
          <h1 className="section-title">
            Carrinho de <span className="gold-text italic">Compras</span>
          </h1>
          <div className="h-px w-16 bg-gold mt-4" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="bg-dark-100 border border-dark-300 p-5 flex gap-5">
                {/* Image */}
                <div className="relative w-24 h-28 bg-dark-200 flex-shrink-0 overflow-hidden">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-gold/70 text-[10px] tracking-[0.25em] uppercase font-sans mb-1">{item.brand}</p>
                  <h3 className="text-white font-sans font-medium text-sm mb-1">{item.name}</h3>
                  {item.ml && <p className="text-white/30 text-xs mb-4">{item.ml}ml</p>}

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Quantity */}
                    <div className="flex items-center border border-dark-300">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-gold transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-white text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-gold transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-gold font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-dark-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4">
              <Link href="/produtos" className="text-white/40 hover:text-gold transition-colors text-sm font-sans flex items-center gap-2">
                <ArrowLeft size={14} />
                Continuar comprando
              </Link>
              <button
                onClick={clearCart}
                className="text-red-400/60 hover:text-red-400 transition-colors text-xs font-sans"
              >
                Limpar carrinho
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-dark-100 border border-dark-300 p-6 sticky top-28">
              <h2 className="font-serif text-xl text-white mb-6">Resumo do Pedido</h2>

              {/* Free shipping progress */}
              {subtotal < FREE_SHIPPING && (
                <div className="mb-6 p-4 bg-dark-200 border border-dark-300">
                  <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>Para frete grátis</span>
                    <span className="text-gold">{formatPrice(FREE_SHIPPING - subtotal)} restantes</span>
                  </div>
                  <div className="h-1.5 bg-dark-300 rounded-full">
                    <div
                      className="h-full bg-gold rounded-full transition-all"
                      style={{ width: `${(subtotal / FREE_SHIPPING) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/60">
                  <span>Frete</span>
                  <span className={shipping === 0 ? "text-green-400" : ""}>
                    {shipping === 0 ? "Grátis" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="h-px bg-dark-300" />
                <div className="flex justify-between text-white font-semibold">
                  <span>Total</span>
                  <span className="text-gold text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="btn-gold flex items-center justify-center gap-2 w-full py-4 text-sm tracking-wider font-semibold uppercase"
              >
                Finalizar Compra
                <ArrowRight size={16} />
              </Link>

              <div className="mt-4 text-center">
                <p className="text-white/30 text-xs font-sans">
                  Pagamento 100% seguro via Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
