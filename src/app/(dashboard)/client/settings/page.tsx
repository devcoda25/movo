'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Modal } from '@/components/ui';
import { Settings, Bell, Lock, Shield, ChevronRight, LogOut, Check, AlertCircle } from 'lucide-react';

export default function ClientSettings() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseModal, setResponseModal] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Redirect escorts to their own settings
    if (!isLoading && user?.userType === 'escort') {
      router.push('/escort/settings');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const showResponse = (title: string, message: string, type: 'success' | 'error') => {
    setResponseModal({ title, message, type });
    setShowResponseModal(true);
  };

  const menuItems = [
    { icon: Bell, label: 'Push Notifications', href: '/client/notifications', color: 'text-yellow-400', toggle: true },
    { icon: Lock, label: 'Privacy Settings', href: '/client/security', color: 'text-blue-400' },
    { icon: Shield, label: 'Account Security', href: '/client/security', color: 'text-green-400' },
    { icon: Settings, label: 'App Settings', href: '#', color: 'text-white/60' },
  ];

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <MobileLayout userType="client">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-white">Settings</h1>

        {/* Menu Items */}
        <div className="bg-white/5 rounded-3xl overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => item.href !== '#' && router.push(item.href)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-white">{item.label}</span>
              </div>
              {item.toggle ? (
                <div className="w-12 h-6 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              ) : (
                <ChevronRight className="w-5 h-5 text-white/40" />
              )}
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-3xl hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>

        {/* Version */}
        <div className="text-center text-white/30 text-sm py-4">
          Movo v1.0.0
        </div>

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
