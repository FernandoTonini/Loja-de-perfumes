import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured") === "true";
    const categorySlug = searchParams.get("categoria");
    const search = searchParams.get("busca");

    const where: Record<string, unknown> = {};
    if (featured) where.featured = true;
    if (categorySlug) where.category = { slug: categorySlug };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        ...body,
        images: typeof body.images === "string" ? body.images : JSON.stringify(body.images || []),
      },
      include: { category: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
