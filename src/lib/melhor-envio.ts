/**
 * Integração com Melhor Envio para geração automática de etiquetas de postagem.
 *
 * Fluxo:
 *  1. Adiciona envio ao carrinho (POST /api/v2/me/cart)
 *  2. Confirma/compra (POST /api/v2/me/checkout)
 *  3. Gera a etiqueta (POST /api/v2/me/shipment/generate)
 *  4. Retorna o link para impressão (GET /api/v2/me/shipment/print)
 */

import { prisma } from "@/lib/prisma";

// ─── Endereço do CD do fornecedor (remetente) ─────────────────────────────────

const SENDER_ADDRESS = {
  name: "GO Perfumaria",
  phone: "6299999999",
  email: "logistica@goperfumaria.com.br",
  address: "Avenida Contorno",
  complement: "Sala 6",
  number: "s/n",
  district: "Jardim Colorado",
  city: "Goiânia",
  state_abbr: "GO",
  country_id: "BR",
  postal_code: "74474100",
};

// Dimensões padrão dos perfumes
const DEFAULT_PACKAGE = {
  weight: 0.5,  // kg
  width: 13,    // cm
  height: 13,   // cm
  length: 13,   // cm
};

// ─── Tipos Melhor Envio ───────────────────────────────────────────────────────

interface MelhorEnvioAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state_abbr: string;
  country_id: string;
  postal_code: string;
}

interface CartPayload {
  service: number;
  agency?: number;
  from: MelhorEnvioAddress;
  to: MelhorEnvioAddress;
  products: Array<{ name: string; quantity: number; unitary_value: number }>;
  volumes: Array<{ weight: number; width: number; height: number; length: number }>;
  options: {
    insurance_value: number;
    receipt: boolean;
    own_hand: boolean;
    non_commercial: boolean;
    invoice?: { key: string };
  };
  tag: string;
}

interface LabelResult {
  success: boolean;
  labelUrl?: string;
  trackingCode?: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getMelhorEnvioToken(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: "melhorenvio_token" } });
  return row?.value || null;
}

async function getMelhorEnvioSettings(): Promise<{
  token: string | null;
  sandbox: boolean;
  defaultService: number;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
}> {
  const keys = [
    "melhorenvio_token",
    "melhorenvio_sandbox",
    "melhorenvio_service",
    "melhorenvio_sender_name",
    "melhorenvio_sender_phone",
    "melhorenvio_sender_email",
  ];
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    token: m["melhorenvio_token"] || null,
    sandbox: m["melhorenvio_sandbox"] === "true",
    // Serviço padrão: 1 = Correios PAC, 2 = Correios SEDEX, 3 = Jadlog .Package
    defaultService: parseInt(m["melhorenvio_service"] || "1"),
    senderName: m["melhorenvio_sender_name"] || SENDER_ADDRESS.name,
    senderPhone: m["melhorenvio_sender_phone"] || SENDER_ADDRESS.phone,
    senderEmail: m["melhorenvio_sender_email"] || SENDER_ADDRESS.email,
  };
}

function buildApiUrl(sandbox: boolean, path: string): string {
  const base = sandbox
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";
  return `${base}${path}`;
}

async function melhorEnvioRequest<T>(
  method: string,
  path: string,
  token: string,
  sandbox: boolean,
  body?: unknown
): Promise<T> {
  const res = await fetch(buildApiUrl(sandbox, path), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Maison Parfums (suporte@maisonparfums.com.br)",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Melhor Envio [${res.status}]: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Funções principais ───────────────────────────────────────────────────────

export async function generateShippingLabel(orderId: string): Promise<LabelResult> {
  const settings = await getMelhorEnvioSettings();

  if (!settings.token) {
    return {
      success: false,
      error: "Token do Melhor Envio não configurado. Vá em Admin → Configurações → Etiquetas.",
    };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order) return { success: false, error: "Pedido não encontrado" };

  const toAddress: MelhorEnvioAddress = {
    name: order.shippingName,
    phone: (order.shippingPhone || "11999999999").replace(/\D/g, ""),
    email: order.shippingEmail,
    address: order.shippingStreet,
    number: order.shippingNumber,
    complement: order.shippingComplement || "",
    district: order.shippingNeighborhood,
    city: order.shippingCity,
    state_abbr: order.shippingState,
    country_id: "BR",
    postal_code: order.shippingZip.replace(/\D/g, ""),
  };

  const fromAddress: MelhorEnvioAddress = {
    name: settings.senderName,
    phone: settings.senderPhone.replace(/\D/g, ""),
    email: settings.senderEmail,
    address: SENDER_ADDRESS.address,
    number: SENDER_ADDRESS.number,
    complement: SENDER_ADDRESS.complement,
    district: SENDER_ADDRESS.district,
    city: SENDER_ADDRESS.city,
    state_abbr: SENDER_ADDRESS.state_abbr,
    country_id: SENDER_ADDRESS.country_id,
    postal_code: SENDER_ADDRESS.postal_code,
  };

  const products = order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitary_value: item.price,
  }));

  const cartPayload: CartPayload = {
    service: settings.defaultService,
    from: fromAddress,
    to: toAddress,
    products,
    volumes: [{ ...DEFAULT_PACKAGE }],
    options: {
      insurance_value: order.total,
      receipt: false,
      own_hand: false,
      non_commercial: true,
    },
    tag: `pedido-${orderId.slice(0, 8)}`,
  };

  try {
    // 1. Adiciona ao carrinho
    const cartItem = await melhorEnvioRequest<{ id: string }>(
      "POST",
      "/api/v2/me/cart",
      settings.token,
      settings.sandbox,
      cartPayload
    );

    // 2. Checkout (compra a etiqueta)
    await melhorEnvioRequest(
      "POST",
      "/api/v2/me/checkout",
      settings.token,
      settings.sandbox,
      { orders: [cartItem.id] }
    );

    // 3. Gera a etiqueta
    await melhorEnvioRequest(
      "POST",
      "/api/v2/me/shipment/generate",
      settings.token,
      settings.sandbox,
      { orders: [cartItem.id] }
    );

    // 4. Pega URL de impressão
    const print = await melhorEnvioRequest<{ url: string }>(
      "GET",
      `/api/v2/me/shipment/print?orders[]=${cartItem.id}&mode=public`,
      settings.token,
      settings.sandbox
    );

    // Salva o código de rastreio no pedido
    const trackingCode = `ME-${cartItem.id.slice(0, 10).toUpperCase()}`;
    await prisma.order.update({
      where: { id: orderId },
      data: { trackingCode },
    });

    return {
      success: true,
      labelUrl: print.url,
      trackingCode,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar etiqueta";
    return { success: false, error: msg };
  }
}

export async function calculateShipping(
  destPostalCode: string,
  totalValue: number
): Promise<Array<{ service: string; price: number; days: number }>> {
  const token = await getMelhorEnvioToken();
  if (!token) return [];

  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["melhorenvio_sandbox"] } },
    });
    const sandbox = rows.find((r) => r.key === "melhorenvio_sandbox")?.value === "true";

    const result = await melhorEnvioRequest<
      Array<{ name: string; price: string; delivery_time: number; error?: string }>
    >(
      "POST",
      "/api/v2/me/shipment/calculate",
      token,
      sandbox,
      {
        from: { postal_code: SENDER_ADDRESS.postal_code },
        to: { postal_code: destPostalCode.replace(/\D/g, "") },
        package: DEFAULT_PACKAGE,
        options: { insurance_value: totalValue, receipt: false, own_hand: false },
        services: "1,2,3,4,17",
      }
    );

    return result
      .filter((s) => !s.error && s.price)
      .map((s) => ({
        service: s.name,
        price: parseFloat(s.price),
        days: s.delivery_time,
      }))
      .sort((a, b) => a.price - b.price);
  } catch {
    return [];
  }
}
