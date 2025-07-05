import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, Smile, MoreVertical, Search, Plus, 
  Hash, Lock, Users, X, Edit2, Trash2, Reply, Pin,
  Bell, BellOff, ChevronDown, Image as ImageIcon, File,
  AtSign, Bold, Italic, Code, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chatService, ChatChannel, ChatMessage } from '@/services/chat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import ChannelList from './ChannelList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChannelHeader from './ChannelHeader';
import UserList from './UserList';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSubscription = useRef<any>(null);
  const typingSubscription = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load channels on mount
  useEffect(() => {
    if (isOpen) {
      loadChannels();
      // Set user status to online
      chatService.updateUserStatus('online');
    }
    
    return () => {
      // Set user status to offline
      if (!isOpen) {
        chatService.updateUserStatus('offline');
      }
    };
  }, [isOpen]);

  // Load messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      subscribeToChannel(selectedChannel.id);
    }
    
    return () => {
      if (messageSubscription.current) {
        chatService.unsubscribe(messageSubscription.current);
      }
      if (typingSubscription.current) {
        chatService.unsubscribe(typingSubscription.current);
      }
    };
  }, [selectedChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await chatService.getChannels();
      setChannels(data);
      
      // Auto-select first channel if none selected
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat channels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      setLoading(true);
      const data = await chatService.getMessages(channelId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChannel = (channelId: string) => {
    // Subscribe to new messages
    messageSubscription.current = chatService.subscribeToChannel(channelId, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as ChatMessage;
        setMessages((prev) => [...prev, newMessage]);
        
        // Update channel's last message
        setChannels((prev) => 
          prev.map((ch) => 
            ch.id === channelId 
              ? { ...ch, last_message: newMessage, unread_count: ch.unread_count + 1 }
              : ch
          )
        );
      } else if (payload.eventType === 'UPDATE') {
        const updatedMessage = payload.new as ChatMessage;
        setMessages((prev) => 
          prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
        );
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id;
        setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
      }
    });

    // Subscribe to typing indicators
    typingSubscription.current = chatService.subscribeToTypingStatus(channelId, (state) => {
      const typing = new Set<string>();
      Object.keys(state).forEach((key) => {
        const presences = state[key];
        presences.forEach((presence: any) => {
          if (presence.user_id !== user?.id && presence.typing) {
            typing.add(presence.user_id);
          }
        });
      });
      setTypingUsers(typing);
    });
  };

  const sendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedChannel || !content.trim()) return;
    
    try {
      setSending(true);
      
      // Upload attachments if any
      let attachmentData;
      if (attachments && attachments.length > 0) {
        attachmentData = await Promise.all(
          attachments.map(async (file) => {
            const url = await chatService.uploadFile(file, selectedChannel.id);
            return {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileUrl: url,
              thumbnailUrl: file.type.startsWith('image/') ? url : undefined,
            };
          })
        );
      }
      
      await chatService.sendMessage({
        channelId: selectedChannel.id,
        content,
        attachments: attachmentData,
      });
      
      // Clear unread count for this channel
      setChannels((prev) => 
        prev.map((ch) => 
          ch.id === selectedChannel.id ? { ...ch, unread_count: 0 } : ch
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!selectedChannel) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing status
    chatService.updateTypingStatus(selectedChannel.id, isTyping);
    
    // Auto-stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        chatService.updateTypingStatus(selectedChannel.id, false);
      }, 3000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createChannel = async (name: string, description: string, type: 'public' | 'private') => {
    try {
      const newChannel = await chatService.createChannel({ name, description, type });
      setChannels((prev) => [newChannel, ...prev]);
      setSelectedChannel(newChannel);
      toast({
        title: 'Success',
        description: 'Channel created successfully',
      });
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to create channel',
        variant: 'destructive',
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      toast({
        title: 'Success',
        description: 'Message deleted',
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      await chatService.updateMessage(messageId, newContent);
      toast({
        title: 'Success',
        description: 'Message updated',
      });
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive',
      });
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.toggleReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="w-full max-w-6xl h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex"
      >
        {/* Channel List */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Chat</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <ChannelList
            channels={channels.filter(ch => 
              ch.name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
            onCreateChannel={createChannel}
            loading={loading}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              <ChannelHeader
                channel={selectedChannel}
                onToggleUserList={() => setShowUserList(!showUserList)}
                showUserList={showUserList}
              />
              
              <div className="flex-1 flex">
                {/* Messages */}
                <div className="flex-1 flex flex-col">
                  <MessageList
                    messages={messages}
                    currentUserId={user?.id || ''}
                    loading={loading}
                    onDeleteMessage={deleteMessage}
                    onEditMessage={editMessage}
                    onReactToMessage={toggleReaction}
                    typingUsers={typingUsers}
                  />
                  <div ref={messagesEndRef} />
                  
                  <MessageInput
                    onSendMessage={sendMessage}
                    onTyping={handleTyping}
                    disabled={sending}
                  />
                </div>
                
                {/* User List */}
                <AnimatePresence>
                  {showUserList && selectedChannel.members && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 240, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="border-l"
                    >
                      <UserList members={selectedChannel.members} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a channel</h3>
                <p className="text-muted-foreground">
                  Choose a channel from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}