import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  increment,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';

export interface Review {
  id: string;
  escortId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: any;
  isVerified: boolean;
}

interface ReviewsState {
  reviews: Review[];
  loading: boolean;
  fetchReviews: (escortId: string) => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'isVerified'>) => Promise<void>;
  getAverageRating: (reviews: Review[]) => number;
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  loading: false,

  fetchReviews: async (escortId: string) => {
    set({ loading: true });
    try {
      const reviewsRef = collection(db, 'reviews');
      const q = query(
        reviewsRef,
        where('escortId', '==', escortId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      set({ reviews, loading: false });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      set({ loading: false });
    }
  },

  addReview: async (review) => {
    try {
      const reviewsRef = collection(db, 'reviews');
      const docRef = await addDoc(reviewsRef, {
        ...review,
        createdAt: serverTimestamp(),
        isVerified: false
      });

      // Update escort's average rating
      const escortRef = doc(db, 'users', review.escortId);
      const escortDoc = await getDoc(escortRef);
      
      if (escortDoc.exists()) {
        const currentData = escortDoc.data();
        const currentReviews = currentData.totalReviews || 0;
        const currentRating = currentData.averageRating || 0;
        
        // Calculate new average
        const newTotalReviews = currentReviews + 1;
        const newAverageRating = ((currentRating * currentReviews) + review.rating) / newTotalReviews;
        
        await updateDoc(escortRef, {
          totalReviews: newTotalReviews,
          averageRating: Math.round(newAverageRating * 10) / 10
        });
      }

      // Refresh reviews
      await get().fetchReviews(review.escortId);
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  getAverageRating: (reviews) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }
}));
