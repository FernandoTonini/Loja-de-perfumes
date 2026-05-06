import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";
import { Package, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: true },
  });

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="section-subtitle mb-3">Bem-vindo(a)</p>
          <h1 className="section-title">
            Minha <span className="gold-text italic">Conta</span>
          </h1>
          <div className="h-px w-16 bg-gold mt-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile */}
          <div className="bg-dark-100 border border-dark-300 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
              <User size={28} className="text-gold" />
            </div>
            <h2 className="font-serif text-xl text-white mb-1">{session.user.name || "Cliente"}</h2>
            <p className="text-white/40 text-xs font-sans mb-6">{session.user.email}</p>
            <div className="w-full pt-4 border-t border-dark-300 space-y-2">
              <Link href="/conta/pedidos" className="flex items-center gap-2 text-white/60 hover:text-gold text-sm font-sans transition-colors py-2">
                <Package size={16} />
                Meus Pedidos
              </Link>
              <Link href="/api/auth/signout" className="flex items-center gap-2 text-red-400/60 hover:text-red-400 text-sm font-sans transition-colors py-2">
                <LogOut size={16} />
                Sair
              </Link>
            </div>
          </div>

          {/* Recent orders */}
          <div className="md:col-span-2 bg-dark-100 border border-dark-300 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-white">Pedidos Recentes</h2>
              <Link href="/conta/pedidos" className="text-gold text-xs tracking-wide uppercase font-sans hover:text-gold-light transition-colors">
                Ver todos
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={40} className="text-dark-400 mx-auto mb-4" />
                <p className="text-white/30 text-sm font-sans">Nenhum pedido ainda</p>
                <Link href="/produtos" className="mt-4 inline-block text-gold text-sm hover:text-gold-light transition-colors">
                  Fazer primeiro pedido →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-dark-300 p-4 hover:border-gold/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white text-sm font-semibold font-sans">
                          {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                        </p>
                        <p className="text-white/30 text-xs font-sans mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-xs px-2 py-1 font-sans font-medium", ORDER_STATUS_COLORS[order.status])}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-gold text-sm font-semibold">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                    {order.trackingCode && (
                      <p className="text-white/40 text-xs font-sans">
                        Rastreio: <span className="text-gold">{order.trackingCode}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
