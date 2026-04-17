import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { Plus, Edit, Trash2, X, Upload, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../../utils/apiConfig';

interface ServiceFormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  rows?: number;
}

interface ServiceItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  processingTime: string;
  requirements: string[];
  image: string;
  formFields: ServiceFormField[];
}

export function AdminServices() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    fee: '',
    processingTime: '',
    requirements: '',
  });
  const [formFields, setFormFields] = useState<ServiceFormField[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [calendarPreviewDate, setCalendarPreviewDate] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  // Holidays (year-agnostic - MM-DD format)
  const holidays = ['01-01', '04-09', '06-12', '11-01', '12-25', '12-30'];

  const isHoliday = (dateStr: string) => {
    const date = new Date(dateStr);
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.includes(monthDay);
  };

  const isMonday = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDay() === 1;
  };

  const fetchBookedDates = async (serviceId?: number) => {
    try {
      const url = serviceId 
        ? getApiUrl(`/api/bookings/booked-dates?serviceId=${serviceId}`)
        : getApiUrl('/api/bookings/booked-dates');
      const response = await fetch(url);
      if (!response.ok) {
        setBookedDates([]);
        return;
      }
      const dates = await response.json();
      setBookedDates(Array.isArray(dates) ? dates : []);
    } catch (err) {
      console.error('Error fetching booked dates:', err);
      setBookedDates([]);
    }
  }; 

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const serviceTemplates = [
    {
      label: 'Wedding',
      name: 'Wedding Service',
      description: 'Ceremony preparation, documents review, and blessing for couples.',
      category: 'Weddings',
      fee: '5000',
      processingTime: '2 weeks',
      requirements: ['Marriage License', 'Baptismal Certificate', 'IDs', 'Parish Interview'],
      formFields: [
        { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Bride or groom full name', required: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
        { name: 'phone', label: 'Phone Number', type: 'text', placeholder: '0917xxxxxxx', required: true },
        { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: true },
        { name: 'church', label: 'Church Location', type: 'text', placeholder: 'Parish church name', required: true },
        { name: 'sponsors', label: 'Sponsors / Witnesses', type: 'text', placeholder: 'Names of sponsors', required: false },
      ],
    },
    {
      label: 'Baptism',
      name: 'Baptism Service',
      description: 'Baptism coordination, certificate issuance, and family guidance.',
      category: 'Baptism',
      fee: '2000',
      processingTime: '1 week',
      requirements: ['Birth Certificate', 'Parents IDs', 'Godparent IDs', 'Baptismal Prep Class'],
      formFields: [
        { name: 'child_name', label: 'Child Name', type: 'text', placeholder: 'Name of child', required: true },
        { name: 'birth_date', label: 'Birth Date', type: 'date', required: true },
        { name: 'parent_names', label: 'Parent Names', type: 'text', placeholder: 'Mother and father names', required: true },
        { name: 'godparents', label: 'Godparents', type: 'text', placeholder: 'Names of godparents', required: true },
        { name: 'parish_origin', label: 'Parish of Origin', type: 'text', placeholder: 'Current home parish', required: false },
      ],
    },
    {
      label: 'Funeral',
      name: 'Funeral Service',
      description: 'Funeral mass, burial arrangements, and memorial support.',
      category: 'Funeral',
      fee: '4000',
      processingTime: '3 days',
      requirements: ['Death Certificate', 'IDs of next of kin', 'Funeral Home Details'],
      formFields: [
        { name: 'deceased_name', label: 'Deceased Name', type: 'text', placeholder: 'Name of deceased', required: true },
        { name: 'date_of_death', label: 'Date of Death', type: 'date', required: true },
        { name: 'family_contact', label: 'Family Contact', type: 'text', placeholder: 'Contact person and phone', required: true },
        { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: false },
        { name: 'burial_place', label: 'Burial Place', type: 'text', placeholder: 'Cemetery or memorial location', required: false },
      ],
    },
    {
      label: 'Counselling',
      name: 'Counselling Session',
      description: 'Pastoral counselling for individuals, couples, and families.',
      category: 'Counselling',
      fee: '1000',
      processingTime: '1-2 days',
      requirements: ['Preferred date/time', 'Reason for counselling', 'Contact details'],
      formFields: [
        { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Your name', required: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
        { name: 'phone', label: 'Phone Number', type: 'text', placeholder: '0917xxxxxxx', required: false },
        { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: false },
        { name: 'issue_summary', label: 'Issue Summary', type: 'textarea', placeholder: 'Short summary of your concern', required: false },
      ],
    },
    {
      label: 'Blessing',
      name: 'Blessing Service',
      description: 'Blessing for homes, businesses, or special occasions.',
      category: 'Blessing',
      fee: '1500',
      processingTime: '1 week',
      requirements: ['Location details', 'Preferred schedule', 'Special requests'],
      formFields: [
        { name: 'requester_name', label: 'Requester Name', type: 'text', placeholder: 'Name of requester', required: true },
        { name: 'address', label: 'Address', type: 'text', placeholder: 'Home or business address', required: true },
        { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: false },
        { name: 'event_type', label: 'Event Type', type: 'text', placeholder: 'Home blessing, car blessing, etc.', required: false },
        { name: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any special requests', required: false },
      ],
    },
  ];

  const applyServiceTemplate = (template: any) => {
    setEditingService(null);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      fee: template.fee,
      processingTime: template.processingTime,
      requirements: template.requirements.join(', '),
    });
    setFormFields(template.formFields);
    setSelectedImageFile(null);
    setImagePreview('');

    scrollToForm();
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('/api/services'));
      if (!response.ok) throw new Error('Failed to load services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError((err as Error).message || 'Unable to load services');
    } finally {
      setLoading(false);
    }
  };

  const [shouldScrollToForm, setShouldScrollToForm] = useState(false);

  useEffect(() => {
    if (shouldScrollToForm) {
      const formElement = document.querySelector('[data-service-form]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setShouldScrollToForm(false);
    }
  }, [shouldScrollToForm]);

  const scrollToForm = () => {
    setShouldScrollToForm(true);
  };

  const handleEdit = (service: ServiceItem) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      fee: service.price.toString(),
      processingTime: service.processingTime,
      requirements: service.requirements.join(', '),
    });
    setFormFields(service.formFields || []);
    setSelectedImageFile(null);
    setImagePreview(service.image?.startsWith('/assets') ? getAssetUrl(service.image) : service.image);
    
    // Fetch booked dates for this service
    if (service.id) {
      fetchBookedDates(service.id);
    }

    scrollToForm();
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
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const response = await fetch(getApiUrl(`/api/services/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete service');
      toast.success('Service deleted successfully');
      await fetchServices();
    } catch (err) {
      console.error(err);
      toast.error('Unable to delete service');
    }
  };

  const openNewServiceModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      fee: '',
      processingTime: '',
      requirements: '',
    });
    setFormFields([]);
    setImagePreview('');
    setSelectedImageFile(null);
    setBookedDates([]);

    scrollToForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.fee) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category', formData.category || 'General');
    formDataToSend.append('price', formData.fee);
    formDataToSend.append('processingTime', formData.processingTime);
    formDataToSend.append('requirements', JSON.stringify(formData.requirements.split(',').map((req) => req.trim()).filter(Boolean)));
    formDataToSend.append('formPath', '');
    formDataToSend.append('formName', '');
    formDataToSend.append('formFields', JSON.stringify(formFields || []));

    if (selectedImageFile) {
      formDataToSend.append('image', selectedImageFile);
    } else if (editingService?.image) {
      formDataToSend.append('image', editingService.image);
    }

    try {
      const url = editingService
        ? getApiUrl(`/api/services/${editingService.id}`)
        : getApiUrl('/api/services');
      const method = editingService ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });
      if (!response.ok) throw new Error('Failed to save service');

      toast.success(`Service ${editingService ? 'updated' : 'created'} successfully`);
      await fetchServices();
      handleCancel();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Unable to save service');
    }
  };

  const handleCancel = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', category: '', fee: '', processingTime: '', requirements: '' });
    setFormFields([]);
    setImagePreview('');
    setSelectedImageFile(null);
  };

  const addFormField = () => {
    setFormFields((prev) => [
      ...prev,
      { name: '', label: '', type: 'text', placeholder: '', required: false, options: [] },
    ]);
  };

  const updateFormField = (index: number, field: keyof ServiceFormField, value: any) => {
    setFormFields((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeFormField = (index: number) => {
    setFormFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-primary mb-2">Services Management</h1>
            <p className="text-muted-foreground">Manage sacramental services</p>
          </div>
          <Button onClick={openNewServiceModal}>
            <Plus className="w-5 h-5 mr-2" />
            Add Service
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading services...</div>
        ) : error ? (
          <div className="text-center text-destructive py-12">{error}</div>
        ) : services.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No services available in the database.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  {service.image ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={service.image.startsWith('/assets') ? getAssetUrl(service.image) : service.image}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-secondary/30 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardBody>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="mb-1">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.category || 'General'}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{service.processingTime}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    <p className="font-bold text-primary mb-3">₱{service.price.toLocaleString()}</p>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Requirements:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {service.requirements.map((req, idx) => (
                          <li key={idx}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(service)} className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(service.id)} className="flex-1">
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

        <Card className="mb-8" data-service-form>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{editingService ? 'Edit Service' : 'Service Form'}</h2>
                <p className="text-sm text-muted-foreground">Use the form below to add or update a service.</p>
              </div>
              <Button variant="outline" size="sm" onClick={openNewServiceModal}>
                New Service
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Service Name"
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
              <Input
                label="Category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Fee (PHP)"
                  value={formData.fee}
                  onChange={e => setFormData({ ...formData, fee: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
                <Input
                  label="Processing Time"
                  value={formData.processingTime}
                  onChange={e => setFormData({ ...formData, processingTime: e.target.value })}
                />
              </div>
              <Textarea
                label="Requirements (comma-separated)"
                value={formData.requirements}
                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
                placeholder="Birth Certificate, Baptismal Certificate, etc."
                required
              />
              <div className="rounded-xl border border-border bg-secondary/5 p-4">
                <p className="text-sm font-medium mb-3">Example service templates</p>
                <div className="flex flex-wrap gap-2">
                  {serviceTemplates.map((template) => (
                    <Button
                      key={template.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyServiceTemplate(template)}
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Booking Form Fields</p>
                    <p className="text-xs text-muted-foreground">Create the booking form users complete for this service.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addFormField}>
                    Add Field
                  </Button>
                </div>

                {formFields.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No booking form fields configured yet. Use the button above to add wedding form fields or other required booking inputs.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formFields.map((field, index) => (
                      <div key={index} className="rounded-xl border border-border p-4 bg-secondary/5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <p className="font-medium">Field {index + 1}</p>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeFormField(index)}>
                            Remove
                          </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Input
                            label="Label"
                            value={field.label}
                            onChange={(e) => updateFormField(index, 'label', e.target.value)}
                            required
                          />
                          <Input
                            label="Name"
                            value={field.name}
                            onChange={(e) => updateFormField(index, 'name', e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block mb-2 text-sm font-medium">Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => updateFormField(index, 'type', e.target.value)}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Textarea</option>
                              <option value="date">Date</option>
                              <option value="time">Time</option>
                              <option value="email">Email</option>
                              <option value="number">Number</option>
                              <option value="select">Select</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 mt-6 sm:mt-0">
                            <input
                              id={`required-${index}`}
                              type="checkbox"
                              checked={!!field.required}
                              onChange={(e) => updateFormField(index, 'required', e.target.checked)}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                            />
                            <label htmlFor={`required-${index}`} className="text-sm">
                              Required
                            </label>
                          </div>
                        </div>

                        {field.type === 'date' && (
                          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-sm font-medium mb-2">Calendar Preview (User View)</p>
                            <div className="text-xs text-muted-foreground mb-2">
                              ℹ️ Mondays, holidays, and already-booked dates are blocked from booking
                            </div>
                            <div className="bg-background rounded border border-border p-3">
                              <div className="flex items-center justify-between mb-3">
                                <button 
                                  type="button"
                                  onClick={() => setCalendarPreviewDate(new Date(calendarPreviewDate.getFullYear(), calendarPreviewDate.getMonth() - 1))}
                                  className="p-1 hover:bg-secondary rounded"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-medium">
                                  {calendarPreviewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => setCalendarPreviewDate(new Date(calendarPreviewDate.getFullYear(), calendarPreviewDate.getMonth() + 1))}
                                  className="p-1 hover:bg-secondary rounded"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                              <table className="w-full border-collapse text-[10px]">
                                <thead>
                                  <tr>
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                      <th key={day} className="border border-border p-1 text-center font-medium">
                                        {day}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.from({ length: Math.ceil((getDaysInMonth(calendarPreviewDate) + getFirstDayOfMonth(calendarPreviewDate)) / 7) }).map((_, weekIndex) => (
                                    <tr key={weekIndex}>
                                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                                        const day = weekIndex * 7 + dayIndex - getFirstDayOfMonth(calendarPreviewDate) + 1;
                                        const isCurrentMonth = day > 0 && day <= getDaysInMonth(calendarPreviewDate);
                                        const dateStr = `${calendarPreviewDate.getFullYear()}-${String(calendarPreviewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const isBooked = isCurrentMonth && bookedDates.includes(dateStr);
                                        const isBlocked = isCurrentMonth && (isMonday(dateStr) || isHoliday(dateStr));

                                        return (
                                          <td key={dayIndex} className="border border-border p-0.5 text-center h-6">
                                            {isCurrentMonth ? (
                                              <div className={`text-[10px] rounded transition-colors ${
                                                isBooked
                                                  ? 'bg-red-200 dark:bg-red-900 text-red-600 dark:text-red-300'
                                                  : isBlocked
                                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                                  : 'bg-white dark:bg-background'
                                              }`}>
                                                {day}
                                              </div>
                                            ) : null}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="mt-2 text-[9px] text-muted-foreground space-y-0.5">
                                <div className="flex gap-2">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-200 dark:bg-red-900 rounded"></div>
                                    <span>Booked</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <span>Blocked</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-white dark:bg-background border border-border rounded"></div>
                                    <span>Available</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <Input
                          label="Placeholder"
                          value={field.placeholder || ''}
                          onChange={(e) => updateFormField(index, 'placeholder', e.target.value)}
                        />

                        {field.type === 'select' && (
                          <Input
                            label="Options (comma-separated)"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) =>
                              updateFormField(
                                index,
                                'options',
                                e.target.value.split(', ').map((option) => option.trim()).filter(Boolean)
                              )
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="block mb-2 text-foreground">Service Image</label>
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
                      onClick={() => setImagePreview('')}
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
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Clear
                </Button>
                <Button type="submit">
                  {editingService ? 'Update Service' : 'Create Service'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
