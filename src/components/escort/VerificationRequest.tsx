'use client';

import { useState } from 'react';
import { Shield, Upload, FileText, Check, X, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface VerificationRequestProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VerificationRequest({ isOpen, onClose }: VerificationRequestProps) {
  const [step, setStep] = useState<'form' | 'uploading' | 'success' | 'error'>('form');
  const [documents, setDocuments] = useState<File[]>([]);
  const [bio, setBio] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [error, setError] = useState('');
  
  const { user } = useAuthStore();

  const AVAILABLE_SERVICES = [
    'Anal Sex', 'BDSM', 'CIM - Come In Mouth', 'COB - Come On Body',
    'Couples', 'Deep throat', 'Dinner Date', 'Face Sitting',
    'Fisting', 'Foot Fetish', 'French Kissing', 'Handjob',
    'Lesbian Shows', 'Live Shows', 'Stripping', 'Threesome', 'Webcam Sex'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleService = (service: string) => {
    setServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (documents.length === 0) {
      setError('Please upload at least one identification document');
      return;
    }

    if (services.length === 0) {
      setError('Please select at least one service');
      return;
    }

    setStep('uploading');
    setError('');

    try {
      // Upload documents
      const documentUrls: string[] = [];
      for (const doc of documents) {
        const storageRef = ref(storage, `verification/${user.id}/${doc.name}`);
        await uploadBytes(storageRef, doc);
        const url = await getDownloadURL(storageRef);
        documentUrls.push(url);
      }

      // Create verification request
      await addDoc(collection(db, 'verificationRequests'), {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        documents: documentUrls,
        bio: bio,
        services: services,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setStep('success');
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to submit verification. Please try again.');
      setStep('error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Become an Escort"
      size="lg"
    >
      {step === 'form' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Verification Required</h4>
              <p className="text-sm text-gray-400 mt-1">
                To become a verified escort on Movo, you need to submit your documents for review. 
                Our team will verify your information within 24-48 hours.
              </p>
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Upload Identification Documents *
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-purple-500/50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="documents"
              />
              <label htmlFor="documents" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB (max 5 files)</p>
              </label>
            </div>
            
            {/* Uploaded Files */}
            {documents.length > 0 && (
              <div className="mt-3 space-y-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-white truncate max-w-[200px]">{doc.name}</span>
                    </div>
                    <button
                      onClick={() => removeDocument(index)}
                      className="p-1 hover:bg-white/10 rounded-lg"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services Selection */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Select Services You Offer *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_SERVICES.map((service) => (
                <button
                  key={service}
                  onClick={() => toggleService(service)}
                  className={`p-3 rounded-xl text-sm text-left transition-colors ${
                    services.includes(service)
                      ? 'bg-purple-500/20 border border-purple-500 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Bio (Optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients about yourself..."
              className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              maxLength={500}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity"
          >
            Submit for Verification
          </button>
        </div>
      )}

      {step === 'uploading' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Submitting Verification</h3>
          <p className="text-gray-400">Please wait while we upload your documents...</p>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Verification Submitted!</h3>
          <p className="text-gray-400 mb-6">
            Your verification request has been submitted successfully. 
            We'll review your documents and get back to you within 24-48 hours.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
          <p className="text-gray-400 mb-6">{error || 'Please try again later.'}</p>
          <button
            onClick={() => setStep('form')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-xl"
          >
            Try Again
          </button>
        </div>
      )}
    </Modal>
  );
}
