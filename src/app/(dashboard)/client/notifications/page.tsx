'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Bell, Loader2, Check, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: any;
}

export default function ClientNotifications() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Redirect escorts to their own notifications
    if (!isLoading && user?.userType === 'escort') {
      router.push('/escort/notifications');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      setIsLoadingData(true);
      try {
        const userId = (user as any).id || (user as any).uid;
        if (!userId) {
          setNotifications([]);
          return;
        }
        
        const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
        const q = query(notificationsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        
        const notificationsData: Notification[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          notificationsData.push({
            id: doc.id,
            title: data.title || 'Notification',
            message: data.message || '',
            type: data.type || 'info',
            isRead: data.isRead || false,
            createdAt: data.createdAt,
          });
        });
        
        // Sort by date
        notificationsData.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchNotifications();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/20 text-green-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-primary/20 text-primary';
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <MobileLayout userType="client">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-white">Notifications</h1>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Notifications</h3>
            <p className="text-white/40">Your notifications will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`bg-white/5 rounded-3xl p-4 border ${notification.isRead ? 'border-white/5' : 'border-primary/30'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                    {notification.type === 'success' ? <Check className="w-5 h-5" /> : 
                     notification.type === 'error' ? <X className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{notification.title}</h4>
                      <span className="text-xs text-white/40">{formatDate(notification.createdAt)}</span>
                    </div>
                    <p className="text-sm text-white/60 mt-1">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
