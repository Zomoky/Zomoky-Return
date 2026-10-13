import { Link } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import { StatsSkeleton, ListSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/date';
import { REQUEST_STATUSES, statusStyles } from './Requests/requestMeta';

const { eq } = window.ApperSDK.CoreSDK;

export const route = { path: '/dashboard', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'LayoutDashboard', label: 'Dashboard', order: 5, profiles: null };

const AGGREGATES = REQUEST_STATUSES.map((s) => ({
  id: s,
  fields: [{ field: 'Id', fn: 'Count', alias: 'count' }],
  where: eq('status_c', s),
}));

export default function Dashboard() {
  const { data: counts, loading, error, run } = useFetch(async () => {
    const res = await sdk.table('return_requests_c').select([{ field: 'Id' }]).aggregate(AGGREGATES).limit(1).fetch();
    if (!res.success) throw new Error(res.message);
    const get = (id) => {
      const b = res.aggregators?.find((a) => a.id === id);
      return b?.data?.count ?? b?.count ?? b?.value ?? 0;
    };
    return Object.fromEntries(REQUEST_STATUSES.map((s) => [s, get(s)]));
  }, []);

  const { data: waiting, loading: waitingLoading, error: waitingError, run: refetchWaiting } = useFetch(
    () =>
      sdk
        .table('return_requests_c')
        .select(['Name', 'order_c', 'item_c', 'request_type_c', 'reason_c', 'CreatedOn'])
        .where(eq('status_c', 'REQUESTED'))
        .orderByDesc('CreatedOn')
        .limit(8)
        .fetch()
        .then((r) => {
          if (!r.success) throw new Error(r.message);
          return r.data;
        }),
    []
  );

  const c = counts ?? {};
  const total = REQUEST_STATUSES.reduce((sum, s) => sum + (c[s] ?? 0), 0);
  const inProgress = (c.APPROVED ?? 0) + (c.PICKUP_SCHEDULED ?? 0) + (c.PICKED_UP ?? 0);
  const waitingRows = waiting ?? [];

  const stats = [
    { label: 'Waiting for review', value: c.REQUESTED ?? 0, tone: 'bg-highlight/20' },
    { label: 'In progress', value: inProgress, tone: 'bg-primary/10' },
    { label: 'Refunded', value: c.REFUNDED ?? 0, tone: 'bg-success-muted' },
    { label: 'Rejected', value: c.REJECTED ?? 0, tone: 'bg-destructive/10' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">What needs a decision today, and where everything else stands.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {error ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm">We could not load the numbers. {error.message}</p>
              <Button variant="outline" onClick={run}>Try again</Button>
            </div>
          ) : loading && counts === undefined ? (
            <StatsSkeleton count={4} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className={cn('mb-3 h-1.5 w-10 rounded-full', s.tone)} />
                    <div className="font-heading text-3xl font-semibold tabular-nums">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="font-heading text-lg font-semibold">Where requests stand</h2>
                  <span className="text-sm text-muted-foreground">{total} in total</span>
                </div>
                <ul className="space-y-3">
                  {REQUEST_STATUSES.map((s) => {
                    const n = c[s] ?? 0;
                    const pct = total ? Math.round((n / total) * 100) : 0;
                    return (
                      <li key={s} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm">
                        <span>{s.replaceAll('_', ' ')}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground">{n}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/requests"><ApperIcon name="Undo2" size={16} /> All requests</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/orders"><ApperIcon name="ShoppingBag" size={16} /> Orders</Link>
            </Button>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-card p-5 shadow-sm xl:self-start" aria-label="Needs a decision">
          <h2 className="font-heading text-lg font-semibold">Needs a decision</h2>
          <p className="mb-4 text-sm text-muted-foreground">Newest first. Open one to approve or reject it.</p>
          {waitingError ? (
            <div className="space-y-3 text-sm">
              <p>We could not load this list.</p>
              <Button variant="outline" size="sm" onClick={refetchWaiting}>Try again</Button>
            </div>
          ) : waitingLoading && waiting === undefined ? (
            <ListSkeleton rows={4} />
          ) : waitingRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <ApperIcon name="CircleCheck" size={24} className="text-success" />
              Nothing is waiting. New customer requests show up here.
            </div>
          ) : (
            <ol className="relative space-y-5 border-l border-border pl-5">
              {waitingRows.map((r) => (
                <li key={r.Id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 size-3 rounded-full border-2 border-card bg-highlight" />
                  <div className="text-xs text-muted-foreground">{formatRelativeTime(r.CreatedOn)}</div>
                  <Link to={`/requests/${r.Id}`} className="text-sm font-medium hover:underline">
                    {r.request_type_c}: {r.item_c?.Name ?? r.Name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{r.order_c?.Name}</span>
                    <span className={cn('rounded-full px-2 py-0.5', statusStyles.REQUESTED)}>{r.reason_c}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
