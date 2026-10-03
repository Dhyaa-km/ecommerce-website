import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Github, Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
              <ShoppingBag className="w-6 h-6 text-sky-500" />
              <span>StoreCraft</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              A modern, full-stack e-commerce platform crafted with React, TypeScript, and Node.js.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="hover:text-white transition">All Products</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition">Shopping Cart</Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/profile" className="hover:text-white transition">My Profile</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition">Order History</Link>
              </li>
            </ul>
          </div>

          {/* Security & Built With */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Platform</h4>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Secure JWT Auth & HTTP Cookies</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Github className="w-4 h-4 text-slate-400" />
              <span>Production Ready Stack</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} StoreCraft. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for portfolio demo.
          </p>
        </div>
      </div>
    </footer>
  );
};
