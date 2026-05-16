const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Verified working Unsplash images (all return 200 OK with real content)
const MASCULINE_IMGS = [
  'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1610461888750-10bfc601b874?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1535683577427-740aaac4ec25?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1543422655-ac1c6ca993ed?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1593487568720-92097fb460fb?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1610113233329-1c73b6f7fe98?w=800&q=85&auto=format&fit=crop',
];

const FEMININE_IMGS = [
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1622618991746-fe6004db3a47?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585218334450-afcf929da36e?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594125311687-3b1b3eafa9f4?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595425959632-34f2822322ce?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588514912908-8f5891714f8d?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1621814374283-57cc5d0d39c2?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1458538977777-0549b2370168?w=800&q=85&auto=format&fit=crop',
];

const UNISEX_IMGS = [
  'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&q=85&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1723391962154-8a2b6299bc09?w=800&q=85&auto=format&fit=crop',
];

// Pick image deterministically based on product index (varies per product)
function pickImage(index, gender, categorySlug) {
  const isArab = categorySlug && (categorySlug.includes('arab') || categorySlug.includes('rabe'));
  const isKit = categorySlug && categorySlug.includes('kit');
  const isNicho = categorySlug && categorySlug.includes('nicho');

  if (isArab) {
    const arabImgs = [...UNISEX_IMGS, MASCULINE_IMGS[2], MASCULINE_IMGS[5]];
    return arabImgs[index % arabImgs.length];
  }
  if (isKit) {
    const all = [...MASCULINE_IMGS, ...FEMININE_IMGS];
    return all[index % all.length];
  }
  if (isNicho) {
    return UNISEX_IMGS[index % UNISEX_IMGS.length];
  }
  if (gender === 'FEMININO') return FEMININE_IMGS[index % FEMININE_IMGS.length];
  if (gender === 'MASCULINO') return MASCULINE_IMGS[index % MASCULINE_IMGS.length];
  return UNISEX_IMGS[index % UNISEX_IMGS.length];
}

async function run() {
  const products = await p.product.findMany({
    include: { category: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Updating ${products.length} products...`);
  let updated = 0;

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const img = pickImage(i, prod.gender, prod.category.slug);
    await p.product.update({
      where: { id: prod.id },
      data: { images: JSON.stringify([img]) },
    });
    updated++;
    if (updated % 50 === 0) console.log(`  ${updated}/${products.length} done`);
  }

  console.log(`✓ All ${updated} products updated with high-quality Unsplash images`);
  await p.$disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
