'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Star, Loader2 } from 'lucide-react';

interface Review {
  id: string;
  escortId: string;
  escortName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function ClientReviews() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Redirect escorts to their own reviews
    if (!isLoading && user?.userType === 'escort') {
      router.push('/escort/reviews');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchReviews = async () => {
      setIsLoadingData(true);
      try {
        const userId = (user as any).id || (user as any).uid;
        if (!userId) {
          setReviews([]);
          return;
        }
        
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('clientId', '==', userId));
        const snapshot = await getDocs(q);
        
        const reviewsData: Review[] = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          let escortName = 'Unknown';
          try {
            const { getDocument } = await import('@/lib/firebase');
            const escortDoc = await getDocument('users', data.escortId) as any;
            if (escortDoc) {
              escortName = escortDoc.fullName || 'Unknown';
            }
          } catch (e) {
            console.log('Error fetching escort name');
          }
          
          reviewsData.push({
            id: doc.id,
            escortId: data.escortId || '',
            escortName,
            rating: data.rating || 0,
            comment: data.comment || '',
            createdAt: data.createdAt,
          });
        }
        
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchReviews();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <MobileLayout userType="client">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-white">My Reviews</h1>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Reviews Yet</h3>
            <p className="text-white/40">Reviews from escorts will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white/5 rounded-3xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {review.escortName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{review.escortName}</h4>
                      <p className="text-xs text-white/40">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-300">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
