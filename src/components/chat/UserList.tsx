import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatChannelMember } from '@/services/chat';
import { cn } from '@/lib/utils';

interface UserListProps {
  members: ChatChannelMember[];
}

export default function UserList({ members }: UserListProps) {
  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getUserStatus = (member: ChatChannelMember) => {
    const status = member.user?.chat_user_status?.status || 'offline';
    return {
      online: { color: 'bg-green-500', label: 'Online' },
      away: { color: 'bg-yellow-500', label: 'Away' },
      busy: { color: 'bg-red-500', label: 'Busy' },
      offline: { color: 'bg-gray-400', label: 'Offline' }
    }[status];
  };

  const groupedMembers = members.reduce((acc, member) => {
    const status = member.user?.chat_user_status?.status || 'offline';
    if (!acc[status]) acc[status] = [];
    acc[status].push(member);
    return acc;
  }, {} as Record<string, ChatChannelMember[]>);

  const statusOrder = ['online', 'away', 'busy', 'offline'];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h4 className="font-semibold text-sm">Members ({members.length})</h4>
        
        {statusOrder.map((status) => {
          const statusMembers = groupedMembers[status];
          if (!statusMembers || statusMembers.length === 0) return null;
          
          const statusInfo = getUserStatus(statusMembers[0]);
          
          return (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <div className={cn("h-2 w-2 rounded-full", statusInfo?.color)} />
                <span>{statusInfo?.label} — {statusMembers.length}</span>
              </div>
              
              <div className="space-y-1">
                {statusMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(member.user?.email || 'UN')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                        statusInfo?.color
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {member.user?.email.split('@')[0]}
                        </p>
                        {member.role !== 'member' && (
                          <Badge variant="secondary" className="text-xs">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                      {member.user?.chat_user_status?.custom_status && (
                        <p className="text-xs text-muted-foreground truncate">
                          {member.user.chat_user_status.custom_status}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}