import { useEffect, useState, useRef } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { supabase } from './lib/supabase';
import { Conversation, Message } from './lib/types';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { cn } from './lib/utils';

function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const selectedPhoneRef = useRef<string | null>(null);

  // Sync ref for realtime callbacks
  useEffect(() => {
    selectedPhoneRef.current = selectedPhone;
  }, [selectedPhone]);

  // Initial fetch: Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else if (data) {
        setConversations(data as Conversation[]);
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedPhone) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('phone_number', selectedPhone)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        setMessages(data as Message[]);
      }
      
      // Reset unread count
      const conv = conversations.find(c => c.phone_number === selectedPhone);
      if (conv && conv.unread_count > 0) {
        await supabase
          .from('conversations')
          .update({ unread_count: 0 })
          .eq('phone_number', selectedPhone);
          
        setConversations(prev => 
          prev.map(c => c.phone_number === selectedPhone ? { ...c, unread_count: 0 } : c)
        );
      }
    };

    fetchMessages();
  }, [selectedPhone]); // Note: conversations is not in deps to prevent infinite loops

  // Realtime Subscriptions
  useEffect(() => {
    const conversationsChannel = supabase.channel('public:conversations')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          const updatedConv = payload.new as Conversation;
          setConversations(prev => {
            const exists = prev.find(c => c.phone_number === updatedConv.phone_number);
            let next;
            if (exists) {
              next = prev.map(c => c.phone_number === updatedConv.phone_number ? updatedConv : c);
            } else {
              next = [updatedConv, ...prev];
            }
            return next.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload) => {
          const newConv = payload.new as Conversation;
          setConversations(prev => {
            // Guard: if already present (e.g. loaded by initial fetch), treat as update
            const exists = prev.find(c => c.phone_number === newConv.phone_number);
            const next = exists
              ? prev.map(c => c.phone_number === newConv.phone_number ? newConv : c)
              : [newConv, ...prev];
            return next.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          });
        }
      )
      .subscribe();

    const messagesChannel = supabase.channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          
          if (newMsg.phone_number === selectedPhoneRef.current) {
            setMessages(prev => {
              // For outbound messages, replace the first matching optimistic bubble by body.
              // Timestamp-based matching is unreliable because n8n may write the message
              // to Supabase with a timestamp that differs from the local optimistic timestamp.
              if (newMsg.direction === 'outbound') {
                const optimisticIdx = prev.findIndex(
                  m => m.optimistic && m.body === newMsg.body
                );
                if (optimisticIdx !== -1) {
                  const next = [...prev];
                  next[optimisticIdx] = newMsg; // replace in-place, preserving order
                  return next;
                }
              }

              // Avoid adding duplicates (e.g. re-subscription replay)
              if (prev.some(m => m.id === newMsg.id)) return prev;

              return [...prev, newMsg];
            });
            
            // If the message is inbound and we are currently viewing this thread,
            // we should ideally mark it as read immediately. But the db trigger or external
            // system might increment unread_count. We will clear it locally and remotely.
            if (newMsg.direction === 'inbound') {
              supabase.from('conversations').update({ unread_count: 0 }).eq('phone_number', selectedPhoneRef.current);
            }
          }
          
          // Note: we don't need to manually update conversations state for the last_message 
          // because the database usually updates the conversations table on message insert (via trigger or backend),
          // which will trigger the conversations UPDATE event above. 
          // If there's no DB trigger, we'd need to manually update conversations here.
          // Assuming the backend handles conversations updates.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!selectedPhone) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      phone_number: selectedPhone,
      wa_message_id: null,
      direction: 'outbound',
      message_type: 'text',
      body: text,
      media_url: null,
      status: 'sending',
      timestamp: new Date().toISOString(),
      optimistic: true
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const response = await fetch('https://shreyahubcredo.app.n8n.cloud/webhook/message-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: selectedPhone,
          message: text
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Send error:', error);
      setMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, status: 'failed', error: true } : m)
      );
    }
  };

  const selectedConversation = conversations.find(c => c.phone_number === selectedPhone) || null;

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile if chat is open */}
      <div 
        className={cn(
          "w-full md:w-[350px] lg:w-[400px] flex-shrink-0 h-full",
          isMobileChatOpen ? "hidden md:block" : "block"
        )}
      >
        <Sidebar 
          conversations={conversations}
          selectedPhone={selectedPhone}
          onSelectConversation={(conv) => {
            setSelectedPhone(conv.phone_number);
            setIsMobileChatOpen(true);
          }}
        />
      </div>

      {/* Main Chat Panel - hidden on mobile if chat is not open */}
      <div 
        className={cn(
          "flex-1 h-full w-full",
          !isMobileChatOpen ? "hidden md:block" : "block"
        )}
      >
        <ChatWindow 
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          onBack={() => setIsMobileChatOpen(false)}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route>
          <div className="flex h-screen items-center justify-center">404 - Not Found</div>
        </Route>
      </Switch>
    </WouterRouter>
  );
}

export default App;
