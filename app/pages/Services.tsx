import { useEffect, useState } from 'react';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Calendar, Upload, FileText, CreditCard, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../components/AuthContext';
import { getApiUrl } from '../utils/apiConfig';

export function Services() {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const CHURCH_LOCATION = 'Sacred Heart of Jesus Parish, Mandaluyong';
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // Today's date string (YYYY-MM-DD) for past-date comparison
  const todayStr = new Date().toISOString().split('T')[0];

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

  const isPastDate = (dateStr: string) => {
    return dateStr < todayStr;
  };

  const isAlreadyBooked = (dateStr: string) => {
    return bookedDates.includes(dateStr);
  };

  const isValidBookingDate = (dateStr: string) => {
    return !isMonday(dateStr) && !isHoliday(dateStr) && !isPastDate(dateStr) && !isAlreadyBooked(dateStr);
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleSelectDate = (day: number) => {
    const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (isPastDate(dateStr)) {
      toast.error('Cannot book on past dates');
      return;
    }
    if (isMonday(dateStr)) {
      toast.error('Cannot book on Mondays - office is closed');
      return;
    }
    if (isHoliday(dateStr)) {
      toast.error('Cannot book on holidays');
      return;
    }
    if (isAlreadyBooked(dateStr)) {
      toast.error('This date is already fully booked');
      return;
    }

    setFormData(prev => ({ ...prev, _bookingDate: dateStr }));
    toast.success(`Date selected: ${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  };

  const goToPreviousMonth = () => {
    const prev = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1);
    // Don't navigate to months fully in the past
    const now = new Date();
    if (prev.getFullYear() > now.getFullYear() || (prev.getFullYear() === now.getFullYear() && prev.getMonth() >= now.getMonth())) {
      setCalendarDate(prev);
    }
  };
  const goToNextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1));

  const daysInMonth = getDaysInMonth(calendarDate);
  const firstDay = getFirstDayOfMonth(calendarDate);
  const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(getApiUrl('/api/services'));
        if (!response.ok) throw new Error('Failed to load services');
        const data = await response.json();
        setServices(data);
        setFilteredServices(data);
      } catch (err) {
        setServicesError((err as Error).message || 'Unable to load services');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Fetch already-booked dates when a service is selected
  useEffect(() => {
    if (!selectedService) return;

    const fetchBookedDates = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/bookings/booked-dates?service=${encodeURIComponent(selectedService.name)}`));
        if (!response.ok) return;
        const data = await response.json();
        // Expecting an array of date strings: ["2025-06-15", "2025-06-20", ...]
        setBookedDates(Array.isArray(data) ? data : []);
      } catch {
        // Silently fail - just show no blocked dates
        setBookedDates([]);
      }
    };

    fetchBookedDates();
  }, [selectedService]);

  // Apply filters
  useEffect(() => {
    let filtered = services;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service =>
        service.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    filtered = filtered.filter(service =>
      service.price >= priceRange[0] && service.price <= priceRange[1]
    );

    setFilteredServices(filtered);
  }, [selectedCategory, priceRange, services]);

  // Get unique categories
  const categories = ['all', ...new Set(services.map(s => s.category))].filter(Boolean);

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid file type. Please upload PDF, JPG, or PNG files.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const newDoc = {
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date()
      };

      setDocuments(prev => [...prev, newDoc]);
      toast.success(`${file.name} uploaded successfully`);
    }

    setUploading(false);
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    toast.success('Document removed');
  };

  const handleFormChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleBookService = () => {
    if (!selectedService || !user) {
      toast.error('Please log in to book a service');
      return;
    }

    // Validate booking date selected from calendar
    const bookingDate = formData._bookingDate;
    if (!bookingDate) {
      toast.error('Please select a booking date from the calendar');
      return;
    }

    // Final validation on booking date
    if (!isValidBookingDate(bookingDate)) {
      if (isPastDate(bookingDate)) {
        toast.error('Selected date is in the past. Please choose another date.');
      } else if (isMonday(bookingDate)) {
        toast.error('Bookings are not available on Mondays (office closed)');
      } else if (isHoliday(bookingDate)) {
        toast.error('Bookings are not available on holidays');
      } else if (isAlreadyBooked(bookingDate)) {
        toast.error('This date is already fully booked. Please choose another date.');
      }
      return;
    }

    // Validate required fields (excluding date fields — handled by calendar)
    const requiredFields = selectedService.formFields?.filter((f: any) => f.required && f.type !== 'date') || [];
    const missingFields = requiredFields.filter((f: any) => !formData[f.name]);

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map((f: any) => f.label).join(', ')}`);
      return;
    }

    const preferredTimeField = selectedService.formFields?.find((f: any) => f.name.toLowerCase().includes('time'));
    const bookingTime = preferredTimeField ? formData[preferredTimeField.name] : '10:00 AM';

    fetch(getApiUrl('/api/bookings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: parseInt(user.id, 10) || 1,
        service: selectedService.name,
        date: bookingDate,
        time: bookingTime,
        notes: JSON.stringify(formData),
        documents: JSON.stringify(documents.map(d => d.name))
      }),
    })
    .then(res => res.json())
    .then(() => {
      toast.success('Service booked successfully! Please wait for admin approval.');
      setShowBookingDialog(false);
      setSelectedService(null);
      setFormData({});
      setDocuments([]);
      setBookedDates([]);
    })
    .catch(err => {
      console.error('Error booking service:', err);
      toast.error('Failed to book service');
    });
  };

  const renderFormField = (field: any) => {
    // Skip date fields entirely — booking date is handled by the calendar above
    if (field.type === 'date') return null;

    if (field.name === 'church' || field.label?.toLowerCase().includes('church location')) {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={field.name}
            type="text"
            value={CHURCH_LOCATION}
            disabled
          />
        </div>
      );
    }

    const value = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFormChange(field.name, e.target.value)}
              rows={field.rows || 3}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleFormChange(field.name, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFormChange(field.name, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Parish Services</h1>
          <p className="text-muted-foreground">Book sacramental and other parish services</p>
        </div>

        {/* Filters Section */}
        {!loadingServices && !servicesError && services.length > 0 && (
          <Card>
            <CardBody>
              <div className="space-y-4">
                <h3 className="font-semibold">Filter Services</h3>

                <div className="space-y-2">
                  <Label htmlFor="category">Service Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="capitalize"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Price Range: ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}</Label>
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      placeholder="Min price"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-32"
                    />
                    <Input
                      type="number"
                      placeholder="Max price"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Showing {filteredServices.length} of {services.length} services
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {loadingServices ? (
          <div className="text-center text-muted-foreground">Loading services...</div>
        ) : servicesError ? (
          <div className="text-center text-destructive">{servicesError}</div>
        ) : services.length === 0 ? (
          <div className="text-center text-muted-foreground">No services available in the database.</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center text-muted-foreground">No services match your filters. Try adjusting your selection.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover>
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={service.image?.startsWith('/assets') ? getAssetUrl(service.image) : service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardBody>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <Badge variant="secondary">
                        {service.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{service.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CreditCard className="w-4 h-4" />
                          Fee
                        </span>
                        <span className="font-semibold">₱{service.price.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Processing
                        </span>
                        <span className="font-medium">{service.processingTime}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium">Requirements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {service.requirements.map((req: any, idx: any) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedService(service);
                        setShowBookingDialog(true);
                        const initialData: Record<string, string> = {};
                        const churchField = service.formFields?.find((f: any) => f.name === 'church' || f.label?.toLowerCase().includes('church location'));
                        if (churchField) {
                          initialData[churchField.name] = CHURCH_LOCATION;
                        }
                        setFormData(initialData);
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book {selectedService?.name}</DialogTitle>
            <DialogDescription>
              Fill in the details below to book this service. Upload required documents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Booking Date Calendar */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">📅 Select Your Booking Date</p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Bookings are not available on Mondays (office closed), holidays, past dates, or fully-booked dates.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Booking Date</Label>
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                      ← Prev
                    </Button>
                    <span className="text-sm font-medium">{monthName}</span>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      Next →
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <th key={day} className="border border-border p-1 text-center font-semibold">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: Math.ceil((daysInMonth + firstDay) / 7) }).map((_, weekIndex) => (
                          <tr key={weekIndex}>
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                              const day = weekIndex * 7 + dayIndex - firstDay + 1;
                              const isCurrentMonth = day > 0 && day <= daysInMonth;
                              const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const isPast = isCurrentMonth && isPastDate(dateStr);
                              const isBooked = isCurrentMonth && isAlreadyBooked(dateStr);
                              const isBlocked = isCurrentMonth && !isValidBookingDate(dateStr);
                              const isSelected = formData._bookingDate === dateStr;

                              let cellClass = 'w-full h-full text-xs font-medium rounded transition-colors ';
                              if (isBlocked) {
                                if (isBooked) {
                                  cellClass += 'bg-red-100 dark:bg-red-900/40 text-red-400 cursor-not-allowed';
                                } else {
                                  cellClass += 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed';
                                }
                              } else if (isSelected) {
                                cellClass += 'bg-primary text-white';
                              } else {
                                cellClass += 'bg-white dark:bg-background hover:bg-primary/20';
                              }

                              return (
                                <td
                                  key={dayIndex}
                                  className={`border border-border p-1 text-center h-8 ${!isCurrentMonth ? 'bg-secondary/30' : ''}`}
                                >
                                  {isCurrentMonth ? (
                                    <button
                                      onClick={() => handleSelectDate(day)}
                                      disabled={isBlocked}
                                      title={isBooked ? 'Already booked' : isPast ? 'Past date' : isMonday(dateStr) ? 'Office closed (Monday)' : isHoliday(dateStr) ? 'Holiday' : ''}
                                      className={cellClass}
                                    >
                                      {day}
                                    </button>
                                  ) : null}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="bg-secondary/50 p-3 rounded-md border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">✓ Your selected booking date:</p>
                      <p className="font-semibold text-foreground text-sm">
                        {formData._bookingDate
                          ? new Date(formData._bookingDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'No date selected yet'}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Legend:</strong></p>
                      <div className="flex gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-primary rounded"></div>
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-white dark:bg-background border border-border rounded"></div>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <span>Unavailable</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/40 rounded"></div>
                          <span>Already Booked</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Additional Information Section — date fields excluded */}
            {selectedService?.formFields && selectedService.formFields.filter((f: any) => f.type !== 'date').length > 0 && (
              <div className="space-y-4">
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground mb-3">📋 Additional Information</p>
                  <div className="space-y-4">
                    {selectedService?.formFields?.map(renderFormField)}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Upload Documents (PDF, JPG, PNG - Max 5MB each)</Label>
              <div className="border-2 border-dashed border-border rounded-md p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="max-w-xs mx-auto"
                />
              </div>

              {documents.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-medium">Uploaded Documents:</p>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {doc.uploadedAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedService && (
              <div className="bg-secondary/30 p-4 rounded-md space-y-2">
                <h4 className="font-medium">Service Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fee:</span>
                    <span className="ml-2 font-medium">₱{selectedService.price.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Processing Time:</span>
                    <span className="ml-2 font-medium">{selectedService.processingTime}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookService}
              disabled={uploading}
            >
              Submit Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}