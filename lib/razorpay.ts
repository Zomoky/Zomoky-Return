import crypto from "node:crypto";

function config() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
  return { keyId, keySecret, webhookSecret };
}

export function razorpayConfig() {
  return config();
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = config();
  const expected = crypto.createHmac("sha256", keySecret).update(orderId + "|" + paymentId).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const { webhookSecret } = config();
  if (!webhookSecret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function razorpayRequest<T>(path: string, init: RequestInit = {}) {
  const { keyId, keySecret } = config();
  const headers = new Headers(init.headers);
  headers.set("Authorization", "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"));
  headers.set("Content-Type", "application/json");
  const response = await fetch("https://api.razorpay.com/v1" + path, { ...init, headers, cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.description || "Razorpay API request failed");
  return payload as T;
}
