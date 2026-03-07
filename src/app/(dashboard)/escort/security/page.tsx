'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Shield, Lock, Eye, EyeOff, Smartphone, Mail, CheckCircle, Loader2 } from 'lucide-react';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
}

export default function EscortSecurity() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && user?.userType !== 'escort' && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchSecuritySettings = async () => {
      if (!user) return;
      const userId = user.id || (user as any).uid;
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.securitySettings) {
          setSecuritySettings(data.securitySettings);
        }
      }
    };
    fetchSecuritySettings();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
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

  return (
    <MobileLayout userType="escort">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Security</h1>
            <p className="text-gray-400">Manage your account security</p>
          </div>
        </div>

        {/* Password Change */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-white">Change Password</h2>
          <div className="bg-white/5 rounded-2xl p-4 space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <button className="w-full py-3 bg-white/5 text-white font-medium rounded-xl flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Update Password
          </button>
        </div>

        {/* Security Options */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-white">Security Options</h2>
          <div className="bg-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-sm">Add an extra</p>
                 layer of security</div>
              </div>
              <button
                onClick={() => setSecuritySettings(s => ({ ...s, twoFactorEnabled: !s.twoFactorEnabled }))}
                className={`w-12 h-7 rounded-full transition-colors ${securitySettings.twoFactorEnabled ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Login Alerts</p>
                  <p className="text-gray-400 text-sm">Get notified of new logins</p>
                </div>
              </div>
              <button
                onClick={() => setSecuritySettings(s => ({ ...s, loginAlerts: !s.loginAlerts }))}
                className={`w-12 h-7 rounded-full transition-colors ${securitySettings.loginAlerts ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-white">Active Sessions</h2>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Current Device</p>
                  <p className="text-gray-400 text-sm">Active now</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
        </button>

        {/* Danger Zone */}
        <div className="mt-8 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
          <h3 className="text-red-400 font-semibold mb-2">Danger Zone</h3>
          <p className="text-gray-400 text-sm mb-4">Once you delete your account, there is no going back.</p>
          <button className="w-full py-3 bg-red-500/20 text-red-400 font-medium rounded-xl">
            Delete Account
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
