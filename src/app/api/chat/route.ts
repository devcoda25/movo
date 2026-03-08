import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Return error if Firebase Admin is not configured
if (!adminDb) {
    console.error('Firebase Admin not initialized - missing environment variables');
}

// Collection names
const COLLECTIONS = {
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
} as const;

// Helper to verify authenticated user
async function verifyUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return { isValid: false, userId: null };

    try {
        const userId = authHeader.replace('Bearer ', '');
        if (!userId || userId.length < 5) return { isValid: false, userId: null };
        return { isValid: true, userId };
    } catch {
        return { isValid: false, userId: null };
    }
}

// GET - Get conversations for a user
export async function GET(request: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    try {
        const { isValid, userId } = await verifyUser(request);
        if (!isValid || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get('userId');

        if (!userIdParam || userIdParam !== userId) {
            return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
        }

        // Get conversations where user is a participant
        const conversationsSnapshot = await adminDb
            .collection(COLLECTIONS.CONVERSATIONS)
            .where('participants', 'array-contains', userId)
            .orderBy('lastMessageAt', 'desc')
            .limit(50)
            .get();

        const conversations = conversationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ conversations });
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create or get a conversation
export async function POST(request: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    try {
        const { isValid, userId } = await verifyUser(request);
        if (!isValid || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { otherUserId } = await request.json();

        if (!otherUserId) {
            return NextResponse.json({ error: 'Other user ID required' }, { status: 400 });
        }

        // Check if conversation already exists
        const existingConv = await adminDb
            .collection(COLLECTIONS.CONVERSATIONS)
            .where('participants', '==', [userId, otherUserId].sort())
            .limit(1)
            .get();

        if (!existingConv.empty) {
            return NextResponse.json({
                conversation: { id: existingConv.docs[0].id, ...existingConv.docs[0].data() }
            });
        }

        // Create new conversation
        const conversationId = uuidv4();
        const conversation = {
            id: conversationId,
            participants: [userId, otherUserId].sort(),
            participantNames: {}, // Would need to fetch from users collection
            lastMessage: '',
            lastMessageAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await adminDb.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).set(conversation);

        return NextResponse.json({ conversation });
    } catch (error: any) {
        console.error('Error creating conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
