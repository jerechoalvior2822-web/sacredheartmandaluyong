import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Plus, Edit, Trash2, X, Upload, Users, ChevronDown, ChevronUp, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../../utils/apiConfig';

interface OrgMember {
  id: number;
  name: string;
  position: string;
  department: string;
  email?: string;
  phone?: string;
  photo?: string;
  level: number;
  parentId?: number;
}

export function AdminOrgChart() {
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrgMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    photo: '',
    level: '1',
  });
  const [expandedDepts, setExpandedDepts] = useState<string[]>(['Leadership', 'Council', 'Liturgy', 'Formation', 'Outreach']);

  const departments = ['Leadership', 'Council', 'Liturgy', 'Formation', 'Outreach', 'Administration'];

  // Fetch org members from API
  useEffect(() => {
    fetchOrgMembers();
  }, []);

  const fetchOrgMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/org-members'));
      if (!response.ok) throw new Error('Failed to load org members');
      const data = await response.json();
      setOrgMembers(data);
    } catch (error) {
      console.error('Error fetching org members:', error);
      toast.error('Failed to load organization members');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: OrgMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      position: member.position,
      department: member.department,
      email: member.email || '',
      phone: member.phone || '',
      photo: member.photo || '',
      level: member.level.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to remove this member from the org chart?')) {
      fetch(getApiUrl(`/api/org-members/${id}`), {
        method: 'DELETE',
      })
        .then(res => {
          if (res.ok) {
            setOrgMembers(orgMembers.filter(m => m.id !== id));
            toast.success('Member removed successfully');
          } else {
            toast.error('Failed to remove member');
          }
        })
        .catch(err => {
          console.error('Error deleting member:', err);
          toast.error('Error removing member');
        });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.position || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    const memberData = {
      name: formData.name,
      position: formData.position,
      department: formData.department,
      email: formData.email || null,
      phone: formData.phone || null,
      photo: formData.photo || null,
      level: parseInt(formData.level),
    };

    try {
      if (editingMember) {
        const response = await fetch(getApiUrl(`/api/org-members/${editingMember.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success('Member updated successfully');
          fetchOrgMembers();
        } else {
          toast.error(`Failed to update member: ${data.error || 'Unknown error'}`);
        }
      } else {
        const response = await fetch(getApiUrl('/api/org-members'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success('Member added successfully');
          fetchOrgMembers();
        } else {
          toast.error(`Failed to add member: ${data.error || 'Unknown error'}`);
        }
      }
      handleCancel();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error(`Error saving member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({ name: '', position: '', department: '', email: '', phone: '', photo: '', level: '1' });
  };

  const toggleDepartment = (dept: string) => {
    if (expandedDepts.includes(dept)) {
      setExpandedDepts(expandedDepts.filter(d => d !== dept));
    } else {
      setExpandedDepts([...expandedDepts, dept]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize to max 400x400 for profile pictures
          const maxSize = 400;
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG quality 80%
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setFormData({ ...formData, photo: compressed });
            toast.success('Photo uploaded and compressed');
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const getMembersByDepartment = (dept: string) => {
    return orgMembers.filter(m => m.department === dept).sort((a, b) => a.level - b.level);
  };

  const handleDownloadChart = () => {
    const link = document.createElement('a');
    link.href = '/src/imports/Parish_Organization_Chart.pdf';
    link.download = 'Parish_Organization_Chart.pdf';
    link.click();
    toast.success('Organization chart downloaded');
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-primary mb-2">Organizational Chart</h1>
            <p className="text-muted-foreground">Manage parish organizational structure and leadership</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadChart}>
              <Upload className="w-5 h-5 mr-2" />
              Download Chart
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Organization Chart Display */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <p>Loading organization members...</p>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          {departments.map((dept, deptIndex) => {
            const members = getMembersByDepartment(dept);
            if (members.length === 0) return null;

            const isExpanded = expandedDepts.includes(dept);

            return (
              <motion.div
                key={dept}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: deptIndex * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <button
                      onClick={() => toggleDepartment(dept)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <h2>{dept}</h2>
                        <span className="text-sm text-muted-foreground">
                          ({members.length} {members.length === 1 ? 'member' : 'members'})
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </CardHeader>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <CardBody className="pt-0">
                          <div className="space-y-3">
                            {members.map(member => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                                style={{ marginLeft: `${(member.level - 1) * 24}px` }}
                              >
                                <div className="flex-1 flex items-center gap-4">
                                  {member.photo ? (
                                    <img
                                      src={member.photo}
                                      alt={member.name}
                                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Users className="w-6 h-6 text-primary" />
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="mb-0.5">{member.name}</h3>
                                    <p className="text-sm text-muted-foreground">{member.position}</p>
                                    {(member.email || member.phone) && (
                                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                        {member.email && <span>{member.email}</span>}
                                        {member.phone && <span>{member.phone}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="danger" size="sm" onClick={() => handleDelete(member.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
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
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2>{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
                      <button onClick={handleCancel}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        label="Full Name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />

                      <Input
                        label="Position/Title"
                        value={formData.position}
                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                        required
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-foreground">Department *</label>
                          <select
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            required
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-2 text-foreground">Hierarchy Level *</label>
                          <select
                            value={formData.level}
                            onChange={e => setFormData({ ...formData, level: e.target.value })}
                            className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            required
                          >
                            <option value="1">Level 1 (Top)</option>
                            <option value="2">Level 2</option>
                            <option value="3">Level 3</option>
                            <option value="4">Level 4</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="email"
                          label="Email (Optional)"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />

                        <Input
                          type="tel"
                          label="Phone (Optional)"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>

                      {/* Photo Upload */}
                      <div>
                        <label className="block mb-2 text-foreground">Photo (Optional)</label>
                        <div className="flex gap-3">
                          <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <ImagePlus className="w-5 h-5" />
                              <span className="text-sm">Upload Photo</span>
                            </div>
                          </label>
                          {formData.photo && (
                            <div className="flex items-center gap-2">
                              <img
                                src={formData.photo}
                                alt="Preview"
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData({ ...formData, photo: '' })}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingMember ? 'Update Member' : 'Add Member'}
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
