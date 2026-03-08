'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getActiveLocations, groupLocationsByRegion, Location } from '@/lib/locations';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit3,
    Save,
    Camera,
    Star,
    CheckCircle,
    AlertCircle,
    Loader2,
    LogOut
} from 'lucide-react';

interface Service {
    id: string;
    name: string;
    isActive: boolean;
}

export default function EscortProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [profilePhoto, setProfilePhoto] = useState<string>('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [locations, setLocations] = useState<Location[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        location: '',
        bio: '',
        hourlyRate: 50000,
        dateOfBirth: ''
    });

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (!isLoading && isAuthenticated && user?.userType === 'client') {
            router.push('/client/profile');
        } else if (!isLoading && isAuthenticated && user?.userType !== 'escort' && user?.userType !== 'admin') {
            router.push('/');
        }
    }, [user, isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (!user) return;

        // Fetch fresh user data from Firebase
        const fetchUserData = async () => {
            try {
                const userId = (user as any).id || (user as any).uid;
                const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setFormData({
                        fullName: userData.fullName || '',
                        phone: userData.phone || '',
                        location: userData.location || '',
                        bio: userData.bio || '',
                        hourlyRate: userData.hourlyRate || 50000,
                        dateOfBirth: userData.dateOfBirth || ''
                    });
                    setSelectedServices(userData.services || []);
                    setProfilePhoto(userData.profilePhoto || '');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        // Fetch locations
        const fetchLocations = async () => {
            const data = await getActiveLocations();
            setLocations(data);
        };

        fetchUserData();
        fetchLocations();
    }, [user]);

    const groupedLocations = groupLocationsByRegion(locations);
    const locationOptions = Object.entries(groupedLocations).flatMap(([region, locs]) => [
        { value: '', label: `📍 ${region}`, disabled: true },
        ...locs.map(loc => ({ value: loc.name, label: `   ${loc.name}` }))
    ]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const servicesSnapshot = await getDocs(collection(db, COLLECTIONS.SERVICES));
                const servicesData: Service[] = [];
                servicesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.isActive) {
                        servicesData.push({
                            id: doc.id,
                            name: data.name,
                            isActive: data.isActive
                        });
                    }
                });
                setServices(servicesData);
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };
        fetchServices();
    }, []);

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const userId = (user as any).id || (user as any).uid;
            await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
                ...formData,
                services: selectedServices,
                profilePhoto: profilePhoto,
                updatedAt: new Date()
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingPhoto(true);
        try {
            const userId = (user as any).id || (user as any).uid;

            // Use API route to upload (bypasses CORS issues)
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', `profiles/${userId}`);

            // Get the auth token for authorization
            const authToken = (user as any).id || (user as any).uid;

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setProfilePhoto(data.url);
                console.log('Photo uploaded successfully:', data.id);
            } else {
                console.error('Upload failed:', data.error);
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const toggleService = (serviceName: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceName)
                ? prev.filter(s => s !== serviceName)
                : [...prev, serviceName]
        );
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
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-xl font-bold text-white">My Profile</h1>
                    <div className="flex-1" />
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 bg-primary rounded-xl"
                        >
                            <Edit3 className="w-5 h-5 text-white" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="p-2 bg-green-500 rounded-xl"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                                <Save className="w-5 h-5 text-white" />
                            )}
                        </button>
                    )}
                </div>

                {/* Profile Photo */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold overflow-hidden border-4 border-white/20 shadow-xl">
                            {profilePhoto ? (
                                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-white/50" />
                            )}
                        </div>
                        {isEditing && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingPhoto}
                                    className="absolute bottom-0 right-0 p-3 bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg hover:scale-110 transition-transform"
                                >
                                    {uploadingPhoto ? (
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-5 h-5 text-white" />
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Photo Upload Instructions */}
                {isEditing && !profilePhoto && (
                    <div className="bg-white/5 rounded-2xl p-4 mb-4 text-center">
                        <Camera className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-white font-medium mb-1">Add Your Photo</p>
                        <p className="text-gray-400 text-sm">Tap the camera icon above to upload a profile photo</p>
                    </div>
                )}

                {/* Photo uploaded - show save reminder */}
                {isEditing && profilePhoto && (
                    <div className="bg-green-500/10 rounded-2xl p-4 mb-4 text-center border border-green-500/20">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-green-400 font-medium mb-1">Photo uploaded!</p>
                        <p className="text-gray-400 text-sm">Click the save button to keep your photo</p>
                    </div>
                )}

                {/* Verification Status */}
                <div className="bg-white/5 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                        {user.isVerified ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span className="text-green-400">Verified Escort</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-yellow-400" />
                                <span className="text-yellow-400">Verification Pending</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                disabled={!isEditing}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={user.email || ''}
                                disabled
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-gray-500 opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!isEditing}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <select
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                disabled={!isEditing}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary disabled:opacity-50 appearance-none"
                            >
                                <option value="">Select location</option>
                                {locationOptions.map((opt: any) => (
                                    opt.disabled ? (
                                        <option key={opt.value} value="" disabled className="font-semibold">{opt.label}</option>
                                    ) : (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    )
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Hourly Rate (UGX)</label>
                        <input
                            type="number"
                            value={formData.hourlyRate}
                            onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                            disabled={!isEditing}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            disabled={!isEditing}
                            placeholder="Tell clients about yourself..."
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-50 resize-none"
                        />
                    </div>

                    {/* Services */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Services You Offer</label>
                        <div className="flex flex-wrap gap-2">
                            {services.map((service, idx) => (
                                <button
                                    key={service.id || `service-${idx}`}
                                    onClick={() => isEditing && toggleService(service.name)}
                                    disabled={!isEditing}
                                    className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedServices.includes(service.name)
                                        ? 'bg-primary text-white'
                                        : 'bg-white/10 text-gray-400'
                                        } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                    {service.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    {!isEditing && (
                        <>
                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <div className="bg-white/5 rounded-xl p-4 text-center">
                                    <Star className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                                    <p className="text-xl font-bold text-white">{(user as any).rating?.toFixed(1) || '0.0'}</p>
                                    <p className="text-gray-400 text-xs">Rating</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 text-center">
                                    <p className="text-xl font-bold text-white">{(user as any).reviews || 0}</p>
                                    <p className="text-gray-400 text-xs">Reviews</p>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={async () => {
                                    await logout();
                                    router.push('/login');
                                }}
                                className="w-full mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center justify-center gap-2 text-red-400"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Log Out</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </MobileLayout>
    );
}
