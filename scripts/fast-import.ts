/**
 * Importação RÁPIDA usando apenas as páginas de listagem.
 * Cada página de categoria já contém: nome, preço, foto, link, status de estoque.
 * Não precisamos entrar em cada produto individualmente.
 */

import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.join(process.cwd(), "prisma", "dev.db")}` } },
});

const PUBLIC_SITE = "https://goperfumaria.com.br";
const SUPPLIER_SITE = "https://franqueadosclubgo.com.br";

const CATEGORIES: Array<[string, string]> = [
  ["perfumes-masculinos", "masculino"],
  ["perfumes-femininos", "feminino"],
  ["perfumes-arabes", "arabe"],
  ["kits", "kits"],
];

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractMl(name: string): number | null {
  const m = name.match(/(\d+)\s*ml/i);
  return m ? parseInt(m[1]) : null;
}

function extractBrand(name: string): string {
  const brands = ["Rabanne", "Paco Rabanne", "Dior", "Chanel", "Tom Ford", "Creed",
    "Yves Saint Laurent", "Saint Laurent", "YSL", "Lancôme", "Lancome",
    "Carolina Herrera", "Hugo Boss", "Versace", "Gucci", "Prada", "Armani",
    "Giorgio Armani", "Calvin Klein", "Dolce & Gabbana", "D&G", "Burberry",
    "Montblanc", "Givenchy", "Hermès", "Jean Paul Gaultier", "Issey Miyake",
    "Davidoff", "Valentino", "Bvlgari", "Lattafa", "Rasasi", "Al Haramain",
    "Al Wataniah", "Ajmal", "Maison Alhambra", "Armaf", "Dunhill", "Diesel",
    "Lacoste", "Azzaro", "Britney Spears", "La Rive", "Ciclo", "Pokoloka",
    "Jacques Bogart", "David Beckham", "Orientica", "Banderas", "Coach",
    "Paris Elysees", "Antonio Banderas", "Ralph Lauren", "Ferrari"];
  for (const brand of brands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return name.split(" ")[0];
}

function detectGender(name: string, catSlug: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("feminino") || lower.includes("feminin")) return "FEMININO";
  if (lower.includes("masculino") || lower.includes("masculin")) return "MASCULINO";
  if (catSlug === "masculino") return "MASCULINO";
  if (catSlug === "feminino") return "FEMININO";
  return "UNISEX";
}

interface ListProduct {
  name: string;
  url: string;
  price: number;
  comparePrice: number | null;
  image: string;
  inStock: boolean;
}

async function main() {
  console.log("⚡ Importação rápida da página de listagem\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--ignore-certificate-errors"],
    defaultViewport: { width: 1280, height: 1600 },
  });

  // Garantir categorias
  const catDefs = [
    { slug: "masculino", name: "Masculino" },
    { slug: "feminino", name: "Feminino" },
    { slug: "unissex", name: "Unissex" },
    { slug: "arabe", name: "Perfumes Árabes" },
    { slug: "kits", name: "Kits" },
  ];
  const catIds: Record<string, string> = {};
  for (const c of catDefs) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug }, update: {},
      create: { slug: c.slug, name: c.name, description: c.name + " importados" },
    });
    catIds[c.slug] = created.id;
  }

  // Backup dos IDs do fornecedor (do banco antes da limpeza ou de arquivo)
  let supplierIdMap = new Map<string, string>();
  try {
    const fs = await import("fs");
    if (fs.existsSync("/tmp/products-backup.json")) {
      const backup = JSON.parse(fs.readFileSync("/tmp/products-backup.json", "utf-8"));
      for (const p of backup) {
        if (p.dropshippingId) supplierIdMap.set(p.slug, p.dropshippingId);
      }
      console.log(`💼 ${supplierIdMap.size} IDs do fornecedor carregados do backup\n`);
    }
  } catch { /* ignore */ }

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");

    let totalSaved = 0, totalInStock = 0, totalOutOfStock = 0;

    for (const [pubSlug, ourSlug] of CATEGORIES) {
      console.log(`\n📂 ${pubSlug}...`);

      for (let pageNum = 1; pageNum <= 4; pageNum++) {
        const url = `${PUBLIC_SITE}/${pubSlug}/?page=${pageNum}`;
        try {
          await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        } catch (err) {
          console.log(`  ⚠ Erro página ${pageNum}: ${(err as Error).message.substring(0, 60)}`);
          continue;
        }

        // Forçar lazy load
        await page.evaluate(async () => {
          await new Promise<void>((resolve) => {
            let total = 0;
            const dist = 200;
            const timer = setInterval(() => {
              window.scrollBy(0, dist);
              total += dist;
              if (total >= document.body.scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });
        await new Promise((r) => setTimeout(r, 1500));

        const products: ListProduct[] = await page.evaluate(() => {
          const items: ListProduct[] = [];

          // Usa a classe REAL identificada na inspeção do site
          const cards = document.querySelectorAll(".js-item-product");

          cards.forEach((card) => {
            // Link do produto
            const linkEl = card.querySelector('a[href*="/produtos/"]') as HTMLAnchorElement;
            if (!linkEl) return;
            const url = linkEl.href.split("?")[0];
            if (!url.includes("/produtos/") || url.endsWith("/produtos/")) return;

            // Nome — múltiplas fontes
            const nameEl = card.querySelector("h2, h3, h4, [class*='item-name'], [class*='product-name']");
            let name = nameEl?.textContent?.trim() || "";
            if (!name) {
              const imgAlt = card.querySelector("img")?.getAttribute("alt") || "";
              name = imgAlt;
            }
            if (!name || name.length < 5) return;

            // Imagem — pega TODAS as imagens no card e escolhe a maior do mitiendanube
            let image = "";
            const allImgs = card.querySelectorAll("img");
            for (const img of Array.from(allImgs)) {
              const candidates = [
                img.getAttribute("data-zoom-image"),
                img.getAttribute("data-src"),
                img.getAttribute("data-lazy-src"),
                img.getAttribute("data-original"),
                img.getAttribute("srcset")?.split(",")[0].trim().split(" ")[0],
                img.src,
              ].filter(Boolean) as string[];

              for (const c of candidates) {
                const cleaned = c.startsWith("//") ? `https:${c}` : c;
                if (
                  cleaned.includes("mitiendanube") &&
                  !cleaned.includes("placeholder") &&
                  !cleaned.includes("empty") &&
                  cleaned.match(/\.(jpg|jpeg|png|webp)/i)
                ) {
                  // Versão maior (substitui -480-0 ou similar por -1024-1024)
                  image = cleaned.replace(/-480-\d+/, "-1024-1024");
                  break;
                }
              }
              if (image) break;
            }

            // Preço — busca elementos com R$
            const cardText = (card as HTMLElement).innerText || "";
            const priceMatches = cardText.match(/R\$\s*\d{1,4}(?:\.\d{3})*,\d{2}/g) || [];
            const validPrices: number[] = [];
            for (const p of priceMatches) {
              const num = parseFloat(p.replace(/[^\d,]/g, "").replace(",", "."));
              if (num >= 30 && num <= 5000) validPrices.push(num);
            }

            if (validPrices.length === 0) return;

            // Estratégia: pega o MAIOR preço como base (o regular, não o Pix com desconto adicional)
            // Mas se houver 3+ preços, pega o do MEIO (geralmente "de X por Y" + Pix)
            const sorted = [...new Set(validPrices)].sort((a, b) => b - a);
            let price: number, comparePrice: number | null;

            if (sorted.length >= 3) {
              // 3 preços: original (sorted[0]) > regular (sorted[1]) > pix (sorted[2])
              price = sorted[1];
              comparePrice = sorted[0];
            } else if (sorted.length === 2) {
              // 2 preços: PODE ser regular > pix OU original > regular
              // Heurística: se a diferença for ~5% é Pix; se for maior, é desconto
              const diff = (sorted[0] - sorted[1]) / sorted[0];
              if (diff < 0.07) {
                // ~5% off = Pix. O preço que queremos é o regular (sorted[0])
                price = sorted[0];
                comparePrice = null;
              } else {
                // Desconto real. Preço com desconto é sorted[1], original é sorted[0]
                price = sorted[1];
                comparePrice = sorted[0];
              }
            } else {
              price = sorted[0];
              comparePrice = null;
            }

            // Estoque - busca badge "Esgotado" no card
            const cardLower = cardText.toLowerCase();
            const badgeEl = card.querySelector("[class*='soldout'], [class*='sold-out']");
            const hasEsgotadoBadge = !!card.querySelector("*:not(script)");
            // Verifica texto exato "Esgotado" como palavra isolada (com fronteira)
            const hasEsgotado = /\besgotado\b/.test(cardLower) ||
                               /\bsem\s+estoque\b/.test(cardLower);
            const inStock = !badgeEl && !hasEsgotado;

            items.push({ name, url, price, comparePrice, image, inStock });
          });

          return items;
        });

        if (products.length === 0) break;

        console.log(`  Página ${pageNum}: ${products.length} produtos`);

        for (const p of products) {
          const slug = slugify(p.name);
          if (!slug || p.price < 30) continue;

          // Filtra decants
          if (p.name.toLowerCase().startsWith("decant")) continue;

          const ml = extractMl(p.name);
          const brand = extractBrand(p.name);
          const gender = detectGender(p.name, ourSlug);

          // Tenta pegar o ID do fornecedor do backup
          const dropshippingId = supplierIdMap.get(slug) || null;

          // Categoria correta baseado no gênero
          const catSlug = gender === "MASCULINO" ? "masculino" :
            gender === "FEMININO" ? "feminino" :
            ourSlug === "kits" ? "kits" :
            ourSlug === "arabe" ? "arabe" : "unissex";

          const images = JSON.stringify(p.image ? [p.image] : [
            "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800"
          ]);

          try {
            await prisma.product.upsert({
              where: { slug },
              update: {
                name: p.name, price: p.price,
                comparePrice: p.comparePrice || undefined,
                images, brand, ml, gender, inStock: p.inStock,
                dropshippingId, categoryId: catIds[catSlug] || catIds["unissex"],
              },
              create: {
                name: p.name, slug, description: `${p.name}. Perfume importado original com nota fiscal.`,
                price: p.price, comparePrice: p.comparePrice || undefined,
                images, categoryId: catIds[catSlug] || catIds["unissex"],
                brand, ml, gender, inStock: p.inStock, featured: false,
                dropshippingId, dropshippingSku: dropshippingId,
              },
            });
            totalSaved++;
            if (p.inStock) totalInStock++; else totalOutOfStock++;
          } catch (err) {
            // duplicate slug or other error
          }
        }
      }
    }

    console.log(`\n✨ Importação concluída em segundos!`);
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
