'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Search, MoreVertical } from 'lucide-react';
import { useChatStore, Conversation } from '@/store/chat';
import { useAuthStore } from '@/store/useAuthStore';
import { getDocument } from '@/lib/firebase';
import { User } from '@/types';

interface ChatListProps {
  onSelectConversation: (conversation: Conversation) => void;
}

export function ChatList({ onSelectConversation }: ChatListProps) {
  const conversations = useChatStore(state => state.conversations);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuthStore();
  const { fetchConversations } = useChatStore();

  // Fetch conversations
  useEffect(() => {
    if (!user?.id) {
      console.log('[ChatList] No user ID yet, skipping fetch');
      return;
    }
    
    console.log('[ChatList] Fetching conversations for user:', user.id);
    setLoading(true);
    const unsubscribe = fetchConversations(user.id);
    
    return () => {
      console.log('[ChatList] Cleanup: unsubscribing from conversations');
      unsubscribe();
    };
  }, [user?.id, fetchConversations]);
  
  // Fetch user details for each conversation
  useEffect(() => {
    if (!conversations.length) {
      console.log('[ChatList] No conversations to fetch user details for');
      setLoading(false);
      return;
    }
    
    console.log('[ChatList] Fetching user details for', conversations.length, 'conversations');
    const fetchUserDetails = async () => {
      // Get unique user IDs
      const userIds = new Set<string>();
      conversations.forEach(c => {
        c.participants.forEach(p => {
          if (p !== user?.id) userIds.add(p);
        });
      });
      
      // Fetch user details
      const userPromises = Array.from(userIds).map(async (id) => {
        const userData = await getDocument('users', id);
        return { id, user: userData as User };
      });
      
      const userResults = await Promise.all(userPromises);
      const userMap: Record<string, User> = {};
      userResults.forEach(({ id, user }) => {
        if (user) userMap[id] = user;
      });
      
      setUsers(userMap);
      setLoading(false);
    };
    
    fetchUserDetails();
  }, [conversations, user?.id]);

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const otherUserId = conv.participants.find(p => p !== user?.id);
    const otherUser = users[otherUserId || ''];
    if (!otherUser) return true;
    
    return otherUser.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = new Date(timestamp.toDate());
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-white/10 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
          <p className="text-gray-400">{user?.userType === 'escort' ? 'Clients will contact you here' : 'Start a conversation by booking an escort or contacting support'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => {
            const otherUserId = conversation.participants.find(p => p !== user?.id);
            const otherUser = users[otherUserId || ''];
            
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-colors text-left cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {otherUser?.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-white truncate">
                      {otherUser?.fullName || 'Unknown User'}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 min-w-[20px] h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white font-bold px-1.5">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // More options
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
