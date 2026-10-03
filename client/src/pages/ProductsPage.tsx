import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { Product, ProductPagination } from '../types/product';
import { Category } from '../types/category';
import { ProductCard } from '../components/products/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { Pagination } from '../components/common/Pagination';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<ProductPagination | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Filter state synced with URL search params
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  // Local filter form inputs
  const [localSearch, setLocalSearch] = useState(search);
  const [localMinPrice, setLocalMinPrice] = useState<string>(minPrice !== undefined ? String(minPrice) : '');
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(maxPrice !== undefined ? String(maxPrice) : '');

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Fetch Categories
  useEffect(() => {
    categoriesApi
      .getAll()
      .then((data) => setCategories(data.categories))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getAll({
        search: search || undefined,
        categoryId,
        minPrice,
        maxPrice,
        page,
        limit: 12,
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch products');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryId, minPrice, maxPrice, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilters = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to page 1 on filter change if not changing page
    if (!('page' in newParams)) {
      params.set('page', '1');
    }
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: localSearch.trim() });
  };

  const handleApplyPriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      minPrice: localMinPrice ? localMinPrice : undefined,
      maxPrice: localMaxPrice ? localMaxPrice : undefined,
    });
  };

  const handleCategorySelect = (id?: number) => {
    updateFilters({ categoryId: id ? String(id) : undefined });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(search || categoryId || minPrice !== undefined || maxPrice !== undefined);

  return (
    <div className="space-y-8">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Products Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse our wide selection of top quality merchandise
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-600" /> Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categories</h4>
            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect(undefined)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  !categoryId
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    categoryId === cat.id
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range ($)</h4>
            <form onSubmit={handleApplyPriceFilter} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Apply Price
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700"
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-600" /> Filter Products
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-rose-600"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Mobile Filter Modal */}
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end lg:hidden">
            <div className="w-full max-w-xs bg-white h-full p-6 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Filters</h3>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-1 text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Categories</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      handleCategorySelect(undefined);
                      setIsFilterDrawerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !categoryId ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        handleCategorySelect(cat.id);
                        setIsFilterDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        categoryId === cat.id ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Price Range</h4>
                <form
                  onSubmit={(e) => {
                    handleApplyPriceFilter(e);
                    setIsFilterDrawerOpen(false);
                  }}
                  className="space-y-3"
                >
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={localMinPrice}
                      onChange={(e) => setLocalMinPrice(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={localMaxPrice}
                      onChange={(e) => setLocalMaxPrice(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                    />
                  </div>
                  <Button type="submit" variant="primary" className="w-full">
                    Apply
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {error && <Alert type="error" message={error} />}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="p-4 bg-slate-100 text-slate-400 rounded-full inline-block">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No products found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                We couldn't find any products matching your current search or filter criteria.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="pt-6 border-t border-slate-200 flex justify-center">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => updateFilters({ page: String(p) })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
