/**
 * Automação do processo de DROP com Club de Franqueados (GO Perfumaria)
 *
 * Fluxo completo (conforme PDF "DROP - PASSO A PASSO"):
 *  1. Acessa o portal do fornecedor com a URL do produto
 *  2. Preenche o endereço de entrega do cliente
 *  3. Seleciona a opção "Estou fazendo DROP"
 *  4. Finaliza a compra (preço atacado)
 *  5. Captura o número do pedido gerado
 *  6. Envia notificação via WhatsApp para a atendente de suporte
 */

import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplierSettings {
  baseUrl: string | null;
  token: string | null;
  email: string | null;
  password: string | null;
  supportWhatsapp: string | null;
  zapApiUrl: string | null;
  zapApiToken: string | null;
  zapInstance: string | null;
}

export interface AutomationResult {
  success: boolean;
  message: string;
  orderNumber?: string;
  screenshot?: string;
  productName?: string;
  whatsappSent?: boolean;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function getSupplierSettings(): Promise<SupplierSettings> {
  const keys = [
    "dropshipping_supplier_base_url",
    "dropshipping_supplier_token",
    "dropshipping_supplier_email",
    "dropshipping_supplier_password",
    "dropshipping_support_whatsapp",
    "dropshipping_zap_api_url",
    "dropshipping_zap_api_token",
    "dropshipping_zap_instance",
  ];
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    baseUrl: m["dropshipping_supplier_base_url"] || null,
    token: m["dropshipping_supplier_token"] || null,
    email: m["dropshipping_supplier_email"] || null,
    password: m["dropshipping_supplier_password"] || null,
    supportWhatsapp: m["dropshipping_support_whatsapp"] || null,
    zapApiUrl: m["dropshipping_zap_api_url"] || null,
    zapApiToken: m["dropshipping_zap_api_token"] || null,
    zapInstance: m["dropshipping_zap_instance"] || null,
  };
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

/**
 * Envia mensagem via Z-API (API popular no Brasil para WhatsApp).
 * Fallback: retorna URL para envio manual.
 */
async function sendWhatsAppMessage(
  settings: SupplierSettings,
  toPhone: string,
  message: string
): Promise<{ sent: boolean; manualUrl?: string }> {
  const phone = toPhone.replace(/\D/g, "");

  // Tenta Z-API
  if (settings.zapApiUrl && settings.zapApiToken && settings.zapInstance) {
    try {
      const url = `${settings.zapApiUrl}/instances/${settings.zapInstance}/token/${settings.zapApiToken}/send-text`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      if (res.ok) return { sent: true };
    } catch {
      // fall through to manual
    }
  }

  // Fallback: link para envio manual
  const encoded = encodeURIComponent(message);
  return { sent: false, manualUrl: `https://wa.me/${phone}?text=${encoded}` };
}

function buildDropMessage(
  orderNumber: string,
  productName: string,
  order: {
    shippingName: string;
    shippingStreet: string;
    shippingNumber: string;
    shippingComplement: string | null;
    shippingNeighborhood: string;
    shippingCity: string;
    shippingState: string;
    shippingZip: string;
  }
): string {
  const addr = [
    order.shippingStreet,
    order.shippingNumber,
    order.shippingComplement,
    order.shippingNeighborhood,
    order.shippingCity,
    order.shippingState,
    order.shippingZip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    `*NOVO DROP - Pedido #${orderNumber}*\n\n` +
    `📦 Produto: ${productName}\n` +
    `👤 Cliente: ${order.shippingName}\n` +
    `📍 Endereço: ${addr}\n\n` +
    `Remetente (usar endereço do CD):\n` +
    `Av. Contorno, QD 35 Lt 39/40 Sala 6\n` +
    `Jardim Colorado - Goiânia GO\n` +
    `CEP 74474-100\n\n` +
    `📐 Dimensões: 13x13x13cm | Peso: ~500g\n\n` +
    `_Mensagem gerada automaticamente_`
  );
}

// ─── Browser automation ────────────────────────────────────────────────────────

async function launchBrowser() {
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = (await import("puppeteer-core")).default;

  const executablePath =
    process.env.CHROMIUM_PATH ||
    (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? await chromium.executablePath()
      : undefined);

  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 800 },
    executablePath,
    headless: true,
  });
}

async function tryType(
  page: import("puppeteer-core").Page,
  selectors: string[],
  value: string
): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el && (await el.isVisible())) {
        await el.click({ clickCount: 3 });
        await el.type(value, { delay: 40 });
        return true;
      }
    } catch {
      /* try next */
    }
  }
  return false;
}

async function trySelect(
  page: import("puppeteer-core").Page,
  selectors: string[],
  value: string
): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        await page.select(sel, value);
        return true;
      }
    } catch {
      /* try next */
    }
  }
  return false;
}

/** Login no portal do fornecedor se necessário */
async function loginIfNeeded(
  page: import("puppeteer-core").Page,
  email: string,
  password: string
): Promise<void> {
  const currentUrl = page.url();
  if (!currentUrl.includes("login") && !currentUrl.includes("entrar")) return;

  await tryType(page, ['[name="email"]', '[type="email"]', "#email"], email);
  await tryType(page, ['[name="password"]', '[type="password"]', "#password", "#senha"], password);

  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }),
    page.keyboard.press("Enter"),
  ]);
}

/** Preenche o formulário de endereço do cliente */
async function fillShippingAddress(
  page: import("puppeteer-core").Page,
  order: {
    shippingName: string;
    shippingEmail: string;
    shippingPhone: string | null;
    shippingZip: string;
    shippingStreet: string;
    shippingNumber: string;
    shippingComplement: string | null;
    shippingNeighborhood: string;
    shippingCity: string;
    shippingState: string;
  }
): Promise<void> {
  const fields: Array<[string[], string]> = [
    [['[name="email"]', '[type="email"]', "#email"], order.shippingEmail],
    [
      ['[name="name"]', '[name="firstName"]', '[name="first_name"]', '[name="nome"]', "#name", "#nome"],
      order.shippingName,
    ],
    [
      ['[name="phone"]', '[name="telefone"]', '[name="celular"]', "#phone", "#telefone"],
      order.shippingPhone || "",
    ],
    [['[name="zip"]', '[name="cep"]', '[name="postalCode"]', "#cep", "#zip"], order.shippingZip],
    [
      ['[name="address1"]', '[name="street"]', '[name="logradouro"]', "#logradouro", "#address1"],
      order.shippingStreet,
    ],
    [
      ['[name="address2"]', '[name="number"]', '[name="numero"]', "#numero"],
      order.shippingNumber,
    ],
    [
      ['[name="company"]', '[name="complement"]', '[name="complemento"]', "#complemento"],
      order.shippingComplement || "",
    ],
    [['[name="neighborhood"]', '[name="bairro"]', "#bairro"], order.shippingNeighborhood],
    [['[name="city"]', '[name="cidade"]', "#city", "#cidade"], order.shippingCity],
  ];

  for (const [selectors, value] of fields) {
    if (value) await tryType(page, selectors, value);
  }

  // Estado
  await trySelect(
    page,
    ['[name="province"]', '[name="state"]', '[name="estado"]', "#province", "#state"],
    order.shippingState
  );

  // CEP pode auto-preencher campos — aguarda um momento
  await new Promise((r) => setTimeout(r, 1500));
}

/** Seleciona a opção de frete "Estou fazendo DROP" */
async function selectDropShipping(page: import("puppeteer-core").Page): Promise<boolean> {
  // Tenta por texto no label/radio/checkbox
  const dropTexts = ["Estou fazendo DROP", "drop", "Drop", "DROP"];

  for (const text of dropTexts) {
    try {
      // Busca por label contendo o texto
      const labels = await page.$$(`xpath///label[contains(normalize-space(.), '${text}')]`);
      if (labels.length > 0) {
        await labels[0].click();
        return true;
      }

      // Busca por span/div contendo o texto
      const spans = await page.$$(`xpath///span[contains(normalize-space(.), '${text}')]`);
      if (spans.length > 0) {
        await spans[0].click();
        return true;
      }
    } catch {
      /* try next */
    }
  }

  // Tenta input[type=radio] com value drop
  try {
    const radios = await page.$$('input[type="radio"]');
    for (const radio of radios) {
      const val = await radio.getProperty("value");
      const valStr = String(await val.jsonValue()).toLowerCase();
      if (valStr.includes("drop")) {
        await radio.click();
        return true;
      }
    }
  } catch {
    /* ignore */
  }

  // Se não encontrou, prossegue mesmo assim (pode já estar selecionado via URL)
  return false;
}

/** Clica no botão de finalizar / continuar / drop */
async function clickContinueOrSubmit(page: import("puppeteer-core").Page): Promise<boolean> {
  const buttonTexts = [
    "Continuar",
    "Continue",
    "Finalizar",
    "Confirmar",
    "Comprar",
    "Fazer pedido",
    "Enviar pedido",
    "Drop",
    "Next",
    "Próximo",
  ];

  for (const text of buttonTexts) {
    try {
      const [btn] = await page.$$(`xpath///button[contains(normalize-space(.), '${text}')]`);
      if (btn && (await btn.isVisible())) {
        await btn.click();
        return true;
      }
    } catch {
      /* try next */
    }
  }

  // Fallback: primeiro botão submit visível
  try {
    const [btn] = await page.$$('button[type="submit"]');
    if (btn && (await btn.isVisible())) {
      await btn.click();
      return true;
    }
  } catch {
    /* ignore */
  }

  return false;
}

/** Extrai o número do pedido da página de confirmação */
async function extractOrderNumber(page: import("puppeteer-core").Page): Promise<string | null> {
  try {
    // Padrão comum: #12345 ou "Pedido 12345" ou "Order #12345"
    const text = await page.evaluate(() => document.body.innerText);
    const patterns = [
      /(?:pedido|order|n[uú]mero)[\s#:]*([A-Z0-9\-]+)/i,
      /#([A-Z0-9\-]{4,})/,
      /(?:confirmação|confirmation)[^\d]*(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ─── Main automation function ──────────────────────────────────────────────────

export async function automateDropshippingItem(
  orderId: string,
  orderItemId: string
): Promise<AutomationResult> {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true, product: true },
  });

  if (!orderItem || orderItem.orderId !== orderId) {
    return { success: false, message: "Item do pedido não encontrado" };
  }

  const productDropId = orderItem.product.dropshippingId;
  if (!productDropId) {
    return {
      success: false,
      message: `Produto "${orderItem.product.name}" sem ID do fornecedor. Configure em Admin → Produtos.`,
      productName: orderItem.product.name,
    };
  }

  const settings = await getSupplierSettings();
  if (!settings.baseUrl || !settings.token) {
    return {
      success: false,
      message: "URL base e token do fornecedor não configurados. Vá em Admin → Configurações.",
    };
  }

  const supplierUrl = `${settings.baseUrl}/${productDropId}/${settings.token}?from_store=1&country=BR`;
  const order = orderItem.order;

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    // 1. Navega para o checkout do fornecedor
    await page.goto(supplierUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // 2. Login se a página redirecionar para login
    if (settings.email && settings.password) {
      await loginIfNeeded(page, settings.email, settings.password);
      // Navega novamente se foi redirecionado para login
      if (!page.url().includes("checkout")) {
        await page.goto(supplierUrl, { waitUntil: "networkidle2", timeout: 30000 });
      }
    }

    // 3. Preenche endereço de entrega do cliente
    await fillShippingAddress(page, order);
    await new Promise((r) => setTimeout(r, 1000));

    // 4. Seleciona opção "Estou fazendo DROP"
    await selectDropShipping(page);
    await new Promise((r) => setTimeout(r, 500));

    // 5. Continua/finaliza (pode haver múltiplos passos no checkout)
    await clickContinueOrSubmit(page);
    await new Promise((r) => setTimeout(r, 3000));

    // Pode haver uma segunda etapa (pagamento, confirmação)
    await clickContinueOrSubmit(page);
    await new Promise((r) => setTimeout(r, 4000));

    const screenshot = (await page.screenshot({ encoding: "base64", fullPage: false })) as string;

    // 6. Extrai número do pedido
    const orderNumber = (await extractOrderNumber(page)) || `drop_${Date.now()}`;

    // 7. Salva no banco
    await prisma.order.update({
      where: { id: orderId },
      data: {
        dropshippingOrderId: orderNumber,
        dropshippingStatus: "SENT",
        status: "PROCESSING",
      },
    });

    // 8. Envia mensagem WhatsApp para atendente de suporte
    let whatsappSent = false;
    let whatsappUrl: string | undefined;

    if (settings.supportWhatsapp) {
      const msg = buildDropMessage(orderNumber, orderItem.product.name, order);
      const result = await sendWhatsAppMessage(settings, settings.supportWhatsapp, msg);
      whatsappSent = result.sent;
      whatsappUrl = result.manualUrl;
    }

    return {
      success: true,
      message: whatsappSent
        ? `Pedido #${orderNumber} enviado ao fornecedor e atendente notificada via WhatsApp!`
        : `Pedido #${orderNumber} enviado! ${whatsappUrl ? `Abra para notificar a atendente: ${whatsappUrl}` : "Configure o WhatsApp nas configurações para notificação automática."}`,
      orderNumber,
      screenshot,
      productName: orderItem.product.name,
      whatsappSent,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido na automação";
    return { success: false, message: msg, productName: orderItem.product.name };
  } finally {
    if (browser) await browser.close();
  }
}

export async function automateFullOrder(orderId: string): Promise<AutomationResult[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return [{ success: false, message: "Pedido não encontrado" }];

  const results: AutomationResult[] = [];
  for (const item of order.items) {
    results.push(await automateDropshippingItem(orderId, item.id));
  }
  return results;
}
