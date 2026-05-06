"use client";

import { useState } from "react";
import { Send, Truck, MoreHorizontal } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Props {
  order: {
    id: string;
    status: string;
    paymentStatus: string;
    dropshippingOrderId: string | null;
    trackingCode: string | null;
  };
}

export function AdminOrderActions({ order }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [showTracking, setShowTracking] = useState(false);

  const sendToDropshipping = async () => {
    try {
      setLoading("dropshipping");
      await axios.post("/api/dropshipping", { orderId: order.id });
      toast.success("Pedido enviado ao fornecedor!", {
        style: { background: "#1a1a1a", color: "#C9A84C", border: "1px solid #2a2a2a" },
      });
      router.refresh();
    } catch {
      toast.error("Erro ao enviar para o fornecedor");
    } finally {
      setLoading(null);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      setLoading("status");
      await axios.patch(`/api/orders/${order.id}`, { status });
      toast.success("Status atualizado!");
      router.refresh();
      setShowMenu(false);
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setLoading(null);
    }
  };

  const addTracking = async () => {
    if (!trackingInput.trim()) return;
    try {
      setLoading("tracking");
      await axios.patch(`/api/orders/${order.id}`, { trackingCode: trackingInput });
      toast.success("Código de rastreio adicionado!");
      setShowTracking(false);
      setTrackingInput("");
      router.refresh();
    } catch {
      toast.error("Erro ao adicionar rastreio");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Send to dropshipping */}
      {!order.dropshippingOrderId && order.paymentStatus === "PAID" && (
        <button
          onClick={sendToDropshipping}
          disabled={!!loading}
          title="Enviar ao fornecedor"
          className="text-gold/60 hover:text-gold transition-colors disabled:opacity-30"
        >
          {loading === "dropshipping" ? (
            <span className="animate-pulse text-xs">...</span>
          ) : (
            <Send size={15} />
          )}
        </button>
      )}

      {/* Add tracking */}
      <button
        onClick={() => setShowTracking(!showTracking)}
        title="Adicionar rastreio"
        className="text-white/40 hover:text-gold transition-colors"
      >
        <Truck size={15} />
      </button>

      {/* More options */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="text-white/40 hover:text-gold transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {/* Status menu */}
      {showMenu && (
        <div className="absolute right-0 top-8 w-44 bg-dark-100 border border-dark-300 shadow-xl z-50">
          {["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`w-full text-left px-4 py-2.5 text-xs font-sans hover:bg-dark-200 transition-colors ${order.status === s ? "text-gold" : "text-white/60"}`}
            >
              {s === "PENDING" ? "Aguardando" : s === "PAID" ? "Pago" : s === "PROCESSING" ? "Processando" : s === "SHIPPED" ? "Enviado" : s === "DELIVERED" ? "Entregue" : "Cancelado"}
            </button>
          ))}
        </div>
      )}

      {/* Tracking input */}
      {showTracking && (
        <div className="absolute right-0 top-8 w-52 bg-dark-100 border border-dark-300 shadow-xl z-50 p-3">
          <input
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            placeholder="Código de rastreio"
            className="w-full bg-dark-200 border border-dark-300 px-3 py-2 text-white text-xs font-sans outline-none focus:border-gold/50 mb-2"
          />
          <button
            onClick={addTracking}
            disabled={!!loading}
            className="w-full btn-gold py-2 text-xs tracking-wide uppercase"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
