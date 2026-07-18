import { format } from 'date-fns';
import { Message } from '../lib/types';
import { cn } from '../lib/utils';
import { Clock, AlertCircle } from 'lucide-react';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function linkify(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-[#1a6e3c] hover:text-[#0d5c30] break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isInbound = message.direction === 'inbound';
  const timeString = message.timestamp ? format(new Date(message.timestamp), 'HH:mm') : '';

  return (
    <div 
      className={cn(
        "flex w-full mb-2",
        isInbound ? "justify-start" : "justify-end"
      )}
      data-testid={`bubble-message-${message.id || 'optimistic'}`}
    >
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 relative shadow-sm",
          isInbound 
            ? "bg-[var(--color-msg-in)] text-foreground rounded-tl-none" 
            : "bg-[var(--color-msg-out)] text-foreground rounded-tr-none"
        )}
      >
        <div className="text-sm whitespace-pre-wrap break-words pb-3">
          {linkify(message.body)}
        </div>
        
        <div className="text-[10px] text-black/40 dark:text-white/40 absolute bottom-1 right-2 flex items-center gap-1">
          {timeString}
          {!isInbound && message.optimistic && !message.error && (
            <Clock className="h-3 w-3 text-black/30" />
          )}
          {!isInbound && message.error && (
            <AlertCircle className="h-3 w-3 text-destructive" />
          )}
        </div>
      </div>
    </div>
  );
}
