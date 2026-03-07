'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Modal } from '@/components/ui/Modal';
import { db, COLLECTIONS } from '@/lib/firebase';
import { notifyEscortOfBooking } from '@/lib/notifications';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { Sparkles, MapPin, Star, Calendar, ChevronLeft, CheckCircle, MessageSquare, Heart, Share2, Phone, ArrowLeft, Play, Clock, X, Check, AlertCircle, ChevronRight, Pause, Star as StarIcon } from 'lucide-react';

interface EscortMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
}

interface EscortProfile {
  id: string;
  fullName: string;
  location: string;
  bio: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  services: string[];
  photos: EscortMedia[];
  videos: EscortMedia[];
  hourlyRate: number;
  phone?: string;
  profilePhoto?: string;
}

export default function EscortProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [escort, setEscort] = useState<EscortProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [responseModal, setResponseModal] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success'
  });

  // Booking form state
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingLocation, setBookingLocation] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Favorite state
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Get userType for navigation
  const userType = user?.userType || 'client';

  useEffect(() => {
    const fetchEscort = async () => {
      if (!params.id) return;

      setIsLoading(true);
      setError('');

      try {
        const escortDoc = await getDoc(doc(db, COLLECTIONS.USERS, params.id as string));

        if (escortDoc.exists()) {
          const data = escortDoc.data();
          // Only show if user is an escort
          if (data.userType === 'escort') {
            setEscort({
              id: escortDoc.id,
              fullName: data.fullName || 'Unknown',
              location: data.location || 'Uganda',
              bio: data.bio || 'No bio available',
              rating: data.rating || 0,
              reviews: data.reviews || 0,
              isVerified: data.isVerified || false,
              services: data.services || [],
              photos: data.photos || [],
              videos: data.videos || [],
              hourlyRate: data.hourlyRate || 0,
              phone: data.phone,
              profilePhoto: data.profilePhoto || '',
            });
          } else {
            setError('Escort not found');
          }
        } else {
          setError('Escort not found');
        }
      } catch (err) {
        console.error('Error fetching escort:', err);
        setError('Failed to load escort profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEscort();
  }, [params.id]);

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!user || !escort || !bookingDate || !bookingTime) {
      setResponseModal({
        title: 'Missing Information',
        message: 'Please fill in the date and time fields.',
        type: 'error'
      });
      setShowResponseModal(true);
      return;
    }

    setIsSavingBooking(true);
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create booking in Firestore
      const bookingRef = doc(collection(db, COLLECTIONS.BOOKINGS));
      await setDoc(bookingRef, {
        id: bookingRef.id,
        clientId: user.id,
        escortId: escort.id,
        serviceId: '',
        status: 'pending',
        date: bookingDate,
        time: bookingTime,
        location: bookingLocation || 'Client location',
        notes: bookingNotes,
        totalAmount: escort.hourlyRate,
        createdAt: serverTimestamp(),
      });

      // Send notification to escort
      const clientName = user.fullName || 'A client';
      await notifyEscortOfBooking(escort.id, clientName, 'Service', bookingDate, bookingRef.id);

      setShowBookingModal(false);
      setResponseModal({
        title: 'Booking Request Sent!',
        message: `Your booking request has been sent to ${escort.fullName}. They will contact you shortly.`,
        type: 'success'
      });
      setShowResponseModal(true);

      // Reset form
      setBookingDate('');
      setBookingTime('');
      setBookingLocation('');
      setBookingNotes('');
    } catch (error) {
      console.error('Error creating booking:', error);
      setResponseModal({
        title: 'Booking Failed',
        message: 'Failed to send booking request. Please try again.',
        type: 'error'
      });
      setShowResponseModal(true);
    } finally {
      setIsSavingBooking(false);
    }
  };

  const handleChat = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // Navigate to chat with escort ID to start a new conversation
    // Use client messages page for clients, escort chat for escorts
    if (user?.userType === 'client') {
      router.push(`/client/messages?escortId=${params.id}`);
    } else if (user?.userType === 'escort') {
      router.push(`/escort/chat?clientId=${params.id}`);
    } else {
      // Not logged in or wrong user type - redirect to login
      router.push('/login');
    }
  };

  const openMediaViewer = (index: number) => {
    setActiveMediaIndex(index);
    setShowMediaViewer(true);
    setIsPlaying(false);
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    setIsTogglingFavorite(true);
    try {
      const userId = user.id || (user as any).uid;
      const favoriteId = `${userId}_${params.id}`;
      const favoriteRef = doc(db, 'favorites', favoriteId);
      const favoriteDoc = await getDoc(favoriteRef);

      if (favoriteDoc.exists()) {
        // Remove from favorites
        await setDoc(favoriteRef, { exists: false }, { merge: true });
        setIsFavorited(false);
      } else {
        // Add to favorites
        await setDoc(favoriteRef, {
          clientId: userId,
          escortId: params.id,
          createdAt: serverTimestamp()
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Check if already favorited
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !params.id) return;
      const userId = user.id || (user as any).uid;
      if (!userId) return;

      const favoriteId = `${userId}_${params.id}`;
      const favoriteRef = doc(db, 'favorites', favoriteId);
      const favoriteDoc = await getDoc(favoriteRef);
      setIsFavorited(favoriteDoc.exists());
    };
    checkFavorite();
  }, [user, params.id]);

  // Submit review
  const handleSubmitReview = async () => {
    if (!user || !escort) return;

    setIsSubmittingReview(true);
    try {
      const userId = user.id || (user as any).uid;

      // Add review
      await addDoc(collection(db, 'reviews'), {
        clientId: userId,
        clientName: user.fullName || 'Anonymous',
        escortId: params.id,
        escortName: escort.fullName,
        rating: reviewRating,
        comment: reviewComment,
        createdAt: serverTimestamp()
      });

      // Update escort's average rating
      const reviewsRef = collection(db, 'reviews');
      const reviewsQuery = query(reviewsRef, where('escortId', '==', params.id));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const totalReviews = reviewsSnapshot.size;
      const totalRating = reviewsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().rating || 0), 0);
      const avgRating = totalReviews > 0 ? totalRating / totalReviews : reviewRating;

      await updateDoc(doc(db, COLLECTIONS.USERS, params.id as string), {
        rating: avgRating,
        reviews: totalReviews
      });

      setShowReviewModal(false);
      setReviewRating(5);
      setReviewComment('');
      setResponseModal({
        title: 'Review Submitted!',
        message: 'Thank you for reviewing this escort.',
        type: 'success'
      });
      setShowResponseModal(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      setResponseModal({
        title: 'Error',
        message: 'Failed to submit review. Please try again.',
        type: 'error'
      });
      setShowResponseModal(true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const allMedia = escort ? [
    // Add profile photo as first item if available
    ...(escort.profilePhoto ? [{ id: 'profile', url: escort.profilePhoto, mediaType: 'photo' as const }] : []),
    ...(escort.photos?.map((p, idx) => ({ ...p, id: p.id || `photo-${idx}`, mediaType: 'photo' as const })) || []),
    ...(escort.videos?.map((v, idx) => ({ ...v, id: v.id || `video-${idx}`, mediaType: 'video' as const })) || [])
  ] : [];

  if (isLoading) {
    return (
      <MobileLayout userType={userType} showBottomNav={false}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (error || !escort) {
    return (
      <MobileLayout userType={userType} showBottomNav={false}>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Escort Not Found</h2>
          <p className="text-gray-400 mb-6 text-center">{error || 'This escort profile does not exist.'}</p>
          <button
            onClick={() => router.push('/escorts')}
            className="px-6 py-3 bg-primary text-white rounded-xl"
          >
            Browse Escorts
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType={userType} showBottomNav={false}>
      <div className="min-h-screen bg-background pb-24">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="fixed top-4 left-4 z-50 p-3 bg-black/50 backdrop-blur-sm rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        {/* Media Section */}
        <div className="relative">
          {/* Main Media Display */}
          <div
            className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-secondary/20 relative cursor-pointer"
            onClick={() => openMediaViewer(activeMediaIndex)}
          >
            {allMedia.length > 0 ? (
              <>
                {allMedia[activeMediaIndex]?.mediaType === 'video' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={allMedia[activeMediaIndex]?.url || '/placeholder.jpg'}
                    alt={escort.fullName}
                    className="w-full h-full object-cover"
                  />
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white/30">{escort.fullName.charAt(0)}</span>
                </div>
              </div>
            )}

            {/* Verified Badge */}
            {escort.isVerified && (
              <div className="absolute top-20 right-4 px-3 py-1.5 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Verified</span>
              </div>
            )}

            {/* Media Navigation Arrows */}
            {allMedia.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMediaIndex((i: number) => (i - 1 + allMedia.length) % allMedia.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMediaIndex((i: number) => (i + 1) % allMedia.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
                disabled={isTogglingFavorite}
                className={`p-3 backdrop-blur-sm rounded-full transition-colors ${isFavorited ? 'bg-red-500 hover:bg-red-600' : 'bg-black/50 hover:bg-black/60'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'text-white fill-white' : 'text-white'}`} />
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Media Thumbnails Strip */}
          {allMedia.length > 1 && (
            <div className="absolute bottom-4 left-4 right-20 flex gap-2 overflow-x-auto pb-2">
              {allMedia.map((media, idx) => (
                <button
                  key={`media-${idx}`}
                  onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(idx); }}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${idx === activeMediaIndex ? 'border-white' : 'border-transparent opacity-60'
                    }`}
                >
                  {media.mediaType === 'video' ? (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <img src={media.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs for Photos/Videos */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'photos'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400'
              }`}
          >
            Photos ({(escort.photos || []).length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'videos'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400'
              }`}
          >
            Videos ({(escort.videos || []).length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{escort.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{escort.location}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">UGX {escort.hourlyRate.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">per hour</p>
            </div>
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-white">{escort.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400">{escort.reviews} reviews</span>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">About</h3>
            <p className="text-gray-300 leading-relaxed">{escort.bio}</p>
          </div>

          {/* Services */}
          {escort.services && escort.services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Services</h3>
              <div className="flex flex-wrap gap-2">
                {(escort.services || []).filter(Boolean).map((service: string, idx: number) => (
                  <span key={`service-${idx}`} className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-white font-semibold">24/7</p>
              <p className="text-gray-400 text-xs">Available</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-semibold">{escort.reviews}</p>
              <p className="text-gray-400 text-xs">Reviews</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-white font-semibold">100%</p>
              <p className="text-gray-400 text-xs">Response</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-white/10">
          <div className="flex gap-3">
            <button
              onClick={handleChat}
              className="flex-1 py-4 bg-white/10 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Chat
            </button>
            <button
              onClick={() => { if (isAuthenticated) setShowReviewModal(true); else router.push('/login'); }}
              className="py-4 px-4 bg-white/10 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <StarIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleBooking}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Calendar className="w-5 h-5" />
              Book Now
            </button>
          </div>
        </div>

        {/* Booking Modal */}
        <Modal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          title={`Book ${escort.fullName}`}
        >
          <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold">
                  {escort.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{escort.fullName}</h4>
                  <p className="text-gray-400 text-sm">{escort.location}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-white/10">
                <span className="text-gray-400">Rate</span>
                <span className="text-white font-semibold">UGX {escort.hourlyRate.toLocaleString()}/hr</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Select Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Select Time</label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Location</label>
              <input
                type="text"
                value={bookingLocation}
                onChange={(e) => setBookingLocation(e.target.value)}
                placeholder="Enter your location"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Notes (Optional)</label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Any special requests..."
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary h-24 resize-none"
              />
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={isSavingBooking}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSavingBooking ? 'Sending...' : 'Confirm Booking'}
            </button>
          </div>
        </Modal>

        {/* Review Modal */}
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Write a Review"
        >
          <div className="space-y-4">
            {/* Rating Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <StarIcon
                    className={`w-8 h-8 ${star <= reviewRating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-500'
                      }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-gray-400 text-sm">{reviewRating} out of 5 stars</p>

            {/* Review Comment */}
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write your review..."
              rows={4}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />

            <button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || !reviewComment.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </Modal>

        {/* Response Modal */}
        <Modal
          isOpen={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          title={responseModal.title}
          type={responseModal.type}
        >
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${responseModal.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
              {responseModal.type === 'success' ? (
                <Check className="w-8 h-8 text-green-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <p className="text-gray-300 mb-6">{responseModal.message}</p>
            <button
              onClick={() => setShowResponseModal(false)}
              className="w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
            >
              {responseModal.type === 'success' ? 'Great!' : 'OK'}
            </button>
          </div>
        </Modal>
      </div>
    </MobileLayout>
  );
}
