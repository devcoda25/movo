'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ChevronRight } from 'lucide-react';
import { VerificationRequest } from '@/components/escort/VerificationRequest';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';

export default function EscortVerificationPage() {
  const router = useRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user?.userType === 'client') {
      router.push('/client/dashboard');
    } else if (!isLoading && isAuthenticated && user?.userType !== 'escort' && user?.userType !== 'admin') {
      router.push('/');
    }
  }, [user, isAuthenticated, isLoading, router]);

  // If user is already an escort, redirect or show different content
  const isAlreadyEscort = user?.userType === 'escort';
  const isVerified = user?.isVerified;

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Verification</h1>
            <p className="text-gray-400">Become a verified escort</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Your Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAlreadyEscort 
                ? isVerified 
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {isAlreadyEscort ? (isVerified ? 'Verified' : 'Pending') : 'Not an Escort'}
            </span>
          </div>
          
          <p className="text-gray-400 text-sm">
            {isAlreadyEscort 
              ? isVerified 
                ? 'You are a verified escort. Clients can now book your services.'
                : 'Your verification is under review. We will notify you once verified.'
              : 'Apply to become a verified escort and start offering your services on Movo.'
            }
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Benefits of Verification</h3>
          
          <div className="space-y-4">
            {[
              { title: 'Verified Badge', desc: 'Show clients you are verified and trustworthy' },
              { title: 'Higher Visibility', desc: 'Get featured in search results and categories' },
              { title: 'Direct Bookings', desc: 'Accept bookings directly through the platform' },
              { title: 'Reviews & Ratings', desc: 'Build your reputation with client reviews' },
              { title: 'Profile Promotion', desc: 'Appear in featured sections and promotions' },
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{benefit.title}</h4>
                  <p className="text-gray-400 text-sm">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
          
          <div className="space-y-3">
            {[
              'Valid government-issued ID',
              'Clear profile photos',
              'Accept our terms of service',
              'Be 18 years or older',
            ].map((req, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        {!isAlreadyEscort && (
          <button
            onClick={() => setShowVerificationModal(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            Apply to Become an Escort
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Already Verified */}
        {isAlreadyEscort && isVerified && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">You are Verified!</h3>
            <p className="text-gray-400">Your profile is visible to clients. Keep it updated to attract more bookings.</p>
          </div>
        )}

        {/* Pending */}
        {isAlreadyEscort && !isVerified && (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Verification Pending</h3>
            <p className="text-gray-400">Our team is reviewing your application. This usually takes 24-48 hours.</p>
          </div>
        )}
      </div>

      <VerificationRequest 
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </MobileLayout>
  );
}
