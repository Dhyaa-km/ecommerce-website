import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center space-x-1">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              page === currentPage
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Next Page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
