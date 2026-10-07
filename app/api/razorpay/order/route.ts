import { NextRequest, NextResponse } from "next/server";
import { razorpayConfig, razorpayRequest } from "@/lib/razorpay";
import { shopifyAdmin } from "@/lib/shopify";

const ORDER_QUERY = \`
  query OrderAmount($id: ID!) {
    order(id: $id) {
      id
      name
      totalPriceSet { shopMoney { amount currencyCode } }
    }
  }
\`;

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const { shopifyOrderId } = await request.json();
    if (!shopifyOrderId || typeof shopifyOrderId !== "string") {
      return NextResponse.json({ error: "shopifyOrderId is required." }, { status: 400 });
    }

    const data = await shopifyAdmin<{
      order: { id: string; name: string; totalPriceSet: { shopMoney: { amount: string; currencyCode: string } } } | null;
    }>(ORDER_QUERY, { id: shopifyOrderId });

    if (!data.order) return NextResponse.json({ error: "Shopify order not found." }, { status: 404 });
    const amount = Math.round(Number(data.order.totalPriceSet.shopMoney.amount) * 100);
    const currency = data.order.totalPriceSet.shopMoney.currencyCode;
    if (!Number.isFinite(amount) || amount <= 0 || currency !== "INR") {
      return NextResponse.json({ error: "Invalid payment amount or currency." }, { status: 422 });
    }

    const receipt = ("zomoky-" + data.order.name.replace(/[^A-Za-z0-9_-]/g, "") + "-" + Date.now()).slice(0, 40);
    const paymentOrder = await razorpayRequest<RazorpayOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes: { shopify_order_id: data.order.id, shopify_order_name: data.order.name },
      }),
    });

    const { keyId } = razorpayConfig();
    return NextResponse.json({
      id: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      keyId,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create payment order." }, { status: 500 });
  }
}
