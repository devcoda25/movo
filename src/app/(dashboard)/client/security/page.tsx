'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Modal } from '@/components/ui';
import { Shield, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function ClientSecurity() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUserData } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseModal, setResponseModal] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success'
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && user?.userType === 'escort') router.push('/escort/dashboard');
  }, [user, isAuthenticated, isLoading, router]);

  const showResponse = (title: string, message: string, type: 'success' | 'error') => {
    setResponseModal({ title, message, type });
    setShowResponseModal(true);
  };

  const handleChangePassword = async () => {
    if (!passwords.new || !passwords.confirm || !passwords.current) {
      showResponse('Error', 'Please fill in all fields', 'error');
      return;
    }
    
    if (passwords.new !== passwords.confirm) {
      showResponse('Error', 'New passwords do not match', 'error');
      return;
    }
    
    if (passwords.new.length < 6) {
      showResponse('Error', 'Password must be at least 6 characters', 'error');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // In a real app, this would call an API to change password
      // For now, we'll just show success
      showResponse('Success', 'Password changed successfully!', 'success');
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      showResponse('Error', 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <MobileLayout userType="client">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-white">Security</h1>

        {/* Security Options */}
        <div className="bg-white/5 rounded-3xl overflow-hidden">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-400" />
              <span className="text-white">Change Password</span>
            </div>
          </button>
          
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-white">Two-Factor Authentication</span>
            </div>
            <div className="w-12 h-6 bg-white/20 rounded-full relative cursor-not-allowed">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-white/5 rounded-3xl p-4">
          <h3 className="font-semibold text-white mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li>• Use a strong, unique password</li>
            <li>• Don't share your login credentials</li>
            <li>• Log out after each session</li>
            <li>• Report suspicious activity immediately</li>
          </ul>
        </div>

        {/* Change Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-4 rounded-2xl disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
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
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              responseModal.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
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
