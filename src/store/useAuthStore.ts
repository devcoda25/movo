import { create } from 'zustand';
import { User, UserType } from '@/types';
import {
    auth,
    COLLECTIONS,
    getDocument,
    createDocument,
    updateDocument,
    onAuthChange,
    subscribeToCollection
} from '@/lib/firebase';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Auth functions
    checkAuth: () => void;
    login: (email: string, password: string) => Promise<void>;
    loginWithPhone: (phone: string, password: string) => Promise<void>;
    signup: (email: string, password: string, userData: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
    updateUserData: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    checkAuth: () => {
        onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                // Try to get user by UID first
                let userData = await getDocument(COLLECTIONS.USERS, firebaseUser.uid);
                
                // If not found by UID, try to find by email
                if (!userData && firebaseUser.email) {
                    const { db } = await import('@/lib/firebase');
                    const { collection, query, where, getDocs, doc, setDoc, deleteDoc } = await import('firebase/firestore');
                    const emailQuery = query(collection(db, COLLECTIONS.USERS), where('email', '==', firebaseUser.email));
                    const snapshot = await getDocs(emailQuery);
                    if (!snapshot.empty) {
                        const existingDoc = snapshot.docs[0];
                        const docData = existingDoc.data();
                        // Remove old id and set to auth UID
                        const { id: _oldId, ...rest } = docData as Record<string, unknown>;
                        userData = { 
                            id: firebaseUser.uid, 
                            ...rest
                        } as User;
                        
                        // Migrate document to new UID if needed
                        if (existingDoc.id !== firebaseUser.uid) {
                            await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), userData);
                            await deleteDoc(doc(db, COLLECTIONS.USERS, existingDoc.id));
                        }
                    }
                }
                
                if (userData) {
                    set({
                        user: userData as User,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } else {
                    // Create user document if doesn't exist
                    const newUser: Partial<User> = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        phone: firebaseUser.phoneNumber || '',
                        fullName: firebaseUser.displayName || '',
                        dateOfBirth: '',
                        userType: 'client', // Default type
                        location: '',
                        profilePhoto: firebaseUser.photoURL || '',
                        bio: '',
                        isVerified: false,
                    };
                    await createDocument(COLLECTIONS.USERS, firebaseUser.uid, newUser);
                    set({
                        user: { ...newUser, createdAt: new Date(), updatedAt: new Date() } as User,
                        isAuthenticated: true,
                        isLoading: false
                    });
                }
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        });
    },

    login: async (email: string, password: string) => {
        const { signInWithEmail, updateUserProfile } = await import('@/lib/firebase');
        set({ isLoading: true, error: null });
        try {
            const result = await signInWithEmail(email, password);
            const authUid = result.user.uid;
            
            // First, check if there's a document with this email in Firestore
            const { db, COLLECTIONS } = await import('@/lib/firebase');
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const emailQuery = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
            const emailSnapshot = await getDocs(emailQuery);
            
            let userData = null;
            
            if (!emailSnapshot.empty) {
                // Use the existing document data
                const doc = emailSnapshot.docs[0];
                const docData = doc.data();
                userData = { 
                    id: authUid, 
                    ...docData,
                } as User;
                
                // If the document ID is different from auth UID, migrate it
                if (doc.id !== authUid) {
                    const { doc: docFunc, setDoc, deleteDoc } = await import('firebase/firestore');
                    await setDoc(docFunc(db, COLLECTIONS.USERS, authUid), userData);
                    await deleteDoc(docFunc(db, COLLECTIONS.USERS, doc.id));
                }
            }
            
            console.log('Login userData:', userData);
            
            if (userData) {
                set({
                    user: userData as User,
                    isAuthenticated: true,
                    isLoading: false
                });
            } else {
                throw new Error('User data not found');
            }
        } catch (error: any) {
            set({
                error: error.message || 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    loginWithPhone: async (phone: string, password: string) => {
        // Phone login would require additional setup with Firebase
        // For MVP, we'll use email-based login
        set({ error: 'Phone login not configured. Please use email login.' });
        throw new Error('Phone login not configured');
    },

    signup: async (email: string, password: string, userData: Partial<User>) => {
        const { signUpWithEmail, updateUserProfile } = await import('@/lib/firebase');
        set({ isLoading: true, error: null });
        try {
            const result = await signUpWithEmail(email, password);

            // Update Firebase user profile
            if (userData.fullName) {
                await updateUserProfile(result.user, {
                    displayName: userData.fullName,
                    photoURL: userData.profilePhoto || ''
                });
            }

            // Create user document in Firestore
            const newUser: Partial<User> = {
                id: result.user.uid,
                email: result.user.email,
                phone: userData.phone || '',
                fullName: userData.fullName || '',
                dateOfBirth: userData.dateOfBirth || '',
                userType: 'client', // Default type
                gender: userData.gender || 'prefer_not_to_say',
                location: userData.location || '',
                profilePhoto: userData.profilePhoto || '',
                bio: userData.bio || '',
                isVerified: false,
            };

            await createDocument(COLLECTIONS.USERS, result.user.uid, newUser);

            set({
                user: { ...newUser, createdAt: new Date(), updatedAt: new Date() } as User,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.message || 'Signup failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: async () => {
        const { signOut: firebaseSignOut, auth } = await import('@/lib/firebase');
        set({ isLoading: true });
        try {
            // Force sign out and clear any persisted state
            await firebaseSignOut();
            // Clear local storage to ensure fresh state
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
            }
            set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Logout failed',
                isLoading: false
            });
            throw error;
        }
    },

    updateUserData: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
            await updateDocument(COLLECTIONS.USERS, user.id, data);
            set({
                user: { ...user, ...data },
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.message || 'Update failed',
                isLoading: false
            });
            throw error;
        }
    },
}));
