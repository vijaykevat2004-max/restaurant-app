import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Check, UtensilsCrossed } from 'lucide-react';
import { api } from '../api/client';
import type { MenuCategory, MenuItem } from '../types';
import { formatCurrency } from '../utils/currency';

const CATEGORY_GRADIENTS = [
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-blue-500',
  'from-fuchsia-500 to-pink-500',
  'from-lime-500 to-green-500',
  'from-indigo-500 to-violet-500',
];

export function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    setIsLoading(true);
    try {
      const menu = await api.getMenu();
      setCategories(menu);
      if (menu.length > 0) {
        setSelectedCategoryId(prev => prev || menu[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/menu/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${api.getToken?.()}` },
      });
      fetchMenu();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleToggleItem = async (item: MenuItem) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${api.getToken?.()}`,
        },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      fetchMenu();
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/menu/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${api.getToken?.()}` },
      });
      const data = await res.json();
      if (!data.success) {
        alert('Error: ' + data.error);
        return;
      }
      fetchMenu();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold vg-text-cyan">Menu Management</h1>
            <p className="text-white/50">Manage your restaurant menu</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
            className="px-5 py-3 rounded-2xl bg-white/10 text-white/80 hover:bg-white/20 border border-white/10 font-semibold transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
          <button
            onClick={() => { setEditingItem(null); setShowItemModal(true); }}
            disabled={categories.length === 0}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card-vibrant p-8 animate-pulse">
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      ) : categories.length === 0 ? (
        <div className="glass-card-vibrant py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-white/30" />
          </div>
          <p className="text-white/50 text-lg font-semibold">No categories yet</p>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category, catIndex) => (
            <div key={category.id} className="glass-card-vibrant p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_GRADIENTS[catIndex % CATEGORY_GRADIENTS.length]} flex items-center justify-center shadow-lg`}>
                    <UtensilsCrossed className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{category.name}</h2>
                    <p className="text-sm text-white/50">{category.items?.length || 0} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingCategory(category); setShowCategoryModal(true); }}
                    className="p-3 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(category.items || []).map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-white/5 border border-white/10 transition-all ${
                      item.isAvailable ? '' : 'opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={item.isVeg ? 'veg-badge' : 'non-veg-badge'} />
                          <h3 className="font-bold text-white">{item.name}</h3>
                        </div>
                        {item.description && (
                          <p className="text-sm text-white/50 line-clamp-2 mb-2">{item.description}</p>
                        )}
                        <p className="text-xl font-bold vg-text-amber">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleToggleItem(item)}
                        className={`p-2 rounded-xl flex-1 transition-all ${
                          item.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        }`}
                      >
                        <Check className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => { setSelectedCategoryId(category.id); setEditingItem(item); setShowItemModal(true); }}
                        className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { setSelectedCategoryId(category.id); setEditingItem(null); setShowItemModal(true); }}
                  className="p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-500/50 text-white/40 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 min-h-[140px]"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          onSave={fetchMenu}
        />
      )}

      {showItemModal && (
        <ItemModal
          item={editingItem}
          categoryId={editingItem?.categoryId || selectedCategoryId}
          categories={categories}
          onClose={() => { setShowItemModal(false); setEditingItem(null); }}
          onSave={fetchMenu}
        />
      )}
    </div>
  );
}

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: MenuCategory | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (category) {
        await fetch(`${import.meta.env.VITE_API_URL}/menu/categories/${category.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${api.getToken?.()}`,
          },
          body: JSON.stringify({ name }),
        });
      } else {
        await api.createCategory(name);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card-vibrant w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Course"
              className="input-vibrant"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold disabled:opacity-50">
              {isSubmitting ? 'Saving...' : category ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemModal({
  item,
  categoryId,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  categoryId: string | null;
  categories: MenuCategory[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [catId, setCatId] = useState(item?.categoryId || categoryId || categories[0]?.id || '');
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${api.getToken?.()}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        setImageUrl(data.data.url);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data: any = {
        categoryId: catId,
        name,
        description,
        price: parseFloat(price),
        isAvailable,
      };
      if (imageUrl) {
        data.imageUrl = imageUrl;
      }

      if (item) {
        await fetch(`${import.meta.env.VITE_API_URL}/menu/items/${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${api.getToken?.()}`,
          },
          body: JSON.stringify(data),
        });
      } else {
        await api.createMenuItem(data);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card-vibrant w-full max-w-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {item ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Category</label>
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="input-vibrant"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Butter Chicken"
              className="input-vibrant"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="input-vibrant min-h-[80px] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Price (₹)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-vibrant"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Image</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  {uploading ? 'Uploading...' : 'Choose Image'}
                </span>
              </label>
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-white/20" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isAvailable ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-white/80 font-medium">{isAvailable ? 'Available' : 'Unavailable'}</span>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-white/10 sticky bottom-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold disabled:opacity-50">
              {isSubmitting ? 'Saving...' : item ? 'Save' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
