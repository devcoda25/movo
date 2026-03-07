'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MapPin, Clock, CheckCircle, XCircle, Loader2, Users, Calendar, DollarSign, Filter } from 'lucide-react';

interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  escortId: string;
  escortName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  amount: number;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && isAuthenticated && user?.userType === 'client') router.push('/client/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType === 'escort') router.push('/escort/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!user || user.userType !== 'admin') return;
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setIsLoadingData(true);
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.BOOKINGS));
      const bookingsData: Booking[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        let clientName = 'Unknown';
        let escortName = 'Unknown';
        
        try {
          const { getDocument } = await import('@/lib/firebase');
          const clientDoc = await getDocument('users', data.clientId) as any;
          const escortDoc = await getDocument('users', data.escortId) as any;
          if (clientDoc) clientName = clientDoc.fullName || 'Unknown';
          if (escortDoc) escortName = escortDoc.fullName || 'Unknown';
        } catch (e) { /* continue */ }
        
        bookingsData.push({
          id: doc.id,
          clientId: data.clientId || '',
          clientName,
          escortId: data.escortId || '',
          escortName,
          service: data.service || 'Service',
          date: data.date || '',
          time: data.time || '',
          location: data.location || '',
          status: data.status || 'pending',
          amount: data.amount || 0,
        });
      }
      
      // Sort by date
      bookingsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      case 'accepted': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.amount, 0),
  };

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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Bookings</h1>
          <p className="text-slate-400">{bookings.length} total bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.completed}</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">UGX {(stats.revenue / 1000).toFixed(0)}k</p>
                <p className="text-xs text-slate-400">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{booking.clientName}</p>
                      <p className="text-sm text-slate-400">→ {booking.escortName}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{booking.date} at {booking.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{booking.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{booking.service}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <DollarSign className="w-4 h-4" />
                    <span>UGX {booking.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
