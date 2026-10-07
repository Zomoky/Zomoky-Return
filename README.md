# Zomoky Fastrr-Style Checkout

Custom mobile-first checkout for Zomoky with server-side Shopify Admin GraphQL and Razorpay integration.

## Shopify connection

Set these server-side environment variables in Vercel (or local .env.local):

    SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
    SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxx

The Shopify Admin token stays server-side and is never exposed to the browser.

## Checkout URL

Pass a Shopify variant ID:

    https://YOUR-CHECKOUT-DOMAIN/?variant_id=gid://shopify/ProductVariant/123456789

Numeric variant IDs are also accepted.

The checkout loads live product/price data from Shopify and collects customer, +91 phone number, shipping/billing address, payment method, coupon, and address type.

## Payment behaviour

COD: creates a pending Shopify order.

Prepaid: creates the Shopify order with the ₹50 prepaid discount applied server-side, creates a Razorpay order, verifies the Razorpay Checkout signature, confirms the payment is captured, and then marks the Shopify order paid. A Razorpay webhook is also included for asynchronous confirmation.

## Razorpay environment variables

    RAZORPAY_KEY_ID=...
    RAZORPAY_KEY_SECRET=...
    RAZORPAY_WEBHOOK_SECRET=...

Configure the webhook URL:

    https://YOUR-CHECKOUT-DOMAIN/api/razorpay/webhook

Subscribe to Razorpay order.paid events. Keep the webhook secret server-side.

## API routes

- GET /api/shopify/product?variant_id=... — loads Shopify variant data.
- POST /api/shopify/order — creates the Shopify order.
- POST /api/razorpay/order — creates the Razorpay payment order.
- POST /api/razorpay/verify — verifies Checkout signature and marks Shopify order paid.
- POST /api/razorpay/webhook — verifies Razorpay webhook signatures and marks Shopify orders paid.

## Production checklist

- Set Shopify server environment variables.
- Set Razorpay server environment variables.
- Give the Shopify custom app the required product/order access and permission to mark orders as paid.
- Configure the Razorpay webhook URL and secret.
- Deploy to Vercel and test with Razorpay test keys first.
- Add Shiprocket/Goswift fulfillment and conversion tracking after checkout/payment verification is stable.
