'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  escortId: string;
  escortName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: string;
  amount: number;
}

export default function ClientBookings() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Redirect escorts to their own bookings
    if (!isLoading && user?.userType === 'escort') {
      router.push('/escort/bookings');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchBookings = async () => {
      setIsLoadingData(true);
      try {
        const userId = (user as any).id || (user as any).uid;
        if (!userId) {
          setBookings([]);
          return;
        }
        
        const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
        const q = query(bookingsRef, where('clientId', '==', userId));
        const snapshot = await getDocs(q);
        
        const bookingsData: Booking[] = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          // Fetch escort name
          let escortName = 'Unknown';
          try {
            const { getDocument } = await import('@/lib/firebase');
            const escortDoc = await getDocument('users', data.escortId) as any;
            if (escortDoc) {
              escortName = escortDoc.fullName || 'Unknown';
            }
          } catch (e) {
            console.log('Could not fetch escort name');
          }
          
          bookingsData.push({
            id: doc.id,
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
        
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchBookings();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-400/10 text-green-400';
      case 'accepted': return 'bg-blue-400/10 text-blue-400';
      case 'pending': return 'bg-yellow-400/10 text-yellow-400';
      case 'completed': return 'bg-green-400/10 text-green-400';
      case 'cancelled': return 'bg-red-400/10 text-red-400';
      default: return 'bg-white/10 text-white/40';
    }
  };

  // Filter bookings by status
  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'upcoming') {
      return booking.status === 'pending' || booking.status === 'accepted';
    } else if (activeTab === 'completed') {
      return booking.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return booking.status === 'cancelled';
    }
    return true;
  });

  return (
    <MobileLayout userType="client">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">My Bookings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab 
                  ? 'bg-primary text-white' 
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Bookings Yet</h3>
            <p className="text-white/40 text-center mb-6">Browse escorts and book your first appointment</p>
            <Link href="/escorts" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Browse Escorts
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white/5 rounded-3xl p-4 border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-2xl font-bold text-white/30">
                      {booking.escortName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{booking.escortName}</h4>
                      <p className="text-xs text-white/40">{booking.service}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{booking.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{booking.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
