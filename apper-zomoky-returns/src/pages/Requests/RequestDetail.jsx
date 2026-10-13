import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import { getTableAccess } from '@/services/userPermissions';
import ApperIcon from '@/components/ApperIcon';
import FilePicker from '@/components/FilePicker';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { REQUEST_NEXT_STATUSES, REQUEST_STAGES, REQUEST_STATUS_GUIDANCE, statusStyles } from './requestMeta';

export const route = { path: '/requests/:id', layout: 'owner', access: 'authenticated' };

const FIELDS = ['Name', 'request_id_c', 'order_c', 'item_c', 'request_type_c', 'requested_quantity_c', 'reason_c', 'reason_details_c', 'resolution_c', 'refund_method_c', 'refund_details_c', 'pickup_address_c', 'pickup_confirmed_c', 'exchange_variant_c', 'notes_c', 'contact_c', 'status_c', 'photo_required_c', 'photo_metadata_c', 'eligibility_snapshot_c', 'customer_updated_on_c', 'CreatedOn'];

function Row({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[10rem_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children || '—'}</dd>
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { canUpdate, canDelete } = getTableAccess(profile, 'return_requests_c');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  const { data, loading, error, run } = useFetch(
    () => sdk.table('return_requests_c').select(FIELDS).get(id).then((r) => r.data),
    [id]
  );

  const nextStatuses = data ? REQUEST_NEXT_STATUSES[data.status_c] ?? [] : [];
  const stageIndex = data ? REQUEST_STAGES.indexOf(data.status_c) : -1;

  async function changeStatus(next) {
    setSaving(true);
    try {
      const res = await sdk.table('return_requests_c').update({ Id: data.Id, status_c: next });
      if (res.messages?.length) {
        toast.error(res.messages[0]);
      }
      if (!res.data?.length) return;
      toast.success(`Status changed to ${next}`);
      run();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const res = await sdk.table('return_requests_c').remove([data.Id]);
      if (res.messages?.length) {
        toast.error(res.messages[0]);
        return;
      }
      toast.success('Request deleted');
      navigate('/requests');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/requests"><ApperIcon name="ArrowLeft" size={16} /> Back to Requests</Link>
      </Button>

      {loading && data === undefined ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm">We could not load this request.</p>
          <Button variant="outline" onClick={run}>Try again</Button>
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          This request does not exist or was deleted.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl font-semibold">{data.request_id_c ?? data.Name}</h1>
              <p className="text-sm text-muted-foreground">{data.request_type_c} · received {formatLocalDate(data.CreatedOn, DATE_FORMATS.SHORT)}</p>
            </div>
            <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-medium', statusStyles[data.status_c])}>
              {data.status_c}
            </span>
          </div>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-lg font-semibold">Return process</h2>
            {data.status_c === 'REJECTED' ? (
              <div className="space-y-2">
                <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-medium', statusStyles.REJECTED)}>REJECTED</span>
                <p className="text-sm text-muted-foreground">{REQUEST_STATUS_GUIDANCE.REJECTED}</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">{REQUEST_STATUS_GUIDANCE[data.status_c]}</p>
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Return request stages">
                  {REQUEST_STAGES.map((status, index) => {
                    const complete = index < stageIndex || data.status_c === 'COMPLETED';
                    const current = status === data.status_c;
                    return (
                      <li key={status} aria-current={current ? 'step' : undefined} className="flex items-start gap-2 text-sm">
                        <span className={cn('mt-0.5 flex size-6 flex-none items-center justify-center rounded-full border text-xs font-semibold', complete ? 'border-primary bg-primary text-primary-foreground' : current ? 'border-primary text-primary' : 'border-border text-muted-foreground')}>
                          {complete ? <ApperIcon name="Check" size={13} /> : index + 1}
                        </span>
                        <span className={current ? 'font-semibold' : 'text-muted-foreground'}>{status}</span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-lg font-semibold">Request</h2>
            <dl>
              <Row label="Order">{data.order_c?.Name}</Row>
              <Row label="Item">{data.item_c?.Name}</Row>
              <Row label="Request type">{data.request_type_c}</Row>
              <Row label="Quantity">{data.requested_quantity_c}</Row>
              <Row label="Reason">{data.reason_c}</Row>
              <Row label="Reason details">{data.reason_details_c || data.notes_c}</Row>
              <Row label="Resolution">{data.resolution_c}</Row>
              <Row label="Refund method">{data.refund_method_c}</Row>
              <Row label="Refund details">{data.refund_details_c}</Row>
              <Row label="Exchange variant">{data.exchange_variant_c}</Row>
              <Row label="Pickup address">{data.pickup_address_c}</Row>
              <Row label="Pickup confirmed">{data.pickup_confirmed_c ? 'Yes' : 'No'}</Row>
              <Row label="Contact">{data.contact_c}</Row>
              <Row label="Eligibility snapshot">{data.eligibility_snapshot_c}</Row>
              <Row label="Customer updated">{data.customer_updated_on_c ? formatLocalDate(data.customer_updated_on_c, DATE_FORMATS.SHORT) : null}</Row>
            </dl>
          </section>

          {data.photo_metadata_c && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3">
                <h2 className="font-heading text-lg font-semibold">Supporting photos</h2>
                <p className="text-sm text-muted-foreground">Evidence uploaded by the customer for damaged, defective, wrong-item or similar requests.</p>
              </div>
              <FilePicker
                value={(() => { try { return JSON.parse(data.photo_metadata_c); } catch { return []; } })()}
                readOnly
              />
            </section>
          )}

          {canUpdate && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 font-heading text-lg font-semibold">Move it forward</h2>
              <div className="flex items-center gap-3">
                {nextStatuses.length > 0 ? (
                  <Select
                    value={data.status_c}
                    onValueChange={(next) => next === 'REJECTED' ? setConfirmReject(true) : changeStatus(next)}
                    disabled={saving}
                  >
                    <SelectTrigger className="w-60" aria-label="Move request to next step">
                      <SelectValue placeholder="Choose next step" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={data.status_c} disabled>Current: {data.status_c}</SelectItem>
                      {nextStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">This request is closed.</p>
                )}
                {saving && <ApperIcon name="LoaderCircle" size={16} className="animate-spin text-muted-foreground" />}
              </div>
            </section>
          )}

          {canUpdate && (
            <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject {data.Name}?</AlertDialogTitle>
                  <AlertDialogDescription>This closes the request. Make sure the customer has a clear reason before you continue.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep request open</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setConfirmReject(false); changeStatus('REJECTED'); }}>Reject request</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {canDelete && (
            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive" disabled={deleting}>
                    <ApperIcon name="Trash2" size={16} /> Delete request
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {data.Name}?</AlertDialogTitle>
                    <AlertDialogDescription>This removes the request for good. The order stays as it is.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep request</AlertDialogCancel>
                    <AlertDialogAction onClick={remove}>{deleting ? 'Deleting…' : 'Delete request'}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </>
      )}
    </div>
  );
}
