'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { MapPin, Star, Bell, CheckCircle, Loader2, Sparkles, ArrowRight, Circle } from 'lucide-react';

interface Escort {
  id: string;
  fullName: string;
  location: string;
  rating: number;
  isVerified: boolean;
  isOnline?: boolean;
  profilePhoto?: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [featuredEscorts, setFeaturedEscorts] = useState<Escort[]>([]);
  const [nearMeEscorts, setNearMeEscorts] = useState<Escort[]>([]);
  const [activeEscorts, setActiveEscorts] = useState<Escort[]>([]);
  const [bookingCount, setBookingCount] = useState({ total: 0, active: 0 });
  const [messageCount, setMessageCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Redirect escorts to their own dashboard
    if (!isLoading && user?.userType === 'escort') {
      router.push('/escort/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch all users and filter for escorts (to avoid index requirement)
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const escortsData: Escort[] = [];
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userType === 'escort' && data.isVerified) {
            escortsData.push({
              id: doc.id,
              fullName: data.fullName || 'Unknown',
              location: data.location || 'Uganda',
              rating: data.rating || 0,
              isVerified: data.isVerified || false,
              isOnline: data.isOnline || false,
              profilePhoto: data.profilePhoto || '',
            });
          }
        });
        // Sort by rating
        escortsData.sort((a, b) => b.rating - a.rating);
        setFeaturedEscorts(escortsData);

        // Filter near me escorts (same location as user)
        const userLocation = user.location || 'Uganda';
        const nearMe = escortsData.filter(e =>
          e.location?.toLowerCase().includes(userLocation.toLowerCase()) ||
          userLocation.toLowerCase().includes(e.location?.toLowerCase())
        );
        setNearMeEscorts(nearMe.slice(0, 4));

        // Filter active escorts (isOnline = true)
        const active = escortsData.filter(e => e.isOnline === true);
        setActiveEscorts(active.slice(0, 4));

        const userId = user.id;
        if (userId) {
          const bookingsQuery = query(
            collection(db, COLLECTIONS.BOOKINGS),
            where('clientId', '==', userId)
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          let total = 0;
          let active = 0;
          bookingsSnapshot.forEach((doc) => {
            const data = doc.data();
            total++;
            if (data.status === 'pending' || data.status === 'accepted') {
              active++;
            }
          });
          setBookingCount({ total, active });

          // Fetch chat count
          const chatsQuery = query(
            collection(db, COLLECTIONS.CHATS),
            where('participants', 'array-contains', userId)
          );
          const chatsSnapshot = await getDocs(chatsQuery);
          setMessageCount(chatsSnapshot.size);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const stats = [
    { label: 'Bookings', value: bookingCount.total },
    { label: 'Active', value: bookingCount.active },
    { label: 'Messages', value: messageCount },
  ];

  return (
    <MobileLayout userType="client">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Welcome back, {user.fullName?.split(' ')[0] || 'User'}! 👋</h1>
            <p className="text-white/40 text-sm">Find your perfect companion</p>
          </div>
          <button className="relative p-3 rounded-2xl bg-white/5">
            <Bell className="w-5 h-5 text-white/60" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Become an Escort CTA */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Become an Escort</span>
              </div>
              <p className="text-white/70 text-sm mb-3">Earn money on your own schedule. Join our platform today!</p>
              <button
                onClick={() => router.push('/contact')}
                className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-xl text-sm font-medium"
              >
                Contact Support
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Featured Escorts</h2>
            <Link href="/escorts" className="text-primary text-sm">See All</Link>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : featuredEscorts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {featuredEscorts.slice(0, 4).map((escort) => (
                <Link
                  key={escort.id}
                  href={`/escorts/${escort.id}`}
                  className="group bg-white/5 rounded-2xl overflow-hidden"
                >
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                    {escort.profilePhoto ? (
                      <img src={escort.profilePhoto} alt={escort.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white/30">{escort.fullName.charAt(0)}</span>
                      </div>
                    )}
                    {escort.isVerified && (
                      <div className="absolute top-2 right-2 p-1 bg-green-500/80 rounded-full">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {escort.isOnline && (
                      <div className="absolute top-2 left-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm truncate">{escort.fullName}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-400">{escort.rating.toFixed(1)}</span>
                      <span className="text-gray-600">•</span>
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">{escort.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No escorts available yet</p>
              <Link href="/escorts" className="text-primary text-sm">Browse all escorts</Link>
            </div>
          )}
        </div>

        {/* Active Escorts */}
        {activeEscorts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Active Now
                </span>
              </h2>
              <Link href="/escorts?filter=active" className="text-primary text-sm">See All</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {activeEscorts.map((escort) => (
                <Link
                  key={escort.id}
                  href={`/escorts/${escort.id}`}
                  className="flex-shrink-0 w-24 bg-white/5 rounded-2xl overflow-hidden"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                    {escort.profilePhoto ? (
                      <img src={escort.profilePhoto} alt={escort.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-white/50">{escort.fullName.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-white text-xs truncate">{escort.fullName}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Near Me Escorts */}
        {nearMeEscorts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Near Me
                </span>
              </h2>
              <Link href="/escorts?filter=nearme" className="text-primary text-sm">See All</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {nearMeEscorts.map((escort) => (
                <Link
                  key={escort.id}
                  href={`/escorts/${escort.id}`}
                  className="group bg-white/5 rounded-2xl overflow-hidden"
                >
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                    {escort.profilePhoto ? (
                      <img src={escort.profilePhoto} alt={escort.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white/30">{escort.fullName.charAt(0)}</span>
                      </div>
                    )}
                    {escort.isVerified && (
                      <div className="absolute top-2 right-2 p-1 bg-green-500/80 rounded-full">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {escort.isOnline && (
                      <div className="absolute top-2 left-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm truncate">{escort.fullName}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-400">{escort.rating.toFixed(1)}</span>
                      <span className="text-gray-600">•</span>
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">{escort.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
