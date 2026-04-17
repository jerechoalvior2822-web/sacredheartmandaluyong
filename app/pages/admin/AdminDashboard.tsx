import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import {
  Users,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getApiUrl } from '../../utils/apiConfig'; getApiUrl } from '../../utils/apiConfig';
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsResponse, donationsResponse, usersResponse] = await Promise.all([
          fetch(getApiUrl('/api/bookings')),
          fetch(getApiUrl('/api/donations')),
          fetch(getApiUrl('/api/users')),
        ]);

        if (!bookingsResponse.ok || !donationsResponse.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const bookingsData = await bookingsResponse.json();
        const donationsData = await donationsResponse.json();
        const usersData = usersResponse.ok ? await usersResponse.json() : [];

        // Build users map for lookup
        const newUsersMap: Record<number, { name: string; email: string }> = {};
        usersData.forEach((u: any) => {
          newUsersMap[u.id] = { 
            name: u.name || u.username || `User #${u.id}`, 
            email: u.email || 'No email' 
          };
        });
        setUsersMap(newUsersMap);

        setBookings(bookingsData.map((booking: any) => ({
          ...booking,
          documents: booking.documents ? JSON.parse(booking.documents) : [],
        })));
        setDonations(donationsData);
      } catch (err) {
        setError((err as Error).message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const thisMonth = new Date().getMonth();
    const bookingsThisMonth = bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate.getMonth() === thisMonth && bookingDate.getFullYear() === new Date().getFullYear();
    }).length;
    const donationTotal = donations.reduce((sum, donation) => sum + Number(donation.amount), 0);

    return [
      {
        label: 'Total Bookings',
        value: totalBookings.toString(),
        change: '+0%',
        trend: 'up',
        icon: Users,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
      },
      {
        label: 'Bookings (This Month)',
        value: bookingsThisMonth.toString(),
        change: '+0%',
        trend: 'up',
        icon: Calendar,
        color: 'text-accent',
        bgColor: 'bg-accent/10',
      },
      {
        label: 'Donations',
        value: `₱${donationTotal.toLocaleString()}`,
        change: '+0%',
        trend: 'up',
        icon: DollarSign,
        color: 'text-chart-2',
        bgColor: 'bg-chart-2/10',
      },
      {
        label: 'Souvenir Sales',
        value: 'N/A',
        change: '+0%',
        trend: 'down',
        icon: ShoppingBag,
        color: 'text-chart-4',
        bgColor: 'bg-chart-4/10',
      },
    ];
  }, [bookings, donations]);

  const bookingsData = useMemo(() => {
    const monthMap = new Map<string, { month: string; bookings: number; donations: number }>();
    const now = new Date();

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthMap.set(monthKey, { month: monthKey, bookings: 0, donations: 0 });
    }

    const formatMonth = (dateString: string) => {
      if (!dateString) return now.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return now.toLocaleString('default', { month: 'short', year: '2-digit' });
      }
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    };

    bookings.forEach((booking) => {
      const month = formatMonth(booking.date || booking.service_date || booking.created_at);
      const entry = monthMap.get(month) || { month, bookings: 0, donations: 0 };
      entry.bookings += 1;
      monthMap.set(month, entry);
    });

    donations.forEach((donation) => {
      const month = formatMonth(donation.created_at || donation.donated_at || donation.date || new Date().toISOString());
      const entry = monthMap.get(month) || { month, bookings: 0, donations: 0 };
      entry.donations += Number(donation.amount || 0);
      monthMap.set(month, entry);
    });

    // Return sorted by date
    return Array.from(monthMap.values()).sort((a, b) => {
      const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const aMonth = a.month.split(' ')[0];
      const bMonth = b.month.split(' ')[0];
      return monthsOrder.indexOf(aMonth) - monthsOrder.indexOf(bMonth);
    });
  }, [bookings, donations]);

  const serviceDistribution = useMemo(() => {
    const colors = ['#8B2635', '#C4954A', '#5B9BD5', '#70AD47', '#FFC000', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    const counts: Record<string, number> = {};

    bookings.forEach((booking) => {
      const serviceName = booking.service || 'Others';
      counts[serviceName] = (counts[serviceName] || 0) + 1;
    });

    const distribution = Object.entries(counts).map(([name, value], index) => ({ 
      name, 
      value, 
      color: colors[index % colors.length] 
    }));
    return distribution.length > 0 ? distribution : [{ name: 'No Data', value: 1, color: '#A05061' }];
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return bookings.slice(0, 4).map((booking) => {
      const userInfo = usersMap[booking.user_id] || { 
        name: booking.user || `User #${booking.user_id || booking.id}`, 
        email: 'No email' 
      };
      return {
        ...booking,
        user: userInfo.email,
        status: booking.status,
      };
    });
  }, [bookings, usersMap]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
          Loading dashboard...
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-destructive">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-primary mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover>
                  <CardBody>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <TrendIcon className="w-4 h-4" />
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                    <p className="font-bold text-2xl">{stat.value}</p>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bookings & Donations Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <h2>Bookings & Donations Trend</h2>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={bookingsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#F5E6D3" />
                    <YAxis yAxisId="left" stroke="#F5E6D3" label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#F5E6D3" label={{ value: 'Donations (₱)', angle: 90, position: 'insideRight' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #C4954A', color: '#F5E6D3' }} />
                    <Legend wrapperStyle={{ color: '#F5E6D3' }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="bookings"
                      stroke="#FF6B9D"
                      fill="#FF6B9D"
                      fillOpacity={0.4}
                      name="Bookings"
                      label={{ fill: '#F5E6D3', fontSize: 11 }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="donations"
                      stroke="#C4954A"
                      fill="#C4954A"
                      fillOpacity={0.4}
                      name="Donations (₱)"
                      label={{ fill: '#F5E6D3', fontSize: 11 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </motion.div>

          {/* Service Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <h2>Service Distribution</h2>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Recent Bookings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <h2>Recent Bookings</h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-6 py-3 text-left">User</th>
                      <th className="px-6 py-3 text-left">Service</th>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map(booking => (
                      <tr key={booking.id} className="border-t border-border">
                        <td className="px-6 py-4">{booking.user}</td>
                        <td className="px-6 py-4">{booking.service}</td>
                        <td className="px-6 py-4">{booking.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {booking.status === 'approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            )}
                            <span className="capitalize">{booking.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
