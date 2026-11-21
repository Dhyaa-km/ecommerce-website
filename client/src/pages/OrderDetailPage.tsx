import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Tag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { ordersApi } from '../api/orders';
import { Order, OrderStatus, PaymentStatus } from '../types/order';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setError('Invalid order ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    ordersApi
      .getById(Number(id))
      .then((data) => setOrder(data.order))
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { status?: number } }).response;
          if (response?.status === 404) {
            setError('Order not found or you do not have permission to view it.');
          } else {
            setError('Failed to load order details.');
          }
        } else {
          setError('Network error loading order.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

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

  const isPaymentResumable = (o: Order): boolean => {
    if (o.status !== 'PENDING') return false;
    if (o.paymentStatus !== 'UNPAID') return false;
    if (o.paymentExpiresAt && new Date(o.paymentExpiresAt) <= new Date()) {
      return false;
    }
    return true;
  };

  const isCancellable = (o: Order): boolean => {
    return o.status === 'PENDING' && o.paymentStatus === 'UNPAID';
  };

  const handleResumePayment = async () => {
    if (!order) return;
    setIsActionLoading(true);
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
          // If 409 session already exists, re-fetch order to retrieve session ID
          const refreshed = await ordersApi.getById(order.id);
          sessionId = refreshed.order.paymentSessionId;
        }
      }

      if (sessionId) {
        navigate(`/checkout/payment?session_id=${sessionId}`);
      } else {
        throw new Error('Unable to obtain payment session for this order.');
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
      setIsActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsActionLoading(true);
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
      setOrder(response.order);
      setIsConfirmingCancel(false);
      setActionSuccess('Order was successfully cancelled and reserved stock was restored.');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
          ? err.message
          : 'Failed to cancel order.';
      setError(message || 'Failed to cancel order.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <Alert type="error" message={error || 'Order not found'} />
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const resumable = isPaymentResumable(order);
  const cancellable = isCancellable(order);

  const isExpired =
    order.status === 'PENDING' &&
    order.paymentStatus === 'UNPAID' &&
    !!order.paymentExpiresAt &&
    new Date(order.paymentExpiresAt) <= new Date();

  const formattedExpiration = order.paymentExpiresAt
    ? {
        date: new Date(order.paymentExpiresAt).toLocaleDateString(),
        time: new Date(order.paymentExpiresAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        diffMins: Math.max(
          0,
          Math.round((new Date(order.paymentExpiresAt).getTime() - Date.now()) / 60000)
        ),
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Order #{order.id}</h1>
            <p className="text-slate-500 text-sm mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Order:</span>
              {renderOrderStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Payment:</span>
              {renderPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {actionSuccess && <Alert type="success" message={actionSuccess} />}

      {/* Pending Payment Alert & Actions Card */}
      {order.status === 'PENDING' && order.paymentStatus === 'UNPAID' && (
        <div
          className={`p-6 rounded-3xl border ${
            isExpired
              ? 'bg-amber-50 border-amber-200'
              : 'bg-sky-50 border-sky-200'
          } space-y-4 shadow-sm`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2.5 rounded-2xl ${
                isExpired ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
              } shrink-0 mt-0.5`}
            >
              {isExpired ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-slate-900 text-base">
                {isExpired ? 'Payment Window Expired' : 'Action Required: Complete Payment'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isExpired
                  ? `The payment window for this order expired on ${formattedExpiration?.date} at ${formattedExpiration?.time}. Items have been released back to stock.`
                  : `Your items are currently reserved. Please finalize payment before ${formattedExpiration?.date} at ${formattedExpiration?.time} (approx. ${formattedExpiration?.diffMins} minutes remaining).`}
              </p>
            </div>
          </div>

          {/* Cancellation Confirmation prompt */}
          {isConfirmingCancel ? (
            <div className="p-4 bg-white rounded-2xl border border-rose-200 space-y-3">
              <div className="text-xs text-rose-800">
                <strong>Confirm Cancellation:</strong> Are you sure you want to cancel Order #{order.id}? Reserved inventory will be returned to the store.
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isActionLoading}
                  onClick={handleCancelOrder}
                >
                  Yes, Cancel Order
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isActionLoading}
                  onClick={() => setIsConfirmingCancel(false)}
                >
                  Keep Order
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {resumable && (
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isActionLoading}
                  onClick={handleResumePayment}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                >
                  Continue to Payment
                </Button>
              )}

              {cancellable && (
                <Button
                  variant="outline"
                  size="md"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                  disabled={isActionLoading}
                  onClick={() => setIsConfirmingCancel(true)}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmed / Shipped / Delivered / Cancelled status note */}
      {order.status === 'CANCELLED' && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-xs text-slate-600">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>This order was cancelled. Reserved inventory was restored to stock.</span>
        </div>
      )}

      {order.paymentStatus === 'PAID' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Payment has been received and verified. Your order is processing.</span>
        </div>
      )}

      {/* Items in Order */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-sky-600" /> Items in Order
        </h3>

        <div className="divide-y divide-slate-100">
          {(order.items || []).map((item) => {
            const unitPrice = Number(item.unitPrice);
            const lineTotal = unitPrice * item.quantity;

            return (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Tag className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-base">
                      {item.product?.name || `Product #${item.productId}`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      ${unitPrice.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                </div>

                <div className="text-right font-bold text-slate-900 text-base">
                  ${lineTotal.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-2 text-sm text-right">
          <div className="text-slate-500">Total Items: {(order.items || []).length}</div>
          <div className="text-xl font-extrabold text-slate-900">
            Order Total:{' '}
            <span className="text-sky-600">
              $
              {(order.items || [])
                .reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
