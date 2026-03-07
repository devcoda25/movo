import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { notifyUserOfMessage } from '@/lib/notifications';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'client' | 'escort' | 'admin';
  receiverId: string;
  content: string;
  createdAt: any;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount: number;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;

  // Actions
  fetchConversations: (userId: string) => () => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: string) => void;
  sendMessage: (message: Omit<Message, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  createConversation: (participants: string[]) => Promise<string>;
  subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void) => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,

  fetchConversations: (userId: string) => {
    console.log('[ChatStore] fetchConversations called with userId:', userId);
    set({ loading: true });

    // Use array-contains query to only fetch conversations where user is a participant
    // This respects Firestore security rules
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participants', 'array-contains', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('[ChatStore] onSnapshot received', snapshot.docs.length, 'conversations');

      const allConversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];

      console.log('[ChatStore] All conversations:', allConversations.map(c => ({ id: c.id, participants: c.participants })));

      // Filter by participant and sort by time
      const conversations = allConversations
        .filter(conv => {
          const hasUser = conv.participants?.includes(userId);
          console.log('[ChatStore] Checking conversation', conv.id, 'participants:', conv.participants, 'includes', userId, '?', hasUser);
          return hasUser;
        })
        .sort((a, b) => {
          const timeA = a.lastMessageTime?.toDate?.() || 0;
          const timeB = b.lastMessageTime?.toDate?.() || 0;
          return timeB - timeA;
        });

      console.log('[ChatStore] Filtered conversations for', userId, ':', conversations.length);
      set({ conversations, loading: false });
    });

    return () => unsubscribe();
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  fetchMessages: async (conversationId: string) => {
    console.log('[ChatStore] fetchMessages called for conversation:', conversationId);
    set({ loading: true });

    // Fetch all messages for this conversation and sort client-side
    const messagesRef = collection(db, 'messages');

    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      console.log('[ChatStore] onSnapshot received', snapshot.docs.length, 'messages total');

      const allMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Filter by conversationId and sort by time
      const messages = allMessages
        .filter(msg => msg.conversationId === conversationId)
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || 0;
          const timeB = b.createdAt?.toDate?.() || 0;
          return timeA - timeB;
        });

      console.log('[ChatStore] Filtered to', messages.length, 'messages for conversation', conversationId);
      set({ messages, loading: false });
    });

    return () => unsubscribe();
  },

  sendMessage: async (message) => {
    console.log('[ChatStore] sendMessage called:', message);
    try {
      // Add message
      const messagesRef = collection(db, 'messages');
      const docRef = await addDoc(messagesRef, {
        ...message,
        createdAt: serverTimestamp(),
        read: false
      });
      console.log('[ChatStore] Message added with ID:', docRef.id);

      // Send notification to receiver
      const senderName = message.senderName || 'Someone';
      const senderType = message.senderType || 'user';
      await notifyUserOfMessage(message.receiverId, senderName, senderType, message.conversationId);

      // Update conversation
      const conversationRef = doc(db, 'conversations', message.conversationId);
      await updateDoc(conversationRef, {
        lastMessage: message.content,
        lastMessageTime: serverTimestamp()
      });
      console.log('[ChatStore] Conversation updated');
    } catch (error) {
      console.error('[ChatStore] Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (conversationId: string, userId: string) => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) return;

      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();

      // Update unread count in conversation (only if conversation exists)
      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, { unreadCount: 0 });
      } catch (convError) {
        // Conversation may not exist yet, ignore error
        console.log('Conversation document not found for marking read:', conversationId);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  createConversation: async (participants: string[]) => {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', '==', participants.sort())
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create new conversation
    const docRef = await addDoc(conversationsRef, {
      participants,
      unreadCount: 0,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  },

  subscribeToMessages: (conversationId, callback) => {
    const messagesRef = collection(db, 'messages');

    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Filter by conversationId and sort client-side
      const messages = allMessages
        .filter(msg => msg.conversationId === conversationId)
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || 0;
          const timeB = b.createdAt?.toDate?.() || 0;
          return timeA - timeB;
        });

      callback(messages);
    });

    return unsubscribe;
  }
}));
