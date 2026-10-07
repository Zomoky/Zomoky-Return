import { NextRequest, NextResponse } from "next/server";
import { shopifyAdmin, toVariantGid } from "@/lib/shopify";

type CheckoutBody = {
  variantId: string;
  quantity?: number;
  paymentMethod: "cod" | "prepaid";
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  addressType?: string;
  coupon?: string;
};

const MUTATION = `
  mutation CreateOrder($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      userErrors { field message }
      order {
        id
        name
        displayFinancialStatus
        statusPageUrl
      }
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutBody;

    const required = [
      body.variantId,
      body.firstName,
      body.lastName,
      body.phone,
      body.address1,
      body.city,
      body.state,
      body.pincode,
    ];

    if (required.some((value) => !String(value || "").trim())) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    if (!/^[6-9]\d{9}$/.test(body.phone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Indian phone number." }, { status: 400 });
    }

    if (!/^\d{6}$/.test(body.pincode)) {
      return NextResponse.json({ error: "Please enter a valid 6-digit PIN code." }, { status: 400 });
    }

    const quantity = Math.min(20, Math.max(1, Number(body.quantity || 1)));
    const variantId = toVariantGid(body.variantId);
    const fullAddress = body.landmark
      ? `${body.address1}. Landmark: ${body.landmark}`
      : body.address1;

    const orderInput: Record<string, unknown> = {
      lineItems: [{ variantId, quantity }],
      firstName: body.firstName,
      lastName: body.lastName,
      phone: `+91${body.phone}`,
      email: body.email || undefined,
      financialStatus: body.paymentMethod === "cod" ? "PENDING" : "PENDING",
      fulfillmentStatus: "UNFULFILLED",
      shippingAddress: {
        firstName: body.firstName,
        lastName: body.lastName,
        address1: fullAddress,
        address2: body.address2 || undefined,
        city: body.city,
        province: body.state,
        zip: body.pincode,
        countryCode: "IN",
        phone: `+91${body.phone}`,
      },
      billingAddress: {
        firstName: body.firstName,
        lastName: body.lastName,
        address1: fullAddress,
        address2: body.address2 || undefined,
        city: body.city,
        province: body.state,
        zip: body.pincode,
        countryCode: "IN",
        phone: `+91${body.phone}`,
      },
      customAttributes: [
        { key: "Checkout", value: "Zomoky Fastrr Style" },
        { key: "Payment Method", value: body.paymentMethod === "cod" ? "COD" : "Prepaid Pending" },
        ...(body.addressType ? [{ key: "Address Type", value: body.addressType }] : []),
        ...(body.coupon ? [{ key: "Coupon", value: body.coupon }] : []),
      ],
      tags: ["zomoky-checkout"],
      sourceName: "zomoky-checkout",
    };

    const data = await shopifyAdmin<{
      orderCreate: {
        userErrors: { field: string[] | null; message: string }[];
        order: { id: string; name: string; displayFinancialStatus: string; statusPageUrl: string | null } | null;
      };
    }>(MUTATION, {
      order: orderInput,
      options: { sendReceipt: Boolean(body.email) },
    });

    if (data.orderCreate.userErrors.length) {
      return NextResponse.json(
        { error: data.orderCreate.userErrors.map((item) => item.message).join("; ") },
        { status: 422 }
      );
    }

    if (!data.orderCreate.order) {
      return NextResponse.json({ error: "Shopify did not return the created order." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: data.orderCreate.order,
      nextStep:
        body.paymentMethod === "prepaid"
          ? "Prepaid order is created as pending. Connect your payment gateway webhook before marking it paid."
          : "COD order created successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Shopify order creation failed" },
      { status: 500 }
    );
  }
}
