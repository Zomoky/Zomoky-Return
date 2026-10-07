"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [showLandmark, setShowLandmark] = useState(false);
  const [addressType, setAddressType] = useState("Home");

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button className="back-button" aria-label="Go back">←</button>
        <div className="logo-lockup" aria-label="Zomoky">
          <div className="logo-mark">M</div>
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
            <del>₹1199.00</del>
            <strong>₹599.00</strong>
            <span className="chevron">›</span>
          </div>
        </section>

        <section className="card coupon-card">
          <div className="coupon-icon">%</div>
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Enter coupon code"
            aria-label="Coupon code"
          />
          <button className="apply-button">Apply</button>
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
            />
          </div>
          <p className="error-text">Please enter a valid phone number</p>
        </section>

        <section className="card address-card">
          <h2>Add shipping address</h2>

          <label className="field full">
            <span>Pincode<em>*</em></span>
            <input inputMode="numeric" maxLength={6} />
          </label>

          <div className="two-col">
            <label className="field"><input placeholder="First name*" /></label>
            <label className="field"><input placeholder="Last name*" /></label>
          </div>

          <label className="field full"><input placeholder="Flat, house number, floor, building*" /></label>
          <label className="field full"><input placeholder="Area, street, sector, village*" /></label>

          <button className="landmark-link" type="button" onClick={() => setShowLandmark((v) => !v)}>
            + Landmark area
          </button>

          {showLandmark && (
            <label className="field full"><input placeholder="Landmark (optional)" /></label>
          )}

          <div className="two-col">
            <label className="field"><input placeholder="City*" /></label>
            <label className="field"><input placeholder="State*" /></label>
          </div>

          <label className="field full">
            <input type="email" placeholder="E-mail (optional)" />
          </label>
          <p className="helper">Order delivery details will be sent here</p>

          <div className="address-type">
            <h3>Address type</h3>
            <div className="radio-row">
              {["Home", "Office", "Others"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="radio-option"
                  onClick={() => setAddressType(item)}
                  aria-pressed={addressType === item}
                >
                  <span className={addressType === item ? "radio selected" : "radio"} />
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="continue-area">
          <button className="continue-button">Continue</button>
        </section>
      </div>
    </main>
  );
}
