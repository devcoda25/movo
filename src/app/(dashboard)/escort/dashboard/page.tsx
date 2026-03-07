'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
    Sparkles,
    Calendar,
    DollarSign,
    Settings,
    Bell,
    LogOut,
    User,
    Star,
    MessageSquare,
    Image,
    Video,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    Eye,
    Heart,
    MapPin
} from 'lucide-react';

interface BookingStats {
    pending: number;
    accepted: number;
    completed: number;
    cancelled: number;
}

export default function EscortDashboard() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuthStore();
    const [stats, setStats] = useState<BookingStats>({ pending: 0, accepted: 0, completed: 0, cancelled: 0 });
    const [profileViews, setProfileViews] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (!isLoading && isAuthenticated && user?.userType === 'client') {
            router.push('/client/dashboard');
        } else if (!isLoading && isAuthenticated && user?.userType !== 'escort' && user?.userType !== 'admin') {
            router.push('/');
        }
    }, [user, isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const userId = user.id;

                // Fetch bookings for this escort
                const bookingsQuery = query(
                    collection(db, COLLECTIONS.BOOKINGS),
                    where('escortId', '==', userId)
                );
                const bookingsSnapshot = await getDocs(bookingsQuery);

                let pending = 0, accepted = 0, completed = 0, cancelled = 0, earnings = 0;

                bookingsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.status === 'pending') pending++;
                    else if (data.status === 'accepted') accepted++;
                    else if (data.status === 'completed') {
                        completed++;
                        earnings += data.totalAmount || 0;
                    }
                    else if (data.status === 'cancelled') cancelled++;
                });

                setStats({ pending, accepted, completed, cancelled });
                setTotalEarnings(earnings);

                // Simulate profile views
                setProfileViews(Math.floor(Math.random() * 100) + 20);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (isLoading || !user) {
        return (
            <MobileLayout userType="escort" showBottomNav={true}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout userType="escort" showBottomNav={true}>
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold">
                            {user.fullName?.charAt(0) || 'E'}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Welcome back!</h1>
                            <p className="text-gray-400 text-sm">{user.fullName || 'Escort'}</p>
                        </div>
                    </div>
                    <button className="p-3 bg-white/5 rounded-2xl">
                        <Bell className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-400 text-xs">Pending</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.pending}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-gray-400 text-xs">Accepted</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.accepted}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-400 text-xs">Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.completed}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-gray-400 text-xs">Earnings</span>
                        </div>
                        <p className="text-2xl font-bold text-white">UGX {totalEarnings.toLocaleString()}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2">
                    <Link href="/escort/media" className="bg-white/5 rounded-2xl p-3 text-center">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Image className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-xs text-gray-400">Media</span>
                    </Link>
                    <Link href="/escort/verification" className="bg-white/5 rounded-2xl p-3 text-center">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <CheckCircle className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-xs text-gray-400">Verify</span>
                    </Link>
                    <Link href="/chat" className="bg-white/5 rounded-2xl p-3 text-center">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <MessageSquare className="w-5 h-5 text-pink-400" />
                        </div>
                        <span className="text-xs text-gray-400">Messages</span>
                    </Link>
                    <Link href="/client/profile" className="bg-white/5 rounded-2xl p-3 text-center">
                        <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-400">Settings</span>
                    </Link>
                </div>

                {/* Profile Status */}
                <div className="bg-white/5 rounded-2xl p-4">
                    <h3 className="font-semibold text-white mb-3">Profile Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-green-400" />
                                <span className="text-gray-300 text-sm">Profile Complete</span>
                            </div>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image className="w-4 h-4 text-green-400" />
                                <span className="text-gray-300 text-sm">Photos Uploaded</span>
                            </div>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                <span className="text-gray-300 text-sm">Verification</span>
                            </div>
                            <XCircle className="w-4 h-4 text-yellow-400" />
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/5 rounded-2xl p-4">
                    <h3 className="font-semibold text-white mb-3">This Week</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                <Eye className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-sm">{profileViews} profile views</p>
                                <p className="text-gray-500 text-xs">+15% from last week</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                                <Heart className="w-4 h-4 text-pink-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-sm">12 new likes</p>
                                <p className="text-gray-500 text-xs">3 new favorites</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-sm">5 new messages</p>
                                <p className="text-gray-500 text-xs">2 from recent bookings</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location */}
                {user.location && (
                    <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-purple-400" />
                        <span className="text-gray-300">{user.location}, Uganda</span>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </MobileLayout>
    );
}
