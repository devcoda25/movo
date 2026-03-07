'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, Mail, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success'
  });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setModalContent({
        title: 'Email Required',
        message: 'Please enter your email address.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setModalContent({
        title: 'Email Sent!',
        message: 'Password reset link has been sent to your email. Please check your inbox and follow the instructions.',
        type: 'success'
      });
      setShowModal(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      setModalContent({
        title: 'Error',
        message: errorMessage,
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-6 shadow-lg">
              <Image
                src="/logo.png"
                alt="Movo"
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
            <p className="text-gray-400">
              No worries, we'll send you reset instructions
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-2xl disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      {/* Response Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          if (modalContent.type === 'success') {
            router.push('/login');
          }
        }}
        title={modalContent.title}
        type={modalContent.type}
      >
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            modalContent.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {modalContent.type === 'success' ? (
              <Check className="w-8 h-8 text-green-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-400" />
            )}
          </div>
          <p className="text-gray-300 mb-6">{modalContent.message}</p>
          <button
            onClick={() => {
              setShowModal(false);
              if (modalContent.type === 'success') {
                router.push('/login');
              }
            }}
            className="w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
          >
            {modalContent.type === 'success' ? 'Back to Login' : 'Try Again'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
