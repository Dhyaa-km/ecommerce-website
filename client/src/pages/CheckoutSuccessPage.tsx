import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Package,
  ShoppingBag,
  AlertCircle,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { ordersApi } from '../api/orders';
import { Order } from '../types/order';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

type VerificationStatus =
  | 'verifying'
  | 'paid_success'
  | 'unpaid_pending'
  | 'session_expired'
  | 'cancelled'
  | 'mismatched_session'
  | 'invalid_session'
  | 'error';

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id');
  const stateOrder = (location.state as { order?: Order })?.order;

  const [order, setOrder] = useState<Order | null>(stateOrder || null);
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verificationAttemptedRef = useRef(false);

  const extractOrderId = (id: string | null): number | null => {
    if (!id) return null;
    const match = id.match(/^mock_session_(\d+)_/);
    return match ? Number(match[1]) : null;
  };

  const verifyOrder = async () => {
    if (!sessionId) {
      setStatus('invalid_session');
      setErrorMessage('No payment session reference was provided.');
      return;
    }

    if (!sessionId.startsWith('mock_session_')) {
      setStatus('invalid_session');
      setErrorMessage('Invalid payment session identifier.');
      return;
    }

    const orderId = extractOrderId(sessionId);
    if (!orderId || isNaN(orderId)) {
      setStatus('invalid_session');
      setErrorMessage('Unable to determine order ID from payment session.');
      return;
    }

    setStatus('verifying');
    setErrorMessage(null);

    try {
      // 1. Verify actual order status from the backend (Never trust URL parameters)
      const data = await ordersApi.getById(orderId);
      const fetchedOrder = data.order;
      setOrder(fetchedOrder);

      // 2. Ensure session ID belongs to the correct order
      if (fetchedOrder.paymentSessionId && fetchedOrder.paymentSessionId !== sessionId) {
        setStatus('mismatched_session');
        setErrorMessage('Security warning: The payment session ID does not match this order.');
        return;
      }

      // 3. Check for expired payment session
      const isExpired =
        fetchedOrder.paymentExpiresAt && new Date(fetchedOrder.paymentExpiresAt) <= new Date();

      // 4. Verify actual payment status
      if (fetchedOrder.paymentStatus === 'PAID' && fetchedOrder.status !== 'CANCELLED') {
        setStatus('paid_success');
      } else if (fetchedOrder.status === 'CANCELLED') {
        setStatus('cancelled');
        setErrorMessage('This order has been cancelled and cannot be confirmed as paid.');
      } else if (fetchedOrder.paymentStatus === 'UNPAID' && fetchedOrder.status === 'PENDING') {
        if (isExpired) {
          setStatus('session_expired');
          setErrorMessage('This payment session has expired (payment window exceeded). The order is unpaid.');
        } else {
          // Unpaid and pending: redirect user to mock payment screen to complete payment
          setStatus('unpaid_pending');
          navigate(`/checkout/payment?session_id=${sessionId}`, { replace: true });
        }
      } else {
        setStatus('error');
        setErrorMessage(`Unexpected order state: status ${fetchedOrder.status}, payment ${fetchedOrder.paymentStatus}.`);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as ApiErrorResponse).response;
        if (res?.status === 401) {
          navigate('/login', { state: { from: location }, replace: true });
          return;
        }
        if (res?.status === 404) {
          setStatus('error');
          setErrorMessage('Order not found or you do not have permission to view this order.');
          return;
        }
        if (res?.data?.message) {
          setStatus('error');
          setErrorMessage(res.data.message);
          return;
        }
      }
      setStatus('error');
      setErrorMessage('Network error while verifying payment status with server. Please retry.');
    }
  };

  useEffect(() => {
    if (verificationAttemptedRef.current) return;
    verificationAttemptedRef.current = true;
    verifyOrder();
  }, [sessionId]);

  // Loading state
  if (status === 'verifying') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-600 text-sm font-medium">Verifying payment status with backend...</p>
        <p className="text-slate-400 text-xs">Authenticating order transaction</p>
      </div>
    );
  }

  // Session expired state
  if (status === 'session_expired') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full inline-block">
            <Clock className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Session Expired</h2>
          <Alert type="warning" message={errorMessage || 'This payment session has expired.'} />
          <p className="text-slate-500 text-sm leading-relaxed">
            Pending orders must be paid within 30 minutes of creation. Reserved items have been released.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate('/products')}>
              Browse Catalog
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/orders')}>
              View Order History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Order cancelled state
  if (status === 'cancelled') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full inline-block">
            <XCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Order Was Cancelled</h2>
          <Alert type="error" message={errorMessage || 'This order was cancelled.'} />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate('/cart')}>
              Go to Cart
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/orders')}>
              View Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error / Invalid Session / Mismatched Session state
  if (status === 'error' || status === 'invalid_session' || status === 'mismatched_session') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full inline-block">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Verification Failed</h2>
          <Alert type="error" message={errorMessage || 'Could not verify payment session.'} />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                verificationAttemptedRef.current = false;
                verifyOrder();
              }}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry Verification
            </Button>
            <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate('/orders')}>
              Go to My Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Verified PAID Success state
  const orderTotal =
    order?.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full inline-block">
          <CheckCircle2 className="w-16 h-16" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
            Payment Verified by Backend
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Thank You for Your Order!</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Your payment has been securely confirmed. Order #{order?.id} is now confirmed and inventory has been officially deducted.
          </p>
        </div>

        {order && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <div>
                <span className="text-xs text-slate-400 uppercase font-medium">Order Reference</span>
                <div className="text-base font-bold text-slate-900">Order #{order.id}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase font-medium">Total Paid</span>
                <div className="text-base font-extrabold text-emerald-600">${orderTotal.toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-slate-600">
                  <span className="truncate pr-2">
                    {item.product?.name || `Product #${item.productId}`} × {item.quantity}
                  </span>
                  <span className="font-semibold text-slate-900 shrink-0">
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex justify-between text-xs text-slate-400">
              <span>Payment Status: <strong className="text-emerald-700">PAID</strong></span>
              <span>Order Status: <strong className="text-sky-700">{order.status}</strong></span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {order && (
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => navigate(`/orders/${order.id}`)}
              leftIcon={<Package className="w-5 h-5" />}
            >
              View Order Details
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/products')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue Shopping
          </Button>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/orders"
            className="text-xs font-medium text-slate-400 hover:text-sky-600 transition inline-flex items-center gap-1"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> View all your past orders
          </Link>
        </div>
      </div>
    </div>
  );
};
