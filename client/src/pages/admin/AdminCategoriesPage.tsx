import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FolderPlus, FolderTree } from 'lucide-react';
import { categoriesApi } from '../../api/categories';
import { Category } from '../../types/category';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { Spinner } from '../../components/common/Spinner';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoriesApi.getAll();
      setCategories(data.categories);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch categories');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await categoriesApi.create({ name: newCategoryName.trim() });
      setSuccessMsg(res.message || 'Category created successfully');
      setNewCategoryName('');
      await fetchCategories();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.status === 409) {
          setError('Category name already exists.');
        } else if (response?.data?.message) {
          setError(response.data.message);
        } else {
          setError('Failed to create category.');
        }
      } else {
        setError('Network error.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900">Category Management</h1>
        <p className="text-slate-500 text-sm mt-1">Manage and add product categories for store classification.</p>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-sky-600" /> Create Category
          </h3>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <Input
              label="Category Name"
              placeholder="e.g. Electronics, Clothing..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isCreating}
              disabled={!newCategoryName.trim()}
            >
              Add Category
            </Button>
          </form>
        </div>

        {/* Category List Table */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-900 text-lg">
            <FolderTree className="w-5 h-5 text-sky-600" /> Store Categories ({categories.length})
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <Spinner size="md" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No categories defined yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <span className="font-semibold text-slate-900 text-sm">{cat.name}</span>
                  <span className="text-xs text-slate-400 font-mono">ID: {cat.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
