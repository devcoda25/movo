import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    Auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    PhoneAuthProvider,
    signInWithPhoneNumber,
    updateProfile
} from 'firebase/auth';
import {
    getFirestore,
    Firestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    QueryConstraint
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import {
    getMessaging,
    getToken,
    onMessage
} from 'firebase/messaging';

// Firebase configuration - Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase only once
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Firebase services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize messaging (only works in browser with service worker)
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
        messaging = getMessaging(app);
    } catch (error) {
        console.log('Firebase messaging not supported:', error);
    }
}

// Auth functions
export const signInWithEmail = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithPhone = async (phone: string, appVerifier: any) => {
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    return signInWithPhoneNumber(auth, phone, appVerifier);
};

export const signOut = async () => {
    return firebaseSignOut(auth);
};

export const updateUserProfile = async (user: any, profileData: { displayName?: string; photoURL?: string }) => {
    return updateProfile(user, profileData);
};

export const onAuthChange = (callback: (user: any) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Firestore helper functions
export const createDocument = async (collectionName: string, docId: string, data: any) => {
    return setDoc(doc(db, collectionName, docId), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const getDocument = async (collectionName: string, docId: string) => {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

export const getDocuments = async (collectionName: string, constraints: QueryConstraint[] = []) => {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
    const docRef = doc(db, collectionName, docId);
    return updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
};

export const deleteDocument = async (collectionName: string, docId: string) => {
    const docRef = doc(db, collectionName, docId);
    return deleteDoc(docRef);
};

export const subscribeToDocument = (collectionName: string, docId: string, callback: (data: any) => void) => {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        }
    });
};

export const subscribeToCollection = (collectionName: string, constraints: QueryConstraint[], callback: (data: any[]) => void) => {
    const q = query(collection(db, collectionName), ...constraints);
    return onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    });
};

// Storage functions
export const uploadFile = async (path: string, file: File) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

export const deleteFile = async (path: string) => {
    const storageRef = ref(storage, path);
    return deleteObject(storageRef);
};

export const getFileUrl = async (path: string) => {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
};

// Messaging functions

// Check if push notifications are supported in the browser
const isPushSupported = (): boolean => {
    if (typeof window === 'undefined') return false;
    if (!('serviceWorker' in navigator)) {
        console.log('[firebase] Service Workers not supported');
        return false;
    }
    if (!('PushManager' in window)) {
        console.log('[firebase] PushManager not supported');
        return false;
    }
    if (!('Notification' in window)) {
        console.log('[firebase] Notification API not supported');
        return false;
    }
    return true;
};

export const requestNotificationPermission = async () => {
    console.log('[firebase] requestNotificationPermission called');
    
    // Check if push notifications are supported
    if (!isPushSupported()) {
        console.log('[firebase] Push notifications not supported in this browser');
        return { supported: false, token: null };
    }
    
    if (!messaging) {
        console.log('[firebase] messaging is null - checking why...');
        // Try to reinitialize messaging
        try {
            const { getMessaging } = await import('firebase/messaging');
            const { app } = await import('@/lib/firebase');
            messaging = getMessaging(app);
            console.log('[firebase] messaging reinitialized:', messaging);
        } catch (e) {
            console.error('[firebase] Failed to reinitialize messaging:', e);
            return { supported: true, token: null, error: e };
        }
    }
    
    if (!messaging) {
        console.log('[firebase] messaging still null, cannot request permission');
        return { supported: true, token: null };
    }
    
    try {
        console.log('[firebase] Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('[firebase] Permission status:', permission);
        
        if (permission === 'granted') {
            console.log('[firebase] Permission granted, getting FCM token...');
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });
            console.log('[firebase] FCM Token received:', token);
            return { supported: true, token };
        } else {
            console.log('[firebase] Permission NOT granted:', permission);
            return { supported: true, token: null, denied: true };
        }
    } catch (error: any) {
        // Check for unsupported-browser error
        if (error?.code === 'messaging/unsupported-browser') {
            console.log('[firebase] Browser does not support FCM:', error.message);
            return { supported: false, token: null, error: 'Browser not supported' };
        }
        console.error('[firebase] Notification permission error:', error);
        return { supported: true, token: null, error };
    }
};

export const onMessageListener = (callback: (payload: any) => void) => {
    if (!messaging) return () => { };
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};

// Export Firebase instances
export { app, auth, db, storage, messaging };
export { query, where, orderBy, limit, onSnapshot, serverTimestamp };
export { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc };

// Collection names
export const COLLECTIONS = {
    USERS: 'users',
    SERVICES: 'services',
    ESCORT_PROFILES: 'escort_profiles',
    BOOKINGS: 'bookings',
    NOTIFICATIONS: 'notifications',
    CHATS: 'conversations',
    MESSAGES: 'messages',
    LOCATIONS: 'locations',
} as const;
