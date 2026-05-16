import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string; session_id?: string };
}) {
  const orderId = searchParams.orderId || searchParams.session_id;

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center py-20">
      <div className="max-w-lg w-full mx-auto px-4 text-center">
        {/* Icon */}
        <div className="relative mb-8 inline-block">
          <div className="w-24 h-24 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto">
            <CheckCircle size={48} className="text-gold" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gold/5 animate-ping" />
        </div>

        <p className="section-subtitle mb-4">Pedido Confirmado</p>
        <h1 className="font-serif text-4xl text-ink mb-4">
          Obrigado pela <span className="gold-text italic">sua compra!</span>
        </h1>
        <div className="divider-gold" />

        <p className="text-ink-muted font-sans text-sm leading-relaxed mt-6 mb-8">
          Seu pedido foi recebido com sucesso e já está sendo processado.
          Você receberá um e-mail com os detalhes e o código de rastreamento assim que o pedido for enviado.
        </p>

        {orderId && (
          <div className="bg-white border border-gold/20 p-4 mb-8 shadow-sm">
            <p className="text-ink-muted text-xs uppercase tracking-wide font-sans mb-1">Número do Pedido</p>
            <p className="text-gold-dark font-mono text-sm">{orderId}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/conta/pedidos"
            className="btn-outline-gold inline-flex items-center justify-center gap-2 px-8 py-3 text-sm tracking-wider uppercase"
          >
            <Package size={16} />
            Meus Pedidos
          </Link>
          <Link
            href="/produtos"
            className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-3 text-sm tracking-wider uppercase"
          >
            Continuar Comprando
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
