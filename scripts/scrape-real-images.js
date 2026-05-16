const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();
const BASE = 'https://goperfumaria.com.br';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'pt-BR,pt;q=0.9',
};

async function fetchPage(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  return res.text();
}

// Extract primary image and multiple gallery images from a product page
function extractImages(html, slug) {
  const urlPattern = /https:\/\/acdn-us\.mitiendanube\.com\/stores\/004\/403\/645\/products\/[^\s"'<>]+\.webp/g;
  const allUrls = [...new Set(html.match(urlPattern) || [])];

  // Find the JSON-LD for THIS specific product (match by URL slug without trailing suffix)
  const cleanSlug = slug.replace(/-[a-z0-9]{5}\/?$/, '').replace(/\/$/, '');

  // Get all product image URLs (480px and 640px, exclude logos/themes/unrelated)
  const productImgs = allUrls.filter(u => {
    const path = u.split('/products/')[1] || '';
    const base = path.split('-')[0];
    // Must be a product image (not theme/logo)
    if (!path || u.includes('theme') || u.includes('logo')) return false;
    return true;
  });

  // Separate by size
  const imgs480 = productImgs.filter(u => u.includes('-480-0.webp'));
  const imgs640 = productImgs.filter(u => u.includes('-640-0.webp'));

  // Match the main product image from JSON-LD
  const jldMatch = html.match(/"mainEntity"[^}]*"image"\s*:\s*"(https:\/\/[^"]+)"/);
  const webpageMatch = html.match(/"@type"\s*:\s*"WebPage"[^}]*"image"\s*:\s*"(https:\/\/[^"]+)"/s);

  let mainImg = null;
  if (jldMatch) mainImg = jldMatch[1];
  else if (webpageMatch) mainImg = webpageMatch[1];
  else if (imgs480.length > 0) mainImg = imgs480[0];
  else if (imgs640.length > 0) mainImg = imgs640[0];

  if (!mainImg) return null;

  // Normalize to 640px for better quality (replace -480- with -640- if possible)
  const mainImg640 = mainImg.replace('-480-0.webp', '-640-0.webp');

  // Find related images: images whose filename base overlaps with the main product filename
  const mainBase = mainImg.split('/products/')[1]?.split('-')[0] || '';

  // Get all images that appear to be for this product (same filename prefix)
  const mainFilename = mainImg.split('/products/')[1]?.replace(/-480-0\.webp$|-640-0\.webp$/, '') || '';

  // Look for numbered variants: -1-, -2-, -3-, -4- etc in similar filenames
  const productBase = mainFilename.replace(/-\d+-[a-f0-9]{32}.*/, '');

  const relatedImgs = [];
  for (const u of [...imgs640, ...imgs480]) {
    const fname = u.split('/products/')[1]?.replace(/-480-0\.webp$|-640-0\.webp$/, '') || '';
    const fbase = fname.replace(/-\d+-[a-f0-9]{32}.*/, '');
    if (fbase && productBase && fbase.startsWith(productBase.slice(0, 20)) && u !== mainImg && u !== mainImg640) {
      relatedImgs.push(u.replace('-480-0.webp', '-640-0.webp'));
    }
  }

  // Build final image array: main + up to 4 related (for gallery)
  const images = [mainImg640, ...relatedImgs.slice(0, 4)];
  return [...new Set(images)];
}

// Get all product URLs from sitemap
async function getSitemapUrls() {
  const xml = await fetchPage(`${BASE}/sitemap.xml`);
  if (!xml) return [];
  const matches = xml.match(/https:\/\/goperfumaria\.com\.br\/produtos\/[^<"]+/g) || [];
  const unique = [...new Set(matches.map(u => u.replace(/\/$/, '')))];
  // Filter only actual product pages (not canonical duplicates)
  return unique.filter(u => !u.endsWith('"'));
}

async function scrapeProduct(url) {
  const html = await fetchPage(url);
  if (!html) return null;
  const slug = url.split('/produtos/')[1]?.replace(/\/$/, '') || '';
  const images = extractImages(html, slug);
  return { slug, images };
}

// Normalize slug for matching: remove trailing short ID codes like -n9ay7
function normalizeSlug(slug) {
  return slug.replace(/-[a-z0-9]{5}$/, '').toLowerCase().trim();
}

async function run() {
  console.log('Fetching sitemap...');
  const urls = await getSitemapUrls();
  console.log(`Found ${urls.length} unique product URLs in sitemap`);

  // Get all our DB products
  const dbProducts = await p.product.findMany({ select: { id: true, slug: true } });
  const dbBySlug = new Map(dbProducts.map(p => [normalizeSlug(p.slug), p]));
  console.log(`DB has ${dbProducts.length} products`);

  // Scrape in batches of 10 concurrent requests
  const BATCH = 10;
  const results = [];
  let matched = 0;
  let notFound = 0;
  let noImage = 0;

  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const scraped = await Promise.all(batch.map(u => scrapeProduct(u).catch(() => null)));

    for (const item of scraped) {
      if (!item || !item.images || item.images.length === 0) { noImage++; continue; }

      const normalized = normalizeSlug(item.slug);
      const dbProd = dbBySlug.get(normalized);

      if (!dbProd) { notFound++; continue; }

      results.push({ id: dbProd.id, slug: dbProd.slug, images: item.images });
      matched++;
    }

    if ((i / BATCH) % 5 === 0) {
      console.log(`  Scraped ${Math.min(i + BATCH, urls.length)}/${urls.length} | matched: ${matched} | not found: ${notFound} | no img: ${noImage}`);
    }
  }

  console.log(`\nScraped: ${matched} products matched. Updating DB...`);

  // Update DB in batches
  let updated = 0;
  for (const r of results) {
    await p.product.update({
      where: { id: r.id },
      data: { images: JSON.stringify(r.images) },
    });
    updated++;
    if (updated % 50 === 0) console.log(`  Updated ${updated}/${results.length}`);
  }

  console.log(`\n✓ Done! Updated ${updated} products with real images from goperfumaria.com.br`);
  console.log(`  Not matched in DB: ${notFound}`);
  console.log(`  No image found: ${noImage}`);
  await p.$disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
