import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { ordersApi } from '../api/orders';
import { Order, OrderStatus } from '../types/order';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    ordersApi
      .getMyOrders()
      .then((data) => setOrders(data.orders))
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load orders');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const renderStatusBadge = (status: OrderStatus) => {
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

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Fetching your order history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">My Orders</h1>
        <p className="text-slate-500 text-sm mt-1">Track and manage your past and active orders.</p>
      </div>

      {error && <Alert type="error" message={error} />}

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="p-4 bg-slate-100 text-slate-400 rounded-full inline-block">
            <Package className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Orders Yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            You haven't placed any orders yet. Start exploring our catalog!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition shadow-sm text-sm"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderTotal = order.items.reduce(
              (sum, item) => sum + Number(item.unitPrice) * item.quantity,
              0
            );

            return (
              <div
                key={order.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-sky-200 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 text-lg">
                      Order #{order.id}
                    </span>
                    {renderStatusBadge(order.status)}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>{order.items.length} item(s)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Amount</div>
                    <div className="text-lg font-bold text-sky-600">${orderTotal.toFixed(2)}</div>
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 transition"
                  >
                    Details <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
