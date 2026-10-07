import { NextRequest, NextResponse } from "next/server";
import { shopifyAdmin, toVariantGid } from "@/lib/shopify";

const QUERY = `
  query Variant($id: ID!) {
    productVariant(id: $id) {
      id
      title
      price
      compareAtPrice
      image { url altText }
      product { title }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const rawId = request.nextUrl.searchParams.get("variant_id");
    if (!rawId) {
      return NextResponse.json({ error: "variant_id is required" }, { status: 400 });
    }

    const id = toVariantGid(rawId);
    const data = await shopifyAdmin<{
      productVariant: {
        id: string;
        title: string;
        price: string;
        compareAtPrice: string | null;
        image: { url: string; altText: string | null } | null;
        product: { title: string };
      } | null;
    }>(QUERY, { id });

    if (!data.productVariant) {
      return NextResponse.json({ error: "Product variant not found" }, { status: 404 });
    }

    return NextResponse.json(data.productVariant);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Shopify product lookup failed" },
      { status: 500 }
    );
  }
}
