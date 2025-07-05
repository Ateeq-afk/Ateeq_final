import React from 'react';
import { Hash, Lock, Users, Bell, Pin, Settings, Search, Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChatChannel } from '@/services/chat';
import { cn } from '@/lib/utils';

interface ChannelHeaderProps {
  channel: ChatChannel;
  onToggleUserList: () => void;
  showUserList: boolean;
}

export default function ChannelHeader({ channel, onToggleUserList, showUserList }: ChannelHeaderProps) {
  const getChannelIcon = () => {
    if (channel.type === 'direct') {
      return <Users className="h-5 w-5" />;
    }
    return channel.type === 'private' ? 
      <Lock className="h-5 w-5" /> : 
      <Hash className="h-5 w-5" />;
  };

  const getMemberCount = () => {
    if (channel.members) {
      return channel.members.length;
    }
    return channel._member_count?.[0]?.count || 0;
  };

  return (
    <div className="border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">
          {getChannelIcon()}
        </div>
        
        <div>
          <h3 className="font-semibold text-lg">{channel.name}</h3>
          {channel.description && (
            <p className="text-sm text-muted-foreground">{channel.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onToggleUserList}
          >
            <Users className="h-4 w-4 mr-1" />
            {getMemberCount()}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon">
          <Pin className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Channel Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="h-4 w-4 mr-2" />
              Notification Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pin className="h-4 w-4 mr-2" />
              Pinned Messages
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Search className="h-4 w-4 mr-2" />
              Search in Channel
            </DropdownMenuItem>
            {channel.type !== 'direct' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Leave Channel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}