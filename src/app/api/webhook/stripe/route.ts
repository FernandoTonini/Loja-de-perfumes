import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderToDropshipping } from "@/lib/dropshipping";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const orderId = checkoutSession.metadata?.orderId;

    if (orderId) {
      // Mark order as paid
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          paymentId: checkoutSession.id,
        },
      });

      // Auto-send to dropshipping
      const result = await sendOrderToDropshipping(orderId);
      if (!result.success) {
        console.error(`Dropshipping failed for order ${orderId}:`, result.error);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await prisma.order.updateMany({
      where: { paymentId: paymentIntent.id },
      data: { paymentStatus: "FAILED", status: "CANCELLED" },
    });
  }

  return NextResponse.json({ received: true });
}
