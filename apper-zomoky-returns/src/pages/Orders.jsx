import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import { getTableAccess } from '@/services/userPermissions';
import ApperIcon from '@/components/ApperIcon';
import { ListSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { ORDER_STATUSES, money, orderStatusStyles } from './Orders/orderMeta';

const { eq, contains, or, and } = window.ApperSDK.CoreSDK;

export const route = { path: '/orders', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'ShoppingBag', label: 'Orders', order: 20, profiles: null };

const FIELDS = ['Name', 'customer_name_c', 'email_c', 'status_c', 'order_date_c', 'total_c'];
const PAGE_SIZE = 10;

export default function Orders() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { canCreate } = getTableAccess(profile, 'orders_c');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, loading, error, run } = useFetch(() => {
    const f = [];
    if (status !== 'all') f.push(eq('status_c', status));
    if (search) f.push(or(contains('Name', search), contains('customer_name_c', search)));
    let q = sdk.table('orders_c').select(FIELDS);
    if (f.length) q = q.where(and(...f));
    return q.orderByDesc('CreatedOn').page(page, PAGE_SIZE).fetch().then((r) => {
      if (!r.success) throw new Error(r.message);
      return { rows: r.data, total: r.total, hasMore: r.hasMore };
    });
  }, [status, search, page]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const firstLoad = loading && data === undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">The orders customers can look up on the returns portal.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/orders/new"><ApperIcon name="Plus" size={16} /> New order</Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <ApperIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order number or customer" className="pl-9" aria-label="Search orders" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48" aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
          <ApperIcon name="TriangleAlert" size={28} className="text-destructive" />
          <p className="text-sm">We could not load the orders. {error.message}</p>
          <Button variant="outline" onClick={run}>Try again</Button>
        </div>
      ) : firstLoad ? (
        <ListSkeleton rows={8} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
          <ApperIcon name="ShoppingBag" size={28} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No orders match. Create one so customers can look it up on the portal.</p>
        </div>
      ) : (
        <div aria-busy={loading} className={cn('overflow-x-auto rounded-xl border border-border bg-card shadow-sm transition-opacity', loading && 'pointer-events-none opacity-60')}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Ordered</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.Id} onClick={() => navigate(`/orders/${o.Id}`)} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${o.Id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-primary hover:underline">{o.Name}</Link>
                    <div className="text-xs text-muted-foreground">{o.customer_name_c}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', orderStatusStyles[o.status_c])}>{o.status_c}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatLocalDate(o.order_date_c, DATE_FORMATS.SHORT)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(o.total_c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
