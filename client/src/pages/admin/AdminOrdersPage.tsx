import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { Order, OrderStatus } from '../../types/order';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';

const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await ordersApi.getAll();
      setOrders(data.orders);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch orders');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setError(null);
    setSuccessMsg(null);

    try {
      await ordersApi.updateStatus(orderId, { status: newStatus });
      setSuccessMsg(`Order #${orderId} status updated to ${newStatus}`);
      await fetchOrders();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.status === 409) {
          setError(`Invalid status transition for Order #${orderId}`);
        } else if (response?.data?.message) {
          setError(response.data.message);
        } else {
          setError('Failed to update status');
        }
      } else {
        setError('Network error');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900">Store Order Fulfillment</h1>
        <p className="text-slate-500 text-sm mt-1">Review all customer orders and update status progression.</p>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No orders placed in store yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map((o) => {
                  const isUpdating = updatingId === o.id;
                  const total = o.items.reduce(
                    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
                    0
                  );

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-900">#{o.id}</td>
                      <td className="p-4 text-slate-700">
                        {o.user ? (
                          <div>
                            <div className="font-semibold">{o.user.name}</div>
                            <div className="text-xs text-slate-400">{o.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">User #{o.userId}</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-medium text-slate-700">{o.items.length}</td>
                      <td className="p-4 font-bold text-slate-900">${total.toFixed(2)}</td>
                      <td className="p-4 font-semibold">{o.status}</td>
                      <td className="p-4 text-right">
                        <select
                          value={o.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                          className="text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:ring-sky-500 focus:border-sky-500"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
