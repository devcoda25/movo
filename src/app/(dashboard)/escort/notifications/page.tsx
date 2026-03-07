'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Bell, Calendar, MessageSquare, Star, Trash2, Loader2 } from 'lucide-react';

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function EscortNotifications() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && user?.userType !== 'escort' && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      setIsLoadingData(true);
      try {
        const userId = user.id || (user as any).uid;
        if (!userId) {
          setNotifications([]);
          return;
        }
        
        const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
        const q = query(
          notificationsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const notificationsData: Notification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          notificationsData.push({
            id: doc.id,
            type: data.type || 'system',
            title: data.title || '',
            message: data.message || '',
            read: data.read || false,
            createdAt: data.createdAt,
          });
        });
        
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchNotifications();
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-purple-400" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = new Date(timestamp.toDate());
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-gray-400">{notifications.filter(n => !n.read).length} unread</p>
            </div>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-4 p-4 rounded-2xl ${notification.read ? 'bg-white/5' : 'bg-white/10'}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                    {notification.title}
                  </p>
                  <p className="text-gray-400 text-sm truncate">{notification.message}</p>
                  <p className="text-gray-500 text-xs mt-1">{formatTime(notification.createdAt)}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No notifications yet</h3>
            <p className="text-gray-400">You'll see booking requests, messages, and reviews here</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
