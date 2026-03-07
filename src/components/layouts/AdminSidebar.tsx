'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, BarChart3, Users, Calendar, Settings, LogOut, UserCheck, Star, TrendingUp, MessageCircle, Shield, Menu, X, Bell, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface AdminSidebarProps {
  onLogout?: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { href: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/admin/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/admin/escorts', icon: Users, label: 'Escorts' },
    { href: '/admin/clients', icon: UserCheck, label: 'Clients' },
    { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/admin/reviews', icon: Star, label: 'Reviews' },
    { href: '/admin/services', icon: Sparkles, label: 'Services' },
    { href: '/admin/locations', icon: MapPin, label: 'Locations' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-2xl border-b border-slate-700/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMobileMenu(true)}
                className="p-2 -ml-2 hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Movo</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-1">
              <Link 
                href="/admin/messages"
                className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors relative"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile Slide-in Menu */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-[60]">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-slate-700/50 p-4 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Admin Panel</p>
                    <p className="text-slate-400 text-xs">Management Console</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-slate-700/50 rounded-xl"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all w-full mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-700/50 px-2 py-2 z-40">
          <div className="flex items-center justify-around">
            {[
              { href: '/admin/dashboard', icon: BarChart3, label: 'Home' },
              { href: '/admin/messages', icon: MessageCircle, label: 'Msg' },
              { href: '/admin/escorts', icon: Users, label: 'Escorts' },
              { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
            ].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Spacer for fixed header/bottom nav */}
        <div className="h-20" />
      </>
    );
  }

  // Desktop Layout
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white/5 border-r border-white/5 backdrop-blur-2xl p-6 flex flex-col z-40">
      <Link href="/admin/dashboard" className="flex items-center gap-3 mb-10">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">Movo</span>
      </Link>

      <div className="text-xs uppercase tracking-wider text-white/30 mb-4">Main</div>
      <nav className="space-y-1 mb-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-6 space-y-2 mt-auto">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all w-full">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
