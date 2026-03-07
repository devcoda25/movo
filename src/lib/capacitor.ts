// Capacitor utilities for native mobile features
// This file provides wrappers for Capacitor plugins

/**
 * Check if running in Capacitor
 */
export const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

/**
 * Get platform (ios, android, or web)
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (typeof window === 'undefined') return 'web';
  const platform = (window as any).Capacitor?.getPlatform?.();
  return platform || 'web';
};

/**
 * Initialize Capacitor Push Notifications
 * Call this when the app starts to register for push notifications
 */
export const initPushNotifications = async (): Promise<{ token: string | null; error: any }> => {
  if (!isCapacitor()) {
    console.log('[Capacitor] Not running in Capacitor, skipping push init');
    return { token: null, error: 'Not in Capacitor' };
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    // Check permission
    let permissionGranted = await (PushNotifications as any).checkPermissions();
    
    if (permissionGranted.receive !== 'granted') {
      permissionGranted = await (PushNotifications as any).requestPermissions();
      
      if (permissionGranted.receive !== 'granted') {
        console.log('[Capacitor] Push notification permission not granted');
        return { token: null, error: 'Permission denied' };
      }
    }
    
    // Register for push notifications
    await (PushNotifications as any).register();
    
    // Get the token
    return new Promise((resolve) => {
      (PushNotifications as any).addListener('registration', (token: any) => {
        console.log('[Capacitor] Push registration success:', token.value);
        resolve({ token: token.value, error: null });
      });
      
      (PushNotifications as any).addListener('registrationError', (error: any) => {
        console.error('[Capacitor] Push registration error:', error);
        resolve({ token: null, error });
      });
    });
  } catch (error) {
    console.error('[Capacitor] Push init error:', error);
    return { token: null, error };
  }
};

/**
 * Initialize Local Notifications
 */
export const initLocalNotifications = async (): Promise<void> => {
  if (!isCapacitor()) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await (LocalNotifications as any).requestPermissions();
    console.log('[Capacitor] Local notifications initialized');
  } catch (error) {
    console.error('[Capacitor] Local notifications init error:', error);
  }
};

/**
 * Show a local notification
 */
export const showLocalNotification = async (
  title: string, 
  body: string, 
  id: string = Date.now().toString()
): Promise<void> => {
  if (!isCapacitor()) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await (LocalNotifications as any).schedule({
      notifications: [
        {
          id: parseInt(id),
          title,
          body,
          iconColor: '#7C3AED',
        },
      ],
    });
  } catch (error) {
    console.error('[Capacitor] Show notification error:', error);
  }
};

/**
 * Trigger haptic feedback
 */
export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> => {
  if (!isCapacitor()) return;

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }[style];
    
    await (Haptics as any).impact({ style: impactStyle });
  } catch (error) {
    // Haptics not supported
  }
};

/**
 * Set status bar style
 */
export const setStatusBarStyle = async (style: 'light' | 'dark' = 'light'): Promise<void> => {
  if (!isCapacitor()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const statusBarStyle = style === 'light' ? Style.Light : Style.Dark;
    await (StatusBar as any).setStyle({ style: statusBarStyle });
    await (StatusBar as any).setBackgroundColor({ color: '#7C3AED' });
  } catch (error) {
    console.error('[Capacitor] Status bar error:', error);
  }
};

/**
 * Hide keyboard
 */
export const hideKeyboard = async (): Promise<void> => {
  if (!isCapacitor()) return;

  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    await (Keyboard as any).hide();
  } catch (error) {
    // Keyboard not available
  }
};
