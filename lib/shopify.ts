const SHOPIFY_API_VERSION = "2026-10";

function shopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();

  if (!domain || !token) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN");
  }

  return {
    domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    token,
  };
}

export async function shopifyAdmin<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const { domain, token } = shopifyConfig();

  const response = await fetch(
    `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || `Shopify HTTP ${response.status}`);
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "Shopify GraphQL error");
  }

  return payload.data as T;
}

export function toVariantGid(value: string) {
  if (value.startsWith("gid://shopify/ProductVariant/")) return value;
  const numeric = value.replace(/\D/g, "");
  if (!numeric) throw new Error("Invalid Shopify variant ID");
  return `gid://shopify/ProductVariant/${numeric}`;
}
