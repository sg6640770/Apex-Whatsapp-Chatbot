import { formatDistanceToNow } from 'date-fns';
import { Conversation } from '../lib/types';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';

interface ConversationRowProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationRow({ conversation, isSelected, onClick }: ConversationRowProps) {
  const displayName = conversation.candidate_name || conversation.profile_name || conversation.phone_number;
  
  // Extract initials
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Consistent color based on phone number
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const colorIndex = conversation.phone_number
    ? Array.from(conversation.phone_number).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;
  const avatarColor = colors[colorIndex];

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer border-b border-border transition-colors hover:bg-black/5 dark:hover:bg-white/5",
        isSelected && "bg-black/5 dark:bg-white/5"
      )}
      data-testid={`row-conversation-${conversation.phone_number}`}
    >
      <Avatar className="h-12 w-12 border border-black/10">
        <AvatarFallback className={cn("text-white font-medium", avatarColor)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-semibold text-foreground truncate" data-testid={`text-name-${conversation.phone_number}`}>
            {displayName}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {conversation.last_message_at 
              ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true }) 
              : ''}
          </span>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <p className="text-sm text-muted-foreground truncate" data-testid={`text-lastmsg-${conversation.phone_number}`}>
            {conversation.last_message || 'No messages yet'}
          </p>
          {conversation.unread_count > 0 && (
            <span 
              className="flex-shrink-0 bg-[#25D366] text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center"
              data-testid={`badge-unread-${conversation.phone_number}`}
            >
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
