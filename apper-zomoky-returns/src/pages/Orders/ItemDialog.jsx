import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { Button } from '@/components/ui/button';
import ApperIcon from '@/components/ApperIcon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EMPTY = { Name: '', size_c: '', quantity_c: '1', price_c: '' };

export default function ItemDialog({ orderId, record, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(record);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      record
        ? { Name: record.Name ?? '', size_c: record.size_c ?? '', quantity_c: String(record.quantity_c ?? 1), price_c: String(record.price_c ?? '') }
        : EMPTY
    );
  }, [open, record]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    if (!form.Name.trim()) return setError('Enter the product name.');
    if (form.price_c === '' || Number(form.price_c) < 0) return setError('Enter the item price.');
    const payload = {
      Name: form.Name.trim(),
      size_c: form.size_c.trim(),
      quantity_c: Math.max(1, Number(form.quantity_c) || 1),
      price_c: Number(form.price_c),
    };
    setSaving(true);
    try {
      const res = isEdit
        ? await sdk.table('order_items_c').update({ Id: record.Id, ...payload })
        : await sdk.table('order_items_c').create({ ...payload, order_c: orderId });
      if (res.messages?.length) {
        toast.error(res.messages[0]);
      }
      if (!res.data?.length) return;
      toast.success(isEdit ? 'Item updated' : 'Item added');
      onOpenChange(false);
      setForm(EMPTY);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit item' : 'Add item'}</DialogTitle>
          <DialogDescription>Items are what customers pick on the returns portal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Product</Label>
            <Input id="item-name" value={form.Name} onChange={set('Name')} placeholder="Cotton crew tee, Navy" autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-size">Size</Label>
              <Input id="item-size" value={form.size_c} onChange={set('size_c')} placeholder="M" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-qty">Quantity</Label>
              <Input id="item-qty" type="number" min="1" value={form.quantity_c} onChange={set('quantity_c')} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Price (₹)</Label>
              <Input id="item-price" type="number" min="0" value={form.price_c} onChange={set('price_c')} placeholder="0.00" />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <><ApperIcon name="LoaderCircle" size={16} className="animate-spin" /> Saving…</> : isEdit ? 'Save item' : 'Add item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
