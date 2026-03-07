'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Modal } from '@/components/ui';
import { User, Mail, Phone, MapPin, Settings, LogOut, Star, Shield, Bell, HelpCircle, ChevronRight, Camera, Check, AlertCircle } from 'lucide-react';
import { getActiveLocations, groupLocationsByRegion, Location } from '@/lib/locations';

export default function ClientProfile() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, updateUserData } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  
  useEffect(() => {
    const fetchLocations = async () => {
      const data = await getActiveLocations();
      setLocations(data);
    };
    fetchLocations();
  }, []);

  const groupedLocations = groupLocationsByRegion(locations);
  const locationOptions = Object.entries(groupedLocations).flatMap(([region, locs]) => [
    { value: '', label: `📍 ${region}`, disabled: true },
    ...locs.map(loc => ({ value: loc.name, label: `   ${loc.name}` }))
  ]);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseModal, setResponseModal] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success'
  });
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    bio: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({ bookings: 0, reviews: 0, favorites: 0 });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Redirect escorts to their own profile
    if (!isLoading && user?.userType === 'escort') {
      router.push('/escort/profile');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      try {
        const userId = (user as any).id || (user as any).uid;
        if (!userId) return;
        
        // Fetch bookings count
        const { getDocuments } = await import('@/lib/firebase');
        const bookings = await getDocuments('bookings') as any[];
        const bookingsCount = bookings.filter((b: any) => b.clientId === userId).length;
        
        // For now, reviews and favorites are placeholders
        setStats({
          bookings: bookingsCount,
          reviews: 0,
          favorites: 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const showResponse = (title: string, message: string, type: 'success' | 'error') => {
    setResponseModal({ title, message, type });
    setShowResponseModal(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateUserData({
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
      });
      showResponse('Success', 'Profile updated successfully!', 'success');
      setShowEditModal(false);
    } catch (error) {
      showResponse('Error', 'Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { icon: Star, label: 'My Reviews', href: '/client/reviews', color: 'text-yellow-400' },
    { icon: Shield, label: 'Privacy & Security', href: '/client/security', color: 'text-blue-400' },
    { icon: Bell, label: 'Notifications', href: '/client/notifications', color: 'text-purple-400' },
    { icon: HelpCircle, label: 'Help & Support', href: '/client/help', color: 'text-green-400' },
    { icon: Settings, label: 'Settings', href: '/client/settings', color: 'text-white/60' },
  ];

  return (
    <MobileLayout userType="client">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-white">Profile</h1>

        {/* Profile Header */}
        <div className="bg-white/5 rounded-3xl p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold mx-auto">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">{user.fullName || 'User'}</h2>
          <p className="text-white/40">{user.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-white/60">
            <MapPin className="w-4 h-4" />
            <span>{user.location || 'No location set'}</span>
          </div>
          <button 
            onClick={() => setShowEditModal(true)}
            className="mt-4 w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            Edit Profile
          </button>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.bookings}</p>
            <p className="text-xs text-white/40">Bookings</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.reviews}</p>
            <p className="text-xs text-white/40">Reviews</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.favorites}</p>
            <p className="text-xs text-white/40">Favorites</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white/5 rounded-3xl p-4 space-y-3">
          <div className="flex items-center gap-3 text-white/60">
            <Mail className="w-5 h-5" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <Phone className="w-5 h-5" />
            <span>{user.phone || 'Not set'}</span>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <MapPin className="w-5 h-5" />
            <span>{user.location || 'Not set'}</span>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white/5 rounded-3xl overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-white">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
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

        {/* Edit Profile Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Profile"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Username</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter username"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+256..."
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Select location</option>
                {locationOptions.map((opt: any) => (
                  opt.disabled ? (
                    <option key={opt.value} value="" disabled className="font-semibold">{opt.label}</option>
                  ) : (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  )
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary h-24 resize-none"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-4 rounded-2xl disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
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
