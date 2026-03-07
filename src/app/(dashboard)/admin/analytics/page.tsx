'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { Card, CardContent } from '@/components/ui';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Users, Calendar, DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [stats, setStats] = useState({
    totalEscorts: 0,
    totalClients: 0,
    totalBookings: 0,
    revenue: 0,
    avgBookingValue: 0,
    verifiedEscorts: 0,
    pendingEscorts: 0,
    completedBookings: 0,
    cancelledBookings: 0,
  });
  const [locationStats, setLocationStats] = useState<{ location: string; count: number }[]>([]);
  const [serviceStats, setServiceStats] = useState<{ service: string; count: number }[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && isAuthenticated && user?.userType === 'client') router.push('/client/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType === 'escort') router.push('/escort/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!user || user.userType !== 'admin') return;
    
    const fetchAnalytics = async () => {
      setIsLoadingData(true);
      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        let escortsCount = 0;
        let clientsCount = 0;
        let verifiedEscorts = 0;
        let pendingEscorts = 0;
        const locationMap: Record<string, number> = {};
        
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userType === 'escort') {
            escortsCount++;
            if (data.isVerified) verifiedEscorts++;
            else pendingEscorts++;
            
            const location = data.location || 'Unknown';
            locationMap[location] = (locationMap[location] || 0) + 1;
          }
          if (data.userType === 'client') {
            clientsCount++;
          }
        });

        // Fetch bookings
        const bookingsSnapshot = await getDocs(collection(db, COLLECTIONS.BOOKINGS));
        let totalRevenue = 0;
        let completedBookings = 0;
        let cancelledBookings = 0;
        const serviceMap: Record<string, number> = {};
        
        bookingsSnapshot.forEach(doc => {
          const data = doc.data();
          totalRevenue += data.amount || 0;
          
          if (data.status === 'completed') completedBookings++;
          if (data.status === 'cancelled') cancelledBookings++;
          
          const service = data.service || 'Unknown';
          serviceMap[service] = (serviceMap[service] || 0) + 1;
        });

        // Calculate location stats
        const locationData = Object.entries(locationMap)
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate service stats
        const serviceData = Object.entries(serviceMap)
          .map(([service, count]) => ({ service, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalEscorts: escortsCount,
          totalClients: clientsCount,
          totalBookings: bookingsSnapshot.size,
          revenue: totalRevenue,
          avgBookingValue: bookingsSnapshot.size > 0 ? Math.round(totalRevenue / bookingsSnapshot.size) : 0,
          verifiedEscorts,
          pendingEscorts,
          completedBookings,
          cancelledBookings,
        });
        
        setLocationStats(locationData);
        setServiceStats(serviceData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchAnalytics();
  }, [user]);

  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (isLoading || !user || user.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar onLogout={handleLogout} />
      <main className="lg:ml-72 p-4 lg:p-8 pb-24">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-white/40">Platform performance insights</p>
        </header>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-10">
              <Card className="bg-white/5 border-white/5">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/40 text-xs lg:text-sm mb-1">Total Escorts</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalEscorts}</p>
                      <p className="text-xs text-green-400 flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3" /> {stats.verifiedEscorts} verified
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/5">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/40 text-xs lg:text-sm mb-1">Total Clients</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalClients}</p>
                      <p className="text-xs text-white/40 mt-2">
                        {stats.pendingEscorts} pending
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 lg:w-6 lg:h-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/5">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/40 text-xs lg:text-sm mb-1">Bookings</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalBookings}</p>
                      <p className="text-xs text-green-400 flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3" /> {stats.completedBookings} done
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/5">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/40 text-xs lg:text-sm mb-1">Revenue</p>
                      <p className="text-xl lg:text-3xl font-bold text-white">UGX {stats.revenue.toLocaleString()}</p>
                      <p className="text-xs text-white/40 mt-2">
                        Avg: UGX {stats.avgBookingValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Location Stats */}
              <Card className="bg-white/5 border-white/5">
                <CardContent className="p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6">Escorts by Location</h3>
                  <div className="space-y-3 lg:space-y-4">
                    {locationStats.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-white/60 text-sm truncate flex-shrink-0 w-20 lg:w-auto">{item.location}</span>
                        <div className="flex items-center gap-2 lg:gap-3 flex-1 justify-end">
                          <div className="w-16 lg:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${(item.count / stats.totalEscorts) * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-medium w-6 lg:w-8 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Service Stats */}
              <Card className="bg-white/5 border-white/5">
                <CardContent className="p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6">Bookings by Service</h3>
                  <div className="space-y-3 lg:space-y-4">
                    {serviceStats.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-white/60 text-sm truncate flex-shrink-0 w-20 lg:w-auto">{item.service}</span>
                        <div className="flex items-center gap-2 lg:gap-3 flex-1 justify-end">
                          <div className="w-16 lg:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-secondary rounded-full" 
                              style={{ width: `${(item.count / stats.totalBookings) * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-medium w-6 lg:w-8 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
