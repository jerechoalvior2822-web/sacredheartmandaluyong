import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { Plus, Edit, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../../utils/apiConfig';

interface SouvenirItem {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
}

export function AdminSouvenirs() {
  const [souvenirs, setSouvenirs] = useState<SouvenirItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SouvenirItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSouvenirs();
  }, []);

  const fetchSouvenirs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('/api/souvenirs'));
      if (!response.ok) throw new Error('Failed to load souvenirs');
      const data = await response.json();
      setSouvenirs(data);
    } catch (err) {
      setError((err as Error).message || 'Unable to load souvenirs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: SouvenirItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      stock: item.stock.toString(),
    });
    setSelectedImageFile(null);
    setImagePreview(item.image ? getAssetUrl(item.image) : '');
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this souvenir?')) return;
    try {
      const response = await fetch(getApiUrl(`/api/souvenirs/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete souvenir');
      toast.success('Souvenir deleted successfully');
      await fetchSouvenirs();
    } catch (err) {
      console.error(err);
      toast.error('Unable to delete souvenir');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('stock', formData.stock);

    if (selectedImageFile) {
      formDataToSend.append('image', selectedImageFile);
    } else if (editingItem && editingItem.image) {
      formDataToSend.append('image', editingItem.image);
    }

    try {
      const url = editingItem ? getApiUrl(`/api/souvenirs/${editingItem.id}`) : getApiUrl('/api/souvenirs');
      const method = editingItem ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });
      if (!response.ok) throw new Error('Failed to save souvenir');

      toast.success(`Souvenir ${editingItem ? 'updated' : 'created'} successfully`);
      await fetchSouvenirs();
      handleCancel();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Unable to save souvenir');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', stock: '' });
    setImagePreview('');
    setSelectedImageFile(null);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-primary mb-2">Souvenirs Management</h1>
            <p className="text-muted-foreground">Manage souvenir products and inventory</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Souvenir
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading souvenirs...</div>
        ) : error ? (
          <div className="text-center text-destructive py-12">{error}</div>
        ) : souvenirs.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No souvenirs found in the database.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {souvenirs.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  {item.image ? (
                    <div className="aspect-square overflow-hidden">
                      <img src={getAssetUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-secondary/30 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardBody>
                    <h3 className="mb-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-primary text-xl">₱{item.price.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">Stock: {item.stock}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)} className="flex-1">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={handleCancel}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2>{editingItem ? 'Edit Souvenir' : 'Add New Souvenir'}</h2>
                      <button onClick={handleCancel}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block mb-2 text-foreground">Product Image</label>
                        <div className="relative border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors">
                          {imagePreview ? (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview('');
                                  setSelectedImageFile(null);
                                }}
                                className="absolute top-2 right-2 p-2 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground mb-1">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG or WEBP (max. 5MB)
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>

                      <Input
                        label="Product Name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />

                      <Textarea
                        label="Description"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        required
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="number"
                          label="Price (PHP)"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                        />
                        <Input
                          type="number"
                          label="Stock"
                          value={formData.stock}
                          onChange={e => setFormData({ ...formData, stock: e.target.value })}
                          min="0"
                          required
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={handleCancel} type="button">
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingItem ? 'Update Souvenir' : 'Create Souvenir'}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
