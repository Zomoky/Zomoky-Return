"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string | null;
  image: { url: string; altText: string | null } | null;
  product: { title: string };
};

export default function CheckoutPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [showLandmark, setShowLandmark] = useState(false);
  const [addressType, setAddressType] = useState("Home");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "prepaid">("cod");
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({
    firstName: "", lastName: "", address1: "", address2: "", city: "", state: "", pincode: "",
    email: "", landmark: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function loadRazorpay(): Promise<void> {
    if ((window as any).Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
      document.body.appendChild(script);
    });
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("variant_id") || "";
    setVariantId(id);
    if (!id) return;

    fetch("/api/shopify/product?variant_id=" + encodeURIComponent(id))
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Unable to load product");
        setProduct(data);
      })
      .catch((e) => setMessage(e.message));
  }, []);

  const price = Number(product?.price || 599);
  const compareAt = Number(product?.compareAtPrice || 1199);
  const subtotal = price * quantity;
  const prepaidDiscount = paymentMethod === "prepaid" ? 50 * quantity : 0;
  const total = Math.max(0, subtotal - prepaidDiscount);
  const savings = Math.max(0, compareAt - price) * quantity;

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const priceText = useMemo(() => "₹" + total.toLocaleString("en-IN") + ".00", [total]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!variantId) {
      setMessage("Add a Shopify variant_id to the checkout URL.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/shopify/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          quantity,
          paymentMethod,
          phone,
          coupon,
          addressType,
          ...form,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Order failed");

      if (paymentMethod === "cod") {
        setMessage("Order " + data.order.name + " placed successfully. Pay on delivery.");
        return;
      }

      await loadRazorpay();
      const paymentResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopifyOrderId: data.order.id }),
      });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.error || "Unable to start online payment.");

      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error("Razorpay checkout is unavailable.");

      const razorpay = new Razorpay({
        key: paymentData.keyId,
        order_id: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "ZOMOKY",
        description: product?.product.title || "Zomoky order",
        prefill: {
          name: (form.firstName + " " + form.lastName).trim(),
          email: form.email,
          contact: "+91" + phone,
        },
        theme: { color: "#5f2b60" },
        handler: async (result: any) => {
          const verify = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shopifyOrderId: data.order.id,
              razorpayOrderId: result.razorpay_order_id,
              razorpayPaymentId: result.razorpay_payment_id,
              razorpaySignature: result.razorpay_signature,
            }),
          });
          const verifyData = await verify.json();
          if (!verify.ok) throw new Error(verifyData.error || "Payment verification failed.");
          setMessage("Payment successful. Order " + data.order.name + " is confirmed.");
        },
        modal: {
          ondismiss: () => setMessage("Payment window closed. Your order remains pending until payment is completed."),
        },
      });
      razorpay.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button className="back-button" aria-label="Go back" onClick={() => history.back()}>←</button>
        <div className="logo-lockup"><div className="logo-mark">M</div><span>ZOMOKY</span></div>
        <div className="header-spacer" />
      </header>

      <form onSubmit={submit} className="checkout-wrap">
        <section className="summary-bar">
          <div><strong>Order summary</strong><span>(1 Item)</span></div>
          <div className="summary-price">
            <del>₹{compareAt.toLocaleString("en-IN")}.00</del>
            <strong>₹{price.toLocaleString("en-IN")}.00</strong>
            <span className="chevron">›</span>
          </div>
        </section>

        <section className="card coupon-card">
          <div className="coupon-icon">%</div>
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter coupon code" />
          <button type="button" className="apply-button">Apply</button>
        </section>

        <section className="card">
          <h2>Contact number</h2>
          <div className="phone-row">
            <div className="country-code"><span>🇮🇳</span><b>+91</b></div>
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="10-digit phone number" required />
          </div>
          {phone && !/^[6-9]\d{9}$/.test(phone) && <p className="error-text">Please enter a valid phone number</p>}
        </section>

        <section className="card address-card">
          <h2>Add shipping address</h2>
          <label className="field"><span>Pincode<em>*</em></span><input value={form.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" required /></label>
          <div className="two-col">
            <label className="field"><input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="First name*" required /></label>
            <label className="field"><input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Last name*" required /></label>
          </div>
          <label className="field"><input value={form.address1} onChange={(e) => update("address1", e.target.value)} placeholder="Flat, house number, floor, building*" required /></label>
          <label className="field"><input value={form.address2} onChange={(e) => update("address2", e.target.value)} placeholder="Area, street, sector, village*" required /></label>
          <button className="landmark-link" type="button" onClick={() => setShowLandmark((v) => !v)}>+ Landmark area</button>
          {showLandmark && <label className="field"><input value={form.landmark} onChange={(e) => update("landmark", e.target.value)} placeholder="Landmark (optional)" /></label>}
          <div className="two-col">
            <label className="field"><input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City*" required /></label>
            <label className="field"><input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="State*" required /></label>
          </div>
          <label className="field"><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="E-mail (optional)" /></label>
          <p className="helper">Order delivery details will be sent here</p>

          <div className="address-type">
            <h3>Address type</h3>
            <div className="radio-row">
              {["Home","Office","Others"].map((item) => (
                <button key={item} type="button" className="radio-option" onClick={() => setAddressType(item)}>
                  <span className={addressType === item ? "radio selected" : "radio"} />{item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card payment-card-wrap">
          <h2>Payment</h2>
          <div className="two-col">
            <button type="button" className={paymentMethod === "cod" ? "method active" : "method"} onClick={() => setPaymentMethod("cod")}>
              <b>Cash on Delivery</b><span>Pay when delivered</span>
            </button>
            <button type="button" className={paymentMethod === "prepaid" ? "method active" : "method"} onClick={() => setPaymentMethod("prepaid")}>
              <b>Pay Online</b><span>Extra ₹50 OFF</span>
            </button>
          </div>
        </section>

        <div className="checkout-total">
          <span>Total</span><strong>{priceText}</strong>
          <small>Save ₹{savings.toLocaleString("en-IN")}{prepaidDiscount ? " + ₹" + prepaidDiscount + " prepaid" : ""}</small>
        </div>

        {message && <div className="success-box">{message}</div>}
        <section className="continue-area">
          <button className="continue-button" disabled={loading || !product}>{loading ? "Creating order…" : paymentMethod === "cod" ? "Place COD Order" : "Continue to Pay"}</button>
        </section>
      </form>
    </main>
  );
}
