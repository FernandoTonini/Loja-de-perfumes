/**
 * Script de importação de produtos do portal franqueadosclubgo.com.br
 * Faz login, percorre todas as categorias, extrai produtos com estoque
 * e salva no banco de dados da loja.
 *
 * Uso: npx ts-node --project tsconfig.json -e esModuleInterop scripts/import-supplier-products.ts
 */

import puppeteer, { Page } from "puppeteer";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.join(process.cwd(), "prisma", "dev.db")}` } },
});

// ─── Configuração ──────────────────────────────────────────────────────────────

const SUPPLIER_URL = "https://franqueadosclubgo.com.br";
const SUPPLIER_EMAIL = process.env.SUPPLIER_EMAIL || "fernandotonini444@gmail.com";
const SUPPLIER_PASSWORD = process.env.SUPPLIER_PASSWORD || "Tonini27!";

// Margem de lucro: preço de venda = preço de custo × MARKUP
const MARKUP = 2.2;

// Categorias do fornecedor → slug da nossa loja
const CATEGORY_MAP: Record<string, string> = {
  "perfumes-masculinos": "masculino",
  "perfumes-femininos": "feminino",
  "perfumes-arabes1": "arabe",
  "kits": "kits",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SupplierProduct {
  name: string;
  brand: string;
  ml: number | null;
  gender: string;
  priceWholesale: number;
  priceRetail: number;
  inStock: boolean;
  images: string[];
  description: string;
  slug: string;
  categorySlug: string;
  dropshippingId: string | null; // variant ID para a URL de checkout
  checkoutUrl: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractMl(name: string): number | null {
  const m = name.match(/(\d+)\s*ml/i);
  return m ? parseInt(m[1]) : null;
}

function extractBrand(name: string): string {
  // Tenta extrair a marca do nome do produto
  const knownBrands = [
    "Rabanne", "Dior", "Chanel", "Tom Ford", "Creed", "YSL", "Yves Saint Laurent",
    "Giorgio Armani", "Armani", "Prada", "Versace", "Gucci", "Calvin Klein",
    "Dolce & Gabbana", "D&G", "Burberry", "Hugo Boss", "Boss", "Montblanc",
    "Givenchy", "Hermès", "Hermes", "Jean Paul Gaultier", "Issey Miyake",
    "Davidoff", "Carolina Herrera", "Valentino", "Bvlgari", "Bulgari",
    "Bleu de Chanel", "Narciso Rodriguez", "Jimmy Choo", "Marc Jacobs",
    "Michael Kors", "Coach", "Moschino", "Ferrari", "Azzaro", "Lattafa",
    "Rasasi", "Al Haramain", "Ajmal", "Dunhill", "Diesel", "Lacoste",
    "Abercrombie", "Paco Rabanne",
  ];
  for (const brand of knownBrands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  // Fallback: primeira palavra(s) antes do traço
  const parts = name.split(" - ");
  if (parts.length > 1) return parts[0].trim().split(" ").slice(-1)[0];
  return name.split(" ")[0];
}

function detectGender(name: string, categorySlug: string): string {
  const lower = name.toLowerCase();
  if (categorySlug === "feminino" || lower.includes("feminino") || lower.includes("feminin")) return "FEMININO";
  if (categorySlug === "masculino" || lower.includes("masculino") || lower.includes("masculin")) return "MASCULINO";
  return "UNISEX";
}

function parsePrice(text: string): number {
  const cleaned = text.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

// ─── Scraping ─────────────────────────────────────────────────────────────────

async function login(page: Page): Promise<void> {
  console.log("🔐 Fazendo login no fornecedor...");
  await page.goto(`${SUPPLIER_URL}/account/login/`, { waitUntil: "networkidle2", timeout: 30000 });

  await page.type('input[type="email"], input[name="email"]', SUPPLIER_EMAIL, { delay: 30 });
  await page.type('input[type="password"], input[name="password"]', SUPPLIER_PASSWORD, { delay: 30 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }),
    page.click('button[type="submit"], input[type="submit"]'),
  ]);

  const url = page.url();
  if (url.includes("login")) {
    throw new Error("Login falhou — verifique as credenciais");
  }
  console.log("✅ Login feito com sucesso!");
}

async function scrapeProductPage(
  page: Page,
  productUrl: string,
  categorySlug: string
): Promise<SupplierProduct | null> {
  try {
    await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 25000 });

    // Rolar a página para forçar o carregamento das imagens lazy-load
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise((r) => setTimeout(r, 1500));

    const data = await page.evaluate((catSlug: string) => {
      // Nome
      const nameEl = document.querySelector("h1, .product-title, [class*='product__title'], [class*='product-name']");
      const name = nameEl?.textContent?.trim() || "";

      // Preço — busca por qualquer elemento com R$ no texto
      let priceText = "0";
      const priceSelectors = [
        ".price__current", ".price-item--sale", ".price-item--regular",
        ".price-item", ".product-price", "[class*='product__price']",
        "[class*='price']", ".money", ".js-price-display",
      ];
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent && el.textContent.includes("R$")) {
          priceText = el.textContent.trim();
          break;
        }
      }
      // Fallback: procura "R$" em qualquer texto da página
      if (priceText === "0") {
        const allText = document.body.innerText;
        const match = allText.match(/R\$\s*[\d.,]+/);
        if (match) priceText = match[0];
      }

      // Preço original (riscado)
      const comparePriceEl = document.querySelector(".price__compare, .price-item--regular, s");
      const comparePriceText = comparePriceEl?.textContent?.trim() || "";

      // Estoque
      const pageText = document.body.innerText.toLowerCase();
      const soldOutBadge = !!document.querySelector(".badge--soldout, [class*='sold-out'], [class*='esgotado']");
      const hasEsgotado = pageText.includes("esgotado") || pageText.includes("sem estoque") || pageText.includes("indisponível");
      const addToCartBtn = document.querySelector('button[name="add"], .btn--add-to-cart, [class*="add-to-cart"], .js-buy-btn, [class*="buy-btn"], button[type="submit"]');
      const btnDisabled = addToCartBtn ? (addToCartBtn as HTMLButtonElement).disabled : false;
      const inStock = !soldOutBadge && !hasEsgotado && !btnDisabled;

      // Imagens — múltiplas estratégias para Tienda Nube
      const imgSet = new Set<string>();

      // 1. Imagens em <img> com src real (não placeholder)
      document.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("data-zoom-image") ||
                    img.getAttribute("data-src") ||
                    img.getAttribute("data-lazy-src") ||
                    img.getAttribute("data-original") ||
                    img.src || "";
        const cleaned = src.startsWith("//") ? `https:${src}` : src;
        if (
          cleaned.startsWith("http") &&
          !cleaned.includes("placeholder") &&
          !cleaned.includes("empty") &&
          !cleaned.includes("icon") &&
          !cleaned.includes("logo") &&
          !cleaned.includes("avatar") &&
          (cleaned.includes("mitiendanube") || cleaned.includes("cloudinary") ||
           cleaned.includes("shopify") || cleaned.includes("cdn") || cleaned.includes("image"))
        ) {
          imgSet.add(cleaned);
        }
      });

      // 2. Srcset attributes
      document.querySelectorAll("img[srcset], source[srcset]").forEach((el) => {
        const srcset = el.getAttribute("srcset") || "";
        const parts = srcset.split(",").map((s) => s.trim().split(" ")[0]).filter(Boolean);
        parts.forEach((src) => {
          const cleaned = src.startsWith("//") ? `https:${src}` : src;
          if (cleaned.startsWith("http") && !cleaned.includes("placeholder") && !cleaned.includes("empty")) {
            imgSet.add(cleaned);
          }
        });
      });

      // 3. JSON-LD ou meta og:image
      const metaImg = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
      if (metaImg && !metaImg.includes("placeholder")) imgSet.add(metaImg);

      // 4. Script tags com JSON de produto (Tienda Nube / Shopify)
      document.querySelectorAll("script").forEach((script) => {
        const text = script.textContent || "";
        const matches = text.match(/https?:\/\/[^"' ]+\.(jpg|jpeg|png|webp)[^"' ]*/gi) || [];
        matches.forEach((url) => {
          if (!url.includes("placeholder") && !url.includes("empty") && !url.includes("icon")) {
            imgSet.add(url);
          }
        });
      });

      const imgs = Array.from(imgSet).slice(0, 4);

      // Descrição
      const descEl = document.querySelector(".product__description, [class*='product-description'], .rte, [class*='description']");
      const description = descEl?.textContent?.trim() || "";

      // Variant ID (para URL de checkout)
      let shopifyVariantId: string | null = null;
      try {
        const scriptTags = Array.from(document.querySelectorAll("script"));
        for (const script of scriptTags) {
          const content = script.textContent || "";
          // Tienda Nube usa "product_id" ou "variant_id"
          const idMatch = content.match(/"(?:variant_id|product_id|id)"\s*:\s*(\d{7,})/);
          if (idMatch) {
            shopifyVariantId = idMatch[1];
            break;
          }
        }
        // Fallback: busca direto no HTML por input hidden ou data-variant-id
        if (!shopifyVariantId) {
          const variantEl = document.querySelector('[name="id"], [data-variant-id], [data-product-id]');
          shopifyVariantId = variantEl?.getAttribute("value") || variantEl?.getAttribute("data-variant-id") || variantEl?.getAttribute("data-product-id") || null;
        }
      } catch { /* ignore */ }

      return {
        name,
        priceText,
        comparePriceText,
        inStock,
        imgs,
        description: description.slice(0, 800),
        variantId: shopifyVariantId,
        categorySlug: catSlug,
      };
    }, categorySlug);

    if (!data.name) return null;

    const priceWholesale = parsePrice(data.priceText);
    const ml = extractMl(data.name);
    const brand = extractBrand(data.name);
    const gender = detectGender(data.name, categorySlug);
    const slug = slugify(data.name);
    const priceRetail = Math.ceil(priceWholesale * MARKUP);

    // URL de checkout do fornecedor (precisa do token que o usuário configurará)
    const checkoutBase = "https://franqueadosclubgo.com.br/checkout/v3/start";
    const token = "2cd7c96fc03c9a95dff9002a20f4fe534f1c7bb4";
    const checkoutUrl = data.variantId
      ? `${checkoutBase}/${data.variantId}/${token}?from_store=1&country=BR`
      : null;

    return {
      name: data.name,
      brand,
      ml,
      gender,
      priceWholesale,
      priceRetail,
      inStock: data.inStock,
      images: data.imgs,
      description: data.description || `${data.name} - Perfume importado de alta qualidade.`,
      slug,
      categorySlug,
      dropshippingId: data.variantId,
      checkoutUrl,
    };
  } catch (err) {
    console.warn(`  ⚠ Erro ao raspar ${productUrl}:`, (err as Error).message);
    return null;
  }
}

async function scrapeCategory(
  page: Page,
  categoryPath: string,
  ourCategorySlug: string
): Promise<SupplierProduct[]> {
  const products: SupplierProduct[] = [];
  let pageNum = 1;

  while (true) {
    const url = `${SUPPLIER_URL}/${categoryPath}/?page=${pageNum}`;
    console.log(`\n📂 Categoria ${categoryPath} — página ${pageNum}...`);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });

    const productLinks: string[] = await page.evaluate((baseUrl: string) => {
      const cards = document.querySelectorAll('a[href*="/produtos/"]');
      const hrefs = Array.from(cards)
        .map((a) => (a as HTMLAnchorElement).href)
        // Remove variantes (?variant=...) e filtros (?brand=...)
        .map((href) => href.split("?")[0])
        // Remove links que são só "/"
        .filter((href) => href.includes("/produtos/") && href.split("/produtos/")[1].length > 1)
        // Deduplica
        .filter((href, idx, arr) => arr.indexOf(href) === idx);
      return hrefs;
    }, SUPPLIER_URL);

    if (productLinks.length === 0) break;

    console.log(`  Encontrados ${productLinks.length} produtos`);

    for (const link of productLinks) {
      process.stdout.write(`  → ${link.split("/produtos/")[1]?.replace("/", "")} ... `);
      const product = await scrapeProductPage(page, link, ourCategorySlug);
      if (product) {
        const status = product.inStock ? "✅ em estoque" : "🔴 esgotado";
        console.log(status);
        products.push(product);
      } else {
        console.log("ignorado");
      }
    }

    // Verifica se há próxima página
    const hasNext = await page.evaluate(() => {
      return !!document.querySelector('a[href*="page="], .pagination__next, [rel="next"]');
    });
    if (!hasNext) break;
    pageNum++;
  }

  return products;
}

// ─── Salvar no banco ──────────────────────────────────────────────────────────

async function ensureCategories(): Promise<Record<string, string>> {
  const categoryDefs = [
    { slug: "masculino", name: "Masculino", description: "Fragrâncias masculinas importadas" },
    { slug: "feminino", name: "Feminino", description: "Fragrâncias femininas importadas" },
    { slug: "unissex", name: "Unissex", description: "Fragrâncias para todos" },
    { slug: "arabe", name: "Perfumes Árabes", description: "Fragrâncias árabes exclusivas" },
    { slug: "kits", name: "Kits", description: "Kits presenteáveis" },
  ];

  const idMap: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    idMap[cat.slug] = created.id;
  }
  return idMap;
}

async function saveProduct(product: SupplierProduct, categoryId: string): Promise<void> {
  const slug = product.slug || slugify(product.name);
  const images = JSON.stringify(product.images.length > 0 ? product.images : [
    "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600",
  ]);

  await prisma.product.upsert({
    where: { slug },
    update: {
      name: product.name,
      price: product.priceRetail,
      comparePrice: product.priceRetail * 1.15,
      images,
      brand: product.brand,
      ml: product.ml,
      gender: product.gender,
      inStock: product.inStock,
      dropshippingId: product.dropshippingId,
      categoryId,
    },
    create: {
      name: product.name,
      slug,
      description: product.description || `${product.name}. Perfume importado original com qualidade garantida.`,
      price: product.priceRetail,
      comparePrice: product.priceRetail * 1.15,
      images,
      categoryId,
      brand: product.brand,
      ml: product.ml,
      gender: product.gender,
      inStock: product.inStock,
      featured: false,
      dropshippingId: product.dropshippingId,
      dropshippingSku: product.dropshippingId,
    },
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🚀 Iniciando importação de produtos do fornecedor...\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-certificate-errors",
      "--ignore-ssl-errors",
    ],
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    // Login
    await login(page);

    // Garante categorias no banco
    const categoryIds = await ensureCategories();

    const allProducts: SupplierProduct[] = [];

    // Raspa cada categoria
    for (const [supplierSlug, ourSlug] of Object.entries(CATEGORY_MAP)) {
      const products = await scrapeCategory(page, supplierSlug, ourSlug);
      allProducts.push(...products);
    }

    // Salva no banco
    console.log(`\n💾 Salvando ${allProducts.length} produtos no banco...`);
    let saved = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;

    for (const product of allProducts) {
      const catSlug = product.categorySlug === "masculino" || product.categorySlug === "feminino"
        ? product.categorySlug
        : product.categorySlug === "arabe" ? "arabe"
        : product.gender === "MASCULINO" ? "masculino"
        : product.gender === "FEMININO" ? "feminino"
        : "unissex";

      const categoryId = categoryIds[catSlug] || categoryIds["unissex"];
      await saveProduct(product, categoryId);
      saved++;
      if (product.inStock) inStockCount++;
      else outOfStockCount++;
    }

    // Atualiza configurações do WhatsApp e fornecedor no banco
    const settingsToUpsert = [
      { key: "dropshipping_supplier_base_url", value: "https://franqueadosclubgo.com.br/checkout/v3/start" },
      { key: "dropshipping_supplier_token", value: "2cd7c96fc03c9a95dff9002a20f4fe534f1c7bb4" },
      { key: "dropshipping_supplier_email", value: SUPPLIER_EMAIL },
      { key: "dropshipping_supplier_password", value: SUPPLIER_PASSWORD },
      { key: "dropshipping_support_whatsapp", value: "5562992903003" },
    ];

    for (const s of settingsToUpsert) {
      await prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      });
    }

    console.log("\n✨ Importação concluída!");
    console.log(`   Total importado : ${saved}`);
    console.log(`   Em estoque      : ${inStockCount} ✅`);
    console.log(`   Esgotados       : ${outOfStockCount} 🔴`);
    console.log("\n⚙️  Configurações do fornecedor salvas no banco.");
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
