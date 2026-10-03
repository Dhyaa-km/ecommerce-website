import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Shield,
  Package,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isLoading,  logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-sky-600 font-bold text-xl tracking-tight shrink-0">
            <ShoppingBag className="w-7 h-7 text-sky-600" />
            <span>StoreCraft</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            </div>
          </form>

          {/* Desktop Navigation links & User actions */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-sm font-medium text-slate-700 hover:text-sky-600 transition">
              Products
            </Link>

            {/* Cart Button */}
            <Link to="/cart" className="relative p-2 text-slate-700 hover:text-sky-600 transition" aria-label="Shopping Cart">
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isLoading ? (
              <div
                className="w-24 h-9 flex items-center justify-center"
                aria-label="Loading authentication"
              >
                <div className="w-5 h-5 border-2 border-slate-300 border-t-sky-600 rounded-full animate-spin" />
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}

                <Link
                  to="/orders"
                  className="text-slate-700 hover:text-sky-600 transition p-2"
                  title="My Orders"
                >
                  <Package className="w-5 h-5" />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-sky-600 transition py-1 px-2 rounded-lg hover:bg-slate-50"
                >
                  <UserIcon className="w-5 h-5 text-slate-500" />
                  <span>{user?.name}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 transition"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-sky-600 transition px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/cart" className="relative p-2 text-slate-700" aria-label="Shopping Cart">
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-sky-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </form>

          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 px-3 rounded-lg hover:bg-slate-50"
          >
            All Products
          </Link>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div
                className="w-5 h-5 border-2 border-slate-300 border-t-sky-600 rounded-full animate-spin"
                aria-label="Loading authentication"
              />
            </div>
          ) : isAuthenticated ? (
            <>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-700 font-medium py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                My Orders
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-700 font-medium py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Profile ({user?.name})
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-amber-800 font-medium py-2 px-3 rounded-lg bg-amber-50"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left text-rose-600 font-medium py-2 px-3 rounded-lg hover:bg-rose-50"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-slate-700 font-medium py-2 rounded-lg border border-slate-300"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-white bg-sky-600 font-medium py-2 rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
