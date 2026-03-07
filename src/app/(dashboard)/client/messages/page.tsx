'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatStore, Conversation } from '@/store/chat';
import { Loader2, MessageCircle } from 'lucide-react';

function ClientMessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Check if there's an escort ID in URL params to start a new chat
  useEffect(() => {
    const startNewChat = async () => {
      const escortId = searchParams.get('escortId');
      if (!escortId || !user?.id || isStartingChat) return;

      setIsStartingChat(true);
      try {
        const { getDocument } = await import('@/lib/firebase');
        const escortDoc = await getDocument('users', escortId);
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

  // Authentication and redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && user?.userType === 'escort') router.push('/escort/chat');
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading || isStartingChat) {
    return (
      <MobileLayout userType="client">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType="client">
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={() => {
              setSelectedConversation(null);
              router.replace('/client/messages');
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
                <p className="text-gray-400">Chat with escorts</p>
              </div>
            </div>

            <ChatList onSelectConversation={setSelectedConversation} />
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default function ClientMessages() {
  return (
    <Suspense fallback={
      <MobileLayout userType="client">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileLayout>
    }>
      <ClientMessagesContent />
    </Suspense>
  );
}
