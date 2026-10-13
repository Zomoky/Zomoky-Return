import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import { ListSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/date';
import { REQUEST_STATUSES, statusStyles } from './Requests/requestMeta';

const { eq, contains, and } = window.ApperSDK.CoreSDK;

export const route = { path: '/requests', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'Undo2', label: 'Requests', order: 10, profiles: null };

const FIELDS = ['Name', 'request_id_c', 'order_c', 'item_c', 'request_type_c', 'reason_c', 'status_c', 'contact_c', 'resolution_c', 'CreatedOn'];
const PAGE_SIZE = 10;

export default function Requests() {
  const navigate = useNavigate();
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
    if (search) f.push(contains('Name', search));
    let q = sdk.table('return_requests_c').select(FIELDS);
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
      <div>
        <h1 className="font-heading text-3xl font-semibold">Return requests</h1>
        <p className="text-sm text-muted-foreground">Review what customers have sent in and move each one forward.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <ApperIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, e.g. RQ-1001"
            className="pl-9"
            aria-label="Search requests"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-52" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
          <ApperIcon name="TriangleAlert" size={28} className="text-destructive" />
          <p className="text-sm">We could not load the requests. {error.message}</p>
          <Button variant="outline" onClick={run}>Try again</Button>
        </div>
      ) : firstLoad ? (
        <ListSkeleton rows={8} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
          <ApperIcon name="Inbox" size={28} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No requests match. New customer requests from the portal show up here.</p>
        </div>
      ) : (
        <div aria-busy={loading} className={cn('overflow-x-auto rounded-xl border border-border bg-card shadow-sm transition-opacity', loading && 'pointer-events-none opacity-60')}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Type</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Reason</th>
                <th className="px-4 py-3 font-medium">Resolution</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.Id}
                  onClick={() => navigate(`/requests/${r.Id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-accent"
                >
                  <td className="px-4 py-3">
                    <Link to={`/requests/${r.Id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-primary hover:underline">
                      {r.Name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{r.order_c?.Name} · {formatRelativeTime(r.CreatedOn)}</div>
                  </td>
                  <td className="px-4 py-3">{r.item_c?.Name ?? '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{r.request_type_c}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{r.reason_c}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.resolution_c ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', statusStyles[r.status_c])}>
                      {r.status_c.replaceAll('_', ' ')}
                    </span>
                  </td>
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
