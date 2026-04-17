import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Plus, Edit, Trash2, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface OfficeHour {
  id: number;
  day: string;
  hours: string;
  notes: string;
}

const STORAGE_KEY = 'adminOfficeHours';
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AdminOfficeHours() {
  const [officeHours, setOfficeHours] = useState<OfficeHour[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHour, setEditingHour] = useState<OfficeHour | null>(null);
  const [formData, setFormData] = useState({
    day: 'Monday',
    hours: '',
    notes: '',
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOfficeHours(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Unable to load office hours from storage', err);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(officeHours));
    } catch (err) {
      console.warn('Unable to save office hours to storage', err);
    }
  }, [officeHours]);

  const handleEdit = (hour: OfficeHour) => {
    setEditingHour(hour);
    setFormData({
      day: hour.day,
      hours: hour.hours,
      notes: hour.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete this office hour entry?')) return;
    setOfficeHours((prev) => prev.filter((item) => item.id !== id));
    toast.success('Office hour deleted');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.day || !formData.hours) {
      toast.error('Please fill in all required fields');
      return;
    }

    const entry: OfficeHour = {
      id: editingHour ? editingHour.id : Date.now(),
      day: formData.day,
      hours: formData.hours,
      notes: formData.notes,
    };

    if (editingHour) {
      setOfficeHours((prev) => prev.map((item) => (item.id === editingHour.id ? entry : item)));
      toast.success('Office hour updated');
    } else {
      setOfficeHours((prev) => [...prev, entry]);
      toast.success('Office hour added');
    }

    handleCancel();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingHour(null);
    setFormData({ day: 'Monday', hours: '', notes: '' });
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-primary mb-2">Office Hours</h1>
            <p className="text-muted-foreground">Set and manage parish office operating hours.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Office Hour
          </Button>
        </div>

        <div className="space-y-4">
          {officeHours.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12 text-muted-foreground">
                No office hours added yet. Click "Add Office Hour" to create your first entry.
              </CardBody>
            </Card>
          ) : (
            officeHours.map((hour, index) => (
              <motion.div
                key={hour.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">{hour.day}</p>
                        <h3 className="text-lg font-semibold">{hour.hours}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(hour)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(hour.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="w-4 h-4" />
                      <span>{hour.hours}</span>
                    </div>
                    {hour.notes && <p className="text-sm text-muted-foreground">{hour.notes}</p>}
                  </CardBody>
                </Card>
              </motion.div>
            ))
          )}
        </div>

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
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2>{editingHour ? 'Edit Office Hour' : 'Add Office Hour'}</h2>
                      <button onClick={handleCancel}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardHeader>

                  <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium">Day</label>
                        <select
                          value={formData.day}
                          onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {weekdays.map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Hours"
                        value={formData.hours}
                        onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                        placeholder="e.g. 8:00 AM - 12:00 NN & 2:00 PM - 5:00 PM"
                        required
                      />

                      <Input
                        label="Notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional note: Closed on holidays, appointment only, etc."
                      />

                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingHour ? 'Update Office Hour' : 'Create Office Hour'}
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
