export interface Conversation {
  phone_number: string;
  candidate_name: string | null;
  profile_name: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  status: string | null;
}

export interface Message {
  id: string;
  phone_number: string;
  wa_message_id: string | null;
  direction: 'inbound' | 'outbound';
  message_type: string;
  body: string;
  media_url: string | null;
  status: string | null;
  timestamp: string;
  optimistic?: boolean;
  error?: boolean;
}
