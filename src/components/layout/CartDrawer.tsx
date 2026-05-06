"use client";

import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { useEffect } from "react";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice } = useCart();
  const total = getTotalPrice();
  const FREE_SHIPPING_THRESHOLD = 500;
  const SHIPPING = 25;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - total;

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[420px] bg-dark-100 border-l border-dark-300 z-[70] flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-300">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-gold" />
            <h2 className="font-serif text-xl text-white">
              Seu Carrinho {items.length > 0 && <span className="text-gold">({items.length})</span>}
            </h2>
          </div>
          <button onClick={closeCart} className="text-white/50 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Free shipping bar */}
        {total > 0 && total < FREE_SHIPPING_THRESHOLD && (
          <div className="px-6 py-3 bg-dark-200 border-b border-dark-300">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>Frete grátis acima de {formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
              <span className="text-gold">{formatPrice(remainingForFreeShipping)} restantes</span>
            </div>
            <div className="h-1 bg-dark-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-500"
                style={{ width: `${Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
        {total >= FREE_SHIPPING_THRESHOLD && (
          <div className="px-6 py-3 bg-gold/10 border-b border-gold/30 text-center text-xs text-gold font-semibold tracking-wide">
            🎉 Você ganhou frete grátis!
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={48} className="text-dark-400" />
              <p className="text-white/50 font-sans text-sm">Seu carrinho está vazio</p>
              <button
                onClick={closeCart}
                className="btn-outline-gold px-6 py-2 text-sm"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-4 py-4 border-b border-dark-300/50">
                {/* Image */}
                <div className="relative w-20 h-24 bg-dark-200 flex-shrink-0 overflow-hidden">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gold/70 font-sans tracking-wide uppercase mb-1">{item.brand}</p>
                  <p className="text-white font-sans text-sm font-medium leading-tight mb-1 truncate">{item.name}</p>
                  {item.ml && <p className="text-white/40 text-xs mb-3">{item.ml}ml</p>}

                  <div className="flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center gap-2 border border-dark-300">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-gold transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-gold transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gold font-semibold text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-dark-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-dark-300 px-6 py-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>Frete</span>
                <span>{total >= FREE_SHIPPING_THRESHOLD ? <span className="text-green-400">Grátis</span> : formatPrice(SHIPPING)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-white pt-2 border-t border-dark-300">
                <span>Total</span>
                <span className="text-gold">{formatPrice(total >= FREE_SHIPPING_THRESHOLD ? total : total + SHIPPING)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-gold flex items-center justify-center gap-2 w-full py-4 text-sm tracking-wider font-semibold"
            >
              Finalizar Compra
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/carrinho"
              onClick={closeCart}
              className="block text-center text-xs text-white/40 hover:text-gold transition-colors"
            >
              Ver carrinho completo
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
