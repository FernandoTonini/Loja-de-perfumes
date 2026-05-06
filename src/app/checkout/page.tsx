"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { CheckoutFormData } from "@/types";
import { ArrowRight, Lock, CreditCard, QrCode } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(3, "Nome completo obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone obrigatório"),
  street: z.string().min(3, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().min(2, "Estado obrigatório"),
  zip: z.string().min(8, "CEP obrigatório"),
  paymentMethod: z.enum(["stripe", "pix"]),
});

const FREE_SHIPPING = 500;
const SHIPPING_PRICE = 25;

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const subtotal = getTotalPrice();
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_PRICE;
  const total = subtotal + shipping;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "stripe" },
  });

  const paymentMethod = watch("paymentMethod");

  if (items.length === 0) {
    router.push("/carrinho");
    return null;
  }

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/checkout", {
        ...data,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          name: i.name,
          image: i.image,
        })),
        subtotal,
        shipping,
        total,
      });

      if (data.paymentMethod === "stripe" && response.data.stripeUrl) {
        clearCart();
        window.location.href = response.data.stripeUrl;
      } else {
        clearCart();
        router.push(`/checkout/sucesso?orderId=${response.data.orderId}`);
      }
    } catch (error) {
      toast.error("Erro ao processar pedido. Tente novamente.", {
        style: { background: "#1a1a1a", color: "#fff", border: "1px solid #2a2a2a" },
      });
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ name, label, placeholder, type = "text", className = "" }: {
    name: keyof CheckoutFormData;
    label: string;
    placeholder?: string;
    type?: string;
    className?: string;
  }) => (
    <div className={className}>
      <label className="block text-xs tracking-wide text-white/50 uppercase font-sans mb-2">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full bg-dark-200 border border-dark-300 focus:border-gold/50 outline-none px-4 py-3 text-white text-sm font-sans placeholder-white/20 transition-colors"
      />
      {errors[name] && (
        <p className="text-red-400 text-xs mt-1">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-subtitle mb-3">Quase Lá</p>
          <h1 className="section-title">
            Finalize seu <span className="gold-text italic">Pedido</span>
          </h1>
          <div className="divider-gold" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal data */}
              <div className="bg-dark-100 border border-dark-300 p-6">
                <h2 className="font-serif text-xl text-white mb-6">
                  Dados Pessoais
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField name="name" label="Nome Completo" placeholder="Seu nome completo" className="sm:col-span-2" />
                  <InputField name="email" label="E-mail" placeholder="seu@email.com" type="email" />
                  <InputField name="phone" label="Telefone / WhatsApp" placeholder="(11) 99999-9999" />
                </div>
              </div>

              {/* Address */}
              <div className="bg-dark-100 border border-dark-300 p-6">
                <h2 className="font-serif text-xl text-white mb-6">
                  Endereço de Entrega
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField name="zip" label="CEP" placeholder="00000-000" />
                  <InputField name="state" label="Estado" placeholder="SP" />
                  <InputField name="street" label="Rua / Avenida" placeholder="Nome da rua" className="sm:col-span-2" />
                  <InputField name="number" label="Número" placeholder="123" />
                  <InputField name="complement" label="Complemento (opcional)" placeholder="Apto, Bloco..." />
                  <InputField name="neighborhood" label="Bairro" placeholder="Nome do bairro" />
                  <InputField name="city" label="Cidade" placeholder="Sua cidade" />
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-dark-100 border border-dark-300 p-6">
                <h2 className="font-serif text-xl text-white mb-6">
                  Forma de Pagamento
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center gap-4 p-4 cursor-pointer border transition-all ${paymentMethod === "stripe" ? "border-gold bg-gold/5" : "border-dark-300 hover:border-dark-400"}`}>
                    <input {...register("paymentMethod")} type="radio" value="stripe" className="accent-gold" />
                    <CreditCard size={20} className={paymentMethod === "stripe" ? "text-gold" : "text-white/40"} />
                    <div>
                      <p className="text-white text-sm font-semibold">Cartão de Crédito</p>
                      <p className="text-white/40 text-xs">Via Stripe — Seguro</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-4 cursor-pointer border transition-all ${paymentMethod === "pix" ? "border-gold bg-gold/5" : "border-dark-300 hover:border-dark-400"}`}>
                    <input {...register("paymentMethod")} type="radio" value="pix" className="accent-gold" />
                    <QrCode size={20} className={paymentMethod === "pix" ? "text-gold" : "text-white/40"} />
                    <div>
                      <p className="text-white text-sm font-semibold">PIX</p>
                      <p className="text-white/40 text-xs">Aprovação imediata</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-dark-100 border border-dark-300 p-6 sticky top-28">
                <h2 className="font-serif text-xl text-white mb-6">Resumo</h2>

                {/* Items */}
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="relative w-14 h-16 bg-dark-200 flex-shrink-0 overflow-hidden">
                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs font-sans font-medium line-clamp-2">{item.name}</p>
                        <p className="text-white/40 text-xs">x{item.quantity}</p>
                        <p className="text-gold text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6 pt-4 border-t border-dark-300">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Frete</span>
                    <span className={shipping === 0 ? "text-green-400" : ""}>{shipping === 0 ? "Grátis" : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-2 border-t border-dark-300">
                    <span>Total</span>
                    <span className="text-gold text-lg">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-4 flex items-center justify-center gap-2 text-sm tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="animate-pulse">Processando...</span>
                  ) : (
                    <>
                      <Lock size={16} />
                      {paymentMethod === "stripe" ? "Pagar com Cartão" : "Gerar PIX"}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-center text-white/30 text-xs mt-3 font-sans flex items-center justify-center gap-1">
                  <Lock size={10} />
                  Pagamento 100% seguro e criptografado
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
