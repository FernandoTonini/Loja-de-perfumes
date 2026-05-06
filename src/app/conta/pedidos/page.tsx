import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Link href="/conta" className="flex items-center gap-2 text-white/40 hover:text-gold transition-colors text-sm font-sans mb-6">
            <ArrowLeft size={14} />
            Minha Conta
          </Link>
          <p className="section-subtitle mb-3">Histórico</p>
          <h1 className="section-title">
            Meus <span className="gold-text italic">Pedidos</span>
          </h1>
          <div className="h-px w-16 bg-gold mt-4" />
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <Package size={64} className="text-dark-400 mx-auto mb-6" />
            <p className="font-serif text-3xl text-white/30 mb-4">Nenhum pedido ainda</p>
            <Link href="/produtos" className="btn-gold px-8 py-3 text-sm tracking-wider uppercase">
              Começar a comprar
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-dark-100 border border-dark-300 p-6 hover:border-gold/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wide font-sans mb-1">Pedido</p>
                    <p className="text-gold font-mono text-sm">{order.id.slice(0, 16)}...</p>
                    <p className="text-white/30 text-xs font-sans mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <span className={cn("text-xs px-3 py-1.5 font-sans font-medium", ORDER_STATUS_COLORS[order.status])}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-gold font-semibold text-lg">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="border-t border-dark-300 pt-4">
                  <p className="text-white/40 text-xs font-sans mb-2">
                    {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                  </p>
                  <div className="flex flex-col gap-1">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-white/60 text-sm font-sans">
                        {item.quantity}x {item.name} — {formatPrice(item.price)}
                      </p>
                    ))}
                  </div>

                  {order.trackingCode && (
                    <div className="mt-4 p-3 bg-dark-200 border border-dark-300">
                      <p className="text-white/40 text-xs font-sans">
                        Código de Rastreio: <span className="text-gold font-mono">{order.trackingCode}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
