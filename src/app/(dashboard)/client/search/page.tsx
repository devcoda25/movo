'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Search, MapPin, Star, Filter, X, SlidersHorizontal } from 'lucide-react';

interface Escort {
    id: string;
    fullName: string;
    location: string;
    rating: number;
    isVerified: boolean;
    isOnline?: boolean;
    profilePhoto?: string;
    hourlyRate?: number;
    services?: string[];
}

interface Service {
    id: string;
    name: string;
}

export default function ClientSearch() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuthStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('All');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [maxPrice, setMaxPrice] = useState(1000);
    const [showFilters, setShowFilters] = useState(false);

    const [escorts, setEscorts] = useState<Escort[]>([]);
    const [filteredEscorts, setFilteredEscorts] = useState<Escort[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/login');
    }, [user, isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (!isLoading && user?.userType === 'escort') {
            router.push('/escort/dashboard');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                // Fetch services
                const servicesSnapshot = await getDocs(collection(db, COLLECTIONS.SERVICES));
                const servicesData = servicesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || ''
                }));
                setServices(servicesData);

                // Fetch all users and filter for escorts
                const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
                const escortsData: Escort[] = [];
                const locationSet = new Set<string>();

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
                            hourlyRate: data.hourlyRate || 0,
                            services: data.services || []
                        });
                        if (data.location) {
                            locationSet.add(data.location);
                        }
                    }
                });

                setEscorts(escortsData);
                setFilteredEscorts(escortsData);
                setLocations(['All', ...Array.from(locationSet)]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = [...escorts];

        // Search query
        if (searchQuery) {
            filtered = filtered.filter(escort =>
                escort.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                escort.location?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Location filter
        if (location && location !== 'All') {
            filtered = filtered.filter(escort =>
                escort.location?.toLowerCase() === location.toLowerCase()
            );
        }

        // Rating filter
        if (minRating > 0) {
            filtered = filtered.filter(escort => escort.rating >= minRating);
        }

        // Price filter
        if (maxPrice < 1000) {
            filtered = filtered.filter(escort => (escort.hourlyRate || 0) <= maxPrice);
        }

        // Services filter
        if (selectedServices.length > 0) {
            filtered = filtered.filter(escort =>
                selectedServices.every(service => escort.services?.includes(service))
            );
        }

        setFilteredEscorts(filtered);
    }, [searchQuery, location, minRating, maxPrice, selectedServices, escorts]);

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setLocation('All');
        setSelectedServices([]);
        setMinRating(0);
        setMaxPrice(1000);
    };

    const activeFiltersCount = [
        location !== 'All',
        minRating > 0,
        maxPrice < 1000,
        selectedServices.length > 0
    ].filter(Boolean).length;

    return (
        <MobileLayout userType="client" title="Search">
            <div className="p-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search escorts by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                    />
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl ${activeFiltersCount > 0 ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60'} active:scale-95 transition-all`}
                    >
                        {activeFiltersCount > 0 ? (
                            <div className="w-5 h-5 flex items-center justify-center">
                                <span className="text-xs font-bold">{activeFiltersCount}</span>
                            </div>
                        ) : (
                            <SlidersHorizontal className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-4 animate-in slide-in-from-top-2">
                        {/* Location Filter */}
                        <div>
                            <label className="text-white/60 text-sm mb-2 block">Location</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                            >
                                {locations.map(loc => (
                                    <option key={loc} value={loc} className="bg-gray-900">{loc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rating Filter */}
                        <div>
                            <label className="text-white/60 text-sm mb-2 block">Minimum Rating: {minRating}+</label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.5"
                                value={minRating}
                                onChange={(e) => setMinRating(Number(e.target.value))}
                                className="w-full accent-purple-500"
                            />
                            <div className="flex justify-between text-white/40 text-xs mt-1">
                                <span>Any</span>
                                <span>5★</span>
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div>
                            <label className="text-white/60 text-sm mb-2 block">Max Price: {maxPrice === 1000 ? 'Any' : `$${maxPrice}/hr`}</label>
                            <input
                                type="range"
                                min="50"
                                max="1000"
                                step="50"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                className="w-full accent-purple-500"
                            />
                            <div className="flex justify-between text-white/40 text-xs mt-1">
                                <span>$50</span>
                                <span>$1000</span>
                            </div>
                        </div>

                        {/* Services Filter */}
                        <div>
                            <label className="text-white/60 text-sm mb-2 block">Services</label>
                            <div className="flex flex-wrap gap-2">
                                {services.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => toggleService(service.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedServices.includes(service.id)
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                            }`}
                                    >
                                        {service.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex gap-2">
                            <button
                                onClick={clearFilters}
                                className="flex-1 h-10 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 transition-all"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 h-10 rounded-xl bg-purple-500 text-white hover:bg-purple-600 active:scale-95 transition-all"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}

                {/* Results Count */}
                <div className="flex items-center justify-between">
                    <p className="text-white/60 text-sm">
                        {filteredEscorts.length} escort{filteredEscorts.length !== 1 ? 's' : ''} found
                    </p>
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="text-purple-400 text-sm flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Results Grid */}
                {isLoadingData ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredEscorts.length === 0 ? (
                    <div className="text-center py-12">
                        <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60">No escorts match your search</p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-purple-400 hover:underline"
                        >
                            Clear filters to see more
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {filteredEscorts.map(escort => (
                            <Link
                                key={escort.id}
                                href={`/escorts/${escort.id}`}
                                className="group block"
                            >
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 relative">
                                    {escort.profilePhoto ? (
                                        <img
                                            src={escort.profilePhoto}
                                            alt={escort.fullName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                            <Star className="w-12 h-12 text-white/20" />
                                        </div>
                                    )}

                                    {/* Online Indicator */}
                                    {escort.isOnline && (
                                        <div className="absolute top-3 right-3 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                                    )}

                                    {/* Verified Badge */}
                                    {escort.isVerified && (
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500/80 rounded-full flex items-center gap-1">
                                            <Star className="w-3 h-3 text-white fill-white" />
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

                                    {/* Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h3 className="text-white font-semibold truncate">{escort.fullName}</h3>
                                        <div className="flex items-center gap-1 text-white/70 text-sm">
                                            <MapPin className="w-3 h-3" />
                                            {escort.location}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center gap-1 text-amber-400 text-sm">
                                                <Star className="w-3 h-3 fill-amber-400" />
                                                {escort.rating.toFixed(1)}
                                            </div>
                                            {escort.hourlyRate && (
                                                <span className="text-white font-semibold">${escort.hourlyRate}/hr</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
