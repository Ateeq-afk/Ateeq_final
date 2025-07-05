import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Lock, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChatChannel } from '@/services/chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChannelListProps {
  channels: ChatChannel[];
  selectedChannel: ChatChannel | null;
  onSelectChannel: (channel: ChatChannel) => void;
  onCreateChannel: (name: string, description: string, type: 'public' | 'private') => void;
  loading: boolean;
}

export default function ChannelList({
  channels,
  selectedChannel,
  onSelectChannel,
  onCreateChannel,
  loading
}: ChannelListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName, newChannelDescription, newChannelType);
      setShowCreateDialog(false);
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('public');
    }
  };

  const getChannelIcon = (channel: ChatChannel) => {
    if (channel.type === 'direct') {
      return <Users className="h-4 w-4" />;
    }
    return channel.type === 'private' ? 
      <Lock className="h-4 w-4" /> : 
      <Hash className="h-4 w-4" />;
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return format(date, 'h:mm a');
    }
    if (diffInHours < 168) { // 7 days
      return format(date, 'EEE');
    }
    return format(date, 'MMM d');
  };

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 mb-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Create Channel
          </Button>
          
          {loading && channels.length === 0 ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            channels.map((channel) => (
              <motion.button
                key={channel.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectChannel(channel)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors group",
                  selectedChannel?.id === channel.id
                    ? "bg-primary/10 hover:bg-primary/15"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 text-muted-foreground",
                    selectedChannel?.id === channel.id && "text-primary"
                  )}>
                    {getChannelIcon(channel)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn(
                        "font-medium truncate",
                        selectedChannel?.id === channel.id && "text-primary"
                      )}>
                        {channel.name}
                      </h4>
                      {channel.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatLastMessageTime(channel.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    
                    {channel.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {channel.last_message.sender?.email.split('@')[0]}: {channel.last_message.content}
                      </p>
                    )}
                  </div>
                  
                  {channel.unread_count > 0 && (
                    <Badge className="ml-2" variant="default">
                      {channel.unread_count}
                    </Badge>
                  )}
                </div>
              </motion.button>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Create a new channel for your team to collaborate.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="e.g., general, announcements"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="channel-description">Description (Optional)</Label>
              <Textarea
                id="channel-description"
                placeholder="What's this channel about?"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Channel Type</Label>
              <RadioGroup value={newChannelType} onValueChange={(value) => setNewChannelType(value as 'public' | 'private')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="font-normal cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Public</div>
                        <div className="text-sm text-muted-foreground">
                          Anyone in your organization can join
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="font-normal cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Private</div>
                        <div className="text-sm text-muted-foreground">
                          Only invited members can join
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}