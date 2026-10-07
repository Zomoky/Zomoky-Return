"use client";

import { useMemo, useState } from "react";

type Item = {
  title: string;
  variantTitle?: string;
  price: number;
  compareAt?: number;
  quantity: number;
  image?: string;
};

const item: Item = {
  title: "Decorative Magnetic Door Bell - Pack of 1",
  variantTitle: "Pack of 1",
  price: 599,
  compareAt: 1199,
  quantity: 1,
  image: "https://cdn.shopify.com/s/files/1/0638/2331/5113/files/7becf88b-32cc-4ab4-9514-b06fd021c30a.png",
};

export default function CheckoutPage() {
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [showLandmark, setShowLandmark] = useState(false);
  const [addressType, setAddressType] = useState("Home");
  const [step, setStep] = useState<"address" | "payment">("address");
  const [payment, setPayment] = useState<"prepaid" | "cod">("prepaid");

  const discount = payment === "prepaid" ? 50 : 0;
  const total = Math.max(0, item.price - discount);

  const phoneValid = phone.length === 10;
  const pinValid = pincode.length === 6;

  const summaryLabel = useMemo(
    () => `₹${total.toLocaleString("en-IN")}`,
    [total]
  );

  function continueCheckout() {
    if (!phoneValid || !pinValid) return;
    setStep("payment");
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button className="back-button" type="button" aria-label="Go back">
          ←
        </button>

        <div className="logo-lockup" aria-label="Zomoky">
          <div className="logo-mark">Z</div>
          <span>ZOMOKY</span>
        </div>

        <div className="header-spacer" />
      </header>

      <div className="checkout-wrap">
        <section className="summary-bar">
          <div>
            <strong>Order summary</strong>
            <span>(1 Item)</span>
          </div>
          <div className="summary-price">
            {item.compareAt && <del>₹{item.compareAt.toFixed(2)}</del>}
            <strong>{summaryLabel}</strong>
            <span className="chevron">⌄</span>
          </div>
        </section>

        {step === "address" ? (
          <>
            <section className="card coupon-card">
              <div className="coupon-icon">%</div>
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                aria-label="Coupon code"
              />
              <button
                type="button"
                className={couponApplied ? "apply-button applied" : "apply-button"}
                onClick={() => setCouponApplied(Boolean(coupon.trim()))}
              >
                {couponApplied ? "Applied" : "Apply"}
              </button>
            </section>

            <section className="card">
              <h2>Contact number</h2>
              <div className="phone-row">
                <div className="country-code"><span>🇮🇳</span><b>+91</b></div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  placeholder="10-digit phone number"
                  aria-label="10-digit phone number"
                  maxLength={10}
                />
              </div>
              <p className={phone.length > 0 && !phoneValid ? "error-text visible" : "error-text"}>
                Please enter a valid phone number
              </p>
            </section>

            <section className="card address-card">
              <h2>Add shipping address</h2>

              <label className="field full">
                <span>Pincode<em>*</em></span>
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit pincode"
                  required
                />
              </label>

              <div className="two-col">
                <label className="field"><input placeholder="First name*" required /></label>
                <label className="field"><input placeholder="Last name*" required /></label>
              </div>

              <label className="field full">
                <input placeholder="Flat, house number, floor, building*" required />
              </label>

              <label className="field full">
                <input placeholder="Area, street, sector, village*" required />
              </label>

              <button className="landmark-link" type="button" onClick={() => setShowLandmark((v) => !v)}>
                {showLandmark ? "− Remove landmark" : "+ Landmark area"}
              </button>

              {showLandmark && (
                <label className="field full">
                  <input placeholder="Landmark (optional)" />
                </label>
              )}

              <div className="two-col">
                <label className="field"><input placeholder="City*" required /></label>
                <label className="field"><input placeholder="State*" required /></label>
              </div>

              <label className="field full">
                <input type="email" placeholder="E-mail (optional)" />
              </label>

              <p className="helper">Order delivery details will be sent here</p>

              <div className="address-type">
                <h3>Address type</h3>
                <div className="radio-row">
                  {["Home", "Office", "Others"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="radio-option"
                      onClick={() => setAddressType(type)}
                      aria-pressed={addressType === type}
                    >
                      <span className={addressType === type ? "radio selected" : "radio"} />
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="continue-area">
              <button type="button" className="continue-button" onClick={continueCheckout}>
                Continue
              </button>
            </section>
          </>
        ) : (
          <>
            <section className="card">
              <div className="payment-heading">
                <button type="button" className="mini-back" onClick={() => setStep("address")}>←</button>
                <div>
                  <h2>Choose payment method</h2>
                  <p>Pay online to get extra ₹50 OFF.</p>
                </div>
              </div>

              <div className="payment-list">
                <button
                  type="button"
                  className={payment === "prepaid" ? "payment-option selected" : "payment-option"}
                  onClick={() => setPayment("prepaid")}
                >
                  <span className="payment-radio">{payment === "prepaid" ? "●" : "○"}</span>
                  <span><b>Pay Online</b><small>UPI, cards & net banking</small></span>
                  <strong>₹50 OFF</strong>
                </button>

                <button
                  type="button"
                  className={payment === "cod" ? "payment-option selected" : "payment-option"}
                  onClick={() => setPayment("cod")}
                >
                  <span className="payment-radio">{payment === "cod" ? "●" : "○"}</span>
                  <span><b>Cash on Delivery</b><small>Pay when your order arrives</small></span>
                </button>
              </div>
            </section>

            <section className="card order-card">
              <div className="order-product">
                <img src={item.image} alt={item.title} />
                <div>
                  <b>{item.title}</b>
                  <span>{item.variantTitle}</span>
                  <strong>₹{item.price.toFixed(2)}</strong>
                </div>
              </div>
              <div className="order-total"><span>Total</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>
            </section>

            <section className="continue-area">
              <button type="submit" className="continue-button">
                {payment === "prepaid" ? `Pay ₹${total.toLocaleString("en-IN")}` : "Place COD order"}
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
