import { api } from './api';
import { supabase } from '@/lib/supabaseClient';

export interface ChatChannel {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  metadata?: any;
  unread_count?: number;
  last_message?: ChatMessage | null;
  members?: ChatChannelMember[];
  current_user_role?: string;
}

export interface ChatChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_at: string;
  notifications_enabled: boolean;
  user?: {
    id: string;
    email: string;
    user_metadata: any;
    chat_user_status?: ChatUserStatus;
  };
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  parent_message_id?: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  metadata?: any;
  reactions?: MessageReaction[];
  sender?: {
    id: string;
    email: string;
    user_metadata: any;
  };
  attachments?: ChatAttachment[];
  parent_message?: ChatMessage;
}

export interface ChatAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface ChatUserStatus {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  custom_status?: string;
  last_seen_at: string;
  is_typing_in_channel?: string;
  typing_started_at?: string;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
}

export interface CreateChannelParams {
  name: string;
  description?: string;
  type: 'public' | 'private';
  memberIds?: string[];
}

export interface SendMessageParams {
  channelId: string;
  content: string;
  type?: 'text' | 'file' | 'image';
  parentMessageId?: string;
  attachments?: {
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    thumbnailUrl?: string;
  }[];
}

class ChatService {
  // Get all channels for the current user
  async getChannels() {
    const response = await api.get('/chat/channels');
    return response.data;
  }

  // Create a new channel
  async createChannel(params: CreateChannelParams) {
    const response = await api.post('/chat/channels', params);
    return response.data;
  }

  // Get channel details with members
  async getChannel(channelId: string) {
    const response = await api.get(`/chat/channels/${channelId}`);
    return response.data;
  }

  // Get messages for a channel
  async getMessages(channelId: string, limit = 50, before?: string) {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (before) params.append('before', before);
    
    const response = await api.get(`/chat/channels/${channelId}/messages?${params}`);
    return response.data;
  }

  // Send a message
  async sendMessage(params: SendMessageParams) {
    const response = await api.post('/chat/messages', params);
    return response.data;
  }

  // Update a message
  async updateMessage(messageId: string, content: string) {
    const response = await api.put(`/chat/messages/${messageId}`, { content });
    return response.data;
  }

  // Delete a message
  async deleteMessage(messageId: string) {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  }

  // Add or remove reaction
  async toggleReaction(messageId: string, emoji: string) {
    const response = await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
    return response.data;
  }

  // Create or get direct message channel
  async getOrCreateDirectChannel(otherUserId: string) {
    const response = await api.post('/chat/channels/direct', { otherUserId });
    return response.data;
  }

  // Update user status
  async updateUserStatus(status: 'online' | 'away' | 'busy' | 'offline', customStatus?: string) {
    const response = await api.put('/chat/status', { status, customStatus });
    return response.data;
  }

  // Update typing indicator
  async updateTypingStatus(channelId: string, isTyping: boolean) {
    const response = await api.post('/chat/typing', { channelId, isTyping });
    return response.data;
  }

  // Subscribe to channel messages (real-time)
  subscribeToChannel(channelId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`chat:${channelId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        }, 
        callback
      )
      .subscribe();
    
    return channel;
  }

  // Subscribe to user status updates
  subscribeToUserStatus(orgId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`user_status:${orgId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_user_status'
        }, 
        callback
      )
      .subscribe();
    
    return channel;
  }

  // Subscribe to typing indicators
  subscribeToTypingStatus(channelId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`typing:${channelId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        callback(state);
      })
      .subscribe();
    
    return channel;
  }

  // Unsubscribe from a channel
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }

  // Upload file for chat
  async uploadFile(file: File, channelId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `chat/${channelId}/${fileName}`;

    const { error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Search messages
  async searchMessages(query: string, channelId?: string) {
    const params = new URLSearchParams();
    params.append('q', query);
    if (channelId) params.append('channelId', channelId);
    
    const response = await api.get(`/chat/search?${params}`);
    return response.data;
  }
}

export const chatService = new ChatService();