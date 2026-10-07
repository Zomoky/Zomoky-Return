"use client";

import { FormEvent, useMemo, useState } from "react";

const product = {
  name: "Premium Everyday Product",
  price: 799,
  compareAt: 1299,
  image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=640&q=80",
};

const formatPrice = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function CheckoutPage() {
  const [payment, setPayment] = useState<"cod" | "prepaid">("cod");
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const discount = Math.max(0, product.compareAt - product.price);
  const prepaidDiscount = payment === "prepaid" ? 50 * quantity : 0;
  const subtotal = product.price * quantity;
  const total = Math.max(0, subtotal - prepaidDiscount);

  const savingsLabel = useMemo(
    () => `Save ${formatPrice(discount * quantity)}`,
    [discount, quantity]
  );

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">ZOMOKY</div>
        <div className="secure-label">🔒 Secure checkout</div>
      </header>

      <section className="checkout-grid">
        <div className="form-column">
          <div className="mobile-summary">
            <ProductSummary
              quantity={quantity}
              setQuantity={setQuantity}
              savingsLabel={savingsLabel}
            />
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <span className="step">1</span>
                <div>
                  <h2>Contact details</h2>
                  <p>We’ll use this to confirm your order.</p>
                </div>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Full name
                <input required name="name" placeholder="Enter your name" />
              </label>
              <label>
                Mobile number
                <input required name="phone" inputMode="numeric" placeholder="10-digit mobile number" />
              </label>
              <label className="full">
                Email address <span>(optional)</span>
                <input name="email" type="email" placeholder="you@example.com" />
              </label>
            </div>
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <span className="step">2</span>
                <div>
                  <h2>Delivery address</h2>
                  <p>India-wide delivery.</p>
                </div>
              </div>
            </div>

            <div className="form-grid">
              <label className="full">
                Address
                <input required name="address" placeholder="House no., street, area" />
              </label>
              <label>
                PIN code
                <input required name="pincode" inputMode="numeric" placeholder="110001" />
              </label>
              <label>
                City
                <input required name="city" placeholder="Delhi" />
              </label>
              <label>
                State
                <input required name="state" placeholder="Delhi" />
              </label>
              <label>
                Landmark <span>(optional)</span>
                <input name="landmark" placeholder="Nearby landmark" />
              </label>
            </div>
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <span className="step">3</span>
                <div>
                  <h2>Payment method</h2>
                  <p>Choose what works best for you.</p>
                </div>
              </div>
            </div>

            <div className="payment-options">
              <button
                type="button"
                className={payment === "cod" ? "payment-card active" : "payment-card"}
                onClick={() => setPayment("cod")}
              >
                <span className="radio">{payment === "cod" ? "●" : "○"}</span>
                <span>
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives</small>
                </span>
              </button>

              <button
                type="button"
                className={payment === "prepaid" ? "payment-card active" : "payment-card"}
                onClick={() => setPayment("prepaid")}
              >
                <span className="radio">{payment === "prepaid" ? "●" : "○"}</span>
                <span>
                  <strong>Pay Online</strong>
                  <small>Extra ₹50 OFF on prepaid orders</small>
                </span>
                <span className="offer-pill">₹50 OFF</span>
              </button>
            </div>
          </div>

          <form className="desktop-submit card" onSubmit={submitOrder}>
            <button className="primary-button" type="submit">
              {payment === "prepaid" ? `Pay ${formatPrice(total)} securely` : `Place COD order — ${formatPrice(total)}`}
            </button>
            <p className="microcopy">By continuing, you agree to our Terms & Privacy Policy.</p>
          </form>
        </div>

        <aside className="summary-column">
          <ProductSummary
            quantity={quantity}
            setQuantity={setQuantity}
            savingsLabel={savingsLabel}
          />

          <div className="trust-card">
            <strong>Why shop with Zomoky?</strong>
            <div>✓ Fast 4–7 day delivery</div>
            <div>✓ 30-day money-back guarantee</div>
            <div>✓ 24×7 customer support</div>
            <div>✓ Secure payments</div>
          </div>

          <div className="summary-totals">
            <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
            {prepaidDiscount > 0 && (
              <div className="discount-row"><span>Prepaid discount</span><strong>-{formatPrice(prepaidDiscount)}</strong></div>
            )}
            <div className="total-row"><span>Total</span><strong>{formatPrice(total)}</strong></div>
          </div>

          {submitted && (
            <div className="success-box">
              Demo checkout submitted. Next step: connect this button to Shopify order creation and Razorpay/Cashfree.
            </div>
          )}
        </aside>
      </section>

      <div className="mobile-sticky">
        <div>
          <small>Total</small>
          <strong>{formatPrice(total)}</strong>
        </div>
        <button onClick={() => setSubmitted(true)}>
          {payment === "prepaid" ? "Pay Online" : "Place Order"}
        </button>
      </div>
    </main>
  );
}

function ProductSummary({
  quantity,
  setQuantity,
  savingsLabel,
}: {
  quantity: number;
  setQuantity: (value: number) => void;
  savingsLabel: string;
}) {
  return (
    <div className="card product-card">
      <img src={product.image} alt={product.name} />
      <div className="product-main">
        <div className="product-title">{product.name}</div>
        <div className="price-line">
          <strong>{formatPrice(product.price)}</strong>
          <span>{formatPrice(product.compareAt)}</span>
        </div>
        <div className="save-line">{savingsLabel}</div>
        <div className="qty-row">
          <span>Quantity</span>
          <div className="qty-control">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
            <strong>{quantity}</strong>
            <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
