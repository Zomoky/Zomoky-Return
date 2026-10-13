import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import OrderForm from './OrderForm';

export const route = { path: '/orders/new', layout: 'owner', access: "profile === 'Admin_c'" };

export default function OrderNew() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/orders"><ApperIcon name="ArrowLeft" size={16} /> Back to Orders</Link>
      </Button>
      <h1 className="font-heading text-3xl font-semibold">New order</h1>
      <OrderForm />
    </div>
  );
}
