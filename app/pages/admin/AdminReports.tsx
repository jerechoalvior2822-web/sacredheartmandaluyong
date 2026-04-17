import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Select } from '../../components/Input';
import { FileText, Calendar, DollarSign, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { getApiUrl } from '../../utils/apiConfig';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function AdminReports() {
  const [reportType, setReportType] = useState('bookings');
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [bookingsData, setBookingsData] = useState<Array<{ month: string; count: number; revenue: number }>>([]);
  const [donationsData, setDonationsData] = useState<Array<{ month: string; amount: number }>>([]);
  const [reportSummary, setReportSummary] = useState({
    bookings: { total: 0, revenue: 0, pending: 0, approved: 0, prevYearTotal: 0, prevYearRevenue: 0 },
    donations: { total: 0, count: 0, avgDonation: 0, prevYearTotal: 0, prevYearCount: 0 },
    users: { total: 0, newThisMonth: 0, active: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchReportsData();
  }, [dateRange, customStartDate, customEndDate, reportType]);

  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date(now);
    
    // Set end to end of today
    end.setHours(23, 59, 59, 999);

    switch (dateRange) {
      case 'week':
        // Last 7 days
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        // Entire calendar month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        // End of current month
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        // Entire quarter
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        // End of quarter
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        // Entire calendar year
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        // End of year
        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStartDate) {
          start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
        }
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999); // Include full day
        }
        break;
    }

    return { start, end };
  };

  const getPreviousYearDateRange = () => {
    const { start, end } = getDateRange();
    const prevStart = new Date(start);
    const prevEnd = new Date(end);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    return { start: prevStart, end: prevEnd };
  };

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const API_BASE = getApiUrl('');
      const [bookingsRes, donationsRes] = await Promise.all([
        fetch(`${API_BASE}/api/bookings`),
        fetch(`${API_BASE}/api/donations`),
      ]);

      const bookingsRaw = bookingsRes.ok ? await bookingsRes.json() : [];
      const donationsRaw = donationsRes.ok ? await donationsRes.json() : [];

      // Helper function to safely parse dates
      const parseDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      };

      // Get current date range for filtering
      const { start: rangeStart, end: rangeEnd } = getDateRange();

      // Process bookings data
      const bookingsByMonth: Record<string, { month: string; count: number; revenue: number }> = {};
      const bookingStatuses = { pending: 0, approved: 0 };
      let totalRevenue = 0;
      let filteredBookingsCount = 0; // Track filtered bookings for summary
      const bookingsArray = Array.isArray(bookingsRaw) ? bookingsRaw : bookingsRaw.bookings || [];

      bookingsArray.forEach((booking: any) => {
        // Try multiple date fields
        const dateObj = parseDate(booking.date) || 
                       parseDate(booking.service_date) || 
                       parseDate(booking.created_at) ||
                       new Date();
        
        // Filter by date range
        if (dateObj < rangeStart || dateObj > rangeEnd) {
          return; // Skip if outside date range
        }

        filteredBookingsCount += 1; // Count filtered bookings

        const month = dateObj.toLocaleString('default', { month: 'short' });

        if (!bookingsByMonth[month]) {
          bookingsByMonth[month] = { month, count: 0, revenue: 0 };
        }
        bookingsByMonth[month].count += 1;
        bookingsByMonth[month].revenue += parseInt(booking.price || 0);

        if (booking.status === 'pending') bookingStatuses.pending += 1;
        else if (booking.status === 'approved' || booking.status === 'confirmed') bookingStatuses.approved += 1;

        totalRevenue += parseInt(booking.price || 0);
      });

      // Process donations data
      const donationsByMonth: Record<string, { month: string; amount: number }> = {};
      const now = new Date();

      // Generate last 12 months for donations
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        if (!donationsByMonth[monthKey]) {
          donationsByMonth[monthKey] = { month: monthKey, amount: 0 };
        }
      }

      let totalDonations = 0;
      let donationCount = 0;
      let filteredDonationsTotal = 0; // Track filtered donations for summary
      let filteredDonationCount = 0; // Track filtered donation count
      const donationsArray = Array.isArray(donationsRaw) ? donationsRaw : donationsRaw.donations || [];

      donationsArray.forEach((donation: any) => {
        const dateObj = parseDate(donation.created_at) || 
                       parseDate(donation.donated_at) ||
                       new Date();
        
        // Filter by date range
        if (dateObj < rangeStart || dateObj > rangeEnd) {
          return; // Skip if outside date range
        }

        filteredDonationsTotal += parseInt(donation.amount || 0); // Sum filtered donations
        filteredDonationCount += 1; // Count filtered donations

        const month = dateObj.toLocaleString('default', { month: 'short' });
        const entry = donationsByMonth[month] || { month, amount: 0 };
        entry.amount += parseInt(donation.amount || 0);
        donationsByMonth[month] = entry;
        
        totalDonations += parseInt(donation.amount || 0);
        donationCount += 1;
      });

      // Sort donations data by month order
      let sortedDonations = Object.values(donationsByMonth).sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

      // Add forecasting for donations (next 2 months)
      if (sortedDonations.length >= 2) {
        const recentAvg = (sortedDonations[sortedDonations.length - 1].amount + 
                          sortedDonations[sortedDonations.length - 2].amount) / 2;
        const nextMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = sortedDonations[sortedDonations.length - 1].month;
        const currentIdx = nextMonths.indexOf(currentMonth);
        
        // Forecast with realistic growth (±5-10% variance)
        for (let i = 1; i <= 2; i++) {
          const nextIdx = (currentIdx + i) % 12;
          const variance = 1 + (Math.random() * 0.1 - 0.05);
          const forecastedAmount = Math.round(recentAvg * variance);
          sortedDonations.push({
            month: nextMonths[nextIdx],
            amount: forecastedAmount
          });
        }
      }

      // Add forecasting for next 2 months
      const sortedBookings = Object.values(bookingsByMonth).sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

      if (sortedBookings.length >= 2) {
        const recentAvg = (sortedBookings[sortedBookings.length - 1].count + 
                          sortedBookings[sortedBookings.length - 2].count) / 2;
        const nextMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = sortedBookings[sortedBookings.length - 1].month;
        const currentIdx = nextMonths.indexOf(currentMonth);
        
        // Forecast with realistic growth (±5-10% variance)
        for (let i = 1; i <= 2; i++) {
          const nextIdx = (currentIdx + i) % 12;
          const variance = 1 + (Math.random() * 0.1 - 0.05); // 5% variance
          const forecastedCount = Math.round(recentAvg * variance);
          const forecastedRevenue = Math.round((sortedBookings[sortedBookings.length - 1].revenue || 0) * variance);
          sortedBookings.push({
            month: nextMonths[nextIdx],
            count: forecastedCount,
            revenue: forecastedRevenue
          });
        }
      }

      setBookingsData(sortedBookings as Array<{ month: string; count: number; revenue: number }>);
      setDonationsData(sortedDonations as Array<{ month: string; amount: number }>);

      // Calculate previous year data for comparison
      const { start: prevStart, end: prevEnd } = getPreviousYearDateRange();
      let prevYearBookings = 0;
      let prevYearRevenue = 0;
      let prevYearDonations = 0;
      let prevYearDonationCount = 0;

      bookingsArray.forEach((booking: any) => {
        const dateObj = parseDate(booking.date) || 
                       parseDate(booking.service_date) || 
                       parseDate(booking.created_at) ||
                       new Date();
        if (dateObj >= prevStart && dateObj <= prevEnd) {
          prevYearBookings += 1;
          prevYearRevenue += parseInt(booking.price || 0);
        }
      });

      donationsArray.forEach((donation: any) => {
        const dateObj = parseDate(donation.created_at) || 
                       parseDate(donation.donated_at) ||
                       new Date();
        if (dateObj >= prevStart && dateObj <= prevEnd) {
          prevYearDonations += parseInt(donation.amount || 0);
          prevYearDonationCount += 1;
        }
      });

      setReportSummary({
        bookings: {
          total: filteredBookingsCount,
          revenue: totalRevenue,
          pending: bookingStatuses.pending,
          approved: bookingStatuses.approved,
          prevYearTotal: prevYearBookings,
          prevYearRevenue: prevYearRevenue,
        },
        donations: {
          total: filteredDonationsTotal,
          count: filteredDonationCount,
          avgDonation: filteredDonationCount > 0 ? filteredDonationsTotal / filteredDonationCount : 0,
          prevYearTotal: prevYearDonations,
          prevYearCount: prevYearDonationCount,
        },
        users: {
          total: 0,
          newThisMonth: 0,
          active: 0,
        },
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const toastId = toast.loading('Generating PDF...');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(139, 38, 53); // Maroon
      pdf.text('Sacred Heart Parish', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setTextColor(61, 40, 23); // Dark brown
      const reportTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report';
      pdf.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      const dateRangeText = dateRange === 'custom' ? `${customStartDate} to ${customEndDate}` : dateRange;
      pdf.text(`Period: ${dateRangeText}`, pageWidth / 2, yPosition + 6, { align: 'center' });

      yPosition += 20;

      // Summary Section
      pdf.setFontSize(12);
      pdf.setTextColor(139, 38, 53);
      pdf.text('SUMMARY', 20, yPosition);

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(61, 40, 23);

      if (reportType === 'bookings') {
        const summaryData = [
          ['Total Bookings', `${reportSummary.bookings.total}`],
          ['Total Revenue', `₱${reportSummary.bookings.revenue.toLocaleString()}`],
          ['Pending', `${reportSummary.bookings.pending}`],
          ['Approved', `${reportSummary.bookings.approved}`],
          ['Last Year Total', `${reportSummary.bookings.prevYearTotal}`],
          ['Change vs Last Year', `${reportSummary.bookings.total - reportSummary.bookings.prevYearTotal > 0 ? '+' : ''}${reportSummary.bookings.total - reportSummary.bookings.prevYearTotal}`],
        ];

        summaryData.forEach((row, idx) => {
          pdf.text(`${row[0]}: ${row[1]}`, 20, yPosition + (idx * 6));
        });

        yPosition += summaryData.length * 6 + 10;

        // Monthly Data Table
        pdf.setFontSize(11);
        pdf.setTextColor(139, 38, 53);
        pdf.text('MONTHLY BREAKDOWN', 20, yPosition);

        yPosition += 8;
        pdf.setFontSize(9);
        
        // Table headers
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(139, 38, 53);
        pdf.rect(20, yPosition - 4, 170, 6, 'F');
        pdf.text('Month', 25, yPosition + 1);
        pdf.text('Bookings', 70, yPosition + 1);
        pdf.text('Revenue', 110, yPosition + 1);
        pdf.text('Forecast', 160, yPosition + 1);

        yPosition += 8;
        pdf.setTextColor(61, 40, 23);

        // Table rows
        bookingsData.forEach((item, idx) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          const isForecast = idx >= bookingsData.length - 2;
          pdf.text(item.month, 25, yPosition);
          pdf.text(String(item.count), 70, yPosition);
          pdf.text(`₱${item.revenue.toLocaleString()}`, 110, yPosition);
          pdf.text(isForecast ? 'Yes' : 'No', 160, yPosition);
          yPosition += 6;
        });

      } else if (reportType === 'donations') {
        const summaryData = [
          ['Total Donations', `₱${reportSummary.donations.total.toLocaleString()}`],
          ['Number of Donors', `${reportSummary.donations.count}`],
          ['Average Donation', `₱${reportSummary.donations.avgDonation.toFixed(2)}`],
          ['Last Year Total', `₱${reportSummary.donations.prevYearTotal.toLocaleString()}`],
          ['Change vs Last Year', `${reportSummary.donations.total - reportSummary.donations.prevYearTotal > 0 ? '+' : ''}₱${(reportSummary.donations.total - reportSummary.donations.prevYearTotal).toLocaleString()}`],
        ];

        summaryData.forEach((row, idx) => {
          pdf.text(`${row[0]}: ${row[1]}`, 20, yPosition + (idx * 6));
        });

        yPosition += summaryData.length * 6 + 10;

        // Monthly Data Table
        pdf.setFontSize(11);
        pdf.setTextColor(139, 38, 53);
        pdf.text('MONTHLY BREAKDOWN', 20, yPosition);

        yPosition += 8;
        pdf.setFontSize(9);

        // Table headers
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(139, 38, 53);
        pdf.rect(20, yPosition - 4, 170, 6, 'F');
        pdf.text('Month', 25, yPosition + 1);
        pdf.text('Amount', 80, yPosition + 1);
        pdf.text('Forecast', 160, yPosition + 1);

        yPosition += 8;
        pdf.setTextColor(61, 40, 23);

        // Table rows
        donationsData.forEach((item, idx) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          const isForecast = idx >= donationsData.length - 2;
          pdf.text(item.month, 25, yPosition);
          pdf.text(`₱${item.amount.toLocaleString()}`, 80, yPosition);
          pdf.text(isForecast ? 'Yes' : 'No', 160, yPosition);
          yPosition += 6;
        });
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      // Save PDF
      pdf.save(`reports_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Dismiss loading and show success
      toast.dismiss(toastId);
      toast.success('Report downloaded successfully! 📄');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to download report');
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-primary mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and download detailed reports</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Report Type"
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                options={[
                  { value: 'bookings', label: 'Bookings Report' },
                  { value: 'donations', label: 'Donations Report' },
                  { value: 'users', label: 'Users Report' },
                ]}
              />
              <Select
                label="Date Range"
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                options={[
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' },
                  { value: 'year', label: 'This Year' },
                  { value: 'custom', label: 'Custom Range' },
                ]}
              />
              {dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg bg-white text-[#3D2817]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg bg-white text-[#3D2817]"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <Button onClick={handleDownloadPDF} className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </>
              )}
              {dateRange !== 'custom' && (
                <div className="flex gap-2 items-end">
                  <Button onClick={handleDownloadPDF} className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {loading ? (
          <Card>
            <CardBody className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reports...</p>
            </CardBody>
          </Card>
        ) : (
          <div id="report-content" className="space-y-8">
            {/* Summary Cards */}
            {reportType === 'bookings' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Bookings</p>
                            <p className="font-bold text-2xl">{reportSummary.bookings.total}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-accent/10">
                            <DollarSign className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                            <p className="font-bold text-2xl">${reportSummary.bookings.revenue}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-yellow-500/10">
                            <Calendar className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Last Year Total</p>
                            <p className="font-bold text-2xl">{reportSummary.bookings.prevYearTotal}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {reportSummary.bookings.total - reportSummary.bookings.prevYearTotal > 0 ? '+' : ''}
                              {reportSummary.bookings.total - reportSummary.bookings.prevYearTotal} vs last year
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-green-500/10">
                            <Calendar className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Last Year Total</p>
                            <p className="font-bold text-2xl">{reportSummary.bookings.prevYearTotal}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {reportSummary.bookings.total - reportSummary.bookings.prevYearTotal > 0 ? '+' : ''}
                              {reportSummary.bookings.total - reportSummary.bookings.prevYearTotal} vs last year
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                </div>

                {/* Bookings Chart */}
                {bookingsData.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <h2>Bookings & Revenue Trend</h2>
                    </CardHeader>
                    <CardBody>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={bookingsData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="month" stroke="#F5E6D3" />
                          <YAxis yAxisId="left" stroke="#F5E6D3" label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#F5E6D3" label={{ value: 'Revenue (₱)', angle: 90, position: 'insideRight' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #C4954A', color: '#F5E6D3' }} />
                          <Legend wrapperStyle={{ color: '#F5E6D3' }} />
                          <Bar yAxisId="left" dataKey="count" fill="#FF6B9D" name="Bookings" label={{ fill: '#F5E6D3', fontSize: 12 }} />
                          <Bar yAxisId="right" dataKey="revenue" fill="#C4954A" name="Revenue (₱)" label={{ fill: '#F5E6D3', fontSize: 12 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>
                ) : (
                  <Card>
                    <CardBody className="text-center py-12">
                      <p className="text-muted-foreground">No booking data available yet</p>
                    </CardBody>
                  </Card>
                )}
              </>
            )}

            {reportType === 'donations' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-accent/10">
                            <DollarSign className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Donations</p>
                            <p className="font-bold text-2xl">${reportSummary.donations.total}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Donors</p>
                            <p className="font-bold text-2xl">{reportSummary.donations.count}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-chart-2/10">
                            <DollarSign className="w-6 h-6 text-chart-2" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Avg Donation</p>
                            <p className="font-bold text-2xl">
                              ₱{reportSummary.donations.avgDonation.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-green-500/10">
                            <DollarSign className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Last Year Total</p>
                            <p className="font-bold text-2xl">₱{reportSummary.donations.prevYearTotal}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {reportSummary.donations.total - reportSummary.donations.prevYearTotal > 0 ? '+' : ''}
                              ₱{reportSummary.donations.total - reportSummary.donations.prevYearTotal} vs last year
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                </div>

                {/* Donations Chart */}
                {donationsData.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <h2>Donations Trend</h2>
                    </CardHeader>
                    <CardBody>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={donationsData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="month" stroke="#F5E6D3" />
                          <YAxis stroke="#F5E6D3" label={{ value: 'Amount (₱)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #C4954A', color: '#F5E6D3' }} formatter={(value: any) => `₱${value}`} />
                          <Legend wrapperStyle={{ color: '#F5E6D3' }} />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#C4954A"
                            strokeWidth={3}
                            dot={{ fill: '#C4954A', r: 6 }}
                            label={{ fill: '#F5E6D3', fontSize: 12, formatter: (value: any) => `₱${value}` }}
                            name="Donations (₱)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>
                ) : (
                  <Card>
                    <CardBody className="text-center py-12">
                      <p className="text-muted-foreground">No donation data available yet</p>
                    </CardBody>
                  </Card>
                )}
              </>
            )}

            {reportType === 'users' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                          <p className="font-bold text-2xl">{reportSummary.users.total}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-accent/10">
                          <Users className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">New This Month</p>
                          <p className="font-bold text-2xl">{reportSummary.users.newThisMonth}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-chart-2/10">
                          <Users className="w-6 h-6 text-chart-2" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Active Users</p>
                          <p className="font-bold text-2xl">{reportSummary.users.active}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
