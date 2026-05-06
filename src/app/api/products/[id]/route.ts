import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...body,
      images: body.images ? (typeof body.images === "string" ? body.images : JSON.stringify(body.images)) : undefined,
    },
    include: { category: true },
  });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
