import { NextRequest, NextResponse } from "next/server";
import { razorpayRequest, verifyCheckoutSignature } from "@/lib/razorpay";
import { shopifyAdmin } from "@/lib/shopify";

const ORDER_QUERY = \`
  query OrderStatus($id: ID!) {
    order(id: $id) { id name displayFinancialStatus }
  }
\`;

const MARK_PAID = \`
  mutation MarkPaid($input: OrderMarkAsPaidInput!) {
    orderMarkAsPaid(input: $input) {
      userErrors { field message }
      order { id name displayFinancialStatus }
    }
  }
\`;

type RazorpayPayment = { id: string; order_id: string; status: string; amount: number; currency: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopifyOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
    if (![shopifyOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature].every((v) => typeof v === "string" && v)) {
      return NextResponse.json({ error: "Payment verification data is incomplete." }, { status: 400 });
    }

    if (!verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
    }

    const payment = await razorpayRequest<RazorpayPayment>("/payments/" + encodeURIComponent(razorpayPaymentId));
    if (payment.order_id !== razorpayOrderId || payment.status !== "captured") {
      return NextResponse.json({ error: "Payment is not captured or does not match the payment order." }, { status: 409 });
    }

    const existing = await shopifyAdmin<{ order: { id: string; name: string; displayFinancialStatus: string } | null }>(ORDER_QUERY, { id: shopifyOrderId });
    if (!existing.order) return NextResponse.json({ error: "Shopify order not found." }, { status: 404 });
    if (existing.order.displayFinancialStatus === "PAID") {
      return NextResponse.json({ success: true, order: existing.order });
    }

    const result = await shopifyAdmin<{
      orderMarkAsPaid: {
        userErrors: { field: string[] | null; message: string }[];
        order: { id: string; name: string; displayFinancialStatus: string } | null;
      };
    }>(MARK_PAID, { input: { id: shopifyOrderId } });

    if (result.orderMarkAsPaid.userErrors.length) {
      return NextResponse.json({ error: result.orderMarkAsPaid.userErrors.map((e) => e.message).join("; ") }, { status: 422 });
    }

    return NextResponse.json({ success: true, order: result.orderMarkAsPaid.order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment verification failed." }, { status: 500 });
  }
}
