import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { Plus, Trash2, Upload, Edit, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../../utils/apiConfig';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

interface CarouselImage {
  id: number;
  title: string;
  description: string;
  image_path: string;
  order_position: number;
  is_active: number;
}

export function AdminCarousel() {
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
  const [previewImage, setPreviewImage] = useState<CarouselImage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderPosition: '0',
    isActive: true,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchCarouselImages();
  }, []);

  const fetchCarouselImages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('/api/carousel/admin/all'));
      if (!response.ok) throw new Error('Failed to load carousel images');
      const data = await response.json();
      setCarouselImages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error).message || 'Unable to load carousel images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const newPreviews: string[] = [];
    let loadedCount = 0;

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        loadedCount++;
        if (loadedCount === newFiles.length) {
          setSelectedFiles((prev) => [...prev, ...newFiles]);
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const openDialog = (image?: CarouselImage) => {
    if (image) {
      setEditingImage(image);
      setFormData({
        title: image.title,
        description: image.description,
        orderPosition: image.order_position.toString(),
        isActive: image.is_active === 1,
      });
      setImagePreviews([getAssetUrl(image.image_path)]);
      setSelectedFiles([]);
    } else {
      setEditingImage(null);
      setFormData({
        title: '',
        description: '',
        orderPosition: '0',
        isActive: true,
      });
      setImagePreviews([]);
      setSelectedFiles([]);
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For editing existing image
    if (editingImage) {
      if (!formData.title) {
        toast.error('Title is required');
        return;
      }

      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      submitFormData.append('orderPosition', formData.orderPosition);
      submitFormData.append('isActive', formData.isActive ? '1' : '0');

      if (selectedFiles.length > 0) {
        submitFormData.append('image', selectedFiles[0]);
      }

      try {
        const response = await fetch(getApiUrl(`/api/carousel/${editingImage.id}`), {
          method: 'PUT',
          body: submitFormData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update carousel image');
        }

        toast.success('Image updated successfully');
        setShowDialog(false);
        await fetchCarouselImages();
      } catch (err) {
        console.error(err);
        toast.error((err as Error).message || 'Failed to update carousel image');
      }
    } else {
      // For adding new images
      if (selectedFiles.length === 0) {
        toast.error('Please select at least one image');
        return;
      }

      let uploadCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const submitFormData = new FormData();
        submitFormData.append('title', formData.title || `Image ${i + 1}`);
        submitFormData.append('description', formData.description);
        submitFormData.append('orderPosition', (parseInt(formData.orderPosition) + i).toString());
        submitFormData.append('isActive', formData.isActive ? '1' : '0');
        submitFormData.append('image', selectedFiles[i]);

        try {
          const response = await fetch(getApiUrl('/api/carousel'), {
            method: 'POST',
            body: submitFormData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save carousel image');
          }

          uploadCount++;
        } catch (err) {
          console.error(err);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`${uploadCount} image(s) added successfully`);
        setShowDialog(false);
        await fetchCarouselImages();
      } else {
        toast.error(`${uploadCount} uploaded, ${errorCount} failed`);
        await fetchCarouselImages();
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(getApiUrl(`/api/carousel/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete image');

      toast.success('Image deleted successfully');
      await fetchCarouselImages();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete image');
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-primary text-2xl sm:text-3xl mb-1 sm:mb-2">Carousel Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage dashboard carousel images</p>
          </div>
          <Button onClick={() => openDialog()} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Image
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardBody>
              <div className="text-center text-muted-foreground">Loading...</div>
            </CardBody>
          </Card>
        ) : error ? (
          <Card>
            <CardBody>
              <div className="text-center text-destructive">{error}</div>
            </CardBody>
          </Card>
        ) : carouselImages.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center text-muted-foreground py-8">
                No carousel images yet. Click "Add Image" to create one.
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {carouselImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="relative aspect-video bg-secondary/30 overflow-hidden rounded-t-lg">
                    <img
                      src={getAssetUrl(image.image_path)}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {!image.is_active && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-semibold">Inactive</span>
                      </div>
                    )}
                  </div>
                  <CardBody>
                    <h3 className="font-semibold mb-1 truncate text-sm sm:text-base">{image.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                      {image.description || 'No description'}
                    </p>
                    <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                      Order: {image.order_position}
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => setPreviewImage(image)}
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => openDialog(image)}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit/Add Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingImage ? 'Edit' : 'Add'} Carousel Image</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Preview */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Image{selectedFiles.length > 0 ? `s (${selectedFiles.length})` : ''}
                </label>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3 max-h-40 overflow-y-auto">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20">
                        <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        {selectedFiles.length > 0 && idx < selectedFiles.length && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                              setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <label className="block w-full cursor-pointer">
                  <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 text-center hover:border-primary hover:bg-primary/5 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="text-xs sm:text-sm text-primary font-semibold">
                      Click to select or drag images here
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 50MB each</p>
                  </div>
                </label>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  {selectedFiles.length > 1 && !editingImage ? 'Title (applied to all)' : 'Title'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Carousel image title"
                  required={!editingImage}
                  className="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary bg-background text-foreground"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  {selectedFiles.length > 1 && !editingImage ? 'Description (applied to all)' : 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary bg-background text-foreground text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Order Position */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.orderPosition}
                  onChange={(e) => setFormData({ ...formData, orderPosition: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary bg-background text-foreground"
                />
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-primary accent-primary cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer flex-1">
                  Active (Show on dashboard)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="px-4"
                  disabled={selectedFiles.length === 0 && !editingImage}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {editingImage ? 'Update' : 'Add'} Image{selectedFiles.length > 1 && !editingImage ? `s (${selectedFiles.length})` : ''}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewImage?.title}</DialogTitle>
            </DialogHeader>
            {previewImage && (
              <div>
                <img
                  src={getAssetUrl(previewImage.image_path)}
                  alt={previewImage.title}
                  className="w-full rounded-lg"
                />
                {previewImage.description && (
                  <p className="mt-4 text-muted-foreground">{previewImage.description}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
