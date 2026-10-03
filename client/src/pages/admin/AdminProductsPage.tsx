import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import { Product, CreateProductDto } from '../../types/product';
import { Category } from '../../types/category';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { Spinner } from '../../components/common/Spinner';
import { Badge } from '../../components/common/Badge';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.getAll({ limit: 50 }),
        categoriesApi.getAll(),
      ]);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load data');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setImageUrl('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setImageUrl(product.imageUrl || '');
    setCategoryId(product.categoryId);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price || !stock || !categoryId) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload: CreateProductDto = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      stock: Number(stock),
      imageUrl: imageUrl.trim() || undefined,
      categoryId: Number(categoryId),
    };

    try {
      if (editingProduct) {
        const res = await productsApi.update(editingProduct.id, payload);
        setSuccessMsg(res.message || 'Product updated successfully');
      } else {
        const res = await productsApi.create(payload);
        setSuccessMsg(res.message || 'Product created successfully');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setError(response?.data?.message || 'Failed to save product');
      } else {
        setError('Network error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this product?')) return;

    setError(null);
    setSuccessMsg(null);
    try {
      const res = await productsApi.delete(id);
      setSuccessMsg(res.message || 'Product deactivated successfully');
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete product');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900">Product Management</h1>
          <p className="text-slate-500 text-sm mt-1">Add, update, or soft-delete store items.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Product
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden border">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Tag className="w-5 h-5 text-slate-300 m-auto mt-2.5" />
                        )}
                      </div>
                      <div>
                        <div>{p.name}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 font-normal">
                          {p.description}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{p.category?.name || 'Uncategorized'}</td>
                    <td className="p-4 font-bold text-slate-900">${Number(p.price).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={p.stock > 0 ? 'text-slate-900 font-semibold' : 'text-rose-600 font-bold'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={p.isActive ? 'success' : 'danger'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-600 hover:text-sky-600 transition"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Product Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price ($) *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />

                <Input
                  label="Stock *"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
