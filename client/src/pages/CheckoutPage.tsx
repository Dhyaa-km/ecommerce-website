import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, ShoppingBag, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ordersApi } from '../api/orders';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, fetchCart } = useCart();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ordersApi.create();
      // Refresh cart context (since cart is cleared on order creation by backend)
      await fetchCart();
      // Redirect to order details
      navigate(`/orders/${response.order.id}`, { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.data?.message) {
          setError(response.data.message);
        } else {
          setError('Failed to place order. Please try again.');
        }
      } else {
        setError('Network error. Failed to communicate with order server.');
      }
    } finally {
      setIsLoading(false);
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
        <p className="text-slate-500 text-sm mt-1">Review your order details and confirm your purchase.</p>
      </div>

      {error && <Alert type="error" message={error} />}

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
            leftIcon={<CheckCircle className="w-5 h-5" />}
          >
            Confirm & Place Order
          </Button>

          <p className="text-xs text-slate-400 text-center">
            By confirming, your order will be created and inventory reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
