const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Extract numeric variant index from CDN URL
// Main shot (unnumbered): .../products/HASH-1024-1024.webp → 0
// Numbered: .../products/HASH-2-HASH-1024-1024.webp → 2
function getImageOrder(url) {
  const filename = url.split('/products/')[1] || '';
  // Match -N- pattern before the resolution part
  const m = filename.match(/-(\d+)-[a-f0-9]+-\d+-\d+\.webp$/) ||
            filename.match(/-(\d+)-\d+-\d+\.webp$/);
  return m ? parseInt(m[1]) : 0; // 0 = main (unnumbered) → sorts first
}

function sortImages(images) {
  return [...images].sort((a, b) => getImageOrder(a) - getImageOrder(b));
}

async function run() {
  const products = await p.product.findMany({ select: { id: true, images: true } });
  let updated = 0;

  for (const prod of products) {
    let imgs;
    try { imgs = JSON.parse(prod.images); } catch { continue; }
    if (!Array.isArray(imgs) || imgs.length < 2) continue;

    const sorted = sortImages(imgs);
    // Only update if order actually changed
    if (sorted[0] === imgs[0]) continue;

    await p.product.update({ where: { id: prod.id }, data: { images: JSON.stringify(sorted) } });
    updated++;
  }

  console.log(`Reordered images for ${updated} products (main shot now first).`);
  await p.$disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
