import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Spinner } from '../components/common/Spinner';

export const CartPage: React.FC = () => {
  const { cart, subtotal, isLoading, error, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="p-4 bg-sky-50 text-sky-600 rounded-full inline-block">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Cart is Waiting</h2>
        <p className="text-slate-500 text-sm">Please sign in to view and manage your shopping cart items.</p>
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition shadow-sm text-center"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition text-center"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Loading your cart...</p>
      </div>
    );
  }

  const items = cart?.items || [];

  const handleUpdateQty = async (itemId: number, currentQty: number, change: number, stock: number) => {
    const newQty = currentQty + change;
    if (newQty < 1 || newQty > stock) return;

    setUpdatingItemId(itemId);
    setActionError(null);
    try {
      await updateQuantity(itemId, newQty);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Failed to update quantity');
      }
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    setUpdatingItemId(itemId);
    setActionError(null);
    try {
      await removeItem(itemId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Failed to remove item');
      }
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6 bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
        <div className="p-4 bg-slate-100 text-slate-400 rounded-full inline-block">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Looks like you haven't added any items to your shopping cart yet.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition shadow-sm"
        >
          Explore Catalog <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const shippingCost = subtotal > 100 ? 0 : 10;
  const grandTotal = subtotal + shippingCost;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Shopping Cart</h1>
        <p className="text-slate-500 text-sm mt-1">Review your selected items before proceeding to checkout.</p>
      </div>

      {(error || actionError) && <Alert type="error" message={error || actionError || ''} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const itemPrice = Number(item.product.price);
            const itemTotal = itemPrice * item.quantity;
            const isItemUpdating = updatingItemId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-5"
              >
                {/* Product Thumbnail */}
                <Link
                  to={`/products/${item.product.id}`}
                  className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-100"
                >
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="font-bold text-slate-900 hover:text-sky-600 transition"
                  >
                    {item.product.name}
                  </Link>
                  <div className="text-sm font-semibold text-slate-700">
                    ${itemPrice.toFixed(2)} each
                  </div>
                  {item.product.stock <= item.quantity && (
                    <p className="text-xs text-amber-600 font-medium">Max stock limit reached</p>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity, -1, item.product.stock)}
                      disabled={item.quantity <= 1 || isItemUpdating}
                      className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity, 1, item.product.stock)}
                      disabled={item.quantity >= item.product.stock || isItemUpdating}
                      className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="w-24 text-right font-bold text-slate-900 text-base">
                    ${itemTotal.toFixed(2)}
                  </span>

                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={isItemUpdating}
                    className="p-2 text-slate-400 hover:text-rose-600 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-4">
            Order Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({cart?.items.length} items)</span>
              <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-slate-900">
                {shippingCost === 0 ? <span className="text-emerald-600">FREE</span> : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            {shippingCost > 0 && (
              <p className="text-xs text-slate-500 bg-sky-50 p-2.5 rounded-lg text-sky-700">
                Add ${(100 - subtotal).toFixed(2)} more to qualify for FREE shipping!
              </p>
            )}
            <div className="border-t border-slate-200 pt-3 flex justify-between font-extrabold text-base text-slate-900">
              <span>Total</span>
              <span className="text-xl text-sky-600">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/checkout')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Proceed to Checkout
          </Button>

          <div className="text-center">
            <Link to="/products" className="text-xs font-semibold text-sky-600 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
