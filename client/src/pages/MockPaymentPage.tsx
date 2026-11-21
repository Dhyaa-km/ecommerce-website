import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowLeft,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { ordersApi } from '../api/orders';
import { Order } from '../types/order';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Spinner } from '../components/common/Spinner';

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export const MockPaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAttemptedRef = useRef(false);

  // Extract orderId from mock session ID (format: mock_session_{orderId}_{timestamp})
  const extractOrderId = (id: string | null): number | null => {
    if (!id) return null;
    const match = id.match(/^mock_session_(\d+)_/);
    return match ? Number(match[1]) : null;
  };

  useEffect(() => {
    if (fetchAttemptedRef.current) return;
    fetchAttemptedRef.current = true;

    if (!sessionId) {
      setError('Missing payment session ID. Please initiate checkout from your cart.');
      setIsLoadingOrder(false);
      return;
    }

    if (!sessionId.startsWith('mock_session_')) {
      setError('Invalid mock session format.');
      setIsLoadingOrder(false);
      return;
    }

    const orderId = extractOrderId(sessionId);
    if (!orderId || isNaN(orderId)) {
      setError('Invalid order reference in payment session.');
      setIsLoadingOrder(false);
      return;
    }

    // Fetch order details to display payment amount, items, and verify status
    ordersApi
      .getById(orderId)
      .then((data) => {
        const fetchedOrder = data.order;
        setOrder(fetchedOrder);

        // Security check: ensure session ID matches order's recorded session ID
        if (fetchedOrder.paymentSessionId && fetchedOrder.paymentSessionId !== sessionId) {
          setError('Security warning: Session ID does not match this order.');
          return;
        }

        // If order is already paid, navigate directly to verified success page
        if (fetchedOrder.paymentStatus === 'PAID') {
          navigate(`/checkout/success?session_id=${sessionId}`, {
            state: { order: fetchedOrder },
            replace: true,
          });
          return;
        }

        // If order is already cancelled, navigate directly to cancellation page
        if (fetchedOrder.status === 'CANCELLED') {
          navigate(`/checkout/cancel?session_id=${sessionId}`, {
            state: { order: fetchedOrder },
            replace: true,
          });
          return;
        }

        // Check if order payment window expired
        if (
          fetchedOrder.paymentExpiresAt &&
          new Date(fetchedOrder.paymentExpiresAt) <= new Date()
        ) {
          setError('This payment session has expired (30-minute limit exceeded). The order can no longer be processed.');
        }
      })
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && 'response' in err) {
          const res = (err as ApiErrorResponse).response;
          if (res?.status === 401) {
            navigate('/login', { state: { from: location }, replace: true });
            return;
          }
          if (res?.data?.message) {
            setError(res.data.message);
            return;
          }
        }
        setError('Network error while retrieving order details.');
      })
      .finally(() => {
        setIsLoadingOrder(false);
      });
  }, [sessionId, navigate, location]);

  const extractErrorMessage = (err: unknown): { message: string; status?: number } => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as ApiErrorResponse;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;
      return {
        message: message || (status === 401 ? 'Session expired. Please log in again.' : 'Payment request failed.'),
        status,
      };
    }
    if (err instanceof Error) {
      return { message: err.message };
    }
    return { message: 'Network error communicating with payment backend.' };
  };

  const handleConfirmPayment = async () => {
    if (!sessionId || actionLoading) return;

    setActionLoading('confirm');
    setError(null);

    try {
      const response = await ordersApi.confirmMockPayment(sessionId);
      navigate(`/checkout/success?session_id=${sessionId}`, {
        state: { order: response.order },
        replace: true,
      });
    } catch (err: unknown) {
      setActionLoading(null);
      const { message, status } = extractErrorMessage(err);
      if (status === 401) {
        navigate('/login', { state: { from: location }, replace: true });
        return;
      }
      setError(message);
    }
  };

  const handleCancelPayment = async () => {
    if (!sessionId || actionLoading) return;

    setActionLoading('cancel');
    setError(null);

    try {
      const response = await ordersApi.cancelMockPayment(sessionId);
      navigate(`/checkout/cancel?session_id=${sessionId}`, {
        state: { order: response.order },
        replace: true,
      });
    } catch (err: unknown) {
      setActionLoading(null);
      const { message, status } = extractErrorMessage(err);
      if (status === 401) {
        navigate('/login', { state: { from: location }, replace: true });
        return;
      }
      setError(message);
    }
  };

  if (!sessionId) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Alert type="error" message="No active payment session was found." />
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Cart
        </Link>
      </div>
    );
  }

  if (isLoadingOrder) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Loading mock payment gateway...</p>
      </div>
    );
  }

  const orderTotal =
    order?.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0
    ) || 0;

  const isExpired =
    !!order?.paymentExpiresAt && new Date(order.paymentExpiresAt) <= new Date();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Simulation Banner */}
      <div className="bg-amber-50 border-2 border-dashed border-amber-300 p-5 rounded-2xl flex items-start gap-4">
        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full">
              Development Simulator
            </span>
            <span className="text-xs text-amber-700 font-medium">Non-production mode</span>
          </div>
          <h2 className="text-base font-bold text-amber-900">
            Mock Payment Gateway
          </h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            This screen simulates a third-party checkout provider (e.g. Stripe Hosted Checkout). No real credit card or funds are required. Choose an action below to test the corresponding order lifecycle flow.
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        {/* Payment Action Panel */}
        <div className="md:col-span-3 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Payment Simulation</h3>
                <p className="text-xs text-slate-500">ShopNest Test Gateway</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
              USD
            </span>
          </div>

          {/* Simulated Card Preview */}
          <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-inner space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs tracking-wider text-slate-400 uppercase font-mono">
                Test Credit Card
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                MOCK CARD
              </span>
            </div>
            <div className="text-lg sm:text-xl font-mono tracking-widest text-slate-200">
              4242 •••• •••• 4242
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <div>
                <span className="block text-[10px] text-slate-500">EXPIRES</span>
                12 / 28
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">CVC</span>
                123
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">NAME</span>
                TEST BUYER
              </div>
            </div>
          </div>

          {/* Session Metadata */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <div className="text-slate-400 font-medium">Session ID</div>
            <div className="font-mono text-slate-700 truncate" title={sessionId}>
              {sessionId}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white"
              isLoading={actionLoading === 'confirm'}
              disabled={!!actionLoading || isExpired}
              onClick={handleConfirmPayment}
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
            >
              {actionLoading === 'confirm' ? 'Confirming Payment...' : `Confirm Payment ($${orderTotal.toFixed(2)})`}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
              isLoading={actionLoading === 'cancel'}
              disabled={!!actionLoading}
              onClick={handleCancelPayment}
              leftIcon={<XCircle className="w-5 h-5" />}
            >
              {actionLoading === 'cancel' ? 'Cancelling Payment...' : 'Cancel Payment & Release Stock'}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>Simulating secure checkout transaction</span>
          </div>
        </div>

        {/* Order Details Sidebar */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <h4 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-sky-600" />
            Order #{order?.id || '—'}
          </h4>

          {order ? (
            <div className="space-y-4">
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between gap-2 text-sm">
                    <div>
                      <div className="font-medium text-slate-800 line-clamp-1">
                        {item.product?.name || `Product #${item.productId}`}
                      </div>
                      <div className="text-xs text-slate-400">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold text-slate-900 shrink-0">
                      ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Status</span>
                  <span className="font-medium text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending Payment
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Due</span>
                  <span className="text-sky-600">${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Order details are not available for this session.</p>
          )}

          <div className="pt-2 text-center">
            <Link
              to="/orders"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
