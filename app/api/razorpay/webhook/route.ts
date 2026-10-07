import { NextRequest, NextResponse } from "next/server";
import { razorpayRequest, verifyWebhookSignature } from "@/lib/razorpay";
import { shopifyAdmin } from "@/lib/shopify";

const MARK_PAID = `
  mutation MarkPaid($input: OrderMarkAsPaidInput!) {
    orderMarkAsPaid(input: $input) {
      userErrors { field message }
      order { id name displayFinancialStatus }
    }
  }
`;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  try {
    const signature = request.headers.get("x-razorpay-signature") || "";
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (!["order.paid", "payment.captured"].includes(event.event)) {
      return NextResponse.json({ received: true });
    }

    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const shopifyOrderId = orderEntity?.notes?.shopify_order_id;
    if (!razorpayOrderId || !shopifyOrderId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const payment = paymentEntity?.status ? paymentEntity : await razorpayRequest<any>("/orders/" + encodeURIComponent(razorpayOrderId));
    if (paymentEntity?.status && paymentEntity.status !== "captured") {
      return NextResponse.json({ received: true, ignored: true });
    }
    if (!paymentEntity?.status && payment.status !== "paid") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const result = await shopifyAdmin<{
      orderMarkAsPaid: {
        userErrors: { field: string[] | null; message: string }[];
        order: { id: string; name: string; displayFinancialStatus: string } | null;
      };
    }>(MARK_PAID, { input: { id: shopifyOrderId } });

    if (result.orderMarkAsPaid.userErrors.length) {
      const message = result.orderMarkAsPaid.userErrors.map((e) => e.message).join("; ");
      if (!/already.*paid/i.test(message)) throw new Error(message);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 500 });
  }
}
