import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ORDER_STATUSES } from './orderMeta';

const today = () => new Date().toISOString().slice(0, 10);

export default function OrderForm({ record }) {
  const navigate = useNavigate();
  const isEdit = Boolean(record);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    Name: record?.Name ?? '',
    customer_name_c: record?.customer_name_c ?? '',
    email_c: record?.email_c ?? '',
    phone_c: record?.phone_c ?? '',
    status_c: record?.status_c ?? 'Placed',
    order_date_c: (record?.order_date_c ?? today()).slice(0, 10),
    delivered_on_c: (record?.delivered_on_c ?? '').slice(0, 10),
    total_c: record?.total_c ?? '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const backTo = isEdit ? `/orders/${record.Id}` : '/orders';

  function validate() {
    const next = {};
    if (!form.Name.trim()) next.Name = 'Enter the order number.';
    if (!form.customer_name_c.trim()) next.customer_name_c = 'Enter the customer name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email_c)) next.email_c = 'Enter a valid email address.';
    if (form.total_c === '' || Number(form.total_c) < 0) next.total_c = 'Enter the order total.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    const payload = {
      Name: form.Name.trim().toUpperCase(),
      customer_name_c: form.customer_name_c.trim(),
      email_c: form.email_c.trim().toLowerCase(),
      phone_c: form.phone_c.replace(/\D/g, '').slice(-10),
      status_c: form.status_c,
      order_date_c: form.order_date_c,
      delivered_on_c: form.delivered_on_c || null,
      total_c: Number(form.total_c),
    };
    setSaving(true);
    try {
      const res = isEdit
        ? await sdk.table('orders_c').update({ Id: record.Id, ...payload })
        : await sdk.table('orders_c').create(payload);
      if (res.messages?.length) {
        toast.error(res.messages[0]);
      }
      if (!res.data?.length) return;
      toast.success(isEdit ? 'Order updated' : 'Order created');
      navigate(`/orders/${isEdit ? record.Id : res.data[0].Id}`);
    } finally {
      setSaving(false);
    }
  }

  const field = (id, label, node, hint) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {node}
      {errors[id] ? <p className="text-xs text-destructive">{errors[id]}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-lg font-semibold">Customer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Name', 'Order number', <Input id="Name" value={form.Name} onChange={set('Name')} placeholder="ZM-10490" autoFocus />, 'Customers type this on the portal.')}
          {field('customer_name_c', 'Customer name', <Input id="customer_name_c" value={form.customer_name_c} onChange={set('customer_name_c')} placeholder="Aarav Mehta" />)}
          {field('email_c', 'Email', <Input id="email_c" type="email" value={form.email_c} onChange={set('email_c')} placeholder="name@example.com" />)}
          {field('phone_c', 'Phone', <Input id="phone_c" value={form.phone_c} onChange={set('phone_c')} placeholder="98XXXXXXXX" />)}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-lg font-semibold">Order</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('status_c', 'Status', (
            <Select value={form.status_c} onValueChange={(v) => setForm((f) => ({ ...f, status_c: v }))}>
              <SelectTrigger id="status_c"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {field('total_c', 'Total (₹)', <Input id="total_c" type="number" min="0" value={form.total_c} onChange={set('total_c')} placeholder="0.00" />)}
          {field('order_date_c', 'Ordered on', <Input id="order_date_c" type="date" value={form.order_date_c} onChange={set('order_date_c')} />)}
          {field('delivered_on_c', 'Delivered on', <Input id="delivered_on_c" type="date" value={form.delivered_on_c} onChange={set('delivered_on_c')} />, 'Starts the 10-day return window.')}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link to={backTo}>Cancel</Link>
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? <><ApperIcon name="LoaderCircle" size={16} className="animate-spin" /> Saving…</> : isEdit ? 'Save changes' : 'Create order'}
        </Button>
      </div>
    </div>
  );
}
