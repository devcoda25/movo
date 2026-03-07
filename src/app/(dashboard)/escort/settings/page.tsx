'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Settings, User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Loader2 } from 'lucide-react';

interface EscortSettings {
  notifications: {
    bookings: boolean;
    messages: boolean;
    promotions: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLocation: boolean;
  };
}

export default function EscortSettings() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<EscortSettings>({
    notifications: {
      bookings: true,
      messages: true,
      promotions: false,
    },
    privacy: {
      showOnlineStatus: true,
      showLocation: true,
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && user?.userType !== 'escort' && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      const userId = user.id || (user as any).uid;
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userId = user.id || (user as any).uid;
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        settings,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <MobileLayout userType="escort">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  const menuItems = [
    { icon: User, label: 'Profile', href: '/escort/profile', color: 'from-purple-500 to-pink-500' },
    { icon: Bell, label: 'Notifications', href: '/escort/notifications', color: 'from-amber-500 to-orange-500' },
    { icon: Shield, label: 'Privacy & Security', href: '/escort/security', color: 'from-green-500 to-teal-500' },
    { icon: HelpCircle, label: 'Help & Support', href: '/escort/help', color: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <MobileLayout userType="escort">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Manage your account</p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <div className="bg-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <p className="text-white font-medium">Booking Alerts</p>
                <p className="text-gray-400 text-sm">Get notified for new bookings</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, notifications: { ...s.notifications, bookings: !s.notifications.bookings } }))}
                className={`w-12 h-7 rounded-full transition-colors ${settings.notifications.bookings ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications.bookings ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <p className="text-white font-medium">Messages</p>
                <p className="text-gray-400 text-sm">Get notified for new messages</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, notifications: { ...s.notifications, messages: !s.notifications.messages } }))}
                className={`w-12 h-7 rounded-full transition-colors ${settings.notifications.messages ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications.messages ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-white font-medium">Promotions</p>
                <p className="text-gray-400 text-sm">Receive promotional updates</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, notifications: { ...s.notifications, promotions: !s.notifications.promotions } }))}
                className={`w-12 h-7 rounded-full transition-colors ${settings.notifications.promotions ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications.promotions ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-white">Privacy</h2>
          <div className="bg-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <p className="text-white font-medium">Show Online Status</p>
                <p className="text-gray-400 text-sm">Let others see when you're online</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, privacy: { ...s.privacy, showOnlineStatus: !s.privacy.showOnlineStatus } }))}
                className={`w-12 h-7 rounded-full transition-colors ${settings.privacy.showOnlineStatus ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-white font-medium">Show Location</p>
                <p className="text-gray-400 text-sm">Display your location to clients</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, privacy: { ...s.privacy, showLocation: !s.privacy.showLocation } }))}
                className={`w-12 h-7 rounded-full transition-colors ${settings.privacy.showLocation ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.privacy.showLocation ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item, i) => (
            <Link
              key={i}
              href={item.href || '#'}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <p className="flex-1 text-white font-medium">{item.label}</p>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>
          ))}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl mb-4"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Settings'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-white/5 text-red-400 font-semibold rounded-2xl flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </MobileLayout>
  );
}
