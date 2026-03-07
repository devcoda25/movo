import { create } from 'zustand';
import { Notification } from '@/types';
import {
  COLLECTIONS,
  createDocument,
  updateDocument,
  subscribeToCollection,
  query,
  where,
  orderBy
} from '@/lib/firebase';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  unsubscribe: (() => void) | null;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
  createNotification: (userId: string, title: string, message: string, type: Notification['type']) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  unsubscribe: null,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notification) => {
    const { notifications, unreadCount } = get();
    set({
      notifications: [notification, ...notifications],
      unreadCount: notification.isRead ? unreadCount : unreadCount + 1
    });
  },

  markAsRead: async (notificationId: string) => {
    const { notifications } = get();
    try {
      await updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, { isRead: true });
      const updatedNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      set({ notifications: updatedNotifications, unreadCount });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(n =>
          updateDocument(COLLECTIONS.NOTIFICATIONS, n.id, { isRead: true })
        )
      );
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      set({ notifications: updatedNotifications, unreadCount: 0 });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  subscribeToNotifications: (userId: string) => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }

    // Simple query without orderBy to avoid index requirement
    const constraints = [
      where('userId', '==', userId),
    ];

    const unsubscribeFn = subscribeToCollection(
      COLLECTIONS.NOTIFICATIONS,
      constraints,
      (data) => {
        // Sort manually in JavaScript
        const sorted = [...data].sort((a, b) =>
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        set({ notifications: sorted as Notification[], isLoading: false });
      }
    );

    set({ unsubscribe: unsubscribeFn, isLoading: true });
  },

  unsubscribeFromNotifications: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, notifications: [], unreadCount: 0 });
    }
  },

  createNotification: async (userId: string, title: string, message: string, type: Notification['type']) => {
    try {
      const notificationId = `${userId}_${Date.now()}`;
      await createDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
        userId,
        title,
        message,
        type,
        isRead: false,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },
}));
