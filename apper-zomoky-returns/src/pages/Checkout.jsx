import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const route = {
  path: '/checkout',
  layout: 'public',
  access: 'public',
};

const DEFAULT_PRODUCT = {
  title: 'Premium Everyday Essential',
  variant: 'Standard',
  price: 899,
  compareAt: 1299,
  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=320&q=80',
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function getInitialProduct(searchParams) {
  const price = Number(searchParams.get('price'));
  const compareAt = Number(searchParams.get('compare_at'));
  return {
    title: searchParams.get('title') || DEFAULT_PRODUCT.title,
    variant: searchParams.get('variant') || DEFAULT_PRODUCT.variant,
    price: Number.isFinite(price) && price > 0 ? price : DEFAULT_PRODUCT.price,
    compareAt: Number.isFinite(compareAt) && compareAt > 0 ? compareAt : DEFAULT_PRODUCT.compareAt,
    image: searchParams.get('image') || DEFAULT_PRODUCT.image,
    quantity: Math.max(1, Number(searchParams.get('quantity')) || 1),
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const product = useMemo(() => getInitialProduct(searchParams), [searchParams]);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [serviceability, setServiceability] = useState('idle');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const subtotal = product.price * product.quantity;
  const couponDiscount = couponApplied ? 50 : 0;
  const prepaidDiscount = paymentMethod === 'prepaid' ? 50 : 0;
  const codFee = 0;
  const total = Math.max(0, subtotal - couponDiscount - prepaidDiscount + codFee);

  const validPhone = /^[6-9]\d{9}$/.test(phone);

  function sendOtp() {
    setMessage('');
    if (!validPhone) {
      setMessage('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setOtpSent(true);
    setMessage('Test OTP sent. Use 123456.');
  }

  function verifyOtp() {
    if (otp === '123456') {
      setVerified(true);
      setMessage('Mobile number verified.');
    } else {
      setMessage('Incorrect OTP. Use 123456 in test mode.');
    }
  }

  function checkPincode() {
    setMessage('');
    if (!/^\d{6}$/.test(pincode)) {
      setServiceability('unavailable');
      setMessage('Enter a valid 6-digit pincode.');
      return;
    }
    setServiceability('checking');
    window.setTimeout(() => {
      const supported = pincode.startsWith('1') || pincode.startsWith('2') || pincode.startsWith('3') || pincode.startsWith('4') || pincode.startsWith('5') || pincode.startsWith('6') || pincode.startsWith('7') || pincode.startsWith('8');
      setCity(supported ? 'New Delhi' : 'Serviceable City');
      setState(supported ? 'Delhi' : 'India');
      setServiceability(supported ? 'available' : 'unavailable');
      if (!supported) setMessage('Sorry, delivery is currently unavailable at this pincode.');
    }, 450);
  }

  function applyCoupon() {
    if (coupon.trim().toUpperCase() === 'ZOM50') {
      setCouponApplied(true);
      setMessage('Coupon applied successfully. You saved ₹50.');
    } else {
      setCouponApplied(false);
      setMessage('Try coupon ZOM50 in test mode.');
    }
  }

  function placeOrder() {
    setMessage('');
    if (!verified) return setMessage('Please verify your mobile number.');
    if (!name.trim()) return setMessage('Enter your full name.');
    if (!address.trim()) return setMessage('Enter your delivery address.');
    if (!/^\d{6}$/.test(pincode) || serviceability !== 'available') return setMessage('Check delivery availability for your pincode.');
    if (paymentMethod === 'prepaid') {
      setBusy(true);
      window.setTimeout(() => {
        setBusy(false);
        navigate(`/checkout/thank-you?order_id=ZM-TEST-${Date.now().toString().slice(-6)}&payment=prepaid`);
      }, 900);
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      navigate(`/checkout/thank-you?order_id=ZM-TEST-${Date.now().toString().slice(-6)}&payment=cod`);
    }, 700);
  }

  return (
    <div className="min-h-svh bg-[#faf9f7] text-foreground">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <div className="font-heading text-xl font-semibold tracking-tight">ZOMOKY</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ApperIcon name="ShieldCheck" size={13} />
              Secure Checkout
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <ApperIcon name="LockKeyhole" size={14} />
            Your information is protected
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-5 md:px-6 md:pb-12 md:pt-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="font-heading text-xl font-semibold">Complete your order</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Fast, secure checkout for India.</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">TEST MODE</span>
              </div>

              <div className="flex gap-3 border-t border-border pt-4">
                <img src={product.image} alt={product.title} className="size-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-medium">{product.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{product.variant} · Qty {product.quantity}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-semibold">{money(product.price)}</span>
                    <span className="text-xs text-muted-foreground line-through">{money(product.compareAt)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-lg font-semibold">Mobile verification</h2>
                  <p className="text-sm text-muted-foreground">Required for COD and order updates.</p>
                </div>
                {verified && <span className="flex items-center gap-1 text-sm font-medium text-success"><ApperIcon name="BadgeCheck" size={16} /> Verified</span>}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile number</Label>
                  <div className="flex">
                    <span className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted/50 px-3 text-sm">+91</span>
                    <Input id="phone" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setVerified(false); }} placeholder="98XXXXXXXX" className="rounded-l-none" />
                  </div>
                </div>
                <Button type="button" variant="outline" className="mt-auto h-10" onClick={sendOtp} disabled={verified || !validPhone}>
                  {verified ? 'Verified' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </Button>
              </div>
              {otpSent && !verified && (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp">One-time password</Label>
                    <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" />
                  </div>
                  <Button type="button" className="mt-auto h-10" onClick={verifyOtp}>Verify OTP</Button>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
              <h2 className="font-heading text-lg font-semibold">Delivery details</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">House / street address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no., street, area" autoComplete="street-address" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apartment">Apartment / landmark <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input id="apartment" value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="Flat, floor, landmark" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">Pincode</Label>
                  <div className="flex gap-2">
                    <Input id="pincode" inputMode="numeric" maxLength={6} value={pincode} onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setServiceability('idle'); }} placeholder="110075" autoComplete="postal-code" />
                    <Button type="button" variant="outline" onClick={checkPincode} disabled={pincode.length !== 6}>Check</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} readOnly placeholder="Auto-filled after pincode" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={state} readOnly placeholder="Auto-filled after pincode" />
                </div>
              </div>
              {serviceability === 'checking' && <p className="mt-3 text-sm text-muted-foreground">Checking delivery availability…</p>}
              {serviceability === 'available' && <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success"><ApperIcon name="CircleCheck" size={16} /> Delivery available to your location</p>}
              {serviceability === 'unavailable' && <p className="mt-3 text-sm font-medium text-destructive">Sorry, delivery is currently unavailable at this pincode.</p>}
            </section>

            <section className="rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
              <h2 className="font-heading text-lg font-semibold">Payment method</h2>
              <div className="mt-4 grid gap-3">
                <button type="button" onClick={() => setPaymentMethod('prepaid')} className={cn('rounded-xl border-2 p-4 text-left transition-colors', paymentMethod === 'prepaid' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                  <div className="flex items-center gap-3">
                    <span className={cn('flex size-5 items-center justify-center rounded-full border', paymentMethod === 'prepaid' ? 'border-primary' : 'border-muted-foreground/50')}>
                      {paymentMethod === 'prepaid' && <span className="size-2.5 rounded-full bg-primary" />}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">Pay Online & Save ₹50</span>
                      <span className="mt-1 block text-xs text-muted-foreground">UPI · Cards · Net Banking · Wallets</span>
                    </span>
                    <span className="font-semibold text-primary">{money(subtotal - couponDiscount - 50)}</span>
                  </div>
                </button>
                <button type="button" onClick={() => setPaymentMethod('cod')} className={cn('rounded-xl border-2 p-4 text-left transition-colors', paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                  <div className="flex items-center gap-3">
                    <span className={cn('flex size-5 items-center justify-center rounded-full border', paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground/50')}>
                      {paymentMethod === 'cod' && <span className="size-2.5 rounded-full bg-primary" />}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">Cash on Delivery</span>
                      <span className="mt-1 block text-xs text-muted-foreground">Pay when your order arrives.</span>
                    </span>
                    <span className="font-semibold">{money(subtotal - couponDiscount)}</span>
                  </div>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] text-muted-foreground">
                <span className="rounded-lg bg-muted/40 px-2 py-2">UPI</span>
                <span className="rounded-lg bg-muted/40 px-2 py-2">Cards</span>
                <span className="rounded-lg bg-muted/40 px-2 py-2">NetBanking</span>
                <span className="rounded-lg bg-muted/40 px-2 py-2">Wallets</span>
              </div>
            </section>

            {message && (
              <div role="status" className={cn('rounded-lg border px-3 py-2.5 text-sm', message.includes('successfully') || message.includes('verified') ? 'border-success-border bg-success-muted text-success' : 'border-border bg-white text-foreground')}>
                {message}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <section className="rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
              <h2 className="font-heading text-lg font-semibold">Order summary</h2>
              <div className="mt-4 flex gap-3">
                <img src={product.image} alt="" className="size-14 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{product.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Qty {product.quantity} · {product.variant}</div>
                </div>
                <span className="text-sm font-semibold">{money(subtotal)}</span>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="flex gap-2">
                  <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" />
                  <Button type="button" variant="outline" onClick={applyCoupon}>Apply</Button>
                </div>
                {couponApplied && <p className="mt-2 text-xs font-medium text-success">ZOM50 applied · You saved ₹50</p>}
              </div>

              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(subtotal)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-success"><span>Coupon</span><span>-{money(couponDiscount)}</span></div>}
                {prepaidDiscount > 0 && <div className="flex justify-between text-success"><span>Prepaid savings</span><span>-{money(prepaidDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-medium">FREE</span></div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>{money(total)}</span></div>
              </div>
            </section>

            <div className="rounded-xl border border-border bg-white p-4 text-sm">
              <div className="grid gap-3">
                <div className="flex gap-2.5"><ApperIcon name="ShieldCheck" size={18} className="text-primary" /><span><strong>Secure checkout</strong><br /><span className="text-xs text-muted-foreground">Your payment details stay protected.</span></span></div>
                <div className="flex gap-2.5"><ApperIcon name="RotateCcw" size={18} className="text-primary" /><span><strong>Easy returns</strong><br /><span className="text-xs text-muted-foreground">Simple support if something goes wrong.</span></span></div>
                <div className="flex gap-2.5"><ApperIcon name="Headphones" size={18} className="text-primary" /><span><strong>24x7 customer support</strong><br /><span className="text-xs text-muted-foreground">support@zomoky.shop</span></span></div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-1 md:px-6">
          <div className="hidden flex-1 sm:block">
            <div className="text-xs text-muted-foreground">{paymentMethod === 'prepaid' ? 'Prepaid order' : 'Cash on Delivery'}</div>
            <div className="font-semibold">{money(total)}</div>
          </div>
          <Button className="min-h-12 flex-1 text-base font-semibold sm:max-w-md md:ml-auto md:w-full md:max-w-md" onClick={placeOrder} disabled={busy}>
            {busy ? <><ApperIcon name="LoaderCircle" size={18} className="animate-spin" /> Processing…</> : paymentMethod === 'prepaid' ? `Pay ${money(total)} & Save ₹50` : `Place COD Order — ${money(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
