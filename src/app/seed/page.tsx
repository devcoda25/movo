'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db, COLLECTIONS, auth } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Database, Loader2, Check, ArrowRight, User, Lock, Mail, Phone } from 'lucide-react';

// Seed data for clients
const clients = [
    { id: 'client1', fullName: 'John Doe', email: 'john@test.com', phone: '+256701111111', location: 'Kampala', userType: 'client', isVerified: true },
    { id: 'client2', fullName: 'Jane Smith', email: 'jane@test.com', phone: '+256702222222', location: 'Entebbe', userType: 'client', isVerified: true },
    { id: 'client3', fullName: 'Mike Johnson', email: 'mike@test.com', phone: '+256703333333', location: 'Jinja', userType: 'client', isVerified: true },
    { id: 'client4', fullName: 'Sarah Wilson', email: 'sarah@test.com', phone: '+256704444444', location: 'Mbarara', userType: 'client', isVerified: true },
    { id: 'client5', fullName: 'David Brown', email: 'david@test.com', phone: '+256705555555', location: 'Gulu', userType: 'client', isVerified: true },
];

// Seed data for escorts with photos
const escorts = [
    { id: 'escort1', fullName: 'Diamond', email: 'diamond@test.com', phone: '+256701234567', location: 'Kampala', userType: 'escort', isVerified: true, bio: 'Premium companion for discerning gentlemen. I provide exceptional companionship services with discretion and professionalism. Whether you need a dinner date, travel companion, or someone to share special moments with, I ensure an unforgettable experience.', rating: 4.9, reviews: 28, hourlyRate: 150000, services: ['Dinner Date', 'Couples', 'Threesome', 'Live Shows', 'Webcam Sex'], profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', photos: [{id: 'p1', type: 'photo', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'}, {id: 'p2', type: 'photo', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800'}, {id: 'p3', type: 'photo', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800'}], videos: [] },
    { id: 'escort2', fullName: 'Princess', email: 'princess@test.com', phone: '+256701234568', location: 'Entebbe', userType: 'escort', isVerified: true, bio: 'Your perfect dinner date companion. I love going out and making memories.', rating: 4.8, reviews: 15, hourlyRate: 120000, services: ['Webcam Sex', 'Live Shows', 'Dinner Date'], profilePhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', photos: [{id: 'p1', type: 'photo', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800'}, {id: 'p2', type: 'photo', url: 'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=800'}], videos: [] },
    { id: 'escort3', fullName: 'Rose', email: 'rose@test.com', phone: '+256701234569', location: 'Kampala', userType: 'escort', isVerified: true, bio: 'Exotic beauty with passion. I bring excitement and adventure to every encounter.', rating: 5.0, reviews: 42, hourlyRate: 180000, services: ['Couples', 'Threesome', 'BDSM'], profilePhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400', photos: [{id: 'p1', type: 'photo', url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800'}, {id: 'p2', type: 'photo', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800'}, {id: 'p3', type: 'photo', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800'}], videos: [] },
    { id: 'escort4', fullName: 'Jasmine', email: 'jasmine@test.com', phone: '+256701234570', location: 'Jinja', userType: 'escort', isVerified: true, bio: 'Relaxed and friendly companion. I am here to make your day special and memorable.', rating: 4.7, reviews: 19, hourlyRate: 100000, services: ['Dinner Date', 'French Kissing', 'Live Shows'], profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', photos: [{id: 'p1', type: 'photo', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'}, {id: 'p2', type: 'photo', url: 'https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=800'}], videos: [] },
    { id: 'escort5', fullName: 'Luna', email: 'luna@test.com', phone: '+256701234571', location: 'Kampala', userType: 'escort', isVerified: true, bio: 'Charming and sophisticated. I provide elite companionship for distinguished gentlemen.', rating: 4.9, reviews: 33, hourlyRate: 200000, services: ['BDSM', 'Stripping', 'Deep Throat'], profilePhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400', photos: [{id: 'p1', type: 'photo', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800'}, {id: 'p2', type: 'photo', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800'}, {id: 'p3', type: 'photo', url: 'https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=800'}], videos: [] },
    { id: 'escort6', fullName: 'Sofia', email: 'sofia@test.com', phone: '+256701234572', location: 'Mbarara', userType: 'escort', isVerified: false, bio: 'New to modeling, eager to please. I am excited to meet new people and explore.', rating: 4.6, reviews: 12, hourlyRate: 80000, services: ['Dinner Date', 'Handjob'], profilePhoto: 'https://images.unsplash.com/photo-1521119989659-a83eee488058?w=400', photos: [{id: 'p1', type: 'photo', url: 'https://images.unsplash.com/photo-1521119989659-a83eee488058?w=800'}], videos: [] },
    { id: 'escort7', fullName: 'Maya', email: 'maya@test.com', phone: '+256701234573', location: 'Kampala', userType: 'escort', isVerified: true, bio: 'Classy and elegant. I bring grace and beauty to every occasion.', rating: 4.8, reviews: 21, hourlyRate: 160000, services: ['Lesbian Shows', 'Foot Fetish', 'Couples'], profilePhoto: 'https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=400', photos: [{id: 'p1', type: 'photo', url: 'https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=800'}, {id: 'p2', type: 'photo', url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800'}], videos: [] },
    { id: 'escort8', fullName: 'Chloe', email: 'chloe@test.com', phone: '+256701234574', location: 'Gulu', userType: 'escort', isVerified: true, bio: 'Adventure seeker and fun companion. Let us explore together!', rating: 4.7, reviews: 8, hourlyRate: 90000, services: ['Couples', 'Deep Throat', 'Live Shows'], profilePhoto: 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=400', photos: [{id: 'p1', type: 'photo', url: 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=800'}, {id: 'p2', type: 'photo', url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800'}], videos: [] },
];

// Seed data for services
const services = [
    { id: 's1', name: 'Anal Sex', description: 'Anal sexual services', isActive: true },
    { id: 's2', name: 'BDSM', description: 'Bondage, Discipline, Sadism, Masochism', isActive: true },
    { id: 's3', name: 'CIM - Come In Mouth', description: 'Oral sex with ejaculation in mouth', isActive: true },
    { id: 's4', name: 'COB - Come On Body', description: 'Oral sex with ejaculation on body', isActive: true },
    { id: 's5', name: 'Couples', description: 'Services for couples', isActive: true },
    { id: 's6', name: 'Deep Throat', description: 'Deep throat oral sex', isActive: true },
    { id: 's7', name: 'Dinner Date', description: 'Companionship for dinner dates', isActive: true },
    { id: 's8', name: 'Face Sitting', description: 'Face sitting service', isActive: true },
    { id: 's9', name: 'Fisting', description: 'Fisting service', isActive: true },
    { id: 's10', name: 'Foot Fetish', description: 'Foot fetish services', isActive: true },
    { id: 's11', name: 'French Kissing', description: 'French kissing service', isActive: true },
    { id: 's12', name: 'Handjob', description: 'Handjob service', isActive: true },
    { id: 's13', name: 'Lesbian Shows', description: 'Lesbian performance shows', isActive: true },
    { id: 's14', name: 'Live Shows', description: 'Live adult shows', isActive: true },
    { id: 's15', name: 'Stripping', description: 'Striptease performance', isActive: true },
    { id: 's16', name: 'Threesome', description: 'Three-person sexual services', isActive: true },
    { id: 's17', name: 'Webcam Sex', description: 'Online webcam sexual services', isActive: true },
];

// Seed data for bookings
const bookings = [
    { id: 'b1', clientId: 'client1', escortId: 'escort1', serviceId: 's7', status: 'completed', date: '2026-03-01', time: '19:00', location: 'Kampala', notes: 'Dinner at restaurant', totalAmount: 50000 },
    { id: 'b2', clientId: 'client2', escortId: 'escort2', serviceId: 's17', status: 'completed', date: '2026-03-02', time: '20:00', location: 'Online', notes: 'Webcam session', totalAmount: 30000 },
    { id: 'b3', clientId: 'client3', escortId: 'escort3', serviceId: 's5', status: 'accepted', date: '2026-03-06', time: '21:00', location: 'Entebbe', notes: 'Couples night', totalAmount: 80000 },
    { id: 'b4', clientId: 'client4', escortId: 'escort4', serviceId: 's7', status: 'pending', date: '2026-03-07', time: '18:00', location: 'Jinja', notes: 'Dinner date', totalAmount: 50000 },
    { id: 'b5', clientId: 'client5', escortId: 'escort5', serviceId: 's14', status: 'pending', date: '2026-03-08', time: '22:00', location: 'Kampala', notes: 'Private show', totalAmount: 60000 },
];

const DEFAULT_PASSWORD = 'test123456';

export default function SeedPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{success?: boolean; message?: string; seeded?: any; error?: string} | null>(null);

    const createAuthUser = async (email: string, password: string) => {
        try {
            // Try to get the user first
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, email.split('@')[0]));
            if (userDoc.exists()) {
                console.log(`User ${email} already exists in Firestore`);
                return true;
            }
            
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log(`Created auth user: ${email}`, userCredential.user.uid);
            return true;
        } catch (error: any) {
            // If user already exists, that's okay
            if (error.code === 'auth/email-already-in-use') {
                console.log(`User ${email} already exists in Auth`);
                return true;
            }
            console.error(`Error creating auth user ${email}:`, error);
            return false;
        }
    };

    const handleSeed = async () => {
        setIsLoading(true);
        setResult(null);
        
        try {
            // Create auth users for clients
            for (const client of clients) {
                await createAuthUser(client.email, DEFAULT_PASSWORD);
            }

            // Create auth users for escorts
            for (const escort of escorts) {
                await createAuthUser(escort.email, DEFAULT_PASSWORD);
            }

            // Seed clients to Firestore
            for (const client of clients) {
                await setDoc(doc(db, COLLECTIONS.USERS, client.id), {
                    ...client,
                    profilePhoto: '',
                    bio: '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            // Seed escorts with photos to Firestore
            for (const escort of escorts) {
                await setDoc(doc(db, COLLECTIONS.USERS, escort.id), {
                    ...escort,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            // Seed services
            for (const service of services) {
                await setDoc(doc(db, COLLECTIONS.SERVICES, service.id), {
                    ...service,
                    createdAt: new Date(),
                });
            }

            // Seed bookings
            for (const booking of bookings) {
                await setDoc(doc(db, COLLECTIONS.BOOKINGS, booking.id), {
                    ...booking,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            setResult({
                success: true,
                message: 'Seed data created successfully!',
                seeded: {
                    clients: clients.length,
                    escorts: escorts.length,
                    services: services.length,
                    bookings: bookings.length,
                }
            });
        } catch (error: any) {
            console.error('Seed error:', error);
            setResult({
                success: false,
                message: 'Failed to seed data',
                error: error.message || 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Database className="w-10 h-10 text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Seed Database</h1>
                    <p className="text-gray-400">Add dummy data with photos to your Firebase database</p>
                </div>

                {/* Login Credentials Info */}
                <div className="bg-white/5 rounded-2xl p-4 mb-6">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Login Credentials
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-400">Password for all:</span>
                            <span className="text-white font-mono">{DEFAULT_PASSWORD}</span>
                        </div>
                        <div className="border-t border-white/10 pt-3 mt-3">
                            <p className="text-gray-400 mb-1">Escorts:</p>
                            <p className="text-white">diamond@test.com</p>
                            <p className="text-white">princess@test.com</p>
                            <p className="text-white">rose@test.com</p>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                            <p className="text-gray-400 mb-1">Clients:</p>
                            <p className="text-white">john@test.com</p>
                            <p className="text-white">jane@test.com</p>
                        </div>
                    </div>
                </div>

                {!result ? (
                    <button
                        onClick={handleSeed}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Seeding...
                            </>
                        ) : (
                            <>
                                <Database className="w-5 h-5" />
                                Seed Data with Photos
                            </>
                        )}
                    </button>
                ) : result.success ? (
                    <div>
                        <div className="bg-green-500/20 text-green-400 p-4 rounded-xl mb-4 flex items-center gap-3">
                            <Check className="w-6 h-6" />
                            <span>{result.message}</span>
                        </div>
                        <div className="space-y-2 mb-6">
                            <p className="text-gray-300">✓ {result.seeded.clients} clients</p>
                            <p className="text-gray-300">✓ {result.seeded.escorts} escorts with photos</p>
                            <p className="text-gray-300">✓ {result.seeded.services} services</p>
                            <p className="text-gray-300">✓ {result.seeded.bookings} bookings</p>
                            <p className="text-gray-300">✓ Auth accounts created</p>
                        </div>
                        <Link
                            href="/login"
                            className="w-full py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        >
                            Go to Login
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl">
                        {result.message}
                        {result.error && (
                            <p className="text-red-300 text-sm mt-2">{result.error}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
