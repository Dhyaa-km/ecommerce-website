import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900">404 - Page Not Found</h1>
      <p className="text-slate-500 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition shadow-sm"
      >
        <Home className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
};
