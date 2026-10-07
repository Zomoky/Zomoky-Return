const SHOPIFY_API_VERSION = "2026-10";

type ShopifyTokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: ShopifyTokenCache | null = null;

function shopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      "Missing SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, or SHOPIFY_CLIENT_SECRET"
    );
  }

  return {
    domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    clientId,
    clientSecret,
  };
}

async function getShopifyAccessToken(): Promise<string> {
  const { domain, clientId, clientSecret } = shopifyConfig();

  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const response = await fetch(
    `https://${domain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      cache: "no-store",
    }
  );

  const payload = await response.json();

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        `Shopify authentication failed (HTTP ${response.status})`
    );
  }

  const expiresIn = Number(payload.expires_in) || 86400;
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(expiresIn - 300, 60) * 1000,
  };

  return payload.access_token;
}

export async function shopifyAdmin<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const { domain } = shopifyConfig();
  const token = await getShopifyAccessToken();

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
    throw new Error(
      payload?.errors?.[0]?.message || `Shopify HTTP ${response.status}`
    );
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
