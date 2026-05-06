import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ShoppingBag, Package, DollarSign, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [totalOrders, totalRevenue, totalProducts, totalUsers, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = await prisma.order.count({ where: { createdAt: { gte: today } } });

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    totalProducts,
    totalUsers,
    recentOrders,
    todayOrders,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Receita Total", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "text-gold" },
    { label: "Pedidos Totais", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-400" },
    { label: "Produtos", value: stats.totalProducts, icon: Package, color: "text-purple-400" },
    { label: "Clientes", value: stats.totalUsers, icon: Users, color: "text-green-400" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-gold text-xs tracking-[0.3em] uppercase font-sans mb-2">Painel</p>
        <h1 className="font-serif text-3xl text-white">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-dark-100 border border-dark-300 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/50 text-xs font-sans uppercase tracking-wide">{card.label}</p>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="font-serif text-3xl text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Today + quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gold/10 border border-gold/30 p-5 flex items-center gap-4">
          <TrendingUp size={32} className="text-gold" />
          <div>
            <p className="text-gold text-sm font-sans font-semibold">{stats.todayOrders} pedidos hoje</p>
            <p className="text-white/40 text-xs font-sans">Últimas 24 horas</p>
          </div>
        </div>
        <Link href="/admin/pedidos" className="bg-dark-100 border border-dark-300 hover:border-gold/30 p-5 flex items-center gap-4 transition-colors group">
          <ShoppingBag size={28} className="text-white/40 group-hover:text-gold transition-colors" />
          <div>
            <p className="text-white text-sm font-sans font-semibold group-hover:text-gold transition-colors">Gerenciar Pedidos</p>
            <p className="text-white/40 text-xs font-sans">Ver e atualizar pedidos</p>
          </div>
        </Link>
        <Link href="/admin/produtos" className="bg-dark-100 border border-dark-300 hover:border-gold/30 p-5 flex items-center gap-4 transition-colors group">
          <Package size={28} className="text-white/40 group-hover:text-gold transition-colors" />
          <div>
            <p className="text-white text-sm font-sans font-semibold group-hover:text-gold transition-colors">Gerenciar Produtos</p>
            <p className="text-white/40 text-xs font-sans">Adicionar e editar produtos</p>
          </div>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-dark-100 border border-dark-300">
        <div className="p-6 border-b border-dark-300 flex items-center justify-between">
          <h2 className="font-serif text-xl text-white">Pedidos Recentes</h2>
          <Link href="/admin/pedidos" className="text-gold text-xs tracking-wide uppercase font-sans hover:text-gold-light">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-dark-300">
          {stats.recentOrders.map((order) => (
            <div key={order.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm font-sans font-medium">{order.shippingName}</p>
                <p className="text-white/30 text-xs font-sans">{order.shippingEmail} • {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn("text-xs px-2 py-1 font-sans", ORDER_STATUS_COLORS[order.status])}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <span className="text-gold font-semibold text-sm">{formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
          {stats.recentOrders.length === 0 && (
            <div className="p-12 text-center text-white/30 text-sm font-sans">
              Nenhum pedido ainda
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
