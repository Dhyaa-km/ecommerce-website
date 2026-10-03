import React from 'react';
import { Link } from 'react-router-dom';
import { Package, FolderTree, ShoppingBag, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" /> System Administration
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Control Center</h1>
          <p className="text-slate-500 text-sm mt-1">Manage catalog, categories, orders, and user access permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/admin/products"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-500 hover:shadow-md transition space-y-4"
        >
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl w-fit group-hover:bg-sky-600 group-hover:text-white transition">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Product Management</h3>
            <p className="text-slate-500 text-xs mt-1">Create, edit, soft-delete products and update stock levels.</p>
          </div>
          <div className="text-xs font-semibold text-sky-600 flex items-center gap-1">
            Manage Products <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/categories"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-500 hover:shadow-md transition space-y-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Category Management</h3>
            <p className="text-slate-500 text-xs mt-1">Organize products into searchable store categories.</p>
          </div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            Manage Categories <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-500 hover:shadow-md transition space-y-4"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit group-hover:bg-amber-600 group-hover:text-white transition">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Order Fulfillment</h3>
            <p className="text-slate-500 text-xs mt-1">Inspect customer orders and transition fulfillment statuses.</p>
          </div>
          <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
            Manage Orders <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-500 hover:shadow-md transition space-y-4"
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl w-fit group-hover:bg-rose-600 group-hover:text-white transition">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">User Directory</h3>
            <p className="text-slate-500 text-xs mt-1">Inspect registered users and activate or deactivate accounts.</p>
          </div>
          <div className="text-xs font-semibold text-rose-600 flex items-center gap-1">
            Manage Users <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
};
