'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  BarChart3, Users, Calendar, Settings, LogOut, UserCheck, Star, 
  TrendingUp, MessageCircle, Sparkles, Menu, X, Bell, ChevronRight,
  Shield, Search, MoreVertical
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminMobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export default function AdminMobileLayout({ children, showBottomNav = true }: AdminMobileLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const navItems = [
    { href: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/admin/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/admin/escorts', icon: Users, label: 'Escorts' },
    { href: '/admin/clients', icon: UserCheck, label: 'Clients' },
    { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/admin/reviews', icon: Star, label: 'Reviews' },
    { href: '/admin/services', icon: Sparkles, label: 'Services' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMenu(true)}
              className="p-2 -ml-2 hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Movo Admin</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <Search className="w-5 h-5 text-slate-300" />
            </button>
            <Link 
              href="/admin/messages"
              className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <button className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search users, bookings..."
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4 pb-24">
        {children}
      </main>

      {/* Slide-in Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-[60]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-slate-700/50 p-4 animate-in slide-in-from-left">
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
                onClick={() => setShowMenu(false)}
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
                    onClick={() => setShowMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-slate-700/50 pt-4 mt-4 space-y-1">
              <Link 
                href="/admin/services"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>

            {/* Admin Info */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {user?.fullName?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user?.fullName || 'Admin'}</p>
                    <p className="text-slate-400 text-xs">Super Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-700/50 px-2 py-2 z-40">
          <div className="flex items-center justify-around">
            {[
              { href: '/admin/dashboard', icon: BarChart3, label: 'Home' },
              { href: '/admin/messages', icon: MessageCircle, label: 'Messages' },
              { href: '/admin/escorts', icon: Users, label: 'Escorts' },
              { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
            ].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors ${
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
      )}
    </div>
  );
}
