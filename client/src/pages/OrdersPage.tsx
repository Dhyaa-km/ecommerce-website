import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { ordersApi } from '../api/orders';
import { Order, OrderStatus, PaymentStatus } from '../types/order';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [activeActionOrderId, setActiveActionOrderId] = useState<number | null>(null);
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    ordersApi
      .getMyOrders()
      .then((data) => setOrders(data.orders))
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load orders');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const renderOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="info" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </Badge>
        );
      case 'SHIPPED':
        return (
          <Badge variant="info" className="gap-1">
            <Truck className="w-3 h-3" /> Shipped
          </Badge>
        );
      case 'DELIVERED':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderPaymentStatusBadge = (status?: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge variant="success" className="gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </Badge>
        );
      case 'UNPAID':
        return (
          <Badge variant="warning" className="gap-1 font-semibold">
            <Clock className="w-3 h-3" /> Unpaid
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="danger" className="gap-1 font-semibold">
            <AlertCircle className="w-3 h-3" /> Failed
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge variant="default" className="gap-1 font-semibold">
            <RotateCcw className="w-3 h-3" /> Refunded
          </Badge>
        );
      default:
        return <Badge>{status || 'Unpaid'}</Badge>;
    }
  };

  const isPaymentResumable = (order: Order): boolean => {
    if (order.status !== 'PENDING') return false;
    if (order.paymentStatus !== 'UNPAID') return false;
    if (order.paymentExpiresAt && new Date(order.paymentExpiresAt) <= new Date()) {
      return false;
    }
    return true;
  };

  const isCancellable = (order: Order): boolean => {
    return order.status === 'PENDING' && order.paymentStatus === 'UNPAID';
  };

  const handleResumePayment = async (order: Order) => {
    setActiveActionOrderId(order.id);
    setError(null);
    setActionSuccess(null);

    try {
      let sessionId = order.paymentSessionId;

      if (!sessionId) {
        try {
          const sessionRes = await ordersApi.createCheckoutSession(order.id);
          const match = sessionRes.checkoutUrl.match(/session_id=([^&]+)/);
          if (match) {
            sessionId = match[1];
          } else {
            window.location.assign(sessionRes.checkoutUrl);
            return;
          }
        } catch {
          // If conflict 409 session already exists, reload order details
          const refreshed = await ordersApi.getById(order.id);
          sessionId = refreshed.order.paymentSessionId;
        }
      }

      if (sessionId) {
        navigate(`/checkout/payment?session_id=${sessionId}`);
      } else {
        throw new Error('Unable to retrieve payment session for this order.');
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
          ? err.message
          : 'Failed to resume payment session.';
      setError(message || 'Failed to resume payment session.');
    } finally {
      setActiveActionOrderId(null);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    setActiveActionOrderId(order.id);
    setError(null);
    setActionSuccess(null);

    try {
      let sessionId = order.paymentSessionId;

      if (!sessionId) {
        try {
          const sessionRes = await ordersApi.createCheckoutSession(order.id);
          const match = sessionRes.checkoutUrl.match(/session_id=([^&]+)/);
          sessionId = match ? match[1] : null;
        } catch {
          const refreshed = await ordersApi.getById(order.id);
          sessionId = refreshed.order.paymentSessionId;
        }
      }

      if (!sessionId) {
        throw new Error('No active payment session was found to cancel.');
      }

      const response = await ordersApi.cancelMockPayment(sessionId);

      // Update order status in place with backend verified response
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: response.order.status } : o))
      );

      setConfirmCancelOrderId(null);
      setActionSuccess(`Order #${order.id} was successfully cancelled and stock was restored.`);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
          ? err.message
          : 'Failed to cancel order.';
      setError(message || 'Failed to cancel order.');
    } finally {
      setActiveActionOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Fetching your order history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">My Orders</h1>
        <p className="text-slate-500 text-sm mt-1">Track and manage your past and active orders.</p>
      </div>

      {error && <Alert type="error" message={error} />}
      {actionSuccess && <Alert type="success" message={actionSuccess} />}

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="p-4 bg-slate-100 text-slate-400 rounded-full inline-block">
            <Package className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Orders Yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            You haven't placed any orders yet. Start exploring our catalog!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition shadow-sm text-sm"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = order.items || [];
            const orderTotal = items.reduce(
              (sum, item) => sum + Number(item.unitPrice) * item.quantity,
              0
            );

            const resumable = isPaymentResumable(order);
            const cancellable = isCancellable(order);
            const isActionLoading = activeActionOrderId === order.id;
            const isConfirmingCancel = confirmCancelOrderId === order.id;

            const isExpired =
              order.status === 'PENDING' &&
              order.paymentStatus === 'UNPAID' &&
              !!order.paymentExpiresAt &&
              new Date(order.paymentExpiresAt) <= new Date();

            return (
              <div
                key={order.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-sky-200 transition"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-extrabold text-slate-900 text-lg">
                        Order #{order.id}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400">Order:</span>
                        {renderOrderStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400">Payment:</span>
                        {renderPaymentStatusBadge(order.paymentStatus)}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span>{items.length} item(s)</span>
                      {isExpired && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">Payment window expired</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Amount</div>
                      <div className="text-lg font-bold text-sky-600">${orderTotal.toFixed(2)}</div>
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 transition"
                    >
                      Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Inline cancellation confirmation */}
                {isConfirmingCancel && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-800">
                    <div>
                      <strong>Are you sure you want to cancel Order #{order.id}?</strong>
                      <span className="block text-rose-700 text-[11px]">
                        Reserved items will be restored to available inventory.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() => handleCancelOrder(order)}
                      >
                        Yes, Cancel Order
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isActionLoading}
                        onClick={() => setConfirmCancelOrderId(null)}
                      >
                        Nevermind
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action buttons for pending/unpaid orders */}
                {(resumable || cancellable) && !isConfirmingCancel && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
                    {resumable && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() => handleResumePayment(order)}
                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                      >
                        Continue Payment
                      </Button>
                    )}

                    {cancellable && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        disabled={isActionLoading}
                        onClick={() => setConfirmCancelOrderId(order.id)}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
