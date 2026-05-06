import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendOrderToDropshipping } from "@/lib/dropshipping";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });

  const result = await sendOrderToDropshipping(orderId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, dropshippingOrderId: result.dropshippingOrderId });
}

// Webhook from dropshipping supplier to update tracking
export async function PUT(req: NextRequest) {
  try {
    const webhookSecret = process.env.DROPSHIPPING_WEBHOOK_SECRET;
    const signature = req.headers.get("x-webhook-secret");

    if (webhookSecret && signature !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { external_order_id, tracking_code, status } = body;

    if (!external_order_id) {
      return NextResponse.json({ error: "external_order_id required" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (tracking_code) updateData.trackingCode = tracking_code;
    if (status) {
      updateData.dropshippingStatus = status;
      if (status === "SHIPPED") updateData.status = "SHIPPED";
      if (status === "DELIVERED") updateData.status = "DELIVERED";
    }

    await prisma.order.update({
      where: { id: external_order_id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
  }
}
