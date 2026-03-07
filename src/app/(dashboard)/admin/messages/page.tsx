'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { MessageCircle, Send, Search, User, ArrowLeft, Loader2, Phone, Mail, Shield, CheckCircle } from 'lucide-react';

interface ChatConversation {
  chatRoomId: string;
  lastMessage: string;
  lastMessageTime: any;
  userId: string;
  userName: string;
  userType: string;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function AdminMessages() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => { await logout(); router.push('/login'); };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Fetch all conversations where admin is involved
    const q = query(
      collection(db, COLLECTIONS.MESSAGES)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats: { [key: string]: ChatConversation } = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const chatRoomId = data.chatRoomId;

        if (data.senderId !== 'admin_support' && !chats[chatRoomId]) {
          // Get unique conversations
          chats[chatRoomId] = {
            chatRoomId,
            lastMessage: data.message,
            lastMessageTime: data.createdAt,
            userId: data.senderId,
            userName: data.senderName,
            userType: data.senderType,
            unreadCount: 0,
          };
        }
      });

      // Count unread messages for each conversation
      const conversationsWithUnread = Object.values(chats);

      // Get user data for each conversation
      conversationsWithUnread.forEach(async (conv) => {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, conv.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          conv.userName = userData.fullName || userData.phone || conv.userId;
        }
      });

      // Sort by last message time
      conversationsWithUnread.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });

      setConversations(conversationsWithUnread);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedChat) return;

    setIsLoadingMessages(true);
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('chatRoomId', '==', selectedChat.chatRoomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderType: data.senderType,
          message: data.message,
          read: data.read || false,
          createdAt: data.createdAt,
        });
      });
      // Sort by createdAt
      msgs.sort((a, b) => {
        if (!a.createdAt?.toDate || !b.createdAt?.toDate) return 0;
        return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
      });
      setMessages(msgs);
      setIsLoadingMessages(false);

      // Mark messages from user as read
      msgs.forEach(async (msg) => {
        if (!msg.read && msg.senderId !== 'admin_support') {
          await updateDoc(doc(db, COLLECTIONS.MESSAGES, msg.id), { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, COLLECTIONS.MESSAGES), {
        chatRoomId: selectedChat.chatRoomId,
        senderId: 'admin_support',
        senderName: 'Movo Support',
        senderType: 'admin',
        receiverId: selectedChat.userId,
        message: newMessage.trim(),
        read: false,
        createdAt: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'escort':
        return 'from-pink-500 to-rose-500';
      case 'client':
        return 'from-purple-500 to-indigo-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'escort':
        return <Shield className="w-4 h-4" />;
      case 'client':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (selectedChat) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/5 p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="p-2 -ml-2 hover:bg-white/5 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getUserTypeColor(selectedChat.userType)} flex items-center justify-center text-white`}>
              {getUserTypeIcon(selectedChat.userType)}
            </div>
            <div>
              <h2 className="text-white font-semibold">{selectedChat.userName}</h2>
              <p className="text-gray-400 text-xs capitalize">{selectedChat.userType}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">No messages yet</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.senderId === 'admin_support';
              return (
                <div key={msg.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary text-white' : 'bg-white/10 text-white'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/5 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a reply..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar onLogout={handleLogout} />
      <main className="lg:ml-72 p-4 lg:p-8 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Support Messages</h1>
            <p className="text-gray-400">{conversations.length} conversations</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv, idx) => (
              <button
                key={conv.chatRoomId || `conv-${idx}`}
                onClick={() => setSelectedChat(conv)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl text-left hover:bg-white/10 transition-colors"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getUserTypeColor(conv.userType)} flex items-center justify-center text-white`}>
                  {getUserTypeIcon(conv.userType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold truncate">{conv.userName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getUserTypeColor(conv.userType)} text-white`}>
                      {conv.userType}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">{conv.lastMessage}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {conv.lastMessageTime?.toDate ? new Date(conv.lastMessageTime.toDate()).toLocaleDateString() : ''}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">{conv.unreadCount}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
