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

function EscortChatContent() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user?.userType === 'client') {
      router.push('/client/messages');
    } else if (!isLoading && isAuthenticated && user?.userType !== 'escort' && user?.userType !== 'admin') {
      router.push('/');
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Check if there's a client ID in URL params to start a new chat
  useEffect(() => {
    const startNewChat = async () => {
      const clientId = searchParams.get('clientId');
      if (!clientId || !user?.id || isStartingChat) return;
      
      setIsStartingChat(true);
      try {
        // Get client details
        const clientDoc = await getDocument(COLLECTIONS.USERS, clientId);
        if (!clientDoc) {
          console.log('Client not found');
          setIsStartingChat(false);
          return;
        }
        
        // Create a temporary conversation object for the UI
        const tempConversation: Conversation = {
          id: `new-${clientId}`,
          participants: [user.id, clientId],
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
      <MobileLayout userType="escort">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType="escort">
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={() => {
              setSelectedConversation(null);
              router.replace('/escort/chat');
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
                <p className="text-gray-400">Chat with clients</p>
              </div>
            </div>
            
            <ChatList onSelectConversation={setSelectedConversation} />
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default function EscortChatPage() {
  return (
    <Suspense fallback={
      <MobileLayout userType="escort">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileLayout>
    }>
      <EscortChatContent />
    </Suspense>
  );
}
