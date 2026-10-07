# Zomoky Fastrr-Style Checkout

Custom mobile-first checkout for Zomoky, with Shopify Admin API integration.

## Shopify connection

Set these server-side environment variables in Vercel (or local `.env.local`):

    SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
    SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxx

Shopify Admin GraphQL is used server-side for product lookup and order creation. Keep the Admin token only in Vercel/server environment variables; never expose it to the browser.\n\nciteturn531087search1turn625113search0

## Checkout URL

Pass a Shopify variant ID:

    https://YOUR-CHECKOUT-DOMAIN/?variant_id=gid://shopify/ProductVariant/123456789

Numeric variant IDs are also accepted.

The checkout loads product/price from Shopify on the server and sends customer, +91 phone number, shipping/billing address, payment method, coupon, and address type to Shopify.

## Current payment behaviour

COD: creates a pending Shopify order.

Prepaid: creates the Shopify order with the ₹50 prepaid discount applied server-side, creates a Razorpay order, verifies the Razorpay Checkout signature, checks the payment is captured, and then marks the Shopify order paid. A Razorpay webhook endpoint is also included for asynchronous confirmation.

## Razorpay environment variables

    RAZORPAY_KEY_ID=...
    RAZORPAY_KEY_SECRET=...
    RAZORPAY_WEBHOOK_SECRET=...

Configure the webhook URL as:

    https://YOUR-CHECKOUT-DOMAIN/api/razorpay/webhook

Subscribe to Razorpay `order.paid` (and optionally `payment.captured`) events. Webhook secrets must remain server-side.

## API routes


- GET /api/shopify/product?variant_id=... — loads Shopify variant data.
- POST /api/shopify/order — creates the Shopify order.

## Production checklist

- Set Shopify server environment variables.
- Set Razorpay server environment variables.
- Give the Shopify custom app the required order/product access and the permission to mark orders as paid.
- Configure the Razorpay webhook URL and secret.
- Deploy to Vercel and test with Razorpay test keys first.
- Add Shiprocket/Goswift fulfillment and conversion tracking after checkout/payment verification is stable.
