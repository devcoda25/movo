'use client';

import { Star, CheckCircle } from 'lucide-react';
import { Review } from '@/store/reviews';

interface ReviewsListProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function ReviewsList({ reviews, averageRating, totalReviews }: ReviewsListProps) {
  // Rating distribution
  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{averageRating.toFixed(1)}</div>
            <div className="flex gap-1 justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-500'
                  }`}
                />
              ))}
            </div>
            <div className="text-gray-400 text-sm mt-1">{totalReviews} reviews</div>
          </div>

          {/* Rating Bars */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-gray-400 text-sm w-3">{rating}</span>
                <Star className="w-3 h-3 text-gray-500" />
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{
                      width: totalReviews > 0 
                        ? `${(distribution[rating as keyof typeof distribution] / totalReviews) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-8">
                  {distribution[rating as keyof typeof distribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No reviews yet. Be the first to leave a review!
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/5 rounded-3xl p-5 border border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {review.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{review.clientName}</span>
                      {review.isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">
                  {review.createdAt?.toDate 
                    ? new Date(review.createdAt.toDate()).toLocaleDateString()
                    : 'Recently'}
                </span>
              </div>
              
              {review.comment && (
                <p className="mt-4 text-gray-300 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
