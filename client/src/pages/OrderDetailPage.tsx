import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Tag } from 'lucide-react';
import { ordersApi } from '../api/orders';
import { Order, OrderStatus } from '../types/order';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            setError('Order not found');
          } else {
            setError('Failed to load order details');
          }
        } else {
          setError('Network error');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">Confirmed</Badge>;
      case 'SHIPPED':
        return <Badge variant="info">Shipped</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  if (error || !order) {
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
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div>{renderStatusBadge(order.status)}</div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-sky-600" /> Items in Order
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => {
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
          <div className="text-slate-500">Total Items: {order.items.length}</div>
          <div className="text-xl font-extrabold text-slate-900">
            Order Total:{' '}
            <span className="text-sky-600">
              $
              {order.items
                .reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
