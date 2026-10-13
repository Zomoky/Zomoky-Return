import { Link, useSearchParams } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';

export const route = {
  path: '/checkout/thank-you',
  layout: 'public',
  access: 'public',
};

export default function CheckoutThankYou() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || 'ZM-TEST-000000';
  const payment = searchParams.get('payment') === 'prepaid' ? 'Prepaid' : 'Cash on Delivery';

  return (
    <div className="min-h-svh bg-[#faf9f7]">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <div className="font-heading text-xl font-semibold tracking-tight">ZOMOKY</div>
            <div className="text-xs text-muted-foreground">Order confirmation</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ApperIcon name="ShieldCheck" size={14} /> Secure</div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 md:py-16">
        <section className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm md:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-muted text-success">
            <ApperIcon name="Check" size={30} />
          </div>
          <p className="mt-5 text-sm font-medium text-success">Order Confirmed</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">Thank you for your order!</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Your order has been received successfully. We will keep you updated on your registered mobile number.</p>

          <div className="mt-7 rounded-xl border border-border bg-muted/30 p-4 text-left">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Order number</span>
              <span className="font-semibold">{orderId}</span>
            </div>
            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">{payment}</span>
            </div>
            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Expected delivery</span>
              <span className="font-medium">4–7 working days</span>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button asChild><Link to="/track">Track Order</Link></Button>
            <Button variant="outline" asChild><Link to="/">Continue Shopping</Link></Button>
          </div>

          <div className="mt-7 border-t border-border pt-6 text-xs text-muted-foreground">
            Need help? <a className="font-medium text-foreground underline-offset-4 hover:underline" href="mailto:support@zomoky.shop">support@zomoky.shop</a>
          </div>
        </section>
      </main>
    </div>
  );
}
