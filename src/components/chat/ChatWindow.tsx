'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useChatStore, Message, Conversation } from '@/store/chat';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { getDocument, createDocument, COLLECTIONS } from '@/lib/firebase';
import { User } from '@/types';

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [conversationId, setConversationId] = useState(conversation.id);
  const [isNewChat, setIsNewChat] = useState(conversation.id.startsWith('new-'));
  const [modalContent, setModalContent] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { subscribeToMessages, sendMessage, markAsRead } = useChatStore();

  // Get other participant
  useEffect(() => {
    const fetchOtherUser = async () => {
      const otherUserId = conversation.participants.find(p => p !== user?.id);
      if (otherUserId) {
        const userData = await getDocument('users', otherUserId);
        if (userData) {
          setOtherUser(userData as User);
        }
      }
    };
    fetchOtherUser();
  }, [conversation.participants, user?.id]);

  // Subscribe to messages (only for existing conversations)
  useEffect(() => {
    if (isNewChat) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId, subscribeToMessages, isNewChat]);

  // Mark as read
  useEffect(() => {
    if (user?.id && conversationId && !isNewChat) {
      markAsRead(conversationId, user.id);
    }
  }, [conversationId, user?.id, markAsRead, isNewChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const receiverId = conversation.participants.find(p => p !== user.id);
    if (!receiverId) return;

    setSending(true);
    try {
      let finalConversationId = conversationId;

      // If this is a new chat, create a new conversation
      if (isNewChat) {
        // Sort participants to ensure consistent ordering
        const sortedParticipants = [user.id, receiverId].sort();

        // Create conversation with timestamp-based ID
        const newConversationId = Date.now().toString();
        const newConversationData = {
          participants: sortedParticipants,
          lastMessage: message.trim(),
          lastMessageTime: new Date(),
          createdAt: new Date(),
          unreadCount: 0,
        };

        // Create conversation in Firebase
        await createDocument(COLLECTIONS.CHATS, newConversationId, newConversationData);
        finalConversationId = newConversationId;
        setConversationId(finalConversationId);
        setIsNewChat(false);

        console.log('[ChatWindow] Created new conversation:', newConversationId, 'with participants:', sortedParticipants);
      }

      await sendMessage({
        conversationId: finalConversationId,
        senderId: user.id,
        senderName: user.fullName || 'User',
        senderType: user.userType as 'client' | 'escort' | 'admin',
        receiverId,
        content: message.trim()
      });
      setMessage('');
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to send message. Please try again.',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    return new Date(timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-white/10 bg-white/5">
        <button onClick={onBack} className="p-2 -ml-2 mr-2 hover:bg-white/10 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
          {otherUser?.profilePhoto ? (
            <img src={otherUser.profilePhoto} alt={otherUser.fullName} className="w-full h-full object-cover" />
          ) : (
            otherUser?.fullName?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div className="ml-3">
          <h3 className="font-semibold text-white">{otherUser?.fullName || 'Loading...'}</h3>
          <p className="text-xs text-gray-400 capitalize">{otherUser?.userType || ''}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-3xl px-5 py-3 ${isMe
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
                    : 'bg-white/10 text-white rounded-bl-md'
                    }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                    <span className="text-xs">{formatTime(msg.createdAt)}</span>
                    {isMe && (
                      msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/10 rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center disabled:opacity-50"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
        type={modalContent.type}
      >
        <div className="text-center">
          <p className="text-gray-300">{modalContent.message}</p>
          <button
            onClick={() => setShowModal(false)}
            className="mt-6 w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}
