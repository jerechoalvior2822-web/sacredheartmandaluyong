import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../components/AuthContext';
import {
  Calendar,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Clock as ClockIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getApiUrl, getAssetUrl } from '../utils/apiConfig';

export function UserDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [carouselImages, setCarouselImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetch(getApiUrl('/api/bookings'))
      .then(res => res.json())
      .then(data => {
        setAllBookings(data);
      })
      .catch(() => {
        setAllBookings([]);
      });

    // Fetch carousel images
    fetch(getApiUrl('/api/carousel'))
      .then(res => res.json())
      .then(data => {
        setCarouselImages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCarouselImages([]);
      });
  }, []);

  // Calendar functions
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  // Holidays (year-agnostic - MM-DD format)
  const holidays = ['01-01', '04-09', '06-12', '11-01', '12-25', '12-30'];

  const isHoliday = (day: number) => {
    const dateStr = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.includes(dateStr);
  };

  const isMonday = (day: number) => {
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return dateObj.getDay() === 1;
  };

  // Returns true if the given day is strictly before today
  const isPastDay = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return dateObj < today;
  };

  const getBookingsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allBookings.filter(booking => booking.date === dateStr);
  };

  // Carousel functions
  const nextImage = () => {
    if (carouselImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }
  };

  const prevImage = () => {
    if (carouselImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
    }
  };

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (carouselImages.length > 1) {
      const interval = setInterval(nextImage, 5000);
      return () => clearInterval(interval);
    }
  }, [carouselImages.length]);

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-primary text-2xl sm:text-3xl mb-2">{t('dashboard.welcome')}, {user?.name}!</h1>
          
        </motion.div>

        {/* Carousel */}
        {carouselImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="overflow-hidden">
              <div className="relative w-full aspect-video sm:aspect-auto sm:h-96 bg-secondary/30">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={getAssetUrl(carouselImages[currentImageIndex].image_path)}
                      alt={carouselImages[currentImageIndex].title}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay with text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3 sm:p-6">
                      <h2 className="text-white text-lg sm:text-2xl font-bold mb-1 sm:mb-2 line-clamp-2">
                        {carouselImages[currentImageIndex].title}
                      </h2>
                      {carouselImages[currentImageIndex].description && (
                        <p className="text-white/90 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3">
                          {carouselImages[currentImageIndex].description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                {carouselImages.length > 1 && (
                  <>
                    {/* Bottom Navigation with 3-dot indicator and arrow icons */}
                    <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-4 z-10">
                      <button
                        onClick={prevImage}
                        className="bg-white/40 hover:bg-white/60 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      
                      {/* 3-dot indicator */}
                      <div className="flex gap-1 sm:gap-1.5">
                        {carouselImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      <button
                        onClick={nextImage}
                        className="bg-white/40 hover:bg-white/60 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Welcome Section */}
        {/* <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-primary mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your account</p>
        </motion.div>*/}

        {/* Bookings Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl">{t('services.bookings')} {t('common.date')}</h2>
                <div className="flex gap-1 sm:gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="text-xs sm:text-sm">
                    ← {t('common.previous')}
                  </Button>
                  <span className="text-xs sm:text-sm font-medium min-w-20 sm:min-w-32 text-center flex items-center">{monthName}</span>
                  <Button variant="outline" size="sm" onClick={goToNextMonth} className="text-xs sm:text-sm">
                    {t('common.next')} →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0 overflow-x-auto">
              <div className="overflow-x-auto min-w-full">
                <table className="w-full border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <th key={day} className="border border-border p-1 sm:p-2 text-center font-semibold">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.ceil((daysInMonth + firstDay) / 7) }).map((_, weekIndex) => (
                      <tr key={weekIndex} className="border-t border-border">
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                          const day = weekIndex * 7 + dayIndex - firstDay + 1;
                          const isCurrentMonth = day > 0 && day <= daysInMonth;
                          const isPast = isCurrentMonth && isPastDay(day);
                          const noOfficeHour = isCurrentMonth && !isPast && isMonday(day);
                          const isHolidayDay = isCurrentMonth && !isPast && isHoliday(day);
                          const dayBookings =
                            isCurrentMonth && !isPast && !noOfficeHour && !isHolidayDay
                              ? getBookingsForDate(day)
                              : [];

                          return (
                            <td
                              key={dayIndex}
                              className={`border border-border p-1 sm:p-2 min-h-20 sm:min-h-32 align-top transition-colors text-xs sm:text-sm ${
                                !isCurrentMonth
                                  ? 'bg-secondary/30'
                                  : isPast
                                  ? 'bg-secondary/40 opacity-50 pointer-events-none select-none'
                                  : noOfficeHour
                                  ? 'bg-gray-200 dark:bg-gray-700'
                                  : ''
                              }`}
                            >
                              {isCurrentMonth ? (
                                <div className="space-y-0.5 sm:space-y-1">
                                  <div
                                    className={`font-bold text-xs sm:text-sm ${
                                      isPast ? 'text-muted-foreground' : ''
                                    }`}
                                  >
                                    {day}
                                  </div>

                                  {/* Past day — no further content */}
                                  {isPast && null}

                                  {/* No office hours (Monday, not past) */}
                                  {!isPast && noOfficeHour && (
                                    <div className="text-xs text-muted-foreground font-semibold text-center py-1 sm:py-2">
                                      {t('common.closed')}
                                    </div>
                                  )}

                                  {/* Holiday (not past) */}
                                  {!isPast && isHolidayDay && (
                                    <div className="bg-red-500 text-white text-xs p-0.5 sm:p-1 rounded text-center font-semibold">
                                      {t('dashboard.holiday')}
                                    </div>
                                  )}

                                  {/* Bookings (not past, not Monday, not holiday) */}
                                  {!isPast && !noOfficeHour && !isHolidayDay && dayBookings.length > 0 && (
                                    <div className="space-y-0.5">
                                      {dayBookings.slice(0, 1).map((booking, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-blue-500 text-white text-xs p-0.5 rounded text-center cursor-pointer hover:bg-blue-600 truncate"
                                        >
                                          <div className="font-semibold truncate text-xs">{booking.service}</div>
                                        </div>
                                      ))}
                                      {dayBookings.length > 1 && (
                                        <div className="text-xs text-muted-foreground text-center">
                                          +{dayBookings.length - 1} {t('common.more')}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Available (not past, not Monday, not holiday, no bookings) */}
                                  {!isPast && !noOfficeHour && !isHolidayDay && dayBookings.length === 0 && (
                                    <div className="text-xs text-muted-foreground">{t('dashboard.available')}</div>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="p-2 sm:p-4 border-t border-border bg-secondary/30">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <p className="mb-1 sm:mb-2 font-semibold"><strong>{t('dashboard.legend')}:</strong></p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                      <span className="text-xs">{t('services.bookings')}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-4 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <span className="text-xs">{t('common.closed')}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
                      <span className="text-xs">{t('dashboard.holiday')}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-4 sm:h-4 bg-secondary border border-border rounded opacity-50"></div>
                      <span className="text-xs">{t('dashboard.past')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <h2 className="text-lg sm:text-xl mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <Link to="/services">
              <Card hover className="cursor-pointer h-full">
                <CardBody className="text-center">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2" />
                  <h3 className="text-sm sm:text-base font-semibold">Book a Service</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Schedule services</p>
                </CardBody>
              </Card>
            </Link>

            <Link to="/donations">
              <Card hover className="cursor-pointer h-full">
                <CardBody className="text-center">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-accent mx-auto mb-2" />
                  <h3 className="text-sm sm:text-base font-semibold">Make a Donation</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Support parish</p>
                </CardBody>
              </Card>
            </Link>

            <Link to="/souvenirs">
              <Card hover className="cursor-pointer h-full">
                <CardBody className="text-center">
                  <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-chart-2 mx-auto mb-2" />
                  <h3 className="text-sm sm:text-base font-semibold">Shop Souvenirs</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Browse collection</p>
                </CardBody>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Footer - Contact & Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <h2 className="text-center text-lg sm:text-xl">Contact & Location</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Address */}
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2">Church Address</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Blk. 34, Brgy.<br />
                      Addition Hills,, Mandaluyong<br />
                      Manila, Philippines 1550
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Phone */}
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-accent/10">
                        <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">Phone</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">(02) 8642-1478</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-chart-2/10">
                        <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-chart-2" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">Email</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">rcamshjp@gmail.com</p>
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-500/10">
                        <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">Office Hours</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Tuesday - Sunday: 8:00 AM - 12:00 NN &2:00 PM 5:00 PM<br />
                        <span className="text-xs">Closed on Mondays & Holidays</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}