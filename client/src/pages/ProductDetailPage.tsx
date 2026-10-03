import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Tag, ShieldCheck, Truck, Check, AlertCircle } from 'lucide-react';
import { productsApi } from '../api/products';
import { Product } from '../types/product';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { Alert } from '../components/common/Alert';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [addSuccess, setAddSuccess] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setError('Invalid product ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    productsApi
      .getById(Number(id))
      .then((data) => {
        setProduct(data.product);
      })
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { status?: number } }).response;
          if (response?.status === 404) {
            setError('Product not found');
          } else {
            setError('Failed to load product details');
          }
        } else {
          setError('Network error. Failed to load product.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!product) return;

    setIsAdding(true);
    setAddError(null);
    setAddSuccess(false);

    try {
      await addToCart(product.id, quantity);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAddError(err.message);
      } else {
        setAddError('Failed to add item to cart');
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <Alert type="error" message={error || 'Product unavailable'} />
        <div className="text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
          </Link>
        </div>
      </div>
    );
  }

  const formattedPrice = Number(product.price).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* Product Image */}
        <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400 flex flex-col items-center gap-2">
              <Tag className="w-16 h-16 stroke-[1.5]" />
              <span className="text-xs">No image preview</span>
            </div>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-rose-600 text-white font-bold text-sm uppercase px-4 py-2 rounded-full shadow-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {product.category && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                {product.category.name}
              </span>
            )}
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">{formattedPrice}</span>
              <span
                className={`text-sm font-semibold ${
                  product.stock > 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {product.stock > 0 ? `${product.stock} items available in stock` : 'Out of Stock'}
              </span>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed border-t border-b border-slate-100 py-4">
              {product.description}
            </p>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-4 pt-2">
            {addSuccess && (
              <Alert type="success" message="Added to cart successfully!" />
            )}
            {addError && <Alert type="error" message={addError} />}

            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 w-32">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 1 && val <= product.stock) {
                        setQuantity(val);
                      }
                    }}
                    className="w-full text-center bg-transparent font-semibold text-slate-900 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 font-bold"
                  >
                    +
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  isLoading={isAdding}
                  onClick={handleAddToCart}
                  leftIcon={addSuccess ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                >
                  {addSuccess ? 'Added to Cart!' : 'Add to Cart'}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                This product is currently out of stock and cannot be added to cart.
              </div>
            )}

            {/* Value Props */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" /> Fast Shipping Available
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Authenticated Quality
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
