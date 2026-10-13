export const ORDER_STATUSES = ['Placed', 'Shipped', 'Delivered', 'Cancelled'];

export const orderStatusStyles = {
  Placed: 'bg-highlight/20 text-foreground',
  Shipped: 'bg-primary/10 text-primary',
  Delivered: 'bg-success-muted text-success',
  Cancelled: 'bg-muted text-muted-foreground',
};

export const money = (v) => `₹${Number(v ?? 0).toLocaleString('en-IN')}`;
