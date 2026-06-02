import type { OrderStatus, PaymentStatus } from '../../types';

interface BadgeProps {
  status: OrderStatus | PaymentStatus;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'status-new-vibrant' },
  CONFIRMED: { label: 'Confirmed', className: 'status-confirmed-vibrant' },
  PREPARING: { label: 'Preparing', className: 'status-preparing-vibrant' },
  READY: { label: 'Ready', className: 'status-ready-vibrant' },
  SERVED: { label: 'Served', className: 'status-served-vibrant' },
  COMPLETED: { label: 'Completed', className: 'status-completed-vibrant' },
  CANCELLED: { label: 'Cancelled', className: 'status-cancelled-vibrant' },
  PENDING: { label: 'Pending', className: 'status-new-vibrant' },
  COMPLETED_PAYMENT: { label: 'Paid', className: 'status-completed-vibrant' },
  FAILED: { label: 'Failed', className: 'status-cancelled-vibrant' },
  REFUNDED: { label: 'Refunded', className: 'status-cancelled-vibrant' },
  PROCESSING: { label: 'Processing', className: 'status-preparing-vibrant' },
};

export function StatusBadge({ status }: BadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'status-new-vibrant' };

  return (
    <span className={`status-badge-vibrant ${config.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
