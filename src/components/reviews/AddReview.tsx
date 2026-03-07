'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { useReviewsStore } from '@/store/reviews';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';

interface AddReviewProps {
  escortId: string;
  escortName: string;
}

export function AddReview({ escortId, escortName }: AddReviewProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success'
  });
  
  const { addReview } = useReviewsStore();
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setModalContent({
        title: 'Rating Required',
        message: 'Please select a rating before submitting.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    if (!user) {
      setModalContent({
        title: 'Login Required',
        message: 'Please login to leave a review.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await addReview({
        escortId,
        clientId: user.id,
        clientName: user.fullName || 'Anonymous',
        rating,
        comment: comment.trim()
      });
      
      setModalContent({
        title: 'Review Submitted!',
        message: 'Thank you for your review. It will be visible after verification.',
        type: 'success'
      });
      setShowModal(true);
      
      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to submit review. Please try again.',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-1">Rate your experience</h3>
          <p className="text-gray-400 text-sm">with {escortName}</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-2 transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm">
          {rating === 0 && 'Tap to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </p>

        {/* Comment */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Share your experience (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about your experience..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            maxLength={500}
          />
          <p className="text-gray-500 text-xs mt-1 text-right">{comment.length}/500</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Review
            </>
          )}
        </button>
      </form>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
        type={modalContent.type}
      >
        <div className="text-center">
          <p className="text-gray-300">{modalContent.message}</p>
          <button
            onClick={() => setShowModal(false)}
            className="mt-6 w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
          >
            {modalContent.type === 'success' ? 'Great!' : 'OK'}
          </button>
        </div>
      </Modal>
    </>
  );
}
