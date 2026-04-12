import type { OrderStatus, PaymentStatus } from '../../types';

interface BadgeProps {
  status: OrderStatus | PaymentStatus;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'status-new' },
  CONFIRMED: { label: 'Confirmed', className: 'status-confirmed' },
  PREPARING: { label: 'Preparing', className: 'status-preparing' },
  READY: { label: 'Ready', className: 'status-ready' },
  SERVED: { label: 'Served', className: 'status-served' },
  COMPLETED: { label: 'Completed', className: 'status-completed' },
  CANCELLED: { label: 'Cancelled', className: 'status-cancelled' },
  PENDING: { label: 'Pending', className: 'status-new' },
  COMPLETED_PAYMENT: { label: 'Paid', className: 'status-completed' },
  FAILED: { label: 'Failed', className: 'status-cancelled' },
  REFUNDED: { label: 'Refunded', className: 'status-cancelled' },
  PROCESSING: { label: 'Processing', className: 'status-preparing' },
};

export function StatusBadge({ status }: BadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'status-new' };

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
