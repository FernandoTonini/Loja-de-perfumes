const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  console.log('Fetching sitemap...');
  const res = await fetch('https://goperfumaria.com.br/sitemap.xml', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
  });
  const xml = await res.text();

  // Parse all product entries with their images from sitemap
  // Each product entry looks like:
  // <loc>URL</loc><image:loc>IMG1</image:loc><image:loc>IMG2</image:loc>
  const productMap = new Map(); // slug → [imageUrls]

  const urlBlocks = xml.split('<url>');
  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(https:\/\/goperfumaria\.com\.br\/produtos\/([^<]+))<\/loc>/);
    if (!locMatch) continue;

    const fullUrl = locMatch[1];
    const rawSlug = locMatch[2].replace(/\/$/, '');

    // Extract all image:loc entries
    const imgMatches = [...block.matchAll(/<image:loc>(https:\/\/[^<]+\.webp)<\/image:loc>/g)];
    if (imgMatches.length === 0) continue;

    const images = imgMatches.map(m => m[1]);

    // Normalize slug: remove trailing 5-char suffix code like -n9ay7, -6hly6
    const normalized = rawSlug.replace(/-[a-z0-9]{5}$/, '').toLowerCase();

    if (!productMap.has(normalized) || productMap.get(normalized).length < images.length) {
      productMap.set(normalized, images);
    }
  }

  console.log(`Sitemap has ${productMap.size} unique products with images`);

  // Get all DB products
  const dbProducts = await p.product.findMany({ select: { id: true, slug: true, name: true } });
  console.log(`DB has ${dbProducts.length} products`);

  let updated = 0;
  let notFound = 0;
  const missing = [];

  for (const prod of dbProducts) {
    const normalized = prod.slug.replace(/-[a-z0-9]{5}$/, '').toLowerCase();
    const images = productMap.get(normalized);

    if (!images || images.length === 0) {
      // Try partial match (first 40 chars)
      let found = null;
      for (const [key, imgs] of productMap.entries()) {
        if (key.startsWith(normalized.slice(0, 35)) || normalized.startsWith(key.slice(0, 35))) {
          found = imgs;
          break;
        }
      }

      if (found) {
        await p.product.update({ where: { id: prod.id }, data: { images: JSON.stringify(found) } });
        updated++;
      } else {
        notFound++;
        missing.push(prod.slug);
      }
      continue;
    }

    await p.product.update({ where: { id: prod.id }, data: { images: JSON.stringify(images) } });
    updated++;

    if (updated % 50 === 0) console.log(`  Updated ${updated}...`);
  }

  console.log(`\n✓ Updated ${updated} products with real multi-image data`);
  console.log(`  Not found in sitemap: ${notFound}`);
  if (missing.length > 0) {
    console.log('\nStill missing:');
    missing.forEach(s => console.log(' -', s));
  }

  // Show sample result for verification
  const sample = await p.product.findFirst({ where: { featured: true } });
  if (sample) {
    const imgs = JSON.parse(sample.images);
    console.log('\nSample - ' + sample.name.slice(0, 40));
    console.log(`  ${imgs.length} images:`);
    imgs.forEach((img, i) => console.log(`  ${i + 1}: ${img.slice(-60)}`));
  }

  await p.$disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
