import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Only initialize if all required env vars are present
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin not initialized: Missing environment variables');
  } else {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

    console.log('Initializing Firebase Admin with:');
    console.log('  Project ID:', projectId);
    console.log('  Storage Bucket:', storageBucket);
    console.log('  Client Email:', clientEmail);

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: storageBucket,
    });

    console.log('Firebase Admin initialized successfully');
  }
}

export const adminDb = admin.apps.length ? getFirestore() : null;
export const storage = admin.apps.length ? getStorage() : null;
