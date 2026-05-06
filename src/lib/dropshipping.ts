import { prisma } from "@/lib/prisma";

interface DropshippingOrderItem {
  sku: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface DropshippingOrderPayload {
  external_order_id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping_address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  items: DropshippingOrderItem[];
  total: number;
  notes?: string;
}

async function getSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: "dropshipping_" } },
  });
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function sendOrderToDropshipping(orderId: string): Promise<{
  success: boolean;
  dropshippingOrderId?: string;
  error?: string;
}> {
  try {
    const settings = await getSettings();
    const apiUrl = settings["dropshipping_api_url"];
    const apiKey = settings["dropshipping_api_key"];
    const authType = settings["dropshipping_auth_type"] || "api_key";
    const orderEndpoint = settings["dropshipping_order_endpoint"] || "/orders";

    if (!apiUrl || !apiKey) {
      return { success: false, error: "Fornecedor não configurado" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) return { success: false, error: "Pedido não encontrado" };

    const payload: DropshippingOrderPayload = {
      external_order_id: order.id,
      customer: {
        name: order.shippingName,
        email: order.shippingEmail,
        phone: order.shippingPhone || "",
      },
      shipping_address: {
        street: order.shippingStreet,
        number: order.shippingNumber,
        complement: order.shippingComplement || undefined,
        neighborhood: order.shippingNeighborhood,
        city: order.shippingCity,
        state: order.shippingState,
        zip_code: order.shippingZip,
        country: "BR",
      },
      items: order.items.map((item) => ({
        sku: item.product.dropshippingSku || item.productId,
        product_id: item.product.dropshippingId || item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      notes: order.notes || undefined,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (authType === "bearer") {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (authType === "api_key") {
      headers["X-API-Key"] = apiKey;
    } else if (authType === "basic") {
      headers["Authorization"] = `Basic ${Buffer.from(apiKey).toString("base64")}`;
    }

    const response = await fetch(`${apiUrl}${orderEndpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Erro do fornecedor: ${response.status} - ${text}` };
    }

    const data = await response.json();
    const dropshippingOrderId = data.id || data.order_id || data.external_id || "created";

    await prisma.order.update({
      where: { id: orderId },
      data: {
        dropshippingOrderId,
        dropshippingStatus: "SENT",
        status: "PROCESSING",
      },
    });

    return { success: true, dropshippingOrderId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, error: msg };
  }
}

export async function testDropshippingConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const settings = await getSettings();
    const apiUrl = settings["dropshipping_api_url"];
    const apiKey = settings["dropshipping_api_key"];

    if (!apiUrl || !apiKey) {
      return { success: false, message: "URL e chave API são obrigatórios" };
    }

    const authType = settings["dropshipping_auth_type"] || "api_key";
    const headers: Record<string, string> = { Accept: "application/json" };

    if (authType === "bearer") headers["Authorization"] = `Bearer ${apiKey}`;
    else if (authType === "api_key") headers["X-API-Key"] = apiKey;
    else if (authType === "basic") {
      headers["Authorization"] = `Basic ${Buffer.from(apiKey).toString("base64")}`;
    }

    const response = await fetch(`${apiUrl}/health`, { headers });

    if (response.ok) return { success: true, message: "Conexão bem-sucedida!" };
    return { success: false, message: `Servidor respondeu com status ${response.status}` };
  } catch (error) {
    return { success: false, message: `Não foi possível conectar: ${error instanceof Error ? error.message : "erro"}` };
  }
}
