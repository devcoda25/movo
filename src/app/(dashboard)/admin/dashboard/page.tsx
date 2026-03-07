'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminMobileLayout from '@/components/layouts/AdminMobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import {
  Users, Calendar, DollarSign, TrendingUp, Plus, Bell, ChevronRight,
  UserCheck, Database, Loader2, MessageCircle, Shield, Activity,
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success?: boolean; message?: string; clients?: number; escorts?: number; services?: number; bookings?: number } | null>(null);
  const [stats, setStats] = useState({ totalEscorts: 0, totalClients: 0, totalBookings: 0, revenue: 0, pendingVerifications: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      setSeedResult(data);
    } catch (error) {
      setSeedResult({ success: false, message: 'Failed to seed data' });
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && isAuthenticated && user?.userType === 'client') router.push('/client/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType === 'escort') router.push('/escort/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  // Fetch dashboard stats
  useEffect(() => {
    if (!user || user.userType !== 'admin') return;

    const fetchStats = async () => {
      setIsLoadingData(true);
      try {
        // Fetch all users and count
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        let escortsCount = 0;
        let clientsCount = 0;
        let pendingVerifications = 0;

        usersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userType === 'escort') {
            escortsCount++;
            if (!data.isVerified) pendingVerifications++;
          }
          if (data.userType === 'client') clientsCount++;
        });

        // Fetch bookings
        const bookingsSnapshot = await getDocs(collection(db, COLLECTIONS.BOOKINGS));
        const bookings: any[] = [];
        let revenue = 0;
        bookingsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') {
            revenue += data.amount || 0;
          }
          bookings.push({ id: doc.id, ...data });
        });

        // Get recent bookings (last 5)
        const recent = bookings
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          })
          .slice(0, 5);

        // Fetch escort names for recent bookings
        const recentWithNames = await Promise.all(
          recent.map(async (booking) => {
            let escortName = 'Unknown';
            let clientName = 'Unknown';
            try {
              const escortDoc = await getDoc(doc(db, COLLECTIONS.USERS, booking.escortId));
              if (escortDoc.exists()) {
                escortName = escortDoc.data().fullName || 'Unknown';
              }
              const clientDoc = await getDoc(doc(db, COLLECTIONS.USERS, booking.clientId));
              if (clientDoc.exists()) {
                clientName = clientDoc.data().fullName || 'Unknown';
              }
            } catch (e) {
              console.log('Error fetching names');
            }
            return {
              ...booking,
              escortName,
              clientName,
            };
          })
        );

        setStats({
          totalEscorts: escortsCount,
          totalClients: clientsCount,
          totalBookings: bookingsSnapshot.size,
          revenue,
          pendingVerifications,
        });
        setRecentBookings(recentWithNames);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading || !user || user.userType !== 'admin') {
    return (
      <AdminMobileLayout showBottomNav={false}>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </AdminMobileLayout>
    );
  }

  return (
    <AdminMobileLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-slate-400">Welcome back, {user.fullName || 'Admin'}</p>
      </div>

      {/* Seed Result Alert */}
      {seedResult && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${seedResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {seedResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="text-sm">
            {seedResult.success
              ? `✓ Seeded: ${seedResult.clients || 0} clients, ${seedResult.escorts || 0} escorts`
              : seedResult.message || 'Seed failed'}
          </span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalEscorts}</p>
          <p className="text-xs text-slate-400">Escorts</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-purple-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +8%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
          <p className="text-xs text-slate-400">Clients</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +24%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalBookings}</p>
          <p className="text-xs text-slate-400">Bookings</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +18%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">UGX {stats.revenue.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Revenue</p>
        </div>
      </div>

      {/* Pending Actions */}
      {stats.pendingVerifications > 0 && (
        <Link
          href="/admin/escorts"
          className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6 hover:bg-amber-500/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">Pending Verifications</p>
            <p className="text-xs text-slate-400">{stats.pendingVerifications} escort applications awaiting review</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Escorts', href: '/admin/escorts', icon: Users, color: 'bg-emerald-500/20 text-emerald-400' },
            { label: 'Clients', href: '/admin/clients', icon: UserCheck, color: 'bg-purple-500/20 text-purple-400' },
            { label: 'Bookings', href: '/admin/bookings', icon: Calendar, color: 'bg-blue-500/20 text-blue-400' },
            { label: 'Messages', href: '/admin/messages', icon: MessageCircle, color: 'bg-pink-500/20 text-pink-400' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 rounded-2xl hover:bg-slate-700/50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-300">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-emerald-400 hover:underline">View All</Link>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : recentBookings.length > 0 ? (
          <div className="space-y-2">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{booking.clientName}</p>
                    <p className="text-xs text-slate-400">→ {booking.escortName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">UGX {(booking.amount || 0).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${booking.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                    }`}>
                    {booking.status || 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 p-6 bg-slate-800/30 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No bookings yet</p>
          </div>
        )}
      </div>

      {/* Seed Button */}
      <button
        onClick={handleSeedData}
        disabled={isSeeding}
        className="mt-6 w-full flex items-center justify-center gap-2 p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl transition-colors disabled:opacity-50"
      >
        {isSeeding ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        ) : (
          <Database className="w-4 h-4 text-slate-400" />
        )}
        <span className="text-sm text-slate-400">Seed Demo Data</span>
      </button>
    </AdminMobileLayout>
  );
}
