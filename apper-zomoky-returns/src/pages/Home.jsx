import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import FilePicker from '@/components/FilePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useFunction } from '@/hooks/useFunction';
import { REASONS } from './Requests/requestMeta';

const { eq, and, isIn } = window.ApperSDK.CoreSDK;

export const route = { path: '/', layout: 'public', access: 'public' };

const RETURN_WINDOW_DAYS = 10;
const PHOTO_REQUIRED_REASONS = ['Damaged on arrival', 'Wrong item received', 'Product defective'];

const TYPES = [
  { value: 'Return', title: 'Return an item', hint: 'Send an eligible item back for a refund.', icon: 'Undo2', done: 'Return requested', reason: 'Does not fit' },
  { value: 'Replacement', title: 'Exchange an item', hint: 'Change size, colour or another variant.', icon: 'RefreshCw', done: 'Exchange requested', reason: 'Damaged on arrival' },
  { value: 'Cancellation', title: 'Cancel an order', hint: 'Stop an eligible order before it ships.', icon: 'Ban', done: 'Cancellation requested', reason: 'Changed my mind' },
];

const ORDER_FIELDS = ['Name', 'status_c', 'order_date_c', 'delivered_on_c', 'total_c', 'payment_method_c'];
const ITEM_FIELDS = ['Name', 'size_c', 'quantity_c', 'price_c'];
const money = (v) => `₹${Number(v ?? 0).toLocaleString('en-IN')}`;

function daysSince(iso) {
  return Math.floor((new Date() - new Date(iso)) / 86400000);
}

function checkEligibility(order, type) {
  if (type === 'Cancellation') {
    if (order.status_c === 'Placed') return null;
    if (order.status_c === 'Cancelled') return 'This order is already cancelled.';
    return 'This order has already shipped, so it cannot be cancelled. Once it arrives you can start a return.';
  }
  if (order.status_c !== 'Delivered') return 'This order has not been delivered yet. You can start a return or replacement once it arrives.';
  if (daysSince(order.delivered_on_c) > RETURN_WINDOW_DAYS) {
    return `The ${RETURN_WINDOW_DAYS}-day window for returns and replacements has passed for this order. Write to support@zomoky.shop and we will take a look.`;
  }
  return null;
}

function nextSteps(type) {
  if (type === 'Cancellation') {
    return [
      { title: 'Request received', text: 'We have your cancellation.' },
      { title: 'Order stopped', text: 'We hold it before it ships.' },
      { title: 'Refund', text: 'Usually 3–5 days if you paid online.' },
    ];
  }
  return [
    { title: 'Request received', text: 'You will get a confirmation email.' },
    { title: 'Pickup from your door', text: 'We email pickup details within 24 hours.' },
    { title: 'Quality check', text: 'We check the item when it reaches us.' },
    type === 'Return'
      ? { title: 'Refund', text: 'Usually 3–5 days after the quality check.' }
      : { title: 'Replacement ships', text: 'A fresh piece is on its way to you.' },
  ];
}

export default function Home() {
  const [step, setStep] = useState('type');
  const [type, setType] = useState(null);
  const [orderNo, setOrderNo] = useState('');
  const [contact, setContact] = useState('');
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [picked, setPicked] = useState({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpReqId, setOtpReqId] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [verifiedMobile, setVerifiedMobile] = useState('');
  const { invoke: otpInvoke, loading: otpBusy } = useFunction(import.meta.env.VITE_ZOMOKY_OTP, { showError: false });
  const [requestId, setRequestId] = useState('');
  const [resolution, setResolution] = useState('Refund');
  const [refundMethod, setRefundMethod] = useState('Original payment method');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const typeInfo = TYPES.find((t) => t.value === type);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('seed-test-orders') !== '1') return;
    let cancelled = false;
    async function seedTestOrders() {
      setError('');
      setBusy(true);
      try {
        const names = ['TEST-RETURN-001', 'TEST-RETURN-002', 'TEST-REPLACE-001', 'TEST-CANCEL-001', 'TEST-WINDOW-001'];
        const existing = await Promise.all(names.map((name) => sdk.table('orders_c').select(['Name']).where(eq('Name', name)).fetch()));
        const existingNames = new Set(existing.flatMap((r) => (r.success ? r.data : [])).map((r) => r.Name));
        const today = new Date();
        const date = (daysAgo) => new Date(today.getTime() - daysAgo * 86400000).toISOString().slice(0, 10);
        const orders = [
          { Name: 'TEST-RETURN-001', customer_name_c: 'Test Return Customer', email_c: 'test.return.001@example.com', phone_c: '9876500001', status_c: 'Delivered', order_date_c: date(12), delivered_on_c: date(4), total_c: 899, payment_method_c: 'COD' },
          { Name: 'TEST-RETURN-002', customer_name_c: 'Test Prepaid Customer', email_c: 'test.return.002@example.com', phone_c: '9876500002', status_c: 'Delivered', order_date_c: date(15), delivered_on_c: date(3), total_c: 1299, payment_method_c: 'Prepaid' },
          { Name: 'TEST-REPLACE-001', customer_name_c: 'Test Replacement Customer', email_c: 'test.replace.001@example.com', phone_c: '9876500003', status_c: 'Delivered', order_date_c: date(9), delivered_on_c: date(2), total_c: 1998, payment_method_c: 'COD' },
          { Name: 'TEST-CANCEL-001', customer_name_c: 'Test Cancellation Customer', email_c: 'test.cancel.001@example.com', phone_c: '9876500004', status_c: 'Placed', order_date_c: date(0), delivered_on_c: null, total_c: 599, payment_method_c: 'COD' },
          { Name: 'TEST-WINDOW-001', customer_name_c: 'Test Window Customer', email_c: 'test.window.001@example.com', phone_c: '9876500005', status_c: 'Delivered', order_date_c: date(18), delivered_on_c: date(9), total_c: 749, payment_method_c: 'Prepaid' },
        ].filter((order) => !existingNames.has(order.Name));
        if (!orders.length) {
          if (!cancelled) toast.success('Test orders already exist.');
          return;
        }
        const created = await sdk.table('orders_c').create(orders);
        if (!created.data?.length) throw new Error(created.messages?.[0] || 'Could not create test orders.');
        const byName = Object.fromEntries(created.data.map((row) => [row.Name, row.Id]));
        const items = [
          { Name: 'TEST Return Product', size_c: 'M', quantity_c: 1, price_c: 899, order_c: byName['TEST-RETURN-001'] },
          { Name: 'TEST Prepaid Product', size_c: 'L', quantity_c: 1, price_c: 1299, order_c: byName['TEST-RETURN-002'] },
          { Name: 'TEST Replacement Product A', size_c: 'M', quantity_c: 1, price_c: 999, order_c: byName['TEST-REPLACE-001'] },
          { Name: 'TEST Replacement Product B', size_c: 'L', quantity_c: 1, price_c: 999, order_c: byName['TEST-REPLACE-001'] },
          { Name: 'TEST Cancellation Product', size_c: 'Free Size', quantity_c: 1, price_c: 599, order_c: byName['TEST-CANCEL-001'] },
          { Name: 'TEST Window Product', size_c: 'M', quantity_c: 1, price_c: 749, order_c: byName['TEST-WINDOW-001'] },
        ].filter((item) => item.order_c);
        if (items.length) await sdk.table('order_items_c').create(items);
        if (!cancelled) toast.success(`Created ${orders.length} test orders and their items.`);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Test order seeding failed.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    seedTestOrders();
    return () => { cancelled = true; };
  }, []);

  const selectedItems = items.filter((it) => picked[it.Id]?.checked);
  const estimatedRefund = selectedItems.reduce((sum, item) => sum + Number(item.price_c ?? 0) * Number(picked[item.Id]?.quantity ?? 1), 0);

  useEffect(() => {
    const widgetId = String(import.meta.env.VITE_MSG91_WIDGET_ID ?? '').trim();
    const tokenAuth = String(import.meta.env.VITE_MSG91_WIDGET_TOKEN ?? '').trim();
    if (!widgetId || !tokenAuth || window.__zomokyMsg91WidgetReady) return undefined;
    const initializeWidget = () => {
      if (typeof window.initSendOTP !== 'function') return false;
      window.initSendOTP({
        widgetId,
        tokenAuth,
        exposeMethods: true,
        success: () => {},
        failure: () => {},
      });
      window.__zomokyMsg91WidgetReady = true;
      return true;
    };
    if (typeof window.initSendOTP === 'function') {
      initializeWidget();
      return undefined;
    }
    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = initializeWidget;
    document.body.appendChild(script);
    return () => { script.onload = null; };
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  function restart() {
    setStep('type');
    setType(null);
    setOrder(null);
    setItems([]);
    setPicked({});
    setNotes('');
    setError('');
    setOtp('');
    setOtpSent(false);
    setOtpReqId('');
    setResendIn(0);
    setVerifiedMobile('');
    setRequestId('');
    setResolution('Refund');
    setRefundMethod('Original payment method');
    setUpiId('');
    setAccountHolder('');
    setBankName('');
    setBankAccountNumber('');
    setIfsc('');
    setPickupAddress('');
    setPickupConfirmed(false);
    setAttachments([]);
  }

  function getMobile() {
    return contact.trim().replace(/\D/g, '').slice(-10);
  }

  async function sendOtp(e) {
    e.preventDefault();
    setError('');
    const raw = orderNo.trim().toUpperCase().replace(/\s/g, '').replace(/^#/, '');
    const mobile = getMobile();
    if (!raw) return setError('Enter your order number.');
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError('Enter the 10-digit Indian mobile number used at checkout.');
    const widgetId = String(import.meta.env.VITE_MSG91_WIDGET_ID ?? '').trim();
    const tokenAuth = String(import.meta.env.VITE_MSG91_WIDGET_TOKEN ?? '').trim();
    if (!widgetId || !tokenAuth) return setError('MSG91 OTP Widget configuration is not available in this build. Please confirm the Widget ID and Widget Token are saved in Apper, then rebuild the app.');
    if (typeof window.sendOtp !== 'function') return setError('OTP service is still loading. Please wait a moment and try again.');

    setBusy(true);
    try {
      await new Promise((resolve) => {
        window.sendOtp(
          `91${mobile}`,
          (data) => {
            setOtpReqId(data?.reqId || data?.requestId || data?.data?.reqId || '');
            setOtpSent(true);
            setResendIn(60);
            setStep('otp');
            resolve();
          },
          (err) => {
            setError(err?.message || err?.msg || 'We could not send the OTP. Please try again.');
            resolve();
          },
        );
      });
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setError('');
    const mobile = getMobile();
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError('Enter the 10-digit Indian mobile number used at checkout.');
    if (!/^\d{4,8}$/.test(otp.trim())) return setError('Enter the OTP sent to your mobile number.');
    if (typeof window.verifyOtp !== 'function') return setError('OTP service is still loading. Please wait a moment and try again.');

    setBusy(true);
    try {
      await new Promise((resolve) => {
        window.verifyOtp(
          otp.trim(),
          async (data) => {
            const accessToken = data?.accessToken || data?.access_token || data?.token || data?.['access-token'] || data?.data?.accessToken || data?.data?.token;
            if (accessToken) {
              const result = await otpInvoke({ action: 'verify-access-token', mobile, accessToken });
              if (!result?.ok) {
                setError(result?.message || 'We could not complete OTP verification. Please try again.');
                resolve();
                return;
              }
            }
            setVerifiedMobile(mobile);

            const raw = orderNo.trim().toUpperCase().replace(/\s/g, '');
            const orderCandidates = [...new Set([
              raw,
              raw.replace(/^#/, ''),
              raw.replace(/^#?ZM-?/, ''),
              raw.replace(/^#?ZM-?/, 'ZM-'),
              raw.replace(/^#?ZM-?/, 'ZM'),
              raw.startsWith('TEST-') ? raw : '',
              raw.startsWith('TEST-') ? `#${raw}` : '',
            ].filter(Boolean))];
            const phoneCandidates = [...new Set([mobile, `91${mobile}`, `+91${mobile}`, `+91 ${mobile}`])];
            const res = await sdk.table('orders_c').select(ORDER_FIELDS).where(and(isIn('Name', orderCandidates), isIn('phone_c', phoneCandidates))).fetch();
            if (!res.success) {
              setError('Something went wrong on our side. Please try again.');
              resolve();
              return;
            }
            const found = res.data[0];
            if (!found) {
              setError('We could not find an order matching that order number and verified mobile number.');
              resolve();
              return;
            }
            const blocked = checkEligibility(found, type);
            if (blocked) {
              setError(blocked);
              resolve();
              return;
            }

            const itemRes = await sdk.table('order_items_c').select(ITEM_FIELDS).where(eq('order_c', found.Id)).fetch();
            if (!itemRes.success) {
              setError('We could not load the items on this order. Please try again.');
              resolve();
              return;
            }
            setOrder(found);
            setItems(itemRes.data);
            setPicked(Object.fromEntries(itemRes.data.map((it) => [it.Id, { checked: false, quantity: 1, reason: typeInfo.reason }])));
            setResolution(type === 'Return' ? 'Refund' : type === 'Replacement' ? 'Same product replacement' : 'Cancellation');
            setRefundMethod(found.payment_method_c === 'COD' ? 'UPI' : 'Original payment method');
            setStep('items');
            resolve();
          },
          (err) => {
            setError(err?.message || err?.msg || 'Invalid or expired OTP. Please try again.');
            resolve();
          },
          otpReqId || undefined,
        );
      });
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (resendIn > 0 || otpBusy) return;
    setError('');
    if (typeof window.retryOtp !== 'function') return setError('OTP service is still loading. Please wait a moment and try again.');
    setBusy(true);
    try {
      await new Promise((resolve) => {
        window.retryOtp(
          null,
          (data) => {
            setOtpReqId(data?.reqId || data?.requestId || otpReqId || '');
            setOtp('');
            setResendIn(60);
            toast.success('A new OTP has been sent.');
            resolve();
          },
          (err) => {
            setError(err?.message || err?.msg || 'We could not resend the OTP. Please try again.');
            resolve();
          },
          otpReqId || undefined,
        );
      });
    } finally {
      setBusy(false);
    }
  }

  function updatePick(id, patch) {
    setPicked((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
  }

  function goToDetails() {
    setError('');
    if (!selectedItems.length) return setError('Select at least one item.');
    setStep('details');
  }

  function goToReview() {
    setError('');
    if (selectedItems.some((item) => PHOTO_REQUIRED_REASONS.includes(picked[item.Id]?.reason)) && !attachments.length) return setError('Please upload at least one clear photo showing the issue with the item.');
    if (type !== 'Cancellation' && !pickupAddress.trim()) return setError('Enter the pickup address.');
    if (type !== 'Cancellation' && !pickupConfirmed) return setError('Confirm that the pickup address is correct.');

    const isCodRefund = order?.payment_method_c === 'COD' && resolution === 'Refund';
    if (isCodRefund && refundMethod === 'UPI' && !/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) return setError('Enter a valid UPI ID for the COD refund.');
    if (isCodRefund && refundMethod === 'Bank transfer' && (!accountHolder.trim() || !bankName.trim() || !/^\d{9,18}$/.test(bankAccountNumber.trim()) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase()))) return setError('Enter account holder, bank name, a valid account number, and a valid IFSC code.');
    setStep('review');
  }

  async function submit() {
    setError('');
    if (!selectedItems.length) return setError('Select at least one item.');
    const now = new Date();
    const day = now.toISOString().slice(0, 10).replace(/-/g, '');
    const requestReference = `ZR${day}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const payload = selectedItems.map((it, i) => ({
      Name: `${requestReference}-${i + 1}`,
      request_id_c: requestReference,
      order_c: order.Id,
      item_c: it.Id,
      request_type_c: type,
      requested_quantity_c: picked[it.Id].quantity,
      reason_c: picked[it.Id].reason,
      reason_details_c: notes.trim(),
      notes_c: notes.trim(),
      contact_c: contact.trim(),
      resolution_c: resolution,
      refund_method_c: resolution === 'Refund' ? refundMethod : null,
      refund_details_c: resolution === 'Refund' && order.payment_method_c === 'COD'
        ? JSON.stringify(refundMethod === 'UPI'
          ? { method: 'UPI', upiId: upiId.trim() }
          : { method: 'Bank transfer', accountHolder: accountHolder.trim(), bankName: bankName.trim(), accountNumber: bankAccountNumber.trim(), ifsc: ifsc.trim().toUpperCase() })
        : null,
      pickup_address_c: type === 'Cancellation' ? null : pickupAddress.trim(),
      pickup_confirmed_c: type === 'Cancellation' ? false : pickupConfirmed,
      exchange_variant_c: resolution === 'Different variant' ? notes.trim() : null,
      photo_required_c: PHOTO_REQUIRED_REASONS.includes(picked[it.Id].reason),
      photo_metadata_c: attachments.length ? JSON.stringify(attachments.map((file) => ({ Id: file.Id, Name: file.Name ?? file.name, Type: file.Type ?? file.type, Size: file.Size ?? file.size, path: file.path }))) : null,
      eligibility_snapshot_c: JSON.stringify({ orderStatus: order.status_c, deliveredOn: order.delivered_on_c, returnWindowDays: RETURN_WINDOW_DAYS }),
      customer_updated_on_c: now.toISOString(),
      status_c: 'REQUESTED',
    }));

    setBusy(true);
    try {
      const res = await sdk.table('return_requests_c').create(payload);
      if (res.messages?.length) toast.error(res.messages[0]);
      if (!res.data?.length) return;
      setRequestId(res.data[0]?.request_id_c ?? requestReference);
      setStep('done');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col justify-start overflow-visible px-3 py-3 sm:justify-center sm:px-4 md:px-6">
      <section className="mx-auto w-full max-w-4xl py-2 text-center sm:py-3">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary sm:text-xs">
          <ApperIcon name="ShieldCheck" size={13} />
          Zomoky self-service
        </div>
        <h1 className="font-heading text-[clamp(1.7rem,5vw,3rem)] font-semibold leading-[1.08] tracking-tight">How can we help with your order?</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-5 text-muted-foreground sm:text-base">Returns, exchanges, refunds, cancellations and order tracking — everything you need in one simple place.</p>
      </section>

      <div className="grid min-h-0 flex-1 items-start gap-3 sm:gap-4 lg:items-center lg:grid-cols-[minmax(0,42rem)_minmax(15rem,20rem)] lg:gap-6">
        <div className="w-full rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4 md:p-5" aria-live="polite">
          {step === 'type' && (
            <div>
              <div className="mb-3 text-center sm:mb-4">
                <h2 className="font-heading text-xl font-semibold sm:text-2xl">Select an option</h2>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Choose what you want to do with your order.</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {TYPES.filter((t) => t.value !== 'Cancellation').map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setType(t.value); setStep('find'); }}
                    className="group flex min-h-[6.6rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-2.5 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-accent hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring sm:min-h-[7.5rem] sm:gap-2.5 sm:rounded-2xl sm:px-4 sm:py-4"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-11">
                      <ApperIcon name={t.icon} size={21} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold sm:text-base">{t.value === 'Return' ? 'RETURN' : 'REPLACEMENT'}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground sm:text-xs">{t.hint}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:gap-3">
                <Link
                  to="/track"
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 px-2.5 py-2.5 text-center text-xs font-medium transition-colors hover:border-primary hover:bg-accent sm:min-h-12 sm:gap-2 sm:px-3 sm:text-sm"
                >
                  <ApperIcon name="PackageSearch" size={18} />
                  Track my order
                </Link>
                <button
                  type="button"
                  onClick={() => { setType('Cancellation'); setStep('find'); }}
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 px-2.5 py-2.5 text-center text-xs font-medium transition-colors hover:border-primary hover:bg-accent sm:min-h-12 sm:gap-2 sm:px-3 sm:text-sm"
                >
                  <ApperIcon name="Ban" size={18} />
                  Cancel my order
                </button>
              </div>

              <div className="mt-2.5 rounded-xl border border-border bg-muted/30 p-2.5 sm:mt-3 sm:p-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-9">
                    <ApperIcon name="Wallet" size={16} />
                  </span>
                  <div>
                    <div className="text-sm font-medium">Refund & payment options</div>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground sm:text-sm">Prepaid → original payment method. COD → UPI or bank transfer.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'find' && (
            <form onSubmit={sendOtp} className="space-y-4">
              <Button type="button" variant="ghost" size="sm" onClick={restart}>
                <ApperIcon name="ArrowLeft" size={16} /> Back to options
              </Button>
              <div>
                <h2 className="font-heading text-xl font-semibold">Verify your order</h2>
                <p className="text-sm text-muted-foreground">Enter your order number and the mobile number used at checkout. We will send you a verification code.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-no">Order number</Label>
                <Input id="order-no" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="e.g. ZM-10482" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Mobile number</Label>
                <Input id="contact" inputMode="numeric" maxLength={10} value={contact} onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98XXXXXXXX" />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || otpBusy}>{busy ? 'Sending OTP…' : 'Send OTP'}</Button>
              <p className="text-center text-xs text-muted-foreground">Your mobile number is used only to verify your order.</p>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setStep('find'); setOtp(''); setError(''); }}>
                <ApperIcon name="ArrowLeft" size={16} /> Change details
              </Button>
              <div>
                <h2 className="font-heading text-xl font-semibold">Enter verification code</h2>
                <p className="text-sm text-muted-foreground">We sent a one-time password to +91 {getMobile().slice(0, 2)}••••••{getMobile().slice(-2)}.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter OTP" autoFocus />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="button" className="w-full" onClick={verifyOtp} disabled={busy || otpBusy || !otp}>{busy ? 'Verifying…' : 'Verify & continue'}</Button>
              <div className="text-center text-sm">
                {resendIn > 0
                  ? <span className="text-muted-foreground">Resend OTP in {resendIn}s</span>
                  : <button type="button" className="font-medium text-primary hover:underline" onClick={resendOtp} disabled={busy || otpBusy}>Resend OTP</button>}
              </div>
            </div>
          )}

          {step === 'items' && order && (
            <div className="space-y-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('find')}>
                <ApperIcon name="ArrowLeft" size={16} /> Back to order lookup
              </Button>
              <div>
                <h2 className="font-heading text-xl font-semibold">Order {order.Name}</h2>
                <p className="text-sm text-muted-foreground">{type === 'Cancellation' ? 'Select the items to cancel.' : 'Select the items and tell us what went wrong.'}</p>
              </div>
              {type === 'Return' && <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">Estimated refund: {money(estimatedRefund)}</div>}
              <div className="space-y-3">
                {items.map((it) => {
                  const sel = picked[it.Id] ?? { checked: false, quantity: 1, reason: typeInfo.reason };
                  return (
                    <div key={it.Id} className={cn('rounded-xl border p-3', sel.checked ? 'border-primary bg-primary/5' : 'border-border')}>
                      <div className="flex items-start gap-3">
                        <Checkbox id={`item-${it.Id}`} checked={sel.checked} onCheckedChange={(v) => updatePick(it.Id, { checked: v === true })} />
                        <Label htmlFor={`item-${it.Id}`} className="flex-1 cursor-pointer">
                          <span className="block font-medium">{it.Name}</span>
                          <span className="text-xs text-muted-foreground">Size {it.size_c} · Purchased {it.quantity_c} · {money(it.price_c)} each</span>
                        </Label>
                      </div>
                      {sel.checked && (
                        <div className="mt-3 grid gap-3 pl-7 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Request quantity</Label>
                            <Input type="number" min="1" max={it.quantity_c} value={sel.quantity} onChange={(e) => updatePick(it.Id, { quantity: Math.max(1, Math.min(Number(it.quantity_c), Number(e.target.value) || 1)) })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Reason</Label>
                            <Select value={sel.reason} onValueChange={(v) => updatePick(it.Id, { reason: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Anything else we should know? (optional)</Label>
                <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tell us what happened in a line or two" />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={goToDetails}>Continue to details</Button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('items')}>
                <ApperIcon name="ArrowLeft" size={16} /> Back to items
              </Button>
              <h2 className="font-heading text-xl font-semibold">Choose resolution and details</h2>
              {type !== 'Cancellation' && (
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {type === 'Return'
                        ? <SelectItem value="Refund">Refund</SelectItem>
                        : <>
                            <SelectItem value="Same product replacement">Same product replacement</SelectItem>
                            <SelectItem value="Different variant">Different variant</SelectItem>
                          </>}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {resolution === 'Refund' && order?.payment_method_c === 'COD' && (
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <Label>COD refund method</Label>
                  <Select value={refundMethod} onValueChange={setRefundMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank transfer">Bank transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {refundMethod === 'UPI'
                    ? <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@bank" />
                    : <div className="grid gap-3 sm:grid-cols-2">
                        <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Account holder name" />
                        <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" />
                        <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="Account number" />
                        <Input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="IFSC code" />
                      </div>}
                </div>
              )}
              {resolution === 'Different variant' && <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="For example: Black / Size 9" />}
              {selectedItems.some((item) => PHOTO_REQUIRED_REASONS.includes(picked[item.Id]?.reason)) && (
                <div className="space-y-2 rounded-xl border border-border p-3">
                  <Label>Supporting photos</Label>
                  <FilePicker value={attachments} onChange={setAttachments} maxFiles={5} fieldConfig={{ supportedExtensions: 'jpg,jpeg,png,webp', supportMultipleValues: true, maxValue: 10240 }} />
                </div>
              )}
              {type !== 'Cancellation' && (
                <div className="space-y-2">
                  <Label>Pickup address</Label>
                  <Textarea value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Enter the pickup address" rows={3} />
                  <label className="flex items-start gap-2 text-sm"><Checkbox checked={pickupConfirmed} onCheckedChange={(v) => setPickupConfirmed(v === true)} /> <span>I confirm this pickup address is correct.</span></label>
                </div>
              )}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={goToReview}>Continue to review</Button>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('details')}>
                <ApperIcon name="ArrowLeft" size={16} /> Back to details
              </Button>
              <h2 className="font-heading text-xl font-semibold">Review your request</h2>
              <div className="rounded-xl border border-border divide-y divide-border">
                <div className="p-3"><div className="text-xs text-muted-foreground">Order</div><div className="font-medium">{order?.Name}</div></div>
                {selectedItems.map((item) => <div key={item.Id} className="flex items-center justify-between p-3 text-sm"><span>{item.Name} · Qty {picked[item.Id]?.quantity}</span><span>{money(Number(item.price_c ?? 0) * Number(picked[item.Id]?.quantity ?? 1))}</span></div>)}
                <div className="p-3 text-sm"><div className="text-xs text-muted-foreground">Resolution</div><div>{resolution}</div></div>
                {type !== 'Cancellation' && <div className="p-3 text-sm"><div className="text-xs text-muted-foreground">Pickup address</div><div>{pickupAddress}</div></div>}
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={submit} disabled={busy}>{busy ? 'Sending…' : `Send ${type.toLowerCase()} request`}</Button>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-success-muted text-success"><ApperIcon name="Check" size={20} /></span>
                <div>
                  <h2 className="font-heading text-xl font-semibold">{typeInfo.done}</h2>
                  <p className="text-sm text-muted-foreground">Order {order?.Name}. Keep this request ID handy.</p>
                </div>
              </div>
              <span className="inline-flex rounded-lg bg-highlight/20 px-3 py-1.5 font-heading text-lg font-semibold">{requestId}</span>
              <ol className="relative space-y-4 border-l border-border pl-6">
                {nextSteps(type).map((s, i) => <li key={s.title} className="relative"><span className={cn('absolute -left-[31px] top-1 size-3 rounded-full border-2 border-card', i === 0 ? 'bg-primary' : 'bg-border')} /><div className="text-sm font-medium">{s.title}</div><div className="text-sm text-muted-foreground">{s.text}</div></li>)}
              </ol>
              <Button variant="outline" className="w-full" onClick={restart}>Start another request</Button>
            </div>
          )}
        </div>

        <aside className="hidden min-w-0 space-y-3 lg:block">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold">Shop with confidence</h2>
            <p className="mt-1 text-sm text-muted-foreground">If something is not right, we will make it right.</p>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-2.5"><ApperIcon name="ListChecks" size={17} /><span><span className="block text-sm font-medium">A few quick steps</span><span className="block text-xs text-muted-foreground">No calls or back-and-forth emails.</span></span></li>
              <li className="flex gap-2.5"><ApperIcon name="ShieldCheck" size={17} /><span><span className="block text-sm font-medium">Safe and secure</span><span className="block text-xs text-muted-foreground">Your details stay private.</span></span></li>
              <li className="flex gap-2.5"><ApperIcon name="Wallet" size={17} /><span><span className="block text-sm font-medium">Quick refunds</span><span className="block text-xs text-muted-foreground">Usually 3–5 days after quality check.</span></span></li>
            </ul>
          </div>
          <p className="px-1 text-xs text-muted-foreground">Need help? support@zomoky.shop</p>
        </aside>
      </div>
    </div>
  );
}
