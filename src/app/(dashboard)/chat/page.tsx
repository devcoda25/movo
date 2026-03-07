'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatStore, Conversation } from '@/store/chat';
import { useAuthStore } from '@/store/useAuthStore';
import { createDocument, getDocument } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Loader2 } from 'lucide-react';

function ChatContent() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Authentication check - redirect based on user type
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user?.userType === 'client') {
      router.push('/client/messages');
    } else if (!isLoading && isAuthenticated && user?.userType === 'escort') {
      router.push('/escort/chat');
    } else if (!isLoading && isAuthenticated && user?.userType === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Check if there's an escort ID in URL params to start a new chat
  useEffect(() => {
    const startNewChat = async () => {
      const escortId = searchParams.get('escortId');
      if (!escortId || !user?.id || isStartingChat) return;

      setIsStartingChat(true);
      try {
        // Get escort details
        const escortDoc = await getDocument(COLLECTIONS.USERS, escortId);
        if (!escortDoc) {
          console.log('Escort not found');
          setIsStartingChat(false);
          return;
        }

        // Create a temporary conversation object for the UI
        const tempConversation: Conversation = {
          id: `new-${escortId}`,
          participants: [user.id, escortId],
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
        };

        setSelectedConversation(tempConversation);
      } catch (error) {
        console.error('Error starting chat:', error);
      } finally {
        setIsStartingChat(false);
      }
    };

    startNewChat();
  }, [searchParams, user]);

  if (isStartingChat) {
    return (
      <MobileLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="h-full flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={() => {
              setSelectedConversation(null);
              // Clear URL params
              router.replace('/chat');
            }}
          />
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Messages</h1>
                <p className="text-gray-400">Chat with escorts and clients</p>
              </div>
            </div>

            <ChatList onSelectConversation={setSelectedConversation} />
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <MobileLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileLayout>
    }>
      <ChatContent />
    </Suspense>
  );
}
