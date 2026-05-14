/**
 * Importa produtos do site PÚBLICO goperfumaria.com.br
 * - Fotos profissionais (fundo branco, alta resolução)
 * - Preços de varejo (já adequados para o consumidor final)
 * - Sem necessidade de login
 *
 * Mantém os IDs do fornecedor (franqueadosclubgo.com.br) para a automação do drop.
 */

import puppeteer, { Page, Browser } from "puppeteer";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.join(process.cwd(), "prisma", "dev.db")}` } },
});

const PUBLIC_SITE = "https://goperfumaria.com.br";
const SUPPLIER_SITE = "https://franqueadosclubgo.com.br";

// Categorias (slug do site público → slug da nossa loja)
const CATEGORIES: Array<[string, string]> = [
  ["perfumes-masculinos", "masculino"],
  ["perfumes-femininos", "feminino"],
  ["perfumes-arabes", "arabe"],
  ["kits", "kits"],
];

interface Product {
  name: string;
  brand: string;
  ml: number | null;
  gender: string;
  price: number;
  comparePrice: number | null;
  inStock: boolean;
  images: string[];
  description: string;
  slug: string;
  categorySlug: string;
  dropshippingId: string | null;
  topNotes: string | null;
  heartNotes: string | null;
  baseNotes: string | null;
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
  const brands = [
    "Rabanne", "Paco Rabanne", "Dior", "Chanel", "Tom Ford", "Creed",
    "Yves Saint Laurent", "Saint Laurent", "YSL", "Lancôme", "Lancome",
    "Carolina Herrera", "Hugo Boss", "Versace", "Gucci", "Prada",
    "Giorgio Armani", "Armani", "Calvin Klein", "Dolce & Gabbana", "D&G",
    "Burberry", "Montblanc", "Givenchy", "Hermès", "Jean Paul Gaultier",
    "Issey Miyake", "Davidoff", "Valentino", "Bvlgari", "Lattafa",
    "Rasasi", "Al Haramain", "Al Wataniah", "Ajmal", "Maison Alhambra",
    "Armaf", "Dunhill", "Diesel", "Lacoste", "Azzaro", "Britney Spears",
    "La Rive", "Ciclo", "Pokoloka", "Jacques Bogart", "David Beckham",
    "ASSALA", "Assala", "Orientica", "Marc Jacobs", "Coach", "Moschino",
  ];
  for (const brand of brands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return name.split(" ")[0];
}

function detectGender(name: string, catSlug: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("feminino") || lower.includes("feminin") || catSlug === "feminino") return "FEMININO";
  if (lower.includes("masculino") || lower.includes("masculin") || catSlug === "masculino") return "MASCULINO";
  if (lower.includes("unissex") || lower.includes("unisex")) return "UNISEX";
  return "UNISEX";
}

function parsePrice(text: string): number {
  // Formato brasileiro: R$ 1.234,56
  const cleaned = text.replace(/[^\d,.]/g, "");
  // Remove pontos de milhar, troca vírgula por ponto
  const normalized = cleaned.replace(/\.(?=\d{3})/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

// ─── Mapeia IDs do fornecedor (do banco existente) ─────────────────────────────

async function getSupplierIds(): Promise<Map<string, string>> {
  const products = await prisma.product.findMany({
    where: { dropshippingId: { not: null } },
    select: { slug: true, dropshippingId: true },
  });
  const map = new Map<string, string>();
  for (const p of products) {
    if (p.dropshippingId) map.set(p.slug, p.dropshippingId);
  }
  return map;
}

// ─── Scraping ─────────────────────────────────────────────────────────────────

async function scrapeProductPage(
  page: Page,
  productUrl: string,
  categorySlug: string
): Promise<Product | null> {
  try {
    await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 25000 });

    // Forçar lazy load das imagens
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 2000));

    const data = await page.evaluate((catSlug: string) => {
      const nameEl = document.querySelector("h1");
      const name = nameEl?.textContent?.trim() || "";

      // Preço — IMPORTANTE: ignorar banners como "frete grátis acima de R$499"
      // Preços reais têm formato R$X,XX (com vírgula decimal). Banners costumam não ter.
      const allText = document.body.innerText;
      let priceText = "";
      let comparePriceText = "";

      // 1. Tenta extrair de JSON-LD (estrutura de Produto)
      try {
        const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of ldScripts) {
          const json = JSON.parse(script.textContent || "{}");
          const items = Array.isArray(json) ? json : [json];
          for (const item of items) {
            if (item["@type"] === "Product" && item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offer.price) {
                priceText = `R$${offer.price}`;
                break;
              }
            }
          }
          if (priceText) break;
        }
      } catch { /* fallback */ }

      // 2. Fallback: busca preços com vírgula decimal (R$XXX,XX) — formato real
      if (!priceText) {
        // Restringe a busca à área PRINCIPAL do produto (não rodapé, não recomendados)
        const mainArea = document.querySelector(
          ".product, .product-page, [class*='product-detail'], main, .container"
        ) || document.body;
        const mainText = (mainArea as HTMLElement).innerText || allText;

        // Pega TODOS preços com vírgula decimal
        const realPrices = mainText.match(/R\$\s*\d{1,4}(?:\.\d{3})*,\d{2}/g) || [];

        // Conta a frequência de cada preço (descontados, originais, parcelados)
        const priceCount = new Map<string, number>();
        const priceValues = new Map<string, number>();

        for (const p of realPrices) {
          const num = parseFloat(p.replace(/[^\d,]/g, "").replace(",", "."));
          if (num >= 50 && num <= 5000) {
            priceCount.set(p, (priceCount.get(p) || 0) + 1);
            priceValues.set(p, num);
          }
        }

        if (priceCount.size > 0) {
          // Ordena por: 1) maior valor (preço cheio) primeiro
          const sorted = Array.from(priceCount.entries())
            .map(([text, count]) => ({ text, count, value: priceValues.get(text)! }))
            .sort((a, b) => b.value - a.value); // Maior valor primeiro

          // O preço "regular" é o segundo maior (após o desconto e antes do Pix)
          // Ou o primeiro se só houver um preço
          if (sorted.length >= 2) {
            // Pega o preço do MEIO (preço com desconto principal, não Pix)
            const middle = Math.floor(sorted.length / 2);
            priceText = sorted[middle].text;
            comparePriceText = sorted[0].text; // O maior é o "de"
          } else {
            priceText = sorted[0].text;
          }
        }
      }

      // 3. Preço comparativo via <s> (strikethrough)
      if (!comparePriceText) {
        const compareEl = document.querySelector("s, del");
        if (compareEl && compareEl.textContent && compareEl.textContent.includes("R$")) {
          const m = compareEl.textContent.match(/R\$\s*\d{1,4}(?:\.\d{3})*,\d{2}/);
          if (m) comparePriceText = m[0];
        }
      }

      // Estoque
      const pageText = allText.toLowerCase();
      const soldOutBadge = !!document.querySelector(".badge--soldout, [class*='sold-out'], [class*='esgotado']");
      const hasEsgotado = pageText.includes("esgotado") || pageText.includes("sem estoque") || pageText.includes("indisponível");
      const addBtn = document.querySelector('button[name="add"], .btn--add-to-cart, [class*="add-to-cart"], .js-buy-btn');
      const btnDisabled = addBtn ? (addBtn as HTMLButtonElement).disabled : false;
      const inStock = !soldOutBadge && !hasEsgotado && !btnDisabled;

      // Imagens — múltiplas estratégias
      const imgSet = new Set<string>();

      // 1. <img> com data-src ou src
      document.querySelectorAll("img").forEach((img) => {
        const candidates = [
          img.getAttribute("data-zoom-image"),
          img.getAttribute("data-src"),
          img.getAttribute("data-lazy-src"),
          img.getAttribute("data-original"),
          img.src,
        ].filter(Boolean) as string[];

        for (const c of candidates) {
          const cleaned = c.startsWith("//") ? `https:${c}` : c;
          if (
            cleaned.startsWith("http") &&
            !cleaned.includes("placeholder") &&
            !cleaned.includes("empty") &&
            !cleaned.includes("icon") &&
            !cleaned.includes("logo") &&
            !cleaned.includes("avatar") &&
            cleaned.includes("mitiendanube")
          ) {
            // Pega versão maior se for thumbnail
            const big = cleaned.replace(/-\d+-\d+\./, "-1024-1024.");
            imgSet.add(big);
          }
        }
      });

      // 2. srcset
      document.querySelectorAll("[srcset]").forEach((el) => {
        const srcset = el.getAttribute("srcset") || "";
        const urls = srcset.split(",").map((s) => s.trim().split(" ")[0]).filter(Boolean);
        urls.forEach((u) => {
          const cleaned = u.startsWith("//") ? `https:${u}` : u;
          if (cleaned.startsWith("http") && cleaned.includes("mitiendanube") && !cleaned.includes("placeholder")) {
            imgSet.add(cleaned);
          }
        });
      });

      // 3. og:image
      const og = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
      if (og && og.includes("http")) imgSet.add(og);

      // 4. Scripts JSON
      document.querySelectorAll("script").forEach((script) => {
        const text = script.textContent || "";
        const matches = text.match(/https?:\/\/[^"' ]*mitiendanube[^"' ]*\.(jpg|jpeg|png|webp)[^"' ]*/gi) || [];
        matches.forEach((url) => {
          if (!url.includes("placeholder") && !url.includes("empty")) {
            imgSet.add(url);
          }
        });
      });

      const imgs = Array.from(imgSet).slice(0, 5);

      // Descrição
      const descEls = document.querySelectorAll(".product__description, [class*='product-description'], .js-product-description, .rte");
      let description = "";
      descEls.forEach((el) => {
        if (el.textContent && el.textContent.length > description.length) {
          description = el.textContent.trim();
        }
      });

      // Notas olfativas (top, heart, base) - busca em headings/labels
      let topNotes = "";
      let heartNotes = "";
      let baseNotes = "";
      const fullText = (description + " " + allText).toLowerCase();

      const topMatch = fullText.match(/notas?\s+(?:de\s+)?topo[:\s-]+([^.\n]{5,200})/i);
      if (topMatch) topNotes = topMatch[1].trim();
      const heartMatch = fullText.match(/notas?\s+(?:de\s+)?cora(?:c|ç)(?:a|ã)o[:\s-]+([^.\n]{5,200})/i);
      if (heartMatch) heartNotes = heartMatch[1].trim();
      const baseMatch = fullText.match(/notas?\s+(?:de\s+)?fundo[:\s-]+([^.\n]{5,200})/i);
      if (baseMatch) baseNotes = baseMatch[1].trim();

      // Variant ID (Tienda Nube)
      let variantId: string | null = null;
      try {
        const scripts = Array.from(document.querySelectorAll("script"));
        for (const s of scripts) {
          const t = s.textContent || "";
          const m = t.match(/"(?:variant_id|product_id|id)"\s*:\s*(\d{7,})/);
          if (m) { variantId = m[1]; break; }
        }
      } catch { /* ignore */ }

      return {
        name,
        priceText,
        comparePriceText,
        inStock,
        imgs,
        description: description.slice(0, 1000),
        topNotes,
        heartNotes,
        baseNotes,
        variantId,
        categorySlug: catSlug,
      };
    }, categorySlug);

    if (!data.name || !data.priceText) return null;

    const price = parsePrice(data.priceText);
    if (price < 10) return null;

    const ml = extractMl(data.name);
    const brand = extractBrand(data.name);
    const gender = detectGender(data.name, categorySlug);
    const slug = slugify(data.name);
    const comparePrice = data.comparePriceText ? parsePrice(data.comparePriceText) : null;

    return {
      name: data.name,
      brand,
      ml,
      gender,
      price,
      comparePrice: comparePrice && comparePrice > price ? comparePrice : price * 1.2,
      inStock: data.inStock,
      images: data.imgs,
      description: data.description || `${data.name}. Perfume importado de alta qualidade, original e com nota fiscal.`,
      slug,
      categorySlug,
      dropshippingId: data.variantId,
      topNotes: data.topNotes || null,
      heartNotes: data.heartNotes || null,
      baseNotes: data.baseNotes || null,
    };
  } catch (err) {
    console.warn(`  ⚠ Erro: ${(err as Error).message}`);
    return null;
  }
}

async function scrapeCategory(
  browser: Browser,
  categoryPath: string,
  ourSlug: string,
  categoryId: string,
  supplierIds: Map<string, string>
): Promise<{ saved: number; inStock: number; outOfStock: number }> {
  let saved = 0, inStock = 0, outOfStock = 0;
  let pageNum = 1;
  const seenLinks = new Set<string>();

  while (pageNum <= 2) {
    const url = `${PUBLIC_SITE}/${categoryPath}/?page=${pageNum}`;
    console.log(`\n📂 ${categoryPath} (página ${pageNum})...`);

    let page: Page;
    try {
      page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");
      await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });
    } catch (err) {
      console.warn(`  ⚠ Erro ao carregar categoria: ${(err as Error).message}`);
      pageNum++;
      continue;
    }

    let links: string[] = [];
    try {
      links = await page.evaluate(() => {
        const anchors = document.querySelectorAll('a[href*="/produtos/"]');
        const hrefs = new Set<string>();
        anchors.forEach((a) => {
          const href = (a as HTMLAnchorElement).href.split("?")[0];
          if (href.includes("/produtos/") && href.split("/produtos/")[1].length > 1) {
            hrefs.add(href);
          }
        });
        return Array.from(hrefs);
      });
    } catch {
      await page.close().catch(() => {});
      pageNum++;
      continue;
    }
    await page.close().catch(() => {});

    const newLinks = links.filter((l) => {
      const slug = l.split("/produtos/")[1] || "";
      return !seenLinks.has(l) && !slug.startsWith("decant-");
    });
    if (newLinks.length === 0) break;

    console.log(`  ${newLinks.length} novos produtos`);

    for (const link of newLinks) {
      seenLinks.add(link);
      const name = link.split("/produtos/")[1]?.replace("/", "").substring(0, 50);
      process.stdout.write(`  → ${name} ... `);

      let prodPage: Page;
      try {
        prodPage = await browser.newPage();
        await prodPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");
      } catch {
        console.log("erro newPage");
        continue;
      }

      try {
        const product = await scrapeProductPage(prodPage, link, ourSlug);
        if (product) {
          const catId = product.gender === "MASCULINO" ? categoryId :
            product.gender === "FEMININO" ? categoryId :
            categoryId;
          await saveProduct(product, catId, supplierIds);
          console.log(`${product.inStock ? "✅" : "🔴"} R$${product.price.toFixed(2)} | ${product.images.length} fotos`);
          saved++;
          if (product.inStock) inStock++; else outOfStock++;
        } else {
          console.log("ignorado");
        }
      } catch (err) {
        console.log(`erro: ${(err as Error).message.substring(0, 50)}`);
      } finally {
        await prodPage.close().catch(() => {});
      }
    }

    pageNum++;
  }

  return { saved, inStock, outOfStock };
}

// ─── Salvar no banco ──────────────────────────────────────────────────────────

async function ensureCategories(): Promise<Record<string, string>> {
  const defs = [
    { slug: "masculino", name: "Masculino", description: "Fragrâncias masculinas importadas" },
    { slug: "feminino", name: "Feminino", description: "Fragrâncias femininas importadas" },
    { slug: "unissex", name: "Unissex", description: "Fragrâncias para todos" },
    { slug: "arabe", name: "Perfumes Árabes", description: "Fragrâncias árabes exclusivas" },
    { slug: "kits", name: "Kits", description: "Kits especiais" },
  ];
  const map: Record<string, string> = {};
  for (const c of defs) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug }, update: {}, create: c,
    });
    map[c.slug] = created.id;
  }
  return map;
}

async function saveProduct(
  p: Product,
  categoryId: string,
  supplierIdMap: Map<string, string>
): Promise<void> {
  // Tenta pegar o ID do fornecedor: primeiro do produto raspado, depois do mapa
  const dropshippingId = p.dropshippingId || supplierIdMap.get(p.slug) || null;

  const images = JSON.stringify(
    p.images.length > 0
      ? p.images
      : ["https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800"]
  );

  await prisma.product.upsert({
    where: { slug: p.slug },
    update: {
      name: p.name,
      price: p.price,
      comparePrice: p.comparePrice || undefined,
      images,
      brand: p.brand,
      ml: p.ml,
      gender: p.gender,
      inStock: p.inStock,
      topNotes: p.topNotes,
      heartNotes: p.heartNotes,
      baseNotes: p.baseNotes,
      description: p.description,
      dropshippingId,
      categoryId,
    },
    create: {
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice || undefined,
      images,
      categoryId,
      brand: p.brand,
      ml: p.ml,
      gender: p.gender,
      inStock: p.inStock,
      topNotes: p.topNotes,
      heartNotes: p.heartNotes,
      baseNotes: p.baseNotes,
      featured: false,
      dropshippingId,
      dropshippingSku: dropshippingId,
    },
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🚀 Importando produtos do site público goperfumaria.com.br\n");
  console.log("📌 Mantendo os IDs de fornecedor para a automação do drop\n");

  const supplierIds = await getSupplierIds();
  console.log(`💼 ${supplierIds.size} IDs do fornecedor mapeados\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--ignore-certificate-errors"],
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const categoryIds = await ensureCategories();
    let totalSaved = 0, totalInStock = 0, totalOutOfStock = 0;

    for (const [pubSlug, ourSlug] of CATEGORIES) {
      const catId = categoryIds[ourSlug] || categoryIds["unissex"];
      const result = await scrapeCategory(browser, pubSlug, ourSlug, catId, supplierIds);
      totalSaved += result.saved;
      totalInStock += result.inStock;
      totalOutOfStock += result.outOfStock;
    }

    console.log("\n✨ Importação concluída!");
    console.log(`   Total       : ${totalSaved}`);
    console.log(`   Em estoque  : ${totalInStock} ✅`);
    console.log(`   Esgotados   : ${totalOutOfStock} 🔴`);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
