import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, RefreshCw } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Banner */}
      <section className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-xl text-white py-16 px-6 sm:px-12 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/50 to-slate-900/80 pointer-events-none" />
        <div className="relative max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <ShoppingBag className="w-4 h-4" /> Next-Gen Shopping
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Premium products delivered straight to your door.
          </h1>
          <p className="text-slate-300 text-lg">
            Discover curated electronics, apparel, and lifestyle items with instant ordering and real-time inventory checks.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg transition"
            >
              Shop Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Fast & Trackable Shipping</h3>
            <p className="text-sm text-slate-500">Every order comes with full live status tracking.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Secure JWT Sessions</h3>
            <p className="text-sm text-slate-500">Protected HTTP cookies and encrypted token refreshes.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Live Stock Reservation</h3>
            <p className="text-sm text-slate-500">Transactional checkouts guarantee item availability.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
