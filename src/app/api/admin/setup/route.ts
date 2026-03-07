import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const { email, uid } = await request.json();

        // Create admin user document
        await setDoc(doc(db, 'users', uid), {
            email,
            fullName: 'Admin',
            userType: 'admin',
            location: 'Kampala',
            profilePhoto: '',
            bio: 'Platform Administrator',
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Admin created successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Admin setup endpoint. POST with { email, uid } to create admin user.'
    });
}
