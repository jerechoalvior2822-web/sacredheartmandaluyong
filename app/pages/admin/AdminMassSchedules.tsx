import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { getApiUrl } from '../../utils/apiConfig';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Plus, Edit, Trash2, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface MassAssignment {
  id: number;
  massDay: string;
  massTime: string;
  date: string;
  collectors: string[];
  lectors: string[];
  eucharisticMinisters: string[];
  altarServers: string[];
  choirLeader: string;
  ushers: string[];
}

export function AdminMassSchedules() {
  const [assignments, setAssignments] = useState<MassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<MassAssignment | null>(null);
  const [formData, setFormData] = useState({
    massDay: 'Sunday',
    massTime: '',
    date: '',
    choirLeader: '',
  });

  const [collectors, setCollectors] = useState<string[]>([]);
  const [lectors, setLectors] = useState<string[]>([]);
  const [eucharisticMinisters, setEucharisticMinisters] = useState<string[]>([]);
  const [altarServers, setAltarServers] = useState<string[]>([]);
  const [ushers, setUshers] = useState<string[]>([]);

  const [collectorInput, setCollectorInput] = useState('');
  const [lectorInput, setLectorInput] = useState('');
  const [emInput, setEmInput] = useState('');
  const [serverInput, setServerInput] = useState('');
  const [usherInput, setUsherInput] = useState('');

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/mass-schedules'));
      if (!response.ok) throw new Error('Failed to load assignments');
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      toast.error('Failed to load mass schedules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment: MassAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      massDay: assignment.massDay,
      massTime: assignment.massTime,
      date: assignment.date,
      choirLeader: assignment.choirLeader,
    });
    setCollectors(assignment.collectors);
    setLectors(assignment.lectors);
    setEucharisticMinisters(assignment.eucharisticMinisters);
    setAltarServers(assignment.altarServers);
    setUshers(assignment.ushers);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this mass assignment?')) {
      try {
        const response = await fetch(getApiUrl(`/api/mass-schedules/${id}`), {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete assignment');
        setAssignments(assignments.filter(a => a.id !== id));
        toast.success('Assignment deleted successfully');
      } catch (err) {
        toast.error('Failed to delete assignment');
        console.error(err);
      }
    }
  };

  const addToList = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string, inputSetter: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      inputSetter('');
    }
  };

  const removeFromList = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.massDay || !formData.massTime || !formData.date) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      massDay: formData.massDay,
      massTime: formData.massTime,
      date: formData.date,
      collectors,
      lectors,
      eucharisticMinisters,
      altarServers,
      choirLeader: formData.choirLeader,
      ushers,
      status: 'upcoming',
    };

    try {
      if (editingAssignment) {
        const response = await fetch(getApiUrl(`/api/mass-schedules/${editingAssignment.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update assignment');
        toast.success('Assignment updated successfully');
      } else {
        const response = await fetch(getApiUrl('/api/mass-schedules'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create assignment');
        toast.success('Assignment created successfully');
      }
      await fetchAssignments();
      handleCancel();
    } catch (err) {
      toast.error(editingAssignment ? 'Failed to update assignment' : 'Failed to create assignment');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
    setFormData({ massDay: 'Sunday', massTime: '', date: '', choirLeader: '' });
    setCollectors([]);
    setLectors([]);
    setEucharisticMinisters([]);
    setAltarServers([]);
    setUshers([]);
    setCollectorInput('');
    setLectorInput('');
    setEmInput('');
    setServerInput('');
    setUsherInput('');
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-primary mb-2">Mass Schedules & Assignments</h1>
            <p className="text-muted-foreground">Manage mass schedules and assign collectors/ministries</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Assignment
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Total Assignments</p>
              <p className="text-2xl font-bold">{assignments.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">This Week</p>
              <p className="text-2xl font-bold">{assignments.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Active Volunteers</p>
              <p className="text-2xl font-bold">45</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Ministries</p>
              <p className="text-2xl font-bold">6</p>
            </CardBody>
          </Card>
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading mass schedules...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No mass schedules found. Create one to get started.</div>
        ) : (
        <div className="space-y-4">
          {assignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <h3>{assignment.massDay}, {assignment.massTime}</h3>
                        <p className="text-sm text-muted-foreground">{assignment.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(assignment.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-2">Collectors:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.collectors.map((name, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Lectors:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.lectors.map((name, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Eucharistic Ministers:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.eucharisticMinisters.map((name, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Altar Servers:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.altarServers.map((name, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Choir Leader:</p>
                      <span className="px-2 py-1 bg-accent/10 text-accent rounded">
                        {assignment.choirLeader}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Ushers:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.ushers.map((name, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
        )}

        {/* Add/Edit Modal */}
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
                <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</h2>
                      <button onClick={handleCancel}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-foreground">Mass Day *</label>
                          <select
                            value={formData.massDay}
                            onChange={e => setFormData({ ...formData, massDay: e.target.value })}
                            className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                          >
                            {daysOfWeek.map(day => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          type="time"
                          label="Mass Time *"
                          value={formData.massTime}
                          onChange={e => setFormData({ ...formData, massTime: e.target.value })}
                          required
                        />
                      </div>

                      <Input
                        type="date"
                        label="Date *"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        required
                      />

                      {/* Collectors */}
                      <div>
                        <label className="block mb-2 text-foreground">Collectors</label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={collectorInput}
                            onChange={e => setCollectorInput(e.target.value)}
                            placeholder="Enter name and press Add"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addToList(setCollectors, collectorInput, setCollectorInput);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => addToList(setCollectors, collectorInput, setCollectorInput)}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {collectors.map((name, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-secondary text-foreground rounded-lg flex items-center gap-2"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => removeFromList(setCollectors, index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Lectors */}
                      <div>
                        <label className="block mb-2 text-foreground">Lectors</label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={lectorInput}
                            onChange={e => setLectorInput(e.target.value)}
                            placeholder="Enter name and press Add"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addToList(setLectors, lectorInput, setLectorInput);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => addToList(setLectors, lectorInput, setLectorInput)}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lectors.map((name, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-secondary text-foreground rounded-lg flex items-center gap-2"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => removeFromList(setLectors, index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Eucharistic Ministers */}
                      <div>
                        <label className="block mb-2 text-foreground">Eucharistic Ministers</label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={emInput}
                            onChange={e => setEmInput(e.target.value)}
                            placeholder="Enter name and press Add"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addToList(setEucharisticMinisters, emInput, setEmInput);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => addToList(setEucharisticMinisters, emInput, setEmInput)}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {eucharisticMinisters.map((name, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-secondary text-foreground rounded-lg flex items-center gap-2"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => removeFromList(setEucharisticMinisters, index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Altar Servers */}
                      <div>
                        <label className="block mb-2 text-foreground">Altar Servers</label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={serverInput}
                            onChange={e => setServerInput(e.target.value)}
                            placeholder="Enter name and press Add"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addToList(setAltarServers, serverInput, setServerInput);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => addToList(setAltarServers, serverInput, setServerInput)}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {altarServers.map((name, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-secondary text-foreground rounded-lg flex items-center gap-2"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => removeFromList(setAltarServers, index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Choir Leader */}
                      <Input
                        label="Choir Leader"
                        value={formData.choirLeader}
                        onChange={e => setFormData({ ...formData, choirLeader: e.target.value })}
                        placeholder="Enter choir leader name"
                      />

                      {/* Ushers */}
                      <div>
                        <label className="block mb-2 text-foreground">Ushers</label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={usherInput}
                            onChange={e => setUsherInput(e.target.value)}
                            placeholder="Enter name and press Add"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addToList(setUshers, usherInput, setUsherInput);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => addToList(setUshers, usherInput, setUsherInput)}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ushers.map((name, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-secondary text-foreground rounded-lg flex items-center gap-2"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => removeFromList(setUshers, index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
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
