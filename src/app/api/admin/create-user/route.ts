import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin initialization
let auth: any = null;
let db: any = null;

const getFirebaseAdmin = async () => {
  if (auth && db) return { auth, db };
  
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');
  
  if (!getApps().length) {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    initializeApp({
      credential: cert(serviceAccount as any),
    });
  }
  
  auth = getAuth();
  db = getFirestore();
  
  return { auth, db };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, phone, location, dateOfBirth, userType, bio } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password length (Firebase requires at least 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const { auth: firebaseAuth, db: firebaseDb } = await getFirebaseAdmin();
    
    let userRecord;
    try {
      userRecord = await firebaseAuth.createUser({
        email,
        password,
        displayName: username || email.split('@')[0], // Use username or fallback to email prefix
        phoneNumber: phone || undefined,
      });
    } catch (authError: any) {
      // If user already exists in auth, get the record
      if (authError.code === 'auth/email-already-exists' || authError.message?.includes('already exists')) {
        userRecord = await firebaseAuth.getUserByEmail(email);
      } else {
        throw authError;
      }
    }

    // Create user document in Firestore
    await firebaseDb.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      fullName: username || '', // Store as username
      phone: phone || '',
      location: location || '',
      dateOfBirth: dateOfBirth || '',
      userType: userType || 'client',
      bio: bio || '',
      isVerified: userType === 'escort',
      profilePhoto: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      userId: userRecord.uid,
      message: 'User created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
