import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

interface CheckoutItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      name, email, phone,
      street, number, complement, neighborhood, city, state, zip,
      paymentMethod,
      items,
      subtotal,
      shipping,
      total,
    } = body;

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        userId: session?.user.id || undefined,
        subtotal,
        shipping,
        total,
        shippingName: name,
        shippingEmail: email,
        shippingPhone: phone,
        shippingStreet: street,
        shippingNumber: number,
        shippingComplement: complement,
        shippingNeighborhood: neighborhood,
        shippingCity: city,
        shippingState: state,
        shippingZip: zip,
        paymentMethod,
        paymentStatus: "PENDING",
        status: "PENDING",
        items: {
          create: items.map((item: CheckoutItem) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            image: item.image,
          })),
        },
      },
    });

    // PIX: return order directly
    if (paymentMethod === "pix") {
      return NextResponse.json({ orderId: order.id });
    }

    // Stripe checkout
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "brl",
      customer_email: email,
      line_items: items.map((item: CheckoutItem) => ({
        price_data: {
          currency: "brl",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      ...(shipping > 0 && {
        shipping_options: [{
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: Math.round(shipping * 100), currency: "brl" },
            display_name: "Frete padrão",
          },
        }],
      }),
      metadata: { orderId: order.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: stripeSession.id },
    });

    return NextResponse.json({ stripeUrl: stripeSession.url, orderId: order.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Erro ao processar pedido" }, { status: 500 });
  }
}
