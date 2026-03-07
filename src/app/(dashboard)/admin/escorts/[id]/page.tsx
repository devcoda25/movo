'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import {
    ArrowLeft, Loader2, MapPin, Phone, Mail, Star, Calendar,
    Check, X, Shield, Video, Image, MessageSquare, Clock, DollarSign,
    User, Edit, Trash2, AlertCircle
} from 'lucide-react';

interface EscortProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    rating: number;
    reviews: number;
    isVerified: boolean;
    services: string[];
    photos: { id: string; url: string }[];
    videos: { id: string; url: string; thumbnail?: string }[];
    hourlyRate: number;
    profilePhoto?: string;
    createdAt?: any;
}

interface Booking {
    id: string;
    clientId: string;
    clientName: string;
    escortId: string;
    date: string;
    time: string;
    location: string;
    status: 'pending' | 'accepted' | 'completed' | 'cancelled';
    createdAt: any;
}

interface Review {
    id: string;
    clientId: string;
    clientName: string;
    rating: number;
    comment: string;
    createdAt: any;
}

export default function AdminEscortDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

    const [escort, setEscort] = useState<EscortProfile | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'reviews' | 'media'>('overview');

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.userType !== 'admin')) {
            router.push('/login');
        }
    }, [user, isAuthenticated, authLoading, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!params.id) return;

            setLoading(true);
            setError('');

            try {
                // Fetch escort profile
                const escortDoc = await getDoc(doc(db, COLLECTIONS.USERS, params.id as string));

                if (!escortDoc.exists()) {
                    setError('Escort not found');
                    setLoading(false);
                    return;
                }

                const data = escortDoc.data();
                if (data.userType !== 'escort') {
                    setError('User is not an escort');
                    setLoading(false);
                    return;
                }

                setEscort({
                    id: escortDoc.id,
                    fullName: data.fullName || 'Unknown',
                    email: data.email || '',
                    phone: data.phone || '',
                    location: data.location || 'Uganda',
                    bio: data.bio || 'No bio available',
                    rating: data.rating || 0,
                    reviews: data.reviews || 0,
                    isVerified: data.isVerified || false,
                    services: data.services || [],
                    photos: data.photos || [],
                    videos: data.videos || [],
                    hourlyRate: data.hourlyRate || 0,
                    profilePhoto: data.profilePhoto || '',
                    createdAt: data.createdAt,
                });

                // Fetch bookings for this escort
                const bookingsQuery = query(
                    collection(db, COLLECTIONS.BOOKINGS),
                    where('escortId', '==', params.id),
                    orderBy('createdAt', 'desc')
                );
                const bookingsSnapshot = await getDocs(bookingsQuery);
                const bookingsData: Booking[] = [];
                bookingsSnapshot.forEach(doc => {
                    const bData = doc.data();
                    bookingsData.push({
                        id: doc.id,
                        clientId: bData.clientId || '',
                        clientName: bData.clientName || 'Unknown',
                        escortId: bData.escortId || '',
                        date: bData.date || '',
                        time: bData.time || '',
                        location: bData.location || '',
                        status: bData.status || 'pending',
                        createdAt: bData.createdAt,
                    });
                });
                setBookings(bookingsData);

                // Fetch reviews for this escort
                const reviewsQuery = query(
                    collection(db, 'reviews'),
                    where('escortId', '==', params.id),
                    orderBy('createdAt', 'desc')
                );
                const reviewsSnapshot = await getDocs(reviewsQuery);
                const reviewsData: Review[] = [];
                reviewsSnapshot.forEach(doc => {
                    const rData = doc.data();
                    reviewsData.push({
                        id: doc.id,
                        clientId: rData.clientId || '',
                        clientName: rData.clientName || 'Anonymous',
                        rating: rData.rating || 0,
                        comment: rData.comment || '',
                        createdAt: rData.createdAt,
                    });
                });
                setReviews(reviewsData);

            } catch (err) {
                console.error('Error fetching escort data:', err);
                setError('Failed to load escort data');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const handleVerify = async (verify: boolean) => {
        if (!escort) return;
        try {
            await import('@/lib/firebase').then(m => m.updateDocument('users', escort.id, { isVerified: verify }));
            setEscort({ ...escort, isVerified: verify });
        } catch (error) {
            console.error('Error updating verification:', error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
        );
    }

    if (error || !escort) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">{error || 'Escort Not Found'}</h2>
                <button
                    onClick={() => router.push('/admin/escorts')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl mt-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Escorts
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10">
                <div className="p-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin/escorts')}
                            className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white">{escort.fullName}</h1>
                            <p className="text-sm text-slate-400">Escort Profile</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {escort.isVerified ? (
                                <button
                                    onClick={() => handleVerify(false)}
                                    className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-sm"
                                >
                                    <Shield className="w-4 h-4" />
                                    Verified
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleVerify(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm"
                                >
                                    <Check className="w-4 h-4" />
                                    Verify
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-4 gap-1 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'bookings', label: `Bookings (${bookings.length})` },
                        { id: 'reviews', label: `Reviews (${reviews.length})` },
                        { id: 'media', label: `Media (${escort.photos.length + escort.videos.length})` },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'text-emerald-400 border-emerald-400'
                                    : 'text-slate-400 border-transparent hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                                    {escort.profilePhoto ? (
                                        <img src={escort.profilePhoto} alt={escort.fullName} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        escort.fullName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-white">{escort.fullName}</h2>
                                        {escort.isVerified && <Check className="w-5 h-5 text-emerald-400" />}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{escort.location}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="text-white font-medium">{escort.rating.toFixed(1)}</span>
                                            <span className="text-slate-400">({escort.reviews} reviews)</span>
                                        </div>
                                        {escort.hourlyRate > 0 && (
                                            <div className="flex items-center gap-1 text-emerald-400">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="font-medium">${escort.hourlyRate}/hr</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-slate-400" />
                                    <span className="text-white">{escort.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-slate-400" />
                                    <span className="text-white">{escort.phone || 'Not provided'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                    <span className="text-white">{escort.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                            <p className="text-slate-300">{escort.bio}</p>
                        </div>

                        {/* Services */}
                        {escort.services.length > 0 && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
                                <div className="flex flex-wrap gap-2">
                                    {escort.services.map((service, idx) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                                        >
                                            {service}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                                <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                                    <Star className="w-5 h-5 fill-yellow-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">{escort.rating.toFixed(1)}</p>
                                <p className="text-xs text-slate-400">Rating</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                                <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-white">{reviews.length}</p>
                                <p className="text-xs text-slate-400">Reviews</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                                <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-white">{bookings.length}</p>
                                <p className="text-xs text-slate-400">Bookings</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div className="space-y-4">
                        {bookings.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No bookings yet</p>
                            </div>
                        ) : (
                            bookings.map(booking => (
                                <div key={booking.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="text-white font-medium">{booking.clientName}</h4>
                                            <p className="text-sm text-slate-400">{booking.date} at {booking.time}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                                                booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    booking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-red-500/20 text-red-400'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <MapPin className="w-4 h-4" />
                                        <span>{booking.location}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div className="space-y-4">
                        {reviews.length === 0 ? (
                            <div className="text-center py-12">
                                <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No reviews yet</p>
                            </div>
                        ) : (
                            reviews.map(review => (
                                <div key={review.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                                                {review.clientName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">{review.clientName}</h4>
                                                <p className="text-xs text-slate-400">
                                                    {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-slate-300">{review.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                    <div className="space-y-6">
                        {/* Photos */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Image className="w-5 h-5" />
                                Photos ({escort.photos.length})
                            </h3>
                            {escort.photos.length === 0 ? (
                                <p className="text-slate-400">No photos uploaded</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {escort.photos.map((photo, idx) => (
                                        <div key={photo.id || idx} className="aspect-square rounded-xl overflow-hidden bg-slate-800">
                                            <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Videos */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Video className="w-5 h-5" />
                                Videos ({escort.videos.length})
                            </h3>
                            {escort.videos.length === 0 ? (
                                <p className="text-slate-400">No videos uploaded</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {escort.videos.map((video, idx) => (
                                        <div key={video.id || idx} className="aspect-video rounded-xl overflow-hidden bg-slate-800">
                                            {video.thumbnail ? (
                                                <img src={video.thumbnail} alt={`Video ${idx + 1}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Video className="w-8 h-8 text-slate-600" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
