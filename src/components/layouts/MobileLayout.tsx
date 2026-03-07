'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Search, Calendar, User, MessageSquare, Home, MoreHorizontal, Bell, Settings, Image, Shield, Heart, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface MobileLayoutProps {
  children: React.ReactNode;
  userType?: 'client' | 'escort' | 'admin';
  showBottomNav?: boolean;
  title?: string;
  rightAction?: React.ReactNode;
}

export default function MobileLayout({
  children,
  userType = 'client',
  showBottomNav = true,
  title,
  rightAction
}: MobileLayoutProps) {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  // Request notification permission on mount
  useEffect(() => {
    console.log('MobileLayout: isAuthenticated =', isAuthenticated);

    // Check if running in Capacitor
    const initNotifications = async () => {
      try {
        // Dynamically import Capacitor to check if it's available
        const { isCapacitor, initPushNotifications, setStatusBarStyle } = await import('@/lib/capacitor');

        const isNative = isCapacitor();
        console.log('MobileLayout: Running in Capacitor:', isNative);

        if (isNative && isAuthenticated) {
          // Set status bar style for native
          await setStatusBarStyle('light');

          // Initialize Capacitor push notifications
          const result = await initPushNotifications();
          console.log('MobileLayout: Capacitor push result:', result);

          if (result?.token) {
            console.log('✅ Capacitor Push Token:', result.token);
            // Save token to user profile in Firestore
            if (!user?.uid) {
              console.warn('No authenticated user; skipping saving Capacitor token');
              return;
            }
            try {
              const { updateDocument } = await import('@/lib/firebase');
              await updateDocument('users', user.uid, {
                capacitorToken: result.token
              });
              console.log('✅ Capacitor Token saved to user profile');
            } catch (e) {
              console.error('Failed to save Capacitor token:', e);
            }
          }
        } else if (isAuthenticated) {
          // Fallback to web-based Firebase messaging
          const { requestNotificationPermission } = await import('@/lib/firebase');
          const result = await requestNotificationPermission();
          console.log('MobileLayout: Web notification result:', result);
        }
      } catch (error) {
        console.error('MobileLayout: Notification init error:', error);
      }
    };

    if (isAuthenticated) {
      initNotifications();
    }
  }, [isAuthenticated, user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMoreMenu(false);
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMoreMenu]);

  const clientNav = [
    { href: '/client/dashboard', icon: Home, label: 'Home', color: 'from-purple-500 to-indigo-500' },
    { href: '/escorts', icon: Search, label: 'Explore', color: 'from-pink-500 to-rose-500' },
    { href: '/client/bookings', icon: Calendar, label: 'Bookings', color: 'from-amber-500 to-orange-500' },
    { href: '/client/favorites', icon: Heart, label: 'Favorites', color: 'from-red-500 to-pink-500' },
    { href: '/client/profile', icon: User, label: 'Profile', color: 'from-emerald-500 to-teal-500' },
  ];

  const escortNav = [
    { href: '/escort/dashboard', icon: Home, label: 'Home', color: 'from-purple-500 to-indigo-500' },
    { href: '/escort/bookings', icon: Calendar, label: 'Bookings', color: 'from-amber-500 to-orange-500' },
    { href: '/escort/media', icon: Image, label: 'Media', color: 'from-fuchsia-500 to-pink-500' },
    { href: '/escort/chat', icon: MessageSquare, label: 'Chat', color: 'from-cyan-500 to-blue-500' },
    { href: '/escort/profile', icon: User, label: 'Profile', color: 'from-emerald-500 to-teal-500' },
  ];

  const navItems = userType === 'escort' ? escortNav : clientNav;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Safe Area Top - For iPhone Notch */}
      <div className="fixed top-0 left-0 right-0 z-[60] md:hidden h-safe-area-top bg-background" />

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden pt-safe-area-top backdrop-blur-2xl bg-gradient-to-b from-background/98 to-background/90 border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Movo</span>
          </Link>

          <div className="flex items-center gap-2">
            {rightAction}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu(!showMoreMenu);
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/5 touch-manipulation"
              >
                {showMoreMenu ? (
                  <X className="w-5 h-5 text-white/80" />
                ) : (
                  <MoreHorizontal className="w-5 h-5 text-white/80" />
                )}
              </button>

              {/* More Menu - Bottom Sheet Style for Native Feel */}
              {showMoreMenu && (
                <div className="absolute right-0 top-14 w-64 bg-gradient-to-b from-purple-950/98 to-background border border-purple-500/20 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 animate-in slide-in-from-top-2 duration-200">
                  {userType === 'escort' ? (
                    <>
                      <Link href="/escort/notifications" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 px-4 py-4 hover:bg-purple-500/20 active:bg-purple-500/30 transition-colors border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                          <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white/90 font-medium">Notifications</span>
                          <p className="text-white/40 text-xs">View alerts</p>
                        </div>
                      </Link>
                      <Link href="/escort/media" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 px-4 py-4 hover:bg-purple-500/20 active:bg-purple-500/30 transition-colors border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <Image className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white/90 font-medium">Media Gallery</span>
                          <p className="text-white/40 text-xs">Photos & Videos</p>
                        </div>
                      </Link>
                      <Link href="/escort/help" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 px-4 py-4 hover:bg-purple-500/20 active:bg-purple-500/30 transition-colors border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white/90 font-medium">Help & Support</span>
                          <p className="text-white/40 text-xs">Get assistance</p>
                        </div>
                      </Link>
                      <Link href="/escort/security" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 px-4 py-4 hover:bg-purple-500/20 active:bg-purple-500/30 transition-colors border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white/90 font-medium">Security</span>
                          <p className="text-white/40 text-xs">Password & 2FA</p>
                        </div>
                      </Link>
                      <Link href="/escort/settings" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 px-4 py-4 hover:bg-purple-500/20 active:bg-purple-500/30 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white/90 font-medium">Settings</span>
                          <p className="text-white/40 text-xs">App preferences</p>
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/client/notifications" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 px-4 py-4 hover:bg-purple-500/20 active:bg-purple-500/30 transition-colors border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                          <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white/90 font-medium">Notifications</span>
                          <p className="text-white/40 text-xs">View alerts</p>
                        </div>
                      </Link>
                      <Link href="/client/search" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 px-4 py-4 hover:bg-purple-500/20 active:bg-purple-500/30 transition-colors border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                          <Search className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white/90 font-medium">Search</span>
                          <p className="text-white/40 text-xs">Find escorts</p>
                        </div>
                      </Link>
                      <Link href="/client/settings" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 px-4 py-4 hover:bg-purple-500/20 active:bg-purple-500/30 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-white/90 font-medium">Settings</span>
                          <p className="text-white/40 text-xs">App preferences</p>
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Title if provided */}
      {title ? (
        <div className="pt-20 md:pt-0 px-4 py-3 md:hidden">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{title}</h1>
        </div>
      ) : null}

      {/* Main Content with Safe Area */}
      <main className="pt-14 md:pt-0 pt-safe-area-top">
        {children}
      </main>

      {/* Safe Area Bottom - For iPhone Home Indicator */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden h-safe-area-bottom bg-background" />

      {/* Mobile Bottom Navigation */}
      {showBottomNav ? (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe-area-bottom backdrop-blur-2xl bg-gradient-to-t from-background/98 to-background/90 border-t border-white/5">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 active:scale-90 ${isActive
                    ? 'text-purple-400'
                    : 'text-white/40 hover:text-white/70'
                    }`}
                >
                  {isActive ? (
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <item.icon className="w-5 h-5 text-purple-400" />
                    </div>
                  ) : (
                    <item.icon className="w-5 h-5 mb-1" />
                  )}
                  <span className={`text-xs font-medium ${isActive ? 'text-purple-400' : 'text-white/50'}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
