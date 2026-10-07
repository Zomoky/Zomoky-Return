# Zomoky Fastrr-Style Checkout

Custom mobile-first checkout for Zomoky, with Shopify Admin API integration.

## Shopify connection

Set these server-side environment variables in Vercel (or local `.env.local`):

    SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
    SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxx

Shopify's current Admin GraphQL API exposes orderCreate for programmatic order creation and requires the write_orders scope with an offline token. citeturn531087search1turn625113search0

## Checkout URL

Pass a Shopify variant ID:

    https://YOUR-CHECKOUT-DOMAIN/?variant_id=gid://shopify/ProductVariant/123456789

Numeric variant IDs are also accepted.

The checkout loads product/price from Shopify on the server and sends customer, +91 phone number, shipping/billing address, payment method, coupon, and address type to Shopify.

## Current payment behaviour

COD: creates a Shopify order with PENDING financial status.

Prepaid: currently creates a PENDING Shopify order. The payment gateway step is not marked paid until a verified gateway webhook is added.

## API routes

- GET /api/shopify/product?variant_id=... — loads Shopify variant data.
- POST /api/shopify/order — creates the Shopify order.

## Next production integrations

Connect Razorpay or Cashfree checkout + webhook, then Shiprocket/Goswift fulfillment and conversion tracking.