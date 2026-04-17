import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea, Select } from '../../components/Input';
import { Plus, Edit, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../../utils/apiConfig';

const getImageUrl = (image: string) => {
  if (!image) return null;
  return getAssetUrl(image);
};

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    date: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = () => {
    fetch(getApiUrl('/api/announcements'))
      .then(res => res.json())
      .then(data => {
        setAnnouncements(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching announcements:', err);
        setLoading(false);
      });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      date: item.date,
    });
    setImagePreview(getImageUrl(item.image) || '');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      try {
        const response = await fetch(getApiUrl(`/api/announcements/${id}`), {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success('Announcement deleted successfully');
          fetchAnnouncements();
        } else {
          toast.error('Failed to delete announcement');
        }
      } catch (error) {
        toast.error('Error deleting announcement');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? getApiUrl(`/api/announcements/${editingItem.id}`) : getApiUrl('/api/announcements');
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('type', formData.type);
      formDataToSend.append('date', formData.date || '');
      
      // Only append new image file, never append the preview URL
      if (selectedFile) {
        console.log('Uploading new file:', selectedFile.name);
        formDataToSend.append('image', selectedFile);
      } else if (editingItem?.image && !selectedFile && !editingItem.image.startsWith('data:')) {
        // When editing without a new image, send the existing image path
        // The server will use this as fallback
        console.log('Preserving existing image:', editingItem.image);
        formDataToSend.append('image', editingItem.image);
      }
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });
      
      const responseText = await response.text();
      let responseData: any = null;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { error: responseText };
      }
      
      if (response.ok) {
        toast.success(`Announcement ${editingItem ? 'updated' : 'created'} successfully`);
        fetchAnnouncements();
        handleCancel();
      } else {
        console.error('Server error:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          responseText,
          responseData,
        });
        const message = responseData?.error || responseData?.message || responseText || `Failed to ${editingItem ? 'update' : 'create'} announcement`;
        toast.error(message);
      }
    } catch (error) {
      console.error('Request error:', error);
      toast.error(`Error ${editingItem ? 'updating' : 'creating'} announcement: ${(error as Error).message}`);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: '', content: '', type: 'announcement', date: '' });
    setImagePreview('');
    setSelectedFile(null);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-primary mb-2">Announcements & Activities</h1>
            <p className="text-muted-foreground">Create and manage parish announcements and events</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Announcement
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center">Loading announcements...</div>
          ) : (
            announcements.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <CardBody>
                  <div className="flex gap-4">
                    {item.image ? (
                      <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
                        <img src={getImageUrl(item.image) || ''} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 flex-shrink-0 bg-secondary/30 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="mb-1">{item.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                              {item.type}
                            </span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))
          )}
        </div>

        {/* Modal */}
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
                      <h2>{editingItem ? 'Edit Announcement' : 'Add New Announcement'}</h2>
                      <button onClick={handleCancel}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Image Upload */}
                      <div>
                        <label className="block mb-2 text-foreground">Featured Image</label>
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
                                  setSelectedFile(null);
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
                        label="Title"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                      />

                      <Textarea
                        label="Content"
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        rows={5}
                        required
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Type"
                          value={formData.type}
                          onChange={e => setFormData({ ...formData, type: e.target.value })}
                          options={[
                            { value: 'announcement', label: 'Announcement' },
                            { value: 'event', label: 'Event' },
                            { value: 'activity', label: 'Activity' },
                          ]}
                        />

                        <Input
                          type="date"
                          label="Date"
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingItem ? 'Update Announcement' : 'Create Announcement'}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          Cancel
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
