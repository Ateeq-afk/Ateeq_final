import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { Edit2, Trash2, Reply, MoreVertical, Smile, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/services/chat';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  loading: boolean;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  typingUsers: Set<string>;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

export default function MessageList({
  messages,
  currentUserId,
  loading,
  onDeleteMessage,
  onEditMessage,
  onReactToMessage,
  typingUsers
}: MessageListProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d at h:mm a');
  };

  const formatDateSeparator = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMMM d, yyyy');
  };

  const shouldShowDateSeparator = (currentMsg: ChatMessage, prevMsg: ChatMessage | null) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    
    return currentDate !== prevDate;
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editContent.trim()) {
      onEditMessage(editingMessageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  if (loading && messages.length === 0) {
    return (
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
          const isOwnMessage = message.sender_id === currentUserId;
          const isSystemMessage = message.type === 'system';
          
          return (
            <React.Fragment key={message.id}>
              {showDateSeparator && (
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDateSeparator(message.created_at)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              
              {isSystemMessage ? (
                <div className="text-center">
                  <span className="text-sm text-muted-foreground italic">
                    {message.content}
                  </span>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "group relative flex gap-3",
                    isOwnMessage && "flex-row-reverse"
                  )}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <Avatar>
                    <AvatarImage src={message.sender?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {getUserInitials(message.sender?.email || 'UN')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn("flex-1 max-w-[70%]", isOwnMessage && "flex flex-col items-end")}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.sender?.email.split('@')[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.created_at)}
                      </span>
                      {message.is_edited && (
                        <span className="text-xs text-muted-foreground italic">(edited)</span>
                      )}
                    </div>
                    
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "rounded-lg p-3",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}>
                          {message.parent_message && (
                            <div className={cn(
                              "mb-2 p-2 rounded border-l-2",
                              isOwnMessage
                                ? "bg-primary-foreground/10 border-primary-foreground/20"
                                : "bg-background/50 border-border"
                            )}>
                              <p className="text-xs opacity-70">
                                {message.parent_message.sender?.email.split('@')[0]}
                              </p>
                              <p className="text-sm line-clamp-2">
                                {message.parent_message.content}
                              </p>
                            </div>
                          )}
                          
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className={cn(
                                    "p-2 rounded flex items-center gap-2",
                                    isOwnMessage
                                      ? "bg-primary-foreground/10"
                                      : "bg-background/50"
                                  )}
                                >
                                  {attachment.thumbnail_url ? (
                                    <img
                                      src={attachment.thumbnail_url}
                                      alt={attachment.file_name}
                                      className="h-20 w-20 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                      <Download className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {attachment.file_name}
                                    </p>
                                    <p className="text-xs opacity-70">
                                      {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    asChild
                                  >
                                    <a href={attachment.file_url} download>
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {message.reactions.map((reaction) => (
                              <button
                                key={reaction.emoji}
                                onClick={() => onReactToMessage(message.id, reaction.emoji)}
                                className={cn(
                                  "px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-colors",
                                  reaction.users.includes(currentUserId)
                                    ? "bg-primary/20 hover:bg-primary/30"
                                    : "bg-muted hover:bg-muted/80"
                                )}
                              >
                                <span>{reaction.emoji}</span>
                                <span className="text-xs">{reaction.users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {hoveredMessageId === message.id && !editingMessageId && (
                    <div className={cn(
                      "absolute top-0 flex items-center gap-1 bg-background border rounded-lg shadow-sm p-1",
                      isOwnMessage ? "left-0" : "right-0"
                    )}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex gap-1">
                            {EMOJI_LIST.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => onReactToMessage(message.id, emoji)}
                                className="p-1 hover:bg-muted rounded transition-colors text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <Reply className="h-4 w-4" />
                      </Button>
                      
                      {isOwnMessage && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEdit(message.id, message.content)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => onDeleteMessage(message.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
        
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <span className="inline-block w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="inline-block w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="inline-block w-2 h-2 bg-current rounded-full animate-bounce" />
            </div>
            <span>Someone is typing...</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}