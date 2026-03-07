'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { notifyClientOfBookingStatus } from '@/lib/notifications';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MapPin,
    MessageSquare,
    DollarSign,
    ArrowLeft,
    User
} from 'lucide-react';

interface Booking {
    id: string;
    clientId: string;
    escortId: string;
    serviceId: string;
    status: 'pending' | 'accepted' | 'completed' | 'cancelled';
    date: string;
    time: string;
    location: string;
    notes: string;
    totalAmount: number;
    createdAt: any;
}

interface ClientInfo {
    id: string;
    fullName: string;
    phone: string;
    location: string;
}

export default function EscortBookingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [clients, setClients] = useState<Record<string, ClientInfo>>({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (!isLoading && isAuthenticated && user?.userType === 'client') {
            router.push('/client/bookings');
        } else if (!isLoading && isAuthenticated && user?.userType !== 'escort' && user?.userType !== 'admin') {
            router.push('/');
        }
    }, [user, isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (!user) return;

        const fetchBookings = async () => {
            setIsLoadingData(true);
            try {
                const userId = (user as any).id || (user as any).uid;
                
                // Fetch bookings for this escort
                const bookingsQuery = query(
                    collection(db, COLLECTIONS.BOOKINGS),
                    where('escortId', '==', userId)
                );
                const bookingsSnapshot = await getDocs(bookingsQuery);
                
                const bookingsData: Booking[] = [];
                const clientIds = new Set<string>();
                
                bookingsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    bookingsData.push({
                        id: doc.id,
                        ...data
                    } as Booking);
                    if (data.clientId) clientIds.add(data.clientId);
                });
                
                // Fetch client info
                if (clientIds.size > 0) {
                    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
                    const clientsData: Record<string, ClientInfo> = {};
                    
                    usersSnapshot.forEach((doc) => {
                        const data = doc.data();
                        if (clientIds.has(doc.id) && data.userType === 'client') {
                            clientsData[doc.id] = {
                                id: doc.id,
                                fullName: data.fullName || 'Unknown',
                                phone: data.phone || '',
                                location: data.location || ''
                            };
                        }
                    });
                    setClients(clientsData);
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

        fetchBookings();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-400 bg-yellow-400/10';
            case 'accepted': return 'text-green-400 bg-green-400/10';
            case 'completed': return 'text-purple-400 bg-purple-400/10';
            case 'cancelled': return 'text-red-400 bg-red-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <AlertCircle className="w-4 h-4" />;
            case 'accepted': return <CheckCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const handleAcceptBooking = async (bookingId: string) => {
        try {
            await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
                status: 'accepted',
                updatedAt: new Date()
            });
            // Find booking to get client info
            const booking = bookings.find(b => b.id === bookingId);
            if (booking) {
                const escortName = user?.fullName || 'The escort';
                await notifyClientOfBookingStatus(booking.clientId, escortName, 'accepted', bookingId);
            }
            // Refresh bookings
            setBookings(prev => prev.map(b => 
                b.id === bookingId ? { ...b, status: 'accepted' } : b
            ));
        } catch (error) {
            console.error('Error accepting booking:', error);
        }
    };

    const handleDeclineBooking = async (bookingId: string) => {
        try {
            await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
                status: 'cancelled',
                updatedAt: new Date()
            });
            // Find booking to get client info
            const booking = bookings.find(b => b.id === bookingId);
            if (booking) {
                const escortName = user?.fullName || 'The escort';
                await notifyClientOfBookingStatus(booking.clientId, escortName, 'declined', bookingId);
            }
            // Refresh bookings
            setBookings(prev => prev.map(b => 
                b.id === bookingId ? { ...b, status: 'cancelled' } : b
            ));
        } catch (error) {
            console.error('Error declining booking:', error);
        }
    };

    const handleCompleteBooking = async (bookingId: string) => {
        try {
            await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
                status: 'completed',
                updatedAt: new Date()
            });
            // Find booking to get client info
            const booking = bookings.find(b => b.id === bookingId);
            if (booking) {
                const escortName = user?.fullName || 'The escort';
                await notifyClientOfBookingStatus(booking.clientId, escortName, 'completed', bookingId);
            }
            // Refresh bookings
            setBookings(prev => prev.map(b => 
                b.id === bookingId ? { ...b, status: 'completed' } : b
            ));
        } catch (error) {
            console.error('Error completing booking:', error);
        }
    };

    const filteredBookings = activeTab === 'all' 
        ? bookings 
        : bookings.filter(b => b.status === activeTab);

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
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-xl font-bold text-white">My Bookings</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {(['all', 'pending', 'accepted', 'completed'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                                activeTab === tab 
                                    ? 'bg-primary text-white' 
                                    : 'bg-white/10 text-gray-400'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            <span className="ml-1">
                                ({bookings.filter(b => activeTab === 'all' || b.status === activeTab).length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                {isLoadingData ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No bookings yet</h3>
                        <p className="text-gray-400 text-sm">When clients book your services, they'll appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredBookings.map((booking) => {
                            const client = clients[booking.clientId];
                            return (
                                <div key={booking.id} className="bg-white/5 rounded-2xl p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{client?.fullName || 'Unknown Client'}</p>
                                                <p className="text-gray-400 text-xs">{client?.phone || ''}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            <span>{booking.date} at {booking.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <MapPin className="w-4 h-4" />
                                            <span>{booking.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <DollarSign className="w-4 h-4" />
                                            <span>UGX {booking.totalAmount?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>

                                    {booking.notes && (
                                        <p className="text-gray-400 text-sm mb-3 pb-3 border-b border-white/10">
                                            {booking.notes}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    {booking.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleAcceptBooking(booking.id)}
                                                className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm hover:bg-green-500/30"
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                onClick={() => handleDeclineBooking(booking.id)}
                                                className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/30"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                    
                                    {booking.status === 'accepted' && (
                                        <button 
                                            onClick={() => handleCompleteBooking(booking.id)}
                                            className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm hover:bg-purple-500/30"
                                        >
                                            Mark as Completed
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
