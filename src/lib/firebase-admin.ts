import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-5774129835-63da4';
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
  
  console.log('Initializing Firebase Admin with:');
  console.log('  Project ID:', projectId);
  console.log('  Storage Bucket:', storageBucket);
  console.log('  Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle the private key - replace escaped newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: storageBucket,
  });
  
  console.log('Firebase Admin initialized successfully');
}

export const adminDb = getFirestore();
export const storage = getStorage();
