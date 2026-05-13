import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { automateDropshippingItem, automateFullOrder } from "@/lib/dropshipping-automation";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { orderId, orderItemId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });
    }

    if (orderItemId) {
      const result = await automateDropshippingItem(orderId, orderItemId);
      return NextResponse.json(result);
    }

    const results = await automateFullOrder(orderId);
    const allSuccess = results.every((r) => r.success);
    return NextResponse.json({ success: allSuccess, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro na automação";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
