import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Users, Mail, Phone, Building } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../utils/apiConfig';

interface OrgMember {
  id: number;
  name: string;
  position: string;
  department: string;
  email?: string;
  phone?: string;
  photo?: string;
  level: number;
}

export function AboutUs() {
  const { t } = useTranslation();
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgMembers();
  }, []);

  const fetchOrgMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/org-members'));
      if (!response.ok) throw new Error('Failed to load org members');
      const data = await response.json();
      setOrgMembers(data.sort((a: OrgMember, b: OrgMember) => a.level - b.level));
    } catch (error) {
      console.error('Error fetching org members:', error);
      toast.error('Failed to load organization members');
    } finally {
      setLoading(false);
    }
  };

  const getMembersByLevel = (level: number) => {
    return orgMembers.filter(m => m.level === level);
  };

  const getLevelLabel = (level: number) => {
    const labels: { [key: number]: string } = {
      1: 'Leadership',
      2: 'Council',
      3: 'Staff & Volunteers',
      4: 'Support Team',
    };
    return labels[level] || `Level ${level}`;
  };

  const getLevelColor = (level: number) => {
    const colors: { [key: number]: string } = {
      1: 'bg-red-100 dark:bg-red-900/30 border-red-300',
      2: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300',
      3: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300',
      4: 'bg-green-100 dark:bg-green-900/30 border-green-300',
    };
    return colors[level] || 'bg-gray-100 dark:bg-gray-800 border-gray-300';
  };

  const getLevelAccentColor = (level: number) => {
    const colors: { [key: number]: string } = {
      1: 'from-red-500 to-red-400',
      2: 'from-blue-500 to-blue-400',
      3: 'from-yellow-500 to-yellow-400',
      4: 'from-green-500 to-green-400',
    };
    return colors[level] || 'from-gray-500 to-gray-400';
  };

  const maxLevel = Math.max(...orgMembers.map(m => m.level), 1);
  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  return (
    <>
      <UserNavbar />
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <Building className="w-10 h-10 text-red-600 dark:text-red-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('About Us')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Sacred Heart Parish Organization Structure
            </p>
          </motion.div>

          {/* Organization Description */}
          <Card className="mb-12">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Our Sacred Heart Parish
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Sacred Heart Parish is dedicated to serving our community with compassion, faith, and dedication. 
                Our organization brings together committed individuals from various roles and departments working towards 
                a common mission of spiritual growth and service to our parishioners.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our hierarchical structure ensures effective leadership, clear communication, and efficient service delivery 
                across all aspects of parish life and ministry.
              </p>
            </CardBody>
          </Card>

          {/* Org Chart Hierarchy */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full"></div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">{t('Loading')}...</p>
            </div>
          ) : orgMembers.length === 0 ? (
            <Card className="text-center py-12">
              <CardBody>
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">{t('No organization members found')}</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-14">
              {levels.map(level => {
                const levelMembers = getMembersByLevel(level);
                if (levelMembers.length === 0) return null;

                return (
                  <motion.div
                    key={`level-${level}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (level - 1) * 0.2 }}
                    className="space-y-6"
                  >
                    {/* Level Header with accent bar */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`h-1 flex-1 bg-gradient-to-r ${getLevelAccentColor(level)}`} />
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white px-4 whitespace-nowrap">
                        {getLevelLabel(level)}
                      </h2>
                      <div className={`h-1 flex-1 bg-gradient-to-l ${getLevelAccentColor(level)}`} />
                    </div>

                    {/* Members Grid */}
                    <div className={`${level === 1 ? 'flex flex-wrap justify-center gap-8' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
                      {levelMembers.map((member, idx) => (
                        <motion.div
                          key={`member-${member.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (level - 1) * 0.2 + idx * 0.1 }}
                          layout
                          className={level === 1 ? 'w-80' : ''}
                        >
                          <Card className={`overflow-hidden border-2 ${getLevelColor(level)} h-full hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                            {/* Photo Section */}
                            <div className="relative w-full h-56 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              {member.photo ? (
                                <img
                                  src={getAssetUrl(member.photo || '')}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Photo';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                                  <Users className="w-16 h-16 text-gray-500" />
                                </div>
                              )}
                              {/* Level badge */}
                              <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${getLevelAccentColor(level)}`}>
                                Level {level}
                              </div>
                            </div>

                            {/* Member Info */}
                            <CardBody className="p-5">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                                {member.name}
                              </h3>
                              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1 line-clamp-2">
                                {member.position}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                                {member.department}
                              </p>

                              {/* Contact Information */}
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
                                {member.email && (
                                  <a
                                    href={`mailto:${member.email}`}
                                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline group"
                                  >
                                    <Mail className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="truncate">{member.email}</span>
                                  </a>
                                )}
                                {member.phone && (
                                  <a
                                    href={`tel:${member.phone}`}
                                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline group"
                                  >
                                    <Phone className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                    <span>{member.phone}</span>
                                  </a>
                                )}
                              </div>
                            </CardBody>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Divider line between levels */}
                    {level < maxLevel && (
                      <div className="flex justify-center pt-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700"></div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}


        </div>
      </div>
    </>
  );
}
