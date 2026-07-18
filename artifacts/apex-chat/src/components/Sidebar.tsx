import { useState } from 'react';
import { Search, GraduationCap } from 'lucide-react';
import { Conversation } from '../lib/types';
import { ConversationRow } from './ConversationRow';

interface SidebarProps {
  conversations: Conversation[];
  selectedPhone: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  className?: string;
}

export function Sidebar({ conversations, selectedPhone, onSelectConversation, className }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) => {
    const query = searchQuery.toLowerCase();
    const name = (c.candidate_name || c.profile_name || '').toLowerCase();
    const phone = c.phone_number.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  return (
    <div className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border ${className}`}>
      {/* Header */}
      <div className="flex items-center h-16 px-4 bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
        <GraduationCap className="h-6 w-6 mr-3" />
        <h1 className="font-semibold text-lg">Apex Outreach</h1>
      </div>

      {/* Search */}
      <div className="p-2 bg-sidebar border-b border-sidebar-border flex-shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="search"
            placeholder="Search or start new chat"
            className="block w-full pl-10 pr-3 py-2 bg-muted border-none rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-conversations"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-sidebar">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationRow
              key={conv.phone_number}
              conversation={conv}
              isSelected={selectedPhone === conv.phone_number}
              onClick={() => onSelectConversation(conv)}
            />
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations found.
          </div>
        )}
      </div>
    </div>
  );
}
