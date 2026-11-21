import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  XCircle,
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  PackageCheck,
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

type CancelPageStatus =
  | 'verifying'
  | 'cancelled_confirmed'
  | 'already_paid'
  | 'pending_unconfirmed'
  | 'expired'
  | 'error';

export const CheckoutCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id');
  const stateOrder = (location.state as { order?: Order })?.order;

  const [order, setOrder] = useState<Order | null>(stateOrder || null);
  const [status, setStatus] = useState<CancelPageStatus>('verifying');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verificationAttemptedRef = useRef(false);

  const extractOrderId = (id: string | null): number | null => {
    if (!id) return null;
    const match = id.match(/^mock_session_(\d+)_/);
    return match ? Number(match[1]) : null;
  };

  const checkOrderCancellation = async () => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('Missing payment session identifier.');
      return;
    }

    if (!sessionId.startsWith('mock_session_')) {
      setStatus('error');
      setErrorMessage('Invalid payment session format.');
      return;
    }

    const orderId = extractOrderId(sessionId);
    if (!orderId || isNaN(orderId)) {
      setStatus('error');
      setErrorMessage('Unable to determine order ID from payment session.');
      return;
    }

    setStatus('verifying');
    setErrorMessage(null);

    try {
      // 1. Fetch current order state from backend to verify actual status
      const data = await ordersApi.getById(orderId);
      const fetchedOrder = data.order;
      setOrder(fetchedOrder);

      // 2. Ensure session ID belongs to this order
      if (fetchedOrder.paymentSessionId && fetchedOrder.paymentSessionId !== sessionId) {
        setStatus('error');
        setErrorMessage('Security warning: Session ID does not match this order.');
        return;
      }

      // 3. Inspect status
      if (fetchedOrder.status === 'CANCELLED') {
        // Backend confirmed cancellation; stock was safely restored
        setStatus('cancelled_confirmed');
      } else if (fetchedOrder.paymentStatus === 'PAID') {
        // Order is paid; cannot cancel
        setStatus('already_paid');
        setErrorMessage(`Order #${fetchedOrder.id} has already been paid and confirmed. It cannot be cancelled without refund.`);
      } else if (
        fetchedOrder.paymentExpiresAt &&
        new Date(fetchedOrder.paymentExpiresAt) <= new Date()
      ) {
        setStatus('expired');
      } else if (fetchedOrder.status === 'PENDING') {
        // Order is pending but not cancelled yet. Do NOT falsely claim stock was restored.
        setStatus('pending_unconfirmed');
      } else {
        setStatus('error');
        setErrorMessage(`Order #${fetchedOrder.id} is in status ${fetchedOrder.status}.`);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as ApiErrorResponse).response;
        if (res?.status === 401) {
          navigate('/login', { state: { from: location }, replace: true });
          return;
        }
        if (res?.data?.message) {
          setStatus('error');
          setErrorMessage(res.data.message);
          return;
        }
      }
      setStatus('error');
      setErrorMessage('Network error while checking order cancellation status.');
    }
  };

  useEffect(() => {
    if (verificationAttemptedRef.current) return;
    verificationAttemptedRef.current = true;
    checkOrderCancellation();
  }, [sessionId]);

  const handleConfirmCancellation = async () => {
    if (!sessionId || isActionLoading) return;

    setIsActionLoading(true);
    setErrorMessage(null);

    try {
      const response = await ordersApi.cancelMockPayment(sessionId);
      setOrder(response.order);
      setStatus('cancelled_confirmed');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as ApiErrorResponse).response;
        if (res?.status === 401) {
          navigate('/login', { state: { from: location }, replace: true });
          return;
        }
        if (res?.data?.message) {
          setErrorMessage(res.data.message);
          return;
        }
      }
      setErrorMessage('Failed to cancel order with the server. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-600 text-sm font-medium">Checking cancellation state with backend...</p>
      </div>
    );
  }

  // Already paid order
  if (status === 'already_paid') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full inline-block">
            <PackageCheck className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Order Already Paid</h2>
          <Alert
            type="warning"
            message={`Order #${order?.id} has already been paid and confirmed. It cannot be cancelled directly.`}
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => navigate(`/orders/${order?.id}`)}
            >
              View Order Details
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expired order
  if (status === 'expired') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full inline-block">
            <Clock className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Window Expired</h2>
          <p className="text-slate-500 text-sm">
            Order #{order?.id} was not completed within the allowed payment window.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate('/products')}>
              Browse Products
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/orders')}>
              My Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full inline-block">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Cancellation Verification Error</h2>
          <Alert type="error" message={errorMessage || 'An error occurred.'} />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                verificationAttemptedRef.current = false;
                checkOrderCancellation();
              }}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry Check
            </Button>
            <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate('/orders')}>
              Go to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pending unconfirmed cancellation: prompt user to confirm cancellation
  if (status === 'pending_unconfirmed') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full inline-block">
            <Clock className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Pending Order Cancellation</h2>
          {errorMessage && <Alert type="error" message={errorMessage} />}
          <p className="text-slate-500 text-sm leading-relaxed">
            Order #{order?.id} is currently unpaid and pending. Confirming cancellation will officially cancel the order and return all reserved items to available inventory.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              isLoading={isActionLoading}
              onClick={handleConfirmCancellation}
              leftIcon={<XCircle className="w-5 h-5" />}
            >
              Confirm Cancellation
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={isActionLoading}
              onClick={() => navigate(`/checkout/payment?session_id=${sessionId}`)}
            >
              Resume Payment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmed cancellation state
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="p-4 bg-rose-50 text-rose-500 rounded-full inline-block">
          <XCircle className="w-16 h-16" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-rose-100 text-rose-800 rounded-full">
            Cancellation Confirmed by Backend
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Checkout Was Cancelled</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Order #{order?.id} has been marked as Cancelled. The backend has returned all reserved items back to public inventory.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1.5 text-left max-w-sm mx-auto">
          {order && (
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Order Reference:</span>
              <span>#{order.id}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Order Status:</span>
            <span className="text-rose-600 font-bold">CANCELLED</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Stock Status:</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Restored
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Charges:</span>
            <span>$0.00 (No charge)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/products')}
            leftIcon={<ShoppingBag className="w-5 h-5" />}
          >
            Explore Products
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/cart')}
            leftIcon={<ShoppingCart className="w-5 h-5" />}
          >
            Go to Cart
          </Button>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/orders"
            className="text-xs font-medium text-slate-400 hover:text-sky-600 transition inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};
