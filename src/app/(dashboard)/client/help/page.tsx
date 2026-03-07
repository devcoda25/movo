'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobileLayout from '@/components/layouts/MobileLayout';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { HelpCircle, ChevronRight, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Loader2, Send, ArrowLeft, X } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: string;
  message: string;
  read: boolean;
  createdAt: any;
}

const ADMIN_ID = 'admin_support';
const WHATSAPP_NUMBER = '0785774272';

export default function ClientHelp() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [contactMethod, setContactMethod] = useState<'chat' | 'whatsapp'>('chat');
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && user?.userType === 'escort') router.push('/escort/dashboard');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!showChat || !user) return;

    setIsLoadingMessages(true);
    const userId = user.id || (user as any).uid;
    
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('chatRoomId', '==', `support_${userId}`)
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
      
      msgs.forEach(async (msg) => {
        if (!msg.read && msg.senderId !== userId) {
          await updateDoc(doc(db, COLLECTIONS.MESSAGES, msg.id), { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [showChat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    try {
      const userId = user.id || (user as any).uid;
      const userName = user.fullName || 'User';
      
      await addDoc(collection(db, COLLECTIONS.MESSAGES), {
        chatRoomId: `support_${userId}`,
        senderId: userId,
        senderName: userName,
        senderType: user.userType,
        receiverId: ADMIN_ID,
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

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Hello, I need help with Movo app');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const faqs = [
    { question: 'How do I book an escort?', answer: 'Browse our verified escorts and click on their profile to see services and availability. You can then send a booking request with your preferred date and time.' },
    { question: 'Is my information secure?', answer: 'Yes, we take privacy seriously. Your personal information is encrypted and never shared with third parties.' },
    { question: 'How do I contact support?', answer: 'You can reach our support team via live chat or WhatsApp. We\'re available 24/7 for urgent issues.' },
    { question: 'What payment methods are accepted?', answer: 'We accept mobile money (MTN, Airtel) and cash payments. Payment is made directly to the escort after service is completed.' },
  ];

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (showChat) {
    return (
      <MobileLayout userType="client" showBottomNav={false}>
        <div className="h-screen flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 bg-white/5 border-b border-white/5">
            <button onClick={() => setShowChat(false)} className="p-2 -ml-2 hover:bg-white/5 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Movo Support</h2>
              <p className="text-gray-400 text-xs">We'll reply as soon as possible</p>
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
                <p className="text-gray-400">Start a conversation with our support team</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === (user.id || (user as any).uid);
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary text-white' : 'bg-white/10 text-white'}`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
                placeholder="Type a message..."
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
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType="client">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-white">Help & Support</h1>

        {/* Contact Options */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-4">Contact Support</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setContactMethod('chat')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${contactMethod === 'chat' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'}`}
            >
              <MessageCircle className="w-5 h-5 mx-auto mb-1" />
              Chat
            </button>
            <button
              onClick={() => setContactMethod('whatsapp')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${contactMethod === 'whatsapp' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400'}`}
            >
              <Phone className="w-5 h-5 mx-auto mb-1" />
              WhatsApp
            </button>
          </div>
          
          {contactMethod === 'chat' ? (
            <button 
              onClick={() => setShowChat(true)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl"
            >
              Start Live Chat
            </button>
          ) : (
            <button 
              onClick={handleWhatsAppClick}
              className="w-full py-4 bg-green-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Chat on WhatsApp
            </button>
          )}
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  {faqOpen === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {faqOpen === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support Hours */}
        <div className="mt-6 p-4 bg-white/5 rounded-2xl">
          <h3 className="text-white font-semibold mb-2">Support Hours</h3>
          <p className="text-gray-400 text-sm">Our support team is available 24/7 for urgent issues. Average response time: 2-4 hours.</p>
        </div>
      </div>
    </MobileLayout>
  );
}
