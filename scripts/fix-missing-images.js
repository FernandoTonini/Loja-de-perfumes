const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Normalize slug for fuzzy matching: strip hyphens, articles, common words
function normalize(s) {
  return s
    .replace(/-[a-z0-9]{5}$/, '')  // trailing ID
    .replace(/\//g, '')
    .toLowerCase()
    // French/Portuguese articles with apostrophes become stuck together on goperfumaria
    .replace(/l-eau-d-/g, 'leau-d')
    .replace(/d-issey/g, 'dissey')
    .replace(/d-hermes/g, 'dhermes')
    .replace(/l-interdit/g, 'linterdit')
    .replace(/l-aventure/g, 'laventure')
    .replace(/l-intrude/g, 'lintrude')
    .replace(/-eau-de-parfum|-eau-de-toilette|-perfume-masculino|-perfume-feminino|-perfume-unissex/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const res = await fetch('https://goperfumaria.com.br/sitemap.xml', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  const xml = await res.text();

  // Build normalized map
  const entries = new Map(); // normalizedSlug → images
  const urlBlocks = xml.split('<url>');
  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>https:\/\/goperfumaria\.com\.br\/produtos\/([^<]+)<\/loc>/);
    if (!locMatch) continue;
    const rawSlug = locMatch[1].replace(/\/$/, '');
    const imgMatches = [...block.matchAll(/<image:loc>(https:\/\/[^<]+\.webp)<\/image:loc>/g)];
    if (imgMatches.length === 0) continue;
    const images = imgMatches.map(m => m[1]);
    const norm = normalize(rawSlug);
    if (!entries.has(norm) || entries.get(norm).length < images.length) {
      entries.set(norm, images);
    }
  }

  // Get products still using Unsplash
  const products = await p.product.findMany({ select: { id: true, slug: true, name: true, images: true } });
  const missing = products.filter(pr => JSON.parse(pr.images)[0]?.includes('unsplash'));
  console.log(`Products still needing real images: ${missing.length}`);

  let updated = 0;
  const stillMissing = [];

  for (const prod of missing) {
    const norm = normalize(prod.slug);

    // Direct match
    if (entries.has(norm)) {
      await p.product.update({ where: { id: prod.id }, data: { images: JSON.stringify(entries.get(norm)) } });
      updated++;
      continue;
    }

    // Fuzzy match: find best partial match by longest common prefix
    const normWords = norm.split('-').filter(w => w.length > 3);
    let bestMatch = null;
    let bestScore = 0;

    for (const [key, imgs] of entries.entries()) {
      const keyWords = key.split('-').filter(w => w.length > 3);
      const common = normWords.filter(w => keyWords.includes(w)).length;
      const score = common / Math.max(normWords.length, keyWords.length);
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestMatch = { key, imgs };
      }
    }

    if (bestMatch) {
      await p.product.update({ where: { id: prod.id }, data: { images: JSON.stringify(bestMatch.imgs) } });
      updated++;
      console.log(`  ✓ Fuzzy matched: ${prod.slug.slice(0, 40)} → ${bestMatch.key.slice(0, 40)} (score: ${bestScore.toFixed(2)})`);
    } else {
      stillMissing.push(prod);
    }
  }

  console.log(`\nUpdated ${updated} more products`);

  if (stillMissing.length > 0) {
    console.log(`\n${stillMissing.length} products with no match — keeping Unsplash fallback:`);
    for (const prod of stillMissing) {
      // These products may no longer be on goperfumaria.com.br
      // Keep the best Unsplash image we have (already there)
      console.log(' -', prod.slug);
    }
  }

  // Final count
  const total = await p.product.count();
  const unsplashCount = (await p.product.findMany({ select: { images: true } }))
    .filter(pr => JSON.parse(pr.images)[0]?.includes('unsplash')).length;
  const multiImg = (await p.product.findMany({ select: { images: true } }))
    .filter(pr => JSON.parse(pr.images).length > 1).length;

  console.log(`\nFinal stats:`);
  console.log(`  Total products: ${total}`);
  console.log(`  With real supplier images: ${total - unsplashCount}`);
  console.log(`  With Unsplash fallback: ${unsplashCount}`);
  console.log(`  With MULTIPLE images (gallery): ${multiImg}`);

  await p.$disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
