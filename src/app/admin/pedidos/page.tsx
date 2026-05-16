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
        <p className="text-gold-dark text-xs tracking-[0.3em] uppercase font-sans mb-2">Gerenciar</p>
        <h1 className="font-serif text-3xl text-ink">Pedidos</h1>
        <p className="text-ink-muted text-sm font-sans mt-2">{orders.length} pedidos no total</p>
      </div>

      <div className="bg-white border border-cream-200 overflow-x-auto shadow-sm">
        <table className="w-full">
          <thead className="bg-cream-50">
            <tr className="border-b border-cream-200">
              {["ID", "Cliente", "Itens", "Total", "Pagamento", "Status", "Data", "Dropshipping", "Ações"].map((h) => (
                <th key={h} className="text-left px-5 py-4 text-ink-muted text-[10px] uppercase tracking-[0.2em] font-sans font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-cream-50/50 transition-colors">
                <td className="px-5 py-4">
                  <span className="text-gold-dark font-mono text-xs">{order.id.slice(0, 8)}...</span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-ink text-sm font-sans">{order.shippingName}</p>
                  <p className="text-ink-muted text-xs font-sans">{order.shippingEmail}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="text-ink/70 text-sm font-sans">{order.items.length}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-ink font-semibold text-sm">{formatPrice(order.total)}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs px-2 py-1 font-sans", order.paymentStatus === "PAID" ? "text-green-700 bg-green-100" : "text-yellow-700 bg-yellow-100")}>
                    {order.paymentStatus === "PAID" ? "Pago" : "Pendente"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs px-2 py-1 font-sans", ORDER_STATUS_COLORS[order.status])}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-ink-muted text-xs font-sans">{formatDate(order.createdAt)}</span>
                </td>
                <td className="px-5 py-4">
                  <div>
                    {order.dropshippingOrderId ? (
                      <span className="text-green-700 text-xs font-mono">{order.dropshippingOrderId.slice(0, 10)}</span>
                    ) : (
                      <span className="text-ink/30 text-xs">Não enviado</span>
                    )}
                    {order.trackingCode && (
                      <p className="text-gold-dark text-xs font-mono mt-0.5">{order.trackingCode}</p>
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
          <div className="p-16 text-center text-ink/30 text-sm font-sans">
            Nenhum pedido ainda
          </div>
        )}
      </div>
    </div>
  );
}
