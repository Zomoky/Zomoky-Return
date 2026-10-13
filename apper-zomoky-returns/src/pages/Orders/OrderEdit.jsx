import { Link, useParams } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import { DetailSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import OrderForm from './OrderForm';

export const route = { path: '/orders/:id/edit', layout: 'owner', access: "profile === 'Admin_c'" };

const FIELDS = ['Name', 'customer_name_c', 'email_c', 'phone_c', 'status_c', 'order_date_c', 'delivered_on_c', 'total_c'];

export default function OrderEdit() {
  const { id } = useParams();
  const { data, loading, error, run } = useFetch(
    () => sdk.table('orders_c').select(FIELDS).get(id).then((r) => r.data),
    [id]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/orders/${id}`}><ApperIcon name="ArrowLeft" size={16} /> Back to order</Link>
      </Button>
      <h1 className="font-heading text-3xl font-semibold">Edit order</h1>
      {loading && data === undefined ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="mb-3 text-sm">We could not load this order.</p>
          <Button variant="outline" onClick={run}>Try again</Button>
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">This order does not exist.</div>
      ) : (
        <OrderForm record={data} />
      )}
    </div>
  );
}
