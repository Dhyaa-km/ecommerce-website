import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Tag } from 'lucide-react';
import { Product } from '../../types/product';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  const formattedPrice = Number(product.price).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setAddError('Please sign in to add items to cart');
      setTimeout(() => setAddError(null), 3000);
      return;
    }

    setIsAdding(true);
    setAddError(null);
    try {
      await addToCart(product.id, 1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAddError(err.message);
      } else {
        setAddError('Failed to add');
      }
      setTimeout(() => setAddError(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col h-full">
      <Link to={`/products/${product.id}`} className="block relative aspect-square bg-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Tag className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}

        {product.category && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
            {product.category.name}
          </span>
        )}

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1 space-y-2">
          <Link
            to={`/products/${product.id}`}
            className="font-semibold text-slate-900 group-hover:text-sky-600 transition line-clamp-1 block text-base"
          >
            {product.name}
          </Link>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-slate-900">{formattedPrice}</span>
            <div className="text-xs text-slate-400 mt-0.5">
              {product.stock > 0 ? (
                <span className="text-emerald-600 font-medium">{product.stock} in stock</span>
              ) : (
                <span className="text-rose-500 font-medium">Unavailable</span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant={product.stock > 0 ? 'primary' : 'outline'}
            disabled={product.stock <= 0}
            isLoading={isAdding}
            onClick={handleAddToCart}
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
          >
            Add
          </Button>
        </div>

        {addError && (
          <p className="text-xs text-rose-600 mt-2 font-medium text-center">{addError}</p>
        )}
      </div>
    </div>
  );
};
