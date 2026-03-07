import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase/auth';

// Helper to verify admin user
async function verifyAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return { isAdmin: false, userId: null };
  
  try {
    const token = authHeader.replace('Bearer ', '');
    // In production, verify Firebase ID token properly
    // For now, we'll check if the token contains 'admin' or is the admin UID
    const isAdmin = token.includes('admin') || token === 'admin-user';
    return { isAdmin, userId: token };
  } catch {
    return { isAdmin: false, userId: null };
  }
}

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    SERVICES: 'services',
    ESCORT_PROFILES: 'escort_profiles',
    BOOKINGS: 'bookings',
    NOTIFICATIONS: 'notifications',
    CHATS: 'conversations',
    MESSAGES: 'messages',
    LOCATIONS: 'locations',
} as const;

// Seed data for clients
const clients = [
    { id: 'client1', fullName: 'John Doe', email: 'john@test.com', phone: '+256701111111', location: 'Kampala', userType: 'client', isVerified: true },
    { id: 'client2', fullName: 'Jane Smith', email: 'jane@test.com', phone: '+256702222222', location: 'Entebbe', userType: 'client', isVerified: true },
    { id: 'client3', fullName: 'Mike Johnson', email: 'mike@test.com', phone: '+256703333333', location: 'Jinja', userType: 'client', isVerified: true },
    { id: 'client4', fullName: 'Sarah Wilson', email: 'sarah@test.com', phone: '+256704444444', location: 'Mbarara', userType: 'client', isVerified: true },
    { id: 'client5', fullName: 'David Brown', email: 'david@test.com', phone: '+256705555555', location: 'Gulu', userType: 'client', isVerified: true },
];

// Seed data for escorts
const escorts = [
    { id: 'escort1', fullName: 'Diamond', email: 'diamond@test.com', phone: '+256701234567', location: 'Kampala', userType: 'escort', isVerified: true, bio: 'Premium companion for discerning gentlemen' },
    { id: 'escort2', fullName: 'Princess', email: 'princess@test.com', phone: '+256701234568', location: 'Entebbe', userType: 'escort', isVerified: true, bio: 'Your perfect dinner date companion' },
    { id: 'escort3', fullName: 'Rose', email: 'rose@test.com', phone: '+256701234569', location: 'Kampala', userType: 'escort', isVerified: true, bio: 'Exotic beauty with passion' },
    { id: 'escort4', fullName: 'Jasmine', email: 'jasmine@test.com', phone: '+256701234570', location: 'Jinja', userType: 'escort', isVerified: true, bio: 'Relaxed and friendly companion' },
    { id: 'escort5', fullName: 'Luna', email: 'luna@test.com', phone: '+256701234571', location: 'Kampala', userType: 'escort', isVerified: true, bio: 'Charming and sophisticated' },
    { id: 'escort6', fullName: 'Sofia', email: 'sofia@test.com', phone: '+256701234572', location: 'Mbarara', userType: 'escort', isVerified: false, bio: 'New to modeling, eager to please' },
    { id: 'escort7', fullName: 'Maya', email: 'maya@test.com', phone: '+256701234573', location: 'Kampala', userType: 'escort', isVerified: true, bio: 'Classy and elegant' },
    { id: 'escort8', fullName: 'Chloe', email: 'chloe@test.com', phone: '+256701234574', location: 'Gulu', userType: 'escort', isVerified: true, bio: 'Adventure seeker and fun companion' },
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

// Seed data for locations (Uganda)
const locations = [
    // Kampala Region
    { id: 'loc1', name: 'Kampala Central', region: 'Kampala', isActive: true },
    { id: 'loc2', name: 'Nakasero', region: 'Kampala', isActive: true },
    { id: 'loc3', name: 'Kololo', region: 'Kampala', isActive: true },
    { id: 'loc4', name: 'Nalubaale', region: 'Kampala', isActive: true },
    { id: 'loc5', name: 'Kisenyi', region: 'Kampala', isActive: true },
    { id: 'loc6', name: 'Mengo', region: 'Kampala', isActive: true },
    { id: 'loc7', name: 'Kawempe', region: 'Kampala', isActive: true },
    { id: 'loc8', name: 'Makerere', region: 'Kampala', isActive: true },
    // Wakiso Region
    { id: 'loc9', name: 'Ntinda', region: 'Wakiso', isActive: true },
    { id: 'loc10', name: 'Kisasi', region: 'Wakiso', isActive: true },
    { id: 'loc11', name: 'Kyaliwajala', region: 'Wakiso', isActive: true },
    { id: 'loc12', name: 'Namugongo', region: 'Wakiso', isActive: true },
    { id: 'loc13', name: 'Seeta', region: 'Wakiso', isActive: true },
    { id: 'loc14', name: 'Mukono Town', region: 'Wakiso', isActive: true },
    // Entebbe Region
    { id: 'loc15', name: 'Entebbe Central', region: 'Entebbe', isActive: true },
    { id: 'loc16', name: 'Kajjansi', region: 'Entebbe', isActive: true },
    { id: 'loc17', name: 'Luwafu', region: 'Entebbe', isActive: true },
    { id: 'loc18', name: 'Ssunga', region: 'Entebbe', isActive: true },
    // Jinja Region
    { id: 'loc19', name: 'Jinja Central', region: 'Jinja', isActive: true },
    { id: 'loc20', name: 'Bugembe', region: 'Jinja', isActive: true },
    { id: 'loc21', name: 'Njeru', region: 'Jinja', isActive: true },
    // Mbarara Region
    { id: 'loc22', name: 'Mbarara Central', region: 'Mbarara', isActive: true },
    { id: 'loc23', name: 'Rwizi', region: 'Mbarara', isActive: true },
    // Gulu Region
    { id: 'loc24', name: 'Gulu Central', region: 'Gulu', isActive: true },
    { id: 'loc25', name: 'Lira', region: 'Lira', isActive: true },
];

export async function POST(request: NextRequest) {
    try {
        // Verify admin user
        const { isAdmin } = await verifyAdminUser(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
        }
        // Seed clients
        for (const client of clients) {
            await adminDb.collection(COLLECTIONS.USERS).doc(client.id).set({
                ...client,
                profilePhoto: '',
                bio: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Seed escorts
        for (const escort of escorts) {
            await adminDb.collection(COLLECTIONS.USERS).doc(escort.id).set({
                ...escort,
                profilePhoto: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Seed services
        for (const service of services) {
            await adminDb.collection(COLLECTIONS.SERVICES).doc(service.id).set({
                ...service,
                createdAt: new Date(),
            });
        }

        // Seed bookings
        for (const booking of bookings) {
            await adminDb.collection(COLLECTIONS.BOOKINGS).doc(booking.id).set({
                ...booking,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Seed locations
        for (const location of locations) {
            await adminDb.collection(COLLECTIONS.LOCATIONS).doc(location.id).set({
                ...location,
                createdAt: new Date(),
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Seed data created successfully!',
            seeded: {
                clients: clients.length,
                escorts: escorts.length,
                services: services.length,
                bookings: bookings.length,
                locations: locations.length,
            }
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error', stack: error.stack }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Seed endpoint. POST to seed dummy data.',
        data: {
            clients: 5,
            escorts: 8,
            services: 17,
            bookings: 5,
        }
    });
}
