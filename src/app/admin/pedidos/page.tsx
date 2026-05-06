import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-gold text-xs tracking-[0.3em] uppercase font-sans mb-2">Gerenciar</p>
        <h1 className="font-serif text-3xl text-white">Pedidos</h1>
        <p className="text-white/40 text-sm font-sans mt-2">{orders.length} pedidos no total</p>
      </div>

      <div className="bg-dark-100 border border-dark-300 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-300">
              {["ID", "Cliente", "Itens", "Total", "Pagamento", "Status", "Data", "Dropshipping", "Ações"].map((h) => (
                <th key={h} className="text-left px-5 py-4 text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-300">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-dark-200/50 transition-colors">
                <td className="px-5 py-4">
                  <span className="text-gold font-mono text-xs">{order.id.slice(0, 8)}...</span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-white text-sm font-sans">{order.shippingName}</p>
                  <p className="text-white/30 text-xs font-sans">{order.shippingEmail}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="text-white/60 text-sm font-sans">{order.items.length}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-gold font-semibold text-sm">{formatPrice(order.total)}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs px-2 py-1 font-sans", order.paymentStatus === "PAID" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10")}>
                    {order.paymentStatus === "PAID" ? "Pago" : "Pendente"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs px-2 py-1 font-sans", ORDER_STATUS_COLORS[order.status])}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-white/40 text-xs font-sans">{formatDate(order.createdAt)}</span>
                </td>
                <td className="px-5 py-4">
                  <div>
                    {order.dropshippingOrderId ? (
                      <span className="text-green-400 text-xs font-mono">{order.dropshippingOrderId.slice(0, 10)}</span>
                    ) : (
                      <span className="text-white/20 text-xs">Não enviado</span>
                    )}
                    {order.trackingCode && (
                      <p className="text-gold text-xs font-mono mt-0.5">{order.trackingCode}</p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <AdminOrderActions order={{
                    id: order.id,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    dropshippingOrderId: order.dropshippingOrderId,
                    trackingCode: order.trackingCode,
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="p-16 text-center text-white/30 text-sm font-sans">
            Nenhum pedido ainda
          </div>
        )}
      </div>
    </div>
  );
}
