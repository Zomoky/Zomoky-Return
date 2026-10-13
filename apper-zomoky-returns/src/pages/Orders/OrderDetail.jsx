import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import { getTableAccess } from '@/services/userPermissions';
import ApperIcon from '@/components/ApperIcon';
import { DetailSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { statusStyles } from '../Requests/requestMeta';
import { money, orderStatusStyles } from './orderMeta';
import ItemDialog from './ItemDialog';

const { eq } = window.ApperSDK.CoreSDK;

export const route = { path: '/orders/:id', layout: 'owner', access: 'authenticated' };

const ORDER_FIELDS = ['Name', 'customer_name_c', 'email_c', 'phone_c', 'status_c', 'order_date_c', 'delivered_on_c', 'total_c'];
const ITEM_FIELDS = ['Name', 'size_c', 'quantity_c', 'price_c'];
const REQUEST_FIELDS = ['Name', 'request_type_c', 'status_c', 'CreatedOn'];

function Row({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[10rem_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children || '—'}</dd>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const orderAccess = getTableAccess(profile, 'orders_c');
  const itemAccess = getTableAccess(profile, 'order_items_c');

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: order, loading, error, run } = useFetch(
    () => sdk.table('orders_c').select(ORDER_FIELDS).get(id).then((r) => r.data),
    [id]
  );
  const { data: items, run: refetchItems } = useFetch(
    () =>
      sdk.table('order_items_c').select(ITEM_FIELDS).where(eq('order_c', id)).fetch().then((r) => {
        if (!r.success) throw new Error(r.message);
        return r.data;
      }),
    [id]
  );
  const { data: requests } = useFetch(
    () =>
      sdk.table('return_requests_c').select(REQUEST_FIELDS).where(eq('order_c', id)).orderByDesc('CreatedOn').fetch().then((r) => {
        if (!r.success) throw new Error(r.message);
        return r.data;
      }),
    [id]
  );

  const itemRows = items ?? [];
  const requestRows = requests ?? [];

  async function confirmRemoveItem() {
    setRemovingItem(true);
    try {
      const res = await sdk.table('order_items_c').remove([removeItem.Id]);
      if (res.messages?.length) {
        toast.error(res.messages[0]);
        return;
      }
      toast.success('Item removed');
      setRemoveItem(null);
      refetchItems();
    } finally {
      setRemovingItem(false);
    }
  }

  async function deleteOrder() {
    setDeleting(true);
    try {
      if (itemRows.length) {
        const itemRes = await sdk.table('order_items_c').remove(itemRows.map((i) => i.Id));
        if (itemRes.messages?.length) {
          toast.error(itemRes.messages[0]);
          return;
        }
      }
      const res = await sdk.table('orders_c').remove([order.Id]);
      if (res.messages?.length) {
        toast.error(res.messages[0]);
        return;
      }
      toast.success('Order deleted');
      setDeleteOpen(false);
      navigate('/orders');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/orders"><ApperIcon name="ArrowLeft" size={16} /> Back to Orders</Link>
      </Button>

      {loading && order === undefined ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="mb-3 text-sm">We could not load this order.</p>
          <Button variant="outline" onClick={run}>Try again</Button>
        </div>
      ) : !order ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">This order does not exist or was deleted.</div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl font-semibold">{order.Name}</h1>
              <p className="text-sm text-muted-foreground">{order.customer_name_c} · ordered {formatLocalDate(order.order_date_c, DATE_FORMATS.SHORT)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-medium', orderStatusStyles[order.status_c])}>{order.status_c}</span>
              {orderAccess.canUpdate && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/orders/${order.Id}/edit`}><ApperIcon name="Pencil" size={14} /> Edit</Link>
                </Button>
              )}
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-lg font-semibold">Details</h2>
            <dl>
              <Row label="Customer">{order.customer_name_c}</Row>
              <Row label="Email">{order.email_c}</Row>
              <Row label="Phone">{order.phone_c}</Row>
              <Row label="Delivered on">{order.delivered_on_c ? formatLocalDate(order.delivered_on_c, DATE_FORMATS.SHORT) : null}</Row>
              <Row label="Total">{money(order.total_c)}</Row>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Items</h2>
              {itemAccess.canCreate && (
                <Button size="sm" onClick={() => setAddOpen(true)}><ApperIcon name="Plus" size={14} /> Add item</Button>
              )}
            </div>
            {itemRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No items yet. Add what the customer bought so they can pick it on the portal.</p>
            ) : (
              <ul className="divide-y divide-border">
                {itemRows.map((it) => (
                  <li key={it.Id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{it.Name}</div>
                      <div className="text-xs text-muted-foreground">Size {it.size_c || '—'} · Qty {it.quantity_c}</div>
                    </div>
                    <div className="text-sm tabular-nums">{money(it.price_c)}</div>
                    {itemAccess.canUpdate && (
                      <Button variant="ghost" size="icon" aria-label={`Edit ${it.Name}`} onClick={() => setEditItem(it)}><ApperIcon name="Pencil" size={16} /></Button>
                    )}
                    {itemAccess.canDelete && (
                      <Button variant="ghost" size="icon" aria-label={`Remove ${it.Name}`} onClick={() => setRemoveItem(it)}><ApperIcon name="Trash2" size={16} /></Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-heading text-lg font-semibold">Requests on this order</h2>
            {requestRows.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No returns, replacements or cancellations yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {requestRows.map((r) => (
                  <li key={r.Id} className="flex items-center justify-between gap-3 py-3">
                    <Link to={`/requests/${r.Id}`} className="text-sm font-medium text-primary hover:underline">{r.Name} · {r.request_type_c}</Link>
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', statusStyles[r.status_c])}>{r.status_c}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {orderAccess.canDelete && (
            <div className="flex justify-end">
              <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
                <ApperIcon name="Trash2" size={16} /> Delete order
              </Button>
            </div>
          )}

          <ItemDialog orderId={order.Id} record={null} open={addOpen} onOpenChange={setAddOpen} onSaved={refetchItems} />
          <ItemDialog orderId={order.Id} record={editItem} open={Boolean(editItem)} onOpenChange={(o) => !o && setEditItem(null)} onSaved={refetchItems} />

          <AlertDialog open={Boolean(removeItem)} onOpenChange={(o) => !o && setRemoveItem(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {removeItem?.Name}?</AlertDialogTitle>
                <AlertDialogDescription>Customers will no longer be able to pick this item on the portal.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep item</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRemoveItem} disabled={removingItem}>{removingItem ? 'Removing…' : 'Remove item'}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete order {order.Name}?</AlertDialogTitle>
                <AlertDialogDescription>This also deletes its items. Existing return requests stay on file.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep order</AlertDialogCancel>
                <AlertDialogAction onClick={deleteOrder} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete order'}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
