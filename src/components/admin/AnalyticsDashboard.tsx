'use client';

import { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Star, TrendingUp, Activity, 
  Calendar, MapPin, Download, Filter
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

interface AnalyticsData {
  totalUsers: number;
  totalEscorts: number;
  totalClients: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  topLocations: { location: string; count: number }[];
  recentBookings: any[];
  monthlyGrowth: number;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalEscorts: 0,
    totalClients: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    topLocations: [],
    recentBookings: [],
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      
      // Get escorts
      const escortsQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'escort')
      );
      const escortsSnapshot = await getDocs(escortsQuery);
      const totalEscorts = escortsSnapshot.size;
      
      // Get clients
      const clientsQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'client')
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const totalClients = clientsSnapshot.size;
      
      // Get bookings
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const totalBookings = bookingsSnapshot.size;
      
      // Calculate revenue (sum of booking prices)
      let totalRevenue = 0;
      bookingsSnapshot.forEach(doc => {
        const booking = doc.data();
        totalRevenue += booking.price || 0;
      });
      
      // Get average rating
      let totalRating = 0;
      let ratingsCount = 0;
      escortsSnapshot.forEach(doc => {
        const escort = doc.data();
        if (escort.averageRating) {
          totalRating += escort.averageRating;
          ratingsCount++;
        }
      });
      const averageRating = ratingsCount > 0 ? totalRating / ratingsCount : 0;
      
      // Get recent bookings
      const recentBookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentBookingsSnapshot = await getDocs(recentBookingsQuery);
      const recentBookings = recentBookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get location distribution
      const locationMap: Record<string, number> = {};
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        if (user.location) {
          locationMap[user.location] = (locationMap[user.location] || 0) + 1;
        }
      });
      
      const topLocations = Object.entries(locationMap)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        totalUsers,
        totalEscorts,
        totalClients,
        totalBookings,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        topLocations,
        recentBookings,
        monthlyGrowth: 12 // Placeholder - would need historical data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend,
    color 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: number;
    color: string;
  }) => (
    <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 && 'rotate-180'}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-gray-400">Track your platform performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-white/5 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          
          <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <Download className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          icon={Users}
          trend={data.monthlyGrowth}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          title="Active Escorts"
          value={data.totalEscorts}
          icon={Star}
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          title="Total Bookings"
          value={data.totalBookings}
          icon={Calendar}
          trend={data.monthlyGrowth}
          color="bg-pink-500/20 text-pink-400"
        />
        <StatCard
          title="Total Revenue"
          value={`UGX ${(data.totalRevenue / 1000).toFixed(1)}K`}
          icon={DollarSign}
          trend={data.monthlyGrowth}
          color="bg-green-500/20 text-green-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Locations */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Top Locations</h3>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.topLocations.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No location data yet</p>
            ) : (
              data.topLocations.map((loc, index) => (
                <div key={loc.location} className="flex items-center gap-4">
                  <span className="text-gray-400 w-6">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white">{loc.location}</span>
                      <span className="text-gray-400">{loc.count}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${(loc.count / data.topLocations[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Platform Rating</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-2">{data.averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(data.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-400">Average escort rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
          <button className="text-purple-400 text-sm hover:text-purple-300">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Client</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Escort</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Service</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                data.recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/5">
                    <td className="py-3 px-4 text-white">{booking.clientName || 'N/A'}</td>
                    <td className="py-3 px-4 text-white">{booking.escortName || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-400">{booking.service || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        booking.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400'
                          : booking.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {booking.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">UGX {booking.price?.toLocaleString() || '0'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
