'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Modal } from '@/components/ui/Modal';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import {
  ArrowLeft,
  Upload,
  ImageIcon,
  Video,
  X,
  Check,
  AlertCircle,
  Trash2,
  Play,
  Loader2,
  FileVideo
} from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  uploadedAt: Date;
}

export default function EscortMediaPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
    showClose?: boolean;
  }>({
    title: '',
    message: '',
    type: 'success'
  });
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch existing media from Firebase
  useEffect(() => {
    const fetchMedia = async () => {
      if (!user) return;

      try {
        const userId = (user as any).id || (user as any).uid;
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const photos = userData.photos || [];
          const videos = userData.videos || [];

          // Combine photos and videos into media array
          const allMedia: MediaItem[] = [
            ...photos.map((p: any, index: number) => ({
              id: p.id || `photo-${index}`,
              type: 'photo' as const,
              url: p.url || '',
              uploadedAt: p.uploadedAt ? new Date(p.uploadedAt) : new Date()
            })),
            ...videos.map((v: any, index: number) => ({
              id: v.id || `video-${index}`,
              type: 'video' as const,
              url: v.url || '',
              thumbnail: v.thumbnail || '',
              uploadedAt: v.uploadedAt ? new Date(v.uploadedAt) : new Date()
            }))
          ];

          setMedia(allMedia);
        }
      } catch (error) {
        console.error('Error fetching media:', error);
      } finally {
        setIsLoadingMedia(false);
      }
    };

    if (user && isAuthenticated) {
      fetchMedia();
    }
  }, [user, isAuthenticated]);

  const photos = media.filter(m => m.type === 'photo');
  const videos = media.filter(m => m.type === 'video');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (type === 'photo' && !file.type.startsWith('image/')) {
      setModalContent({
        title: 'Invalid File',
        message: 'Please select an image file (JPG, PNG, WEBP)',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      setModalContent({
        title: 'Invalid File',
        message: 'Please select a video file (MP4, WEBM)',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    // Validate file size (10MB for photos, 50MB for videos)
    const maxSize = type === 'photo' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setModalContent({
        title: 'File Too Large',
        message: type === 'photo'
          ? 'Photo must be less than 10MB'
          : 'Video must be less than 50MB',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const userId = (user as any).id || (user as any).uid;

      // Use API route to upload (bypasses CORS issues)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `escorts/${userId}/${type}s`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress(100);

        const newMedia: MediaItem = {
          id: data.id || Date.now().toString(),
          type,
          url: data.url,
          uploadedAt: new Date()
        };

        // Save to Firebase user document
        try {
          const userId = (user as any).id || (user as any).uid;
          const mediaField = type === 'photo' ? 'photos' : 'videos';

          await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
            [mediaField]: arrayUnion({
              id: newMedia.id,
              url: newMedia.url,
              uploadedAt: new Date().toISOString()
            })
          });

          // Also update local state
          setMedia(prev => [...prev, newMedia]);
        } catch (error) {
          console.error('Error saving media to Firebase:', error);
          // Still add to local state even if Firebase save fails
          setMedia(prev => [...prev, newMedia]);
        }

        setModalContent({
          title: 'Upload Successful!',
          message: `Your ${type} has been uploaded successfully.`,
          type: 'success'
        });
        setShowModal(true);
      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setModalContent({
        title: 'Upload Failed',
        message: 'Failed to upload file. Please try again.',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset input
      if (type === 'photo' && photoInputRef.current) {
        photoInputRef.current.value = '';
      } else if (type === 'video' && videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (item: MediaItem) => {
    setDeleteItem(item);
  };

  const confirmDelete = () => {
    if (deleteItem) {
      setMedia(prev => prev.filter(m => m.id !== deleteItem.id));
      setModalContent({
        title: 'Deleted!',
        message: 'Media has been removed successfully.',
        type: 'success'
      });
      setShowModal(true);
      setDeleteItem(null);
    }
  };

  return (
    <MobileLayout userType="escort" showBottomNav>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-white/10">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Manage Media</h1>
          </div>
        </div>

        {/* Upload Section */}
        <div className="p-4">
          <div className="bg-white/5 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Upload New Media</h2>

            {/* Photo Upload */}
            <div className="mb-4">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'photo')}
                className="hidden"
                id="photo-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="photo-upload"
                className={`flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${isUploading
                    ? 'border-gray-600 cursor-not-allowed opacity-50'
                    : 'border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10'
                  }`}
              >
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-gray-300 font-medium">
                  {isUploading ? 'Uploading...' : 'Add Photos'}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2">Max 10MB per image (JPG, PNG, WEBP)</p>
            </div>

            {/* Video Upload */}
            <div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e, 'video')}
                className="hidden"
                id="video-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="video-upload"
                className={`flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${isUploading
                    ? 'border-gray-600 cursor-not-allowed opacity-50'
                    : 'border-pink-500/50 hover:border-pink-400 hover:bg-pink-500/10'
                  }`}
              >
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <FileVideo className="w-5 h-5 text-pink-400" />
                </div>
                <span className="text-gray-300 font-medium">
                  {isUploading ? 'Uploading...' : 'Add Videos'}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2">Max 50MB per video (MP4, WEBM)</p>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Uploading...</span>
                  <span className="text-sm text-purple-400">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Photos Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Photos ({photos.length})</h2>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, idx) => (
                  <div key={photo.id || `photo-${idx}`} className="relative aspect-square group">
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt="Photo"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(photo)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No photos uploaded yet</p>
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Videos ({videos.length})</h2>
            </div>

            {videos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {videos.map((video, idx) => (
                  <div key={video.id || `video-${idx}`} className="relative aspect-video group">
                    {video.url ? (
                      <video
                        src={video.url}
                        className="w-full h-full object-cover rounded-xl"
                        poster={video.thumbnail}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-1" />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(video)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No videos uploaded yet</p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <h3 className="font-semibold text-purple-300 mb-2">💡 Tips for great media</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Use high-quality, well-lit photos</li>
              <li>• Videos should be short (15-60 seconds)</li>
              <li>• Keep your face visible in profile photos</li>
              <li>• Update your media regularly</li>
            </ul>
          </div>
        </div>

        {/* Response Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalContent.title}
          type={modalContent.type}
        >
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalContent.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
              {modalContent.type === 'success' ? (
                <Check className="w-8 h-8 text-green-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <p className="text-gray-300 mb-6">{modalContent.message}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
            >
              {modalContent.type === 'success' ? 'Done' : 'Try Again'}
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          title="Delete Media"
          type="error"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500/20">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-300 mb-2">Are you sure you want to delete this {deleteItem?.type}?</p>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </MobileLayout>
  );
}
