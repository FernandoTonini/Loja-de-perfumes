"use client";

import { useState } from "react";
import { Send, Truck, MoreHorizontal, Bot, X, Tag } from "lucide-react";
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

interface AutomationResult {
  success: boolean;
  message: string;
  screenshot?: string;
  productName?: string;
  labelUrl?: string;
  whatsappSent?: boolean;
}

export function AdminOrderActions({ order }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [showTracking, setShowTracking] = useState(false);
  const [automationResult, setAutomationResult] = useState<AutomationResult | null>(null);

  const automateDropshipping = async () => {
    try {
      setLoading("dropshipping");
      setAutomationResult(null);
      const response = await axios.post("/api/dropshipping/automate", { orderId: order.id });
      const data = response.data;

      if (data.results) {
        // Multiple items
        const allOk = data.results.every((r: AutomationResult) => r.success);
        const lastResult = data.results[data.results.length - 1] as AutomationResult;
        setAutomationResult({ ...lastResult, success: allOk });
      } else {
        setAutomationResult(data);
      }

      if (data.success || (data.results && data.results.some((r: AutomationResult) => r.success))) {
        toast.success("Pedido enviado ao fornecedor!", {
          style: { background: "#1a1a1a", color: "#C9A84C", border: "1px solid #2a2a2a" },
        });
        router.refresh();
      } else {
        toast.error("Erro ao enviar ao fornecedor. Veja os detalhes.");
      }
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Erro na automação";
      setAutomationResult({ success: false, message: msg });
      toast.error(msg);
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
      {/* Automate dropshipping */}
      {!order.dropshippingOrderId && order.paymentStatus === "PAID" && (
        <button
          onClick={automateDropshipping}
          disabled={!!loading}
          title="Enviar automaticamente ao fornecedor (bot)"
          className="text-gold/60 hover:text-gold transition-colors disabled:opacity-30 flex items-center gap-1"
        >
          {loading === "dropshipping" ? (
            <span className="animate-pulse text-xs text-gold/60">Enviando...</span>
          ) : (
            <>
              <Bot size={15} />
              <span className="text-xs hidden lg:inline">Auto</span>
            </>
          )}
        </button>
      )}

      {/* Manual send (fallback) */}
      {!order.dropshippingOrderId && order.paymentStatus === "PAID" && (
        <button
          onClick={async () => {
            try {
              setLoading("manual");
              await axios.post("/api/dropshipping", { orderId: order.id });
              toast.success("Enviado via API!", {
                style: { background: "#1a1a1a", color: "#C9A84C", border: "1px solid #2a2a2a" },
              });
              router.refresh();
            } catch {
              toast.error("Erro ao enviar manualmente");
            } finally {
              setLoading(null);
            }
          }}
          disabled={!!loading}
          title="Enviar via API (método alternativo)"
          className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
        >
          {loading === "manual" ? (
            <span className="animate-pulse text-xs">...</span>
          ) : (
            <Send size={14} />
          )}
        </button>
      )}

      {/* Gerar etiqueta */}
      {order.dropshippingOrderId && !order.trackingCode && (
        <button
          onClick={async () => {
            try {
              setLoading("label");
              const res = await axios.post("/api/shipping/label", { orderId: order.id });
              if (res.data.labelUrl) {
                window.open(res.data.labelUrl, "_blank");
                toast.success("Etiqueta gerada! Abrindo para impressão...", {
                  style: { background: "#1a1a1a", color: "#C9A84C", border: "1px solid #2a2a2a" },
                });
              }
              router.refresh();
            } catch {
              toast.error("Erro ao gerar etiqueta. Verifique o token Melhor Envio.");
            } finally {
              setLoading(null);
            }
          }}
          disabled={!!loading}
          title="Gerar etiqueta de postagem (Melhor Envio)"
          className="text-white/40 hover:text-gold transition-colors disabled:opacity-30"
        >
          {loading === "label" ? (
            <span className="animate-pulse text-xs">...</span>
          ) : (
            <Tag size={15} />
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
              {s === "PENDING"
                ? "Aguardando"
                : s === "PAID"
                  ? "Pago"
                  : s === "PROCESSING"
                    ? "Processando"
                    : s === "SHIPPED"
                      ? "Enviado"
                      : s === "DELIVERED"
                        ? "Entregue"
                        : "Cancelado"}
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

      {/* Automation result modal */}
      {automationResult && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 border border-dark-300 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p
                  className={`text-sm font-sans font-medium ${automationResult.success ? "text-green-400" : "text-red-400"}`}
                >
                  {automationResult.success ? "✓ Enviado com sucesso!" : "✗ Falha na automação"}
                </p>
                {automationResult.productName && (
                  <p className="text-white/40 text-xs mt-0.5">{automationResult.productName}</p>
                )}
              </div>
              <button
                onClick={() => setAutomationResult(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-white/60 text-sm font-sans mb-4">{automationResult.message}</p>

            {automationResult.labelUrl && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 text-xs font-sans font-medium mb-1">🏷️ Etiqueta gerada pelo Melhor Envio:</p>
                <a
                  href={automationResult.labelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold text-xs font-mono underline break-all"
                >
                  {automationResult.labelUrl}
                </a>
                <p className="text-white/30 text-xs mt-1">
                  Link também enviado para a atendente via WhatsApp.
                </p>
              </div>
            )}

            {automationResult.screenshot && (
              <div>
                <p className="text-white/30 text-xs font-sans mb-2">Screenshot do resultado no fornecedor:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${automationResult.screenshot}`}
                  alt="Screenshot do fornecedor"
                  className="w-full border border-dark-300"
                />
              </div>
            )}

            <button
              onClick={() => setAutomationResult(null)}
              className="mt-4 w-full btn-outline-gold py-3 text-xs tracking-wide uppercase"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
