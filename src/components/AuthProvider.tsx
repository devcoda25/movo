'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, user, isLoading } = useAuthStore();
  const { subscribeToNotifications, unsubscribeFromNotifications } = useNotificationStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.id) {
      subscribeToNotifications(user.id);
    } else if (!isLoading) {
      unsubscribeFromNotifications();
    }
  }, [user?.id, isLoading]);

  return <>{children}</>;
}
