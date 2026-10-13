import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';

const { eq, and } = window.ApperSDK.CoreSDK;

export const route = { path: '/track', layout: 'public', access: 'public' };

const ORDER_FIELDS = ['Name', 'status_c', 'order_date_c', 'delivered_on_c', 'total_c'];
const ITEM_FIELDS = ['Name', 'size_c', 'quantity_c', 'price_c'];

const money = (v) => `₹${Number(v ?? 0).toLocaleString('en-IN')}`;

function buildSteps(order) {
  if (order.status_c === 'Cancelled') {
    return [
      { title: 'Order placed', date: order.order_date_c, done: true },
      { title: 'Cancelled', text: 'This order was cancelled. Any online payment is refunded to UPI in 3–5 days.', done: true, current: true },
    ];
  }
  const reached = { Placed: 0, Shipped: 1, Delivered: 2 }[order.status_c] ?? 0;
  return [
    { title: 'Order placed', date: order.order_date_c, done: reached >= 0, current: reached === 0 },
    { title: 'Shipped', text: reached >= 1 ? 'On its way to you.' : 'We will email you when it ships.', done: reached >= 1, current: reached === 1 },
    { title: 'Delivered', date: order.delivered_on_c, done: reached >= 2, current: reached === 2 },
  ];
}

export default function Track() {
  const [orderNo, setOrderNo] = useState('');
  const [contact, setContact] = useState('');
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function findOrder(e) {
    e.preventDefault();
    setError('');
    const raw = orderNo.trim().toUpperCase().replace(/\s/g, '').replace(/^#/, '');
    const c = contact.trim();
    if (!raw) return setError('Enter your order number.');
    if (!c) return setError('Enter the email or phone number from checkout.');
    const number = raw.startsWith('ZM-') ? raw : `ZM-${raw}`;
    const contactFilter = c.includes('@')
      ? eq('email_c', c.toLowerCase())
      : eq('phone_c', c.replace(/\D/g, '').slice(-10));

    setBusy(true);
    try {
      const res = await sdk.table('orders_c').select(ORDER_FIELDS).where(and(eq('Name', number), contactFilter)).fetch();
      if (!res.success) return setError('Something went wrong on our side. Please try again.');
      const found = res.data[0];
      if (!found) return setError('We could not find an order that matches. Check the order number and the email or phone from checkout.');
      const itemRes = await sdk.table('order_items_c').select(ITEM_FIELDS).where(eq('order_c', found.Id)).fetch();
      setItems(itemRes.success ? itemRes.data : []);
      setOrder(found);
    } finally {
      setBusy(false);
    }
  }

  const steps = order ? buildSteps(order) : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 md:px-6">
      <section className="max-w-2xl py-6 md:py-10">
        <h1 className="font-heading text-4xl font-semibold leading-tight md:text-5xl">Where is my order?</h1>
        <p className="mt-3 text-lg text-muted-foreground">Enter your order number to see where it is right now.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,30rem)_1fr]">
        <form onSubmit={findOrder} className="space-y-4 self-start rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="space-y-2">
            <Label htmlFor="track-order">Order number</Label>
            <Input id="track-order" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="e.g. ZM-10482" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="track-contact">Email or phone number</Label>
            <Input id="track-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com or 98XXXXXXXX" />
            <p className="text-xs text-muted-foreground">It has to match what is on the order.</p>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <><ApperIcon name="LoaderCircle" size={16} className="animate-spin" /> Looking up…</> : 'Track order'}
          </Button>
        </form>

        <div aria-live="polite">
          {order ? (
            <div className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-2xl font-semibold">Order {order.Name}</h2>
                <span className="text-sm text-muted-foreground">Placed {formatLocalDate(order.order_date_c, DATE_FORMATS.SHORT)}</span>
              </div>

              <ol className="relative space-y-5 border-l border-border pl-6">
                {steps.map((s) => (
                  <li key={s.title} className="relative">
                    <span className={cn('absolute -left-[31px] top-1 size-3 rounded-full border-2 border-card', s.done ? 'bg-primary' : 'bg-border')} />
                    <div className={cn('text-sm', s.current ? 'font-semibold' : 'font-medium', !s.done && 'text-muted-foreground')}>{s.title}</div>
                    {(s.date || s.text) && (
                      <div className="text-sm text-muted-foreground">
                        {s.date ? formatLocalDate(s.date, DATE_FORMATS.SHORT) : s.text}
                      </div>
                    )}
                  </li>
                ))}
              </ol>

              {items.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">In this order</h3>
                  <ul className="divide-y divide-border">
                    {items.map((it) => (
                      <li key={it.Id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{it.Name}</span>
                          <span className="text-xs text-muted-foreground">Size {it.size_c} · Qty {it.quantity_c}</span>
                        </span>
                        <span className="tabular-nums">{money(it.price_c)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Something not right with this order?</span>
                <Button variant="outline" asChild>
                  <Link to="/">Returns and cancellations</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              <ApperIcon name="PackageSearch" size={24} />
              Your order status shows up here once you look it up.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
