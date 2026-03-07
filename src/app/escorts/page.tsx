'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Sparkles, MapPin, Star, ChevronRight, Search, Bell, X, Filter, Check, Loader2 } from 'lucide-react';
import { UGANDA_LOCATIONS } from '@/types';

interface Escort {
  id: string;
  fullName: string;
  location: string;
  rating: number;
  reviews: number;
  services: string[];
  isVerified: boolean;
  profilePhoto?: string;
}

export default function EscortsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [escorts, setEscorts] = useState<Escort[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Get userType for navigation
  const userType = user?.userType || 'client';

  // Filter escorts based on search and location
  const filteredEscorts = useMemo(() => {
    return escorts.filter(escort => {
      const matchesSearch = escort.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = !locationFilter || escort.location === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [escorts, searchQuery, locationFilter]);

  // Get paginated escorts
  const paginatedEscorts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEscorts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEscorts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationFilter]);

  const totalPages = Math.ceil(filteredEscorts.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const fetchEscorts = async () => {
      setIsLoading(true);
      try {
        // Fetch all users and filter for escorts (to avoid index requirement)
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));

        const escortData: Escort[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userType === 'escort') {
            escortData.push({
              id: doc.id,
              fullName: data.fullName || 'Unknown',
              location: data.location || 'Uganda',
              rating: data.rating || 0,
              reviews: data.reviews || 0,
              services: data.services || [],
              isVerified: data.isVerified || false,
              profilePhoto: data.profilePhoto || '',
            });
          }
        });

        setEscorts(escortData);
      } catch (error) {
        console.error('Error fetching escorts:', error);
        setEscorts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEscorts();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationFilter]);

  return (
    <MobileLayout userType={userType} showBottomNav={isAuthenticated}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Explore</h1>
            <p className="text-gray-400 text-sm">Find your perfect companion</p>
          </div>
          {isAuthenticated && (
            <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
              <Bell className="w-6 h-6 text-white/60" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search escorts..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Location Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setLocationFilter('')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${!locationFilter
              ? 'bg-primary text-white'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
          >
            All Locations
          </button>
          {UGANDA_LOCATIONS.slice(0, 6).map((location) => (
            <button
              key={location}
              onClick={() => setLocationFilter(location)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${locationFilter === location
                ? 'bg-primary text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
            >
              {location}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-gray-400 text-sm">
          {isLoading ? 'Loading...' : `${filteredEscorts.length} escorts found`}
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Escort Grid */}
        {!isLoading && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {paginatedEscorts.map((escort) => (
                <Link
                  key={escort.id}
                  href={`/escorts/${escort.id}`}
                  className="group bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors"
                >
                  {/* Photo */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                    {escort.profilePhoto ? (
                      <img
                        src={escort.profilePhoto}
                        alt={escort.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl font-bold text-white/30">{escort.fullName.charAt(0)}</span>
                      </div>
                    )}

                    {/* Verified Badge */}
                    {escort.isVerified && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-white truncate">{escort.fullName}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-400">{escort.rating.toFixed(1)}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs text-gray-400">{escort.reviews} reviews</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">{escort.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/10 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/10 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && filteredEscorts.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No escorts found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
