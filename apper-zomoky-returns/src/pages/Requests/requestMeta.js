export const REQUEST_STATUSES = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'PICKUP_ATTEMPTED', 'PICKED_UP', 'QUALITY_CHECK', 'REFUND_PENDING', 'REFUNDED', 'REPLACEMENT_PROCESSING', 'REPLACEMENT_SHIPPED', 'COMPLETED', 'CANCELLED'];

export const REQUEST_STAGES = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'QUALITY_CHECK', 'REFUND_PENDING', 'REFUNDED', 'COMPLETED'];

export const REQUEST_NEXT_STATUSES = {
  REQUESTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['PICKUP_SCHEDULED', 'REPLACEMENT_PROCESSING', 'CANCELLED'],
  PICKUP_SCHEDULED: ['PICKUP_ATTEMPTED', 'PICKED_UP'],
  PICKUP_ATTEMPTED: ['PICKUP_SCHEDULED', 'PICKED_UP'],
  PICKED_UP: ['QUALITY_CHECK'],
  QUALITY_CHECK: ['REFUND_PENDING', 'REPLACEMENT_PROCESSING', 'REJECTED'],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: ['COMPLETED'],
  REPLACEMENT_PROCESSING: ['REPLACEMENT_SHIPPED'],
  REPLACEMENT_SHIPPED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

export const REQUEST_STATUS_GUIDANCE = {
  REQUESTED: 'The customer submitted this request. Start by reviewing the order, item, reason, and supporting details.',
  UNDER_REVIEW: 'Verify eligibility and evidence before approving or rejecting the request.',
  APPROVED: 'The request is approved. Schedule a pickup or start the replacement process.',
  REJECTED: 'The request is closed. Record a clear reason before communicating with the customer.',
  PICKUP_SCHEDULED: 'Pickup is scheduled. Confirm collection once the courier has the item.',
  PICKUP_ATTEMPTED: 'The courier attempted pickup. Reschedule or mark the item as picked up.',
  PICKED_UP: 'The item is with the courier. Move it to quality check when it reaches the return facility.',
  QUALITY_CHECK: 'Inspect the returned item and continue with a refund or replacement.',
  REFUND_PENDING: 'The refund is being processed. Mark it refunded when confirmation is received.',
  REFUNDED: 'Refund has been issued. Complete the request once no further action is needed.',
  REPLACEMENT_PROCESSING: 'Prepare the replacement item and move it to shipped when dispatched.',
  REPLACEMENT_SHIPPED: 'Replacement is on the way. Complete when delivery is confirmed.',
  COMPLETED: 'This request is complete. No further action is needed.',
  CANCELLED: 'The cancellation is complete. No further action is needed.',
};

export const REQUEST_TYPES = ['Return', 'Replacement', 'Cancellation'];

export const REASONS = [
  'Does not fit',
  'Damaged on arrival',
  'Wrong item received',
  'Product defective',
  'Not as described',
  'Changed my mind',
];

export const statusStyles = {
  REQUESTED: 'bg-highlight/20 text-foreground',
  UNDER_REVIEW: 'bg-primary/10 text-primary',
  APPROVED: 'bg-primary/10 text-primary',
  REJECTED: 'bg-destructive/10 text-destructive',
  PICKUP_SCHEDULED: 'bg-primary/10 text-primary',
  PICKUP_ATTEMPTED: 'bg-highlight/20 text-foreground',
  PICKED_UP: 'bg-secondary text-secondary-foreground',
  QUALITY_CHECK: 'bg-secondary text-secondary-foreground',
  REFUND_PENDING: 'bg-highlight/20 text-foreground',
  REFUNDED: 'bg-success-muted text-success',
  REPLACEMENT_PROCESSING: 'bg-primary/10 text-primary',
  REPLACEMENT_SHIPPED: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-success-muted text-success',
  CANCELLED: 'bg-secondary text-secondary-foreground',
};
