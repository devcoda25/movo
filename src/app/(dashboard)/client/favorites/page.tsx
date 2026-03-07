'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Heart, MapPin, Star, Loader2, Trash2 } from 'lucide-react';

interface Escort {
  id: string;
  fullName: string;
  location: string;
  rating: number;
  isVerified: boolean;
  profilePhoto?: string;
}

interface FavoriteEscort extends Escort {
  favoriteId: string;
  addedAt: any;
}

export default function ClientFavorites() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteEscort[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Redirect escorts to their own page
    if (!isLoading && user?.userType === 'escort') {
      router.push('/escort/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      
      setIsLoadingData(true);
      try {
        const userId = user.id || (user as any).uid;
        if (!userId) {
          setFavorites([]);
          return;
        }
        
        // Get all favorites for this user
        const favoritesRef = collection(db, 'favorites');
        const favoritesQuery = query(favoritesRef, where('clientId', '==', userId));
        const favoritesSnapshot = await getDocs(favoritesQuery);
        
        const favoriteEscorts: FavoriteEscort[] = [];
        
        for (const favDoc of favoritesSnapshot.docs) {
          const favData = favDoc.data();
          const escortDoc = await getDoc(doc(db, COLLECTIONS.USERS, favData.escortId));
          
          if (escortDoc.exists()) {
            const escortData = escortDoc.data();
            if (escortData.userType === 'escort') {
              favoriteEscorts.push({
                id: escortDoc.id,
                fullName: escortData.fullName || 'Unknown',
                location: escortData.location || 'Uganda',
                rating: escortData.rating || 0,
                isVerified: escortData.isVerified || false,
                profilePhoto: escortData.profilePhoto || '',
                favoriteId: favDoc.id,
                addedAt: favData.createdAt,
              });
            }
          }
        }
        
        setFavorites(favoriteEscorts);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await import('firebase/firestore').then(({ doc: docRef, deleteDoc }) => 
        deleteDoc(docRef(db, 'favorites', favoriteId))
      );
      setFavorites(favorites.filter(f => f.favoriteId !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <MobileLayout userType="client">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType="client">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Favorites</h1>
            <p className="text-gray-400">Your favorite escorts</p>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((escort) => (
              <div
                key={escort.id}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl"
              >
                <Link href={`/escorts/${escort.id}`} className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                    {escort.profilePhoto ? (
                      <img src={escort.profilePhoto} alt={escort.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white/50">{escort.fullName.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/escorts/${escort.id}`}>
                    <h3 className="font-semibold text-white truncate">{escort.fullName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-400">{escort.rating.toFixed(1)}</span>
                      <span className="text-gray-600">•</span>
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">{escort.location}</span>
                    </div>
                  </Link>
                </div>
                
                <button
                  onClick={() => handleRemoveFavorite(escort.favoriteId)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No favorites yet</h3>
            <p className="text-gray-400 mb-6">Start adding escorts to your favorites</p>
            <Link href="/escorts" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl">
              Browse Escorts
            </Link>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
