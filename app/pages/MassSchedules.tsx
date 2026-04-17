import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Calendar, Clock, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { getApiUrl } from '../utils/apiConfig';

type MassSchedule = {
  id: number;
  massDay: string;
  massTime: string;
  date: string;
  status: string;
  collectors: string[];
  lectors: string[];
  altarServers: string[];
  eucharisticMinisters: string[];
  choirLeader: string;
  ushers: string[];
};

export function MassSchedules() {
  const [massSchedules, setMassSchedules] = useState<MassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMassSchedules = async () => {
      try {
        const response = await fetch(getApiUrl('/api/mass-schedules'));
        if (!response.ok) throw new Error('Failed to load mass schedules');
        const data = await response.json();
        setMassSchedules(data);
      } catch (err) {
        setError((err as Error).message || 'Unable to load schedules');
      } finally {
        setLoading(false);
      }
    };

    fetchMassSchedules();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'ongoing') {
      return <span className="px-3 py-1 bg-accent text-white rounded-full text-sm">Ongoing</span>;
    }
    return <span className="px-3 py-1 bg-secondary text-foreground rounded-full text-sm">Upcoming</span>;
  };

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-primary mb-2">Mass Schedules</h1>
          <p className="text-muted-foreground">View mass schedules and ministry assignments</p>
        </motion.div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading schedules...</div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : massSchedules.length === 0 ? (
          <div className="text-center text-muted-foreground">No mass schedules found in the database.</div>
        ) : (
          <div className="space-y-6">
            {massSchedules.map((mass, index) => {
              return (
                <motion.div
                  key={mass.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h2>{mass.massDay} Mass</h2>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{mass.massTime}</span>
                              <span>•</span>
                              <span>{mass.date}</span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(mass.status)}
                      </div>
                    </CardHeader>
                    <CardBody>
                      {mass.status === 'ongoing' && (
                        <div className="mb-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                          <div className="flex items-center gap-2 text-accent">
                            <Users className="w-5 h-5" />
                            <p className="font-medium">Currently On Duty</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="mb-3">Ministry Assignments</h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Collectors:</p>
                              <div className="flex flex-wrap gap-2">
                                {mass.collectors.map((name: string, i: number) => (
                                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Lectors:</p>
                              <div className="flex flex-wrap gap-2">
                                {mass.lectors.map((name: string, i: number) => (
                                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Altar Servers:</p>
                              <div className="flex flex-wrap gap-2">
                                {mass.altarServers.map((name: string, i: number) => (
                                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-3">Additional Roles</h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Eucharistic Ministers:</p>
                              <div className="flex flex-wrap gap-2">
                                {mass.eucharisticMinisters.map((name: string, i: number) => (
                                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Choir Leader:</p>
                              <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-sm">
                                {mass.choirLeader}
                              </span>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Ushers:</p>
                              <div className="flex flex-wrap gap-2">
                                {mass.ushers.map((name: string, i: number) => (
                                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
