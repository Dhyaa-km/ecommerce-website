import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, ShoppingBag, CreditCard, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ordersApi } from '../api/orders';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdOrderLink, setCreatedOrderLink] = useState<{ id: number } | null>(null);

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Alert type="warning" message="Your cart is empty. Please add items before checking out." />
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Products
        </Link>
      </div>
    );
  }

  const shippingCost = subtotal > 100 ? 0 : 10;
  const grandTotal = subtotal + shippingCost;

  const extractErrorMessage = (err: unknown): { message: string; status?: number } => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as ApiErrorResponse;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;
      return {
        message:
          message ||
          (status === 401
            ? 'Your session has expired. Please sign in again.'
            : 'An unexpected error occurred during checkout.'),
        status,
      };
    }

    if (err instanceof Error) {
      return { message: err.message };
    }

    return { message: 'Network error. Failed to communicate with the server.' };
  };

  const handlePlaceOrder = async () => {
    // 5. Prevent duplicate submissions while checkout is processing
    if (isLoading) return;

    // 1. Validate that the cart contains items
    if (!items || items.length === 0) {
      setError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Creating your order...');
    setError(null);
    setCreatedOrderLink(null);

    let createdOrderId: number | null = null;

    try {
      // 2. Create the order using the existing order creation API
      const orderResponse = await ordersApi.create();
      createdOrderId = orderResponse.order.id;

      // Refresh cart context (since cart items are cleared on order creation by backend)
      await fetchCart();

      // 3. Use the returned order ID to request a checkout session
      setLoadingStep('Initializing payment session...');
      const checkoutResponse = await ordersApi.createCheckoutSession(createdOrderId);

      // 4. Handle the returned checkout URL and navigate the user to it
      if (!checkoutResponse.checkoutUrl) {
        throw new Error('Checkout session URL was not returned by the payment server.');
      }

      setLoadingStep('Redirecting to payment...');
      const sessionMatch = checkoutResponse.checkoutUrl.match(/session_id=([^&]+)/);
      if (sessionMatch) {
        navigate(`/checkout/payment?session_id=${sessionMatch[1]}`);
      } else {
        window.location.assign(checkoutResponse.checkoutUrl);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setLoadingStep(null);

      const { message, status } = extractErrorMessage(err);

      // 7. Handle authentication errors and expired sessions appropriately
      if (status === 401) {
        setError('Your session has expired. Redirecting to login...');
        navigate('/login', { state: { from: location }, replace: true });
        return;
      }

      // If the order was created but requesting the checkout session failed
      if (createdOrderId) {
        setCreatedOrderLink({ id: createdOrderId });
        setError(
          `Order #${createdOrderId} was created, but we could not redirect to payment (${message}). You can review your order under My Orders.`
        );
      } else {
        // 6. Display appropriate loading and error states
        setError(message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900">Checkout Confirmation</h1>
        <p className="text-slate-500 text-sm mt-1">Review your order details and proceed to secure payment.</p>
      </div>

      {error && (
        <div className="space-y-2">
          <Alert type="error" message={error} />
          {createdOrderLink && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Link
                to={`/orders/${createdOrderLink.id}`}
                className="text-sm font-semibold text-sky-600 hover:underline"
              >
                View Order #{createdOrderLink.id} in Order History &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Order Items Review */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-sky-600" /> Items in Your Order
            </h3>

            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const itemPrice = Number(item.product.price);
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 overflow-hidden border">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{item.product.name}</h4>
                        <p className="text-xs text-slate-500">Qty: {item.quantity} × ${itemPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      ${(itemPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex items-start gap-3 text-sm text-sky-900">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Transactional Stock Protection</h4>
              <p className="text-xs text-sky-800 mt-0.5">
                Our backend instantly validates inventory during order processing to reserve your items atomically.
              </p>
            </div>
          </div>
        </div>

        {/* Total Summary & Confirm Button */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-fit">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">
            Payment Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">
                {shippingCost === 0 ? <span className="text-emerald-600">FREE</span> : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-900">
              <span>Total Amount</span>
              <span className="text-xl text-sky-600">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            onClick={handlePlaceOrder}
            leftIcon={isLoading ? undefined : <CreditCard className="w-5 h-5" />}
          >
            {isLoading ? loadingStep || 'Processing...' : 'Proceed to Payment'}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted checkout session</span>
          </div>

          <p className="text-xs text-slate-400 text-center">
            By proceeding, your order will be created and you will be redirected to the payment gateway.
          </p>
        </div>
      </div>
    </div>
  );
};
