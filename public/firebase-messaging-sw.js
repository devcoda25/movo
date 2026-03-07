// Firebase Messaging Service Worker
// This file handles push notifications from Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
    apiKey: "AIzaSyCvzXLV41lUtMxyvYdybIDuKe2Dlu-B5t4",
    authDomain: "studio-5774129835-63da4.firebaseapp.com",
    projectId: "studio-5774129835-63da4",
    storageBucket: "studio-5774129835-63da4.firebasestorage.app",
    messagingSenderId: "68326873551",
    appId: "1:68326873551:web:c3f0aa66a74469cf49daba"
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: payload.data?.tag || 'movo-notification',
        data: payload.data,
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Handle notification click - navigate to the appropriate page
    const data = event.notification.data || {};
    const urlToOpen = data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // If no window is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle push events (for when app is in foreground)
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push event received:', event);

    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New update',
            icon: '/logo.png',
            badge: '/logo.png',
            data: data.data
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Movo', options)
        );
    }
});

console.log('[firebase-messaging-sw.js] Service Worker loaded');
