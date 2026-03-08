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

// GET - Get messages for a conversation
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
        const conversationId = searchParams.get('conversationId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const before = searchParams.get('before');

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
        }

        // Verify user is part of this conversation
        const convDoc = await adminDb.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).get();
        if (!convDoc.exists) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const convData = convDoc.data();
        if (!convData?.participants?.includes(userId)) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Get messages
        let query = adminDb
            .collection(COLLECTIONS.MESSAGES)
            .where('conversationId', '==', conversationId)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        if (before) {
            const beforeDoc = await adminDb.collection(COLLECTIONS.MESSAGES).doc(before).get();
            if (beforeDoc.exists) {
                query = query.startAfter(beforeDoc);
            }
        }

        const messagesSnapshot = await query.get();
        const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })).reverse();

        return NextResponse.json({ messages });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Send a message
export async function POST(request: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    try {
        const { isValid, userId } = await verifyUser(request);
        if (!isValid || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId, content, type = 'text' } = await request.json();

        if (!conversationId || !content) {
            return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 });
        }

        // Verify user is part of this conversation
        const convDoc = await adminDb.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).get();
        if (!convDoc.exists) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const convData = convDoc.data();
        if (!convData?.participants?.includes(userId)) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Create message
        const messageId = uuidv4();
        const message = {
            id: messageId,
            conversationId,
            senderId: userId,
            content,
            type, // 'text', 'image', 'file'
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).set(message);

        // Update conversation with last message
        await adminDb.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).update({
            lastMessage: content.substring(0, 100),
            lastMessageAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({ message });
    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    try {
        const { isValid, userId } = await verifyUser(request);
        if (!isValid || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId } = await request.json();

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
        }

        // Get all unread messages in the conversation
        const messagesSnapshot = await adminDb
            .collection(COLLECTIONS.MESSAGES)
            .where('conversationId', '==', conversationId)
            .where('senderId', '!=', userId)
            .where('isRead', '==', false)
            .get();

        // Mark all as read
        const batch = adminDb.batch();
        messagesSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true, updatedAt: new Date() });
        });
        await batch.commit();

        return NextResponse.json({ success: true, count: messagesSnapshot.size });
    } catch (error: any) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
