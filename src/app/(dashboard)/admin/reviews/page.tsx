'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { Star, Check, X, Eye, Search, Filter, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Modal } from '@/components/ui/Modal';

interface Review {
  id: string;
  escortId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: any;
  isVerified: boolean;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && isAuthenticated && user?.userType === 'client') router.push('/client/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType === 'escort') router.push('/escort/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.userType === 'admin') fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const reviewsRef = collection(db, 'reviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, { isVerified: true });
      fetchReviews();
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, { isVerified: false });
      fetchReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'pending' && review.isVerified) return false;
    if (filter === 'approved' && !review.isVerified) return false;
    if (searchQuery) {
      return review.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  return (
    <div className="bg-slate-900 min-h-screen lg:ml-72 pb-24">
      <AdminSidebar />
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews Management</h1>
          <p className="text-gray-400">Review and moderate user reviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        
        <div className="flex bg-white/5 rounded-xl p-1">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Total Reviews</p>
          <p className="text-2xl font-bold text-white">{reviews.length}</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">
            {reviews.filter(r => !r.isVerified).length}
          </p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-400">
            {reviews.filter(r => r.isVerified).length}
          </p>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/5 rounded-3xl p-6 border border-white/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {review.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{review.clientName}</h4>
                    <p className="text-gray-400 text-sm">{formatDate(review.createdAt)}</p>
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
                <p className="text-gray-300 mb-4">{review.comment}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  review.isVerified 
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {review.isVerified ? 'Approved' : 'Pending'}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setShowModal(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-xl"
                  >
                    <Eye className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  {!review.isVerified && (
                    <>
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="p-2 hover:bg-green-500/20 rounded-xl"
                      >
                        <Check className="w-5 h-5 text-green-400" />
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        className="p-2 hover:bg-red-500/20 rounded-xl"
                      >
                        <X className="w-5 h-5 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Review Details"
      >
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                {selectedReview.clientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-white text-lg">{selectedReview.clientName}</h4>
                <p className="text-gray-400">{formatDate(selectedReview.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= selectedReview.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-300">{selectedReview.comment || 'No comment'}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleApprove(selectedReview.id);
                  setShowModal(false);
                }}
                className="flex-1 bg-green-500/20 text-green-400 py-3 rounded-xl hover:bg-green-500/30 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  handleReject(selectedReview.id);
                  setShowModal(false);
                }}
                className="flex-1 bg-red-500/20 text-red-400 py-3 rounded-xl hover:bg-red-500/30 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
}
