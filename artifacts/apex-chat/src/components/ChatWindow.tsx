import { useState, useRef, useEffect, FormEvent } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Conversation, Message } from '../lib/types';
import { MessageBubble } from './MessageBubble';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
  className?: string;
}

export function ChatWindow({ conversation, messages, onSendMessage, onBack, className }: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adjust textarea height automatically
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!conversation) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full bg-[var(--color-chat-bg)]", className)}>
        <div className="bg-white/80 dark:bg-black/50 px-6 py-4 rounded-full shadow-sm text-muted-foreground">
          Select a conversation to begin
        </div>
      </div>
    );
  }

  const displayName = conversation.candidate_name || conversation.profile_name || conversation.phone_number;
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const colorIndex = Array.from(conversation.phone_number).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <div className={cn("flex flex-col h-full bg-[var(--color-chat-bg)]", className)}>
      {/* Header */}
      <div className="flex items-center h-16 px-4 bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0 shadow-sm z-10">
        <button 
          onClick={onBack}
          className="mr-3 md:hidden p-2 -ml-2 rounded-full hover:bg-white/10"
          data-testid="button-back-mobile"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <Avatar className="h-10 w-10 mr-3 border border-white/20">
          <AvatarFallback className={cn("text-white font-medium text-sm", avatarColor)}>
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col">
          <h2 className="font-semibold" data-testid="text-chat-header-name">{displayName}</h2>
          <span className="text-xs opacity-80">{conversation.phone_number}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6"
        style={{
          backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/rnt_w1n3wA7.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: '400px',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'var(--color-chat-bg)',
        }}
      >
        <div className="flex flex-col justify-end min-h-full">
          {messages.map((msg, index) => (
            <MessageBubble key={msg.id || index} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F2F5] dark:bg-[#202C33] p-3 flex items-end gap-2">
        <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-lg shadow-sm border border-black/5 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="w-full max-h-[120px] bg-transparent border-none focus:ring-0 resize-none py-2.5 px-4 text-sm outline-none"
            rows={1}
            data-testid="input-message"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!inputText.trim()}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white p-2.5 rounded-full flex-shrink-0 transition-colors"
          data-testid="button-send-message"
        >
          <Send className="h-5 w-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
