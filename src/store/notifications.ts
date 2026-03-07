import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'chat' | 'review' | 'verification' | 'system';
  read: boolean;
  data?: Record<string, any>;
  createdAt: any;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  
  // Actions
  fetchNotifications: (userId: string) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: (userId: string) => {
    set({ loading: true });
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({ notifications, unreadCount, loading: false });
    });

    return () => unsubscribe();
  },

  markAsRead: async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  addNotification: async (notification) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        ...notification,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        deleted: true
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }
}));

// Push Notification Service (Web-based using Firebase Cloud Messaging)
class PushNotificationService {
  private messaging: any = null;
  private token: string | null = null;

  async initialize() {
    if (typeof window === 'undefined') return;
    
    try {
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
      const { app } = await import('@/lib/firebase');
      
      this.messaging = getMessaging(app);
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.token = await getToken(this.messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        // Listen for foreground messages
        onMessage(this.messaging, (payload: any) => {
          console.log('Foreground message:', payload);
          // Show in-app notification
          this.showLocalNotification(payload);
        });
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private showLocalNotification(payload: any) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: payload.messageId,
        data: payload.data
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        // Navigate based on notification data
        if (payload.data?.route) {
          window.location.href = payload.data.route;
        }
        notification.close();
      };
    }
  }

  async saveTokenToFirestore(userId: string) {
    if (!this.token) return;
    
    try {
      const tokenRef = doc(db, 'fcmTokens', userId);
      await updateDoc(tokenRef, {
        token: this.token,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  getToken() {
    return this.token;
  }
}

export const pushNotificationService = new PushNotificationService();
