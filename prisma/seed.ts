import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@maisonparfums.com.br";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin criado:", adminEmail);

  // Categories
  const categories = [
    { name: "Masculino", slug: "masculino", description: "Fragrâncias para homens", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400" },
    { name: "Feminino", slug: "feminino", description: "Fragrâncias para mulheres", image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400" },
    { name: "Unissex", slug: "unissex", description: "Fragrâncias para todos", image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400" },
    { name: "Nicho", slug: "nicho", description: "Perfumes exclusivos de nicho", image: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=400" },
    { name: "Árabes", slug: "arabes", description: "Fragrâncias árabes e orientais", image: "https://images.unsplash.com/photo-1547887538-047f814d2d24?w=400" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = c.id;
  }
  console.log("✅ Categorias criadas");

  // Products
  const products = [
    {
      name: "Dior Sauvage EDP",
      slug: "dior-sauvage-edp",
      brand: "Dior",
      description: "Uma fragrância selvagem e nobre ao mesmo tempo. Inspirado em vastidões iluminadas pelo sol, de planícies rochosas que se estendem até o horizonte. Sauvage é tanto selvagem quanto nobre.",
      price: 589.90,
      comparePrice: 720.00,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800",
        "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800",
      ]),
      categoryId: createdCategories["masculino"],
      ml: 100,
      gender: "MASCULINO",
      topNotes: "Bergamota, Pimenta",
      heartNotes: "Lavanda, Gengibre, Pimenta rosa, Vetiver",
      baseNotes: "Ambroxan, Cedro, Sândalo",
      featured: true,
      inStock: true,
      dropshippingId: "DIOR-SAU-100",
      dropshippingSku: "DS-EDP-100ML",
    },
    {
      name: "Chanel N°5 EDP",
      slug: "chanel-no5-edp",
      brand: "Chanel",
      description: "O perfume mais famoso do mundo. Uma composição atemporal de aldeídos florais com notas de ylang-ylang, neroli, jasmim e sândalo que se tornou um símbolo de elegância e sofisticação.",
      price: 699.90,
      comparePrice: 850.00,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800",
        "https://images.unsplash.com/photo-1588514912908-e4a8c8c77f0e?w=800",
      ]),
      categoryId: createdCategories["feminino"],
      ml: 100,
      gender: "FEMININO",
      topNotes: "Aldeídos, Neroli, Ylang-Ylang",
      heartNotes: "Jasmim, Rosa, Lírio do vale, Íris",
      baseNotes: "Cíbeto, Vetiver, Sândalo, Âmbar",
      featured: true,
      inStock: true,
      dropshippingId: "CHA-N5-100",
      dropshippingSku: "CH-N5-EDP-100ML",
    },
    {
      name: "Tom Ford Black Orchid EDP",
      slug: "tom-ford-black-orchid",
      brand: "Tom Ford",
      description: "Uma fragrância luxuosa e sensual de flores exóticas e especiarias. Uma criação fascinante que combina orquídea negra, trufa preta e especiarias em uma composição única e marcante.",
      price: 899.90,
      comparePrice: 1100.00,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800",
        "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=800",
      ]),
      categoryId: createdCategories["unissex"],
      ml: 100,
      gender: "UNISEX",
      topNotes: "Trufa, Ylang-Ylang, Bergamota",
      heartNotes: "Orquídea negra, Lotus, Frutas",
      baseNotes: "Sândalo, Âmbar, Musgo, Baunilha",
      featured: true,
      inStock: true,
      dropshippingId: "TF-BLKORCHID-100",
      dropshippingSku: "TF-BO-EDP-100ML",
    },
    {
      name: "Creed Aventus EDP",
      slug: "creed-aventus-edp",
      brand: "Creed",
      description: "Celebra a força, o sucesso e o poder de um líder. Inspirado na vida dramática de Napoleão Bonaparte, Aventus combina frutas frescas com madeiras defumadas em uma criação lendária.",
      price: 1299.90,
      comparePrice: 1600.00,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800",
        "https://images.unsplash.com/photo-1547887538-047f814d2d24?w=800",
      ]),
      categoryId: createdCategories["nicho"],
      ml: 100,
      gender: "MASCULINO",
      topNotes: "Abacaxi, Groselha, Maçã, Bergamota",
      heartNotes: "Bétula, Patchouli, Rosa, Jasmim",
      baseNotes: "Musgo de carvalho, Âmbar, Almíscar",
      featured: true,
      inStock: true,
      dropshippingId: "CR-AVE-100",
      dropshippingSku: "CR-AVE-EDP-100ML",
    },
    {
      name: "YSL Libre EDP",
      slug: "ysl-libre-edp",
      brand: "Yves Saint Laurent",
      description: "A fragrância da liberdade feminina. Uma ousada fusão de lavanda francesa e âmbar baunilhado que captura a essência da mulher moderna: livre, audaciosa e apaixonada.",
      price: 529.90,
      comparePrice: 650.00,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1588514912908-e4a8c8c77f0e?w=800",
        "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800",
      ]),
      categoryId: createdCategories["feminino"],
      ml: 90,
      gender: "FEMININO",
      topNotes: "Tangerina, Lavanda",
      heartNotes: "Flor de laranjeira, Lavanda, Rosa",
      baseNotes: "Âmbar baunilhado, Cedro, Musgo branco",
      featured: true,
      inStock: true,
      dropshippingId: "YSL-LIB-90",
      dropshippingSku: "YSL-LIB-EDP-90ML",
    },
    {
      name: "Acqua di Giò Profumo",
      slug: "acqua-di-gio-profumo",
      brand: "Giorgio Armani",
      description: "Profumo: uma versão mais intensa e aprofundada do ícone Acqua di Giò. Evoca o poder do mar Mediterrâneo com notas aquáticas profundas, especiarias e incenso marcante.",
      price: 459.90,
      comparePrice: 560.00,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800",
      ]),
      categoryId: createdCategories["masculino"],
      ml: 75,
      gender: "MASCULINO",
      topNotes: "Bergamota, Aquática",
      heartNotes: "Alecrim, Incenso, Gerânio",
      baseNotes: "Musgo, Cedro, Vetiver, Patchouli",
      featured: false,
      inStock: true,
      dropshippingId: "GA-ADG-75",
      dropshippingSku: "GA-ADG-PROF-75ML",
    },
    {
      name: "Maison Margiela Replica Jazz Club",
      slug: "maison-margiela-replica-jazz-club",
      brand: "Maison Margiela",
      description: "Uma viagem sensorial a um clube de jazz noturno. Rum, tabaco e madeiras se fundem numa fragrância calorosa e envolvente que evoca noites vibrantes e memoráveis.",
      price: 749.90,
      comparePrice: 920.00,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=800",
      ]),
      categoryId: createdCategories["unissex"],
      ml: 100,
      gender: "UNISEX",
      topNotes: "Rum, Pimenta rosa, Pinheiro",
      heartNotes: "Tabaco, Notas musicais, Flor de açafrão",
      baseNotes: "Baunilha, Benjoim, Musgo de carvalho",
      featured: false,
      inStock: true,
      dropshippingId: "MM-REP-JC-100",
      dropshippingSku: "MM-JC-EDT-100ML",
    },
    {
      name: "Lattafa Bade'e Al Oud Amethyst",
      slug: "lattafa-badee-al-oud-amethyst",
      brand: "Lattafa",
      description: "Uma joia olfativa do Oriente. Ricas notas de oud, âmbar e especiarias criam uma fragrância profunda e luxuosa que ressoa com a tradição árabe milenar de perfumaria.",
      price: 189.90,
      comparePrice: 250.00,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1547887538-047f814d2d24?w=800",
      ]),
      categoryId: createdCategories["arabes"],
      ml: 100,
      gender: "UNISEX",
      topNotes: "Açafrão, Bergamota",
      heartNotes: "Oud, Rosa, Ameixa",
      baseNotes: "Âmbar, Sândalo, Almíscar",
      featured: false,
      inStock: true,
      dropshippingId: "LAT-BADEE-100",
      dropshippingSku: "LAT-BA-EDP-100ML",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log("✅ Produtos criados");

  // Default settings
  const settings = [
    { key: "store_name", value: "Maison Parfums" },
    { key: "store_email", value: "contato@maisonparfums.com.br" },
    { key: "store_whatsapp", value: "5511999999999" },
    { key: "store_instagram", value: "@maisonparfums" },
    { key: "dropshipping_api_url", value: "" },
    { key: "dropshipping_api_key", value: "" },
    { key: "dropshipping_auth_type", value: "api_key" },
    { key: "dropshipping_order_endpoint", value: "/orders" },
    { key: "free_shipping_above", value: "500" },
    { key: "shipping_price", value: "25" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value },
    });
  }
  console.log("✅ Configurações criadas");

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log(`\n📧 Admin: ${adminEmail}`);
  console.log(`🔑 Senha: ${process.env.ADMIN_PASSWORD || "Admin@123"}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
