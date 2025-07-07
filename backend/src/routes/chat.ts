import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabaseClient';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Apply authentication to all chat routes
router.use(authenticate);

// Schema validations
const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['public', 'private']),
  memberIds: z.array(z.string().uuid()).optional()
});

const sendMessageSchema = z.object({
  channelId: z.string().uuid(),
  content: z.string().min(1).max(4000),
  type: z.enum(['text', 'file', 'image']).default('text'),
  parentMessageId: z.string().uuid().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileSize: z.number(),
    fileType: z.string(),
    fileUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional()
  })).optional()
});

const updateMessageSchema = z.object({
  content: z.string().min(1).max(4000)
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional()
});

// Get all channels for the user
router.get('/channels', async (req, res) => {
  try {
    const userId = req.user!.sub;

    // Get channels where user is a member
    const { data: channels, error } = await supabase
      .from('chat_channels')
      .select(`
        *,
        chat_channel_members!inner(
          user_id,
          role,
          joined_at,
          notifications_enabled
        ),
        _message_count:chat_messages(count),
        _member_count:chat_channel_members(count),
        last_message:chat_messages(
          id,
          content,
          type,
          created_at,
          sender:users!sender_id(
            id,
            email,
            user_metadata
          )
        )
      `)
      .eq('chat_channel_members.user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .order('created_at', { foreignTable: 'chat_messages', ascending: false })
      .limit(1, { foreignTable: 'chat_messages' });

    if (error) throw error;

    // Get unread counts for each channel
    const channelsWithUnread = await Promise.all(
      channels.map(async (channel) => {
        const { data: unreadCount } = await supabase
          .rpc('get_unread_message_count', { p_channel_id: channel.id });
        
        return {
          ...channel,
          unread_count: unreadCount || 0,
          last_message: channel.last_message?.[0] || null
        };
      })
    );

    res.json({ success: true, data: channelsWithUnread });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
});

// Create a new channel
router.post('/channels', validateRequest(createChannelSchema), async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { name, description, type, memberIds = [] } = req.body;

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    // Create channel
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .insert({
        org_id: userData.org_id,
        name,
        description,
        type,
        created_by: userId
      })
      .select()
      .single();

    if (channelError) throw channelError;

    // Add creator as admin
    const membersToAdd = [
      { channel_id: channel.id, user_id: userId, role: 'admin' },
      ...memberIds.map(memberId => ({
        channel_id: channel.id,
        user_id: memberId,
        role: 'member' as const
      }))
    ];

    const { error: membersError } = await supabase
      .from('chat_channel_members')
      .insert(membersToAdd);

    if (membersError) throw membersError;

    // Send system message
    await supabase
      .from('chat_messages')
      .insert({
        channel_id: channel.id,
        sender_id: userId,
        content: `${req.user!.email} created the channel`,
        type: 'system'
      });

    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ success: false, error: 'Failed to create channel' });
  }
});

// Get channel details with members
router.get('/channels/:channelId', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { channelId } = req.params;

    // Check if user is a member
    const { data: membership } = await supabase
      .from('chat_channel_members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Not a member of this channel' });
    }

    // Get channel details with members
    const { data: channel, error } = await supabase
      .from('chat_channels')
      .select(`
        *,
        members:chat_channel_members(
          *,
          user:users(
            id,
            email,
            user_metadata,
            chat_user_status(
              status,
              custom_status,
              last_seen_at
            )
          )
        )
      `)
      .eq('id', channelId)
      .single();

    if (error) throw error;

    res.json({ success: true, data: { ...channel, current_user_role: membership.role } });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch channel' });
  }
});

// Get messages for a channel
router.get('/channels/:channelId/messages', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user is a member
    const { data: membership } = await supabase
      .from('chat_channel_members')
      .select('user_id')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Not a member of this channel' });
    }

    // Build query
    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id(
          id,
          email,
          user_metadata
        ),
        attachments:chat_attachments(*),
        parent_message:chat_messages!parent_message_id(
          id,
          content,
          sender:users!sender_id(
            id,
            email,
            user_metadata
          )
        )
      `)
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    // Mark channel as read
    await supabase.rpc('update_channel_last_read', { p_channel_id: channelId });

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/messages', validateRequest(sendMessageSchema), async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { channelId, content, type, parentMessageId, attachments } = req.body;

    // Check if user is a member
    const { data: membership } = await supabase
      .from('chat_channel_members')
      .select('user_id')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Not a member of this channel' });
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        sender_id: userId,
        content,
        type,
        parent_message_id: parentMessageId
      })
      .select(`
        *,
        sender:users!sender_id(
          id,
          email,
          user_metadata
        )
      `)
      .single();

    if (messageError) throw messageError;

    // Add attachments if any
    if (attachments && attachments.length > 0) {
      const attachmentData = attachments.map(att => ({
        message_id: message.id,
        file_name: att.fileName,
        file_size: att.fileSize,
        file_type: att.fileType,
        file_url: att.fileUrl,
        thumbnail_url: att.thumbnailUrl
      }));

      const { error: attachmentError } = await supabase
        .from('chat_attachments')
        .insert(attachmentData);

      if (attachmentError) throw attachmentError;
    }

    // Update channel's updated_at
    await supabase
      .from('chat_channels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', channelId);

    // Create notifications for mentions
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      // Implementation for mention notifications would go here
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Update a message
router.put('/messages/:messageId', validateRequest(updateMessageSchema), async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { messageId } = req.params;
    const { content } = req.body;

    // Check if user is the sender
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('sender_id, created_at')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ success: false, error: 'Cannot edit other users\' messages' });
    }

    // Check if message is within edit window (24 hours)
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    if (messageAge > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ success: false, error: 'Cannot edit messages older than 24 hours' });
    }

    // Update message
    const { data: updated, error: updateError } = await supabase
      .from('chat_messages')
      .update({ content, is_edited: true })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ success: false, error: 'Failed to update message' });
  }
});

// Delete a message (soft delete)
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { messageId } = req.params;

    // Check if user is the sender
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ success: false, error: 'Cannot delete other users\' messages' });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true, content: '[Message deleted]' })
      .eq('id', messageId);

    if (deleteError) throw deleteError;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

// Add/update message reaction
router.post('/messages/:messageId/reactions', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, error: 'Emoji is required' });
    }

    // Get current reactions
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Update reactions
    const reactions = message.reactions || [];
    const existingReaction = reactions.find((r: any) => r.emoji === emoji);

    if (existingReaction) {
      if (existingReaction.users.includes(userId)) {
        // Remove user from reaction
        existingReaction.users = existingReaction.users.filter((u: string) => u !== userId);
        if (existingReaction.users.length === 0) {
          // Remove reaction if no users left
          reactions.splice(reactions.indexOf(existingReaction), 1);
        }
      } else {
        // Add user to reaction
        existingReaction.users.push(userId);
      }
    } else {
      // Add new reaction
      reactions.push({ emoji, users: [userId] });
    }

    // Save updated reactions
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ reactions })
      .eq('id', messageId);

    if (updateError) throw updateError;

    res.json({ success: true, data: reactions });
  } catch (error) {
    console.error('Error updating reaction:', error);
    res.status(500).json({ success: false, error: 'Failed to update reaction' });
  }
});

// Create or get direct message channel
router.post('/channels/direct', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { otherUserId } = req.body;

    if (!otherUserId || typeof otherUserId !== 'string') {
      return res.status(400).json({ success: false, error: 'Other user ID is required' });
    }

    // Use the database function to create/get DM channel
    const { data: channelId, error } = await supabase
      .rpc('create_direct_message_channel', { p_other_user_id: otherUserId });

    if (error) throw error;

    // Get channel details
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select(`
        *,
        members:chat_channel_members(
          *,
          user:users(
            id,
            email,
            user_metadata
          )
        )
      `)
      .eq('id', channelId)
      .single();

    if (channelError) throw channelError;

    res.json({ success: true, data: channel });
  } catch (error) {
    console.error('Error creating direct channel:', error);
    res.status(500).json({ success: false, error: 'Failed to create direct channel' });
  }
});

// Update user status
router.put('/status', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { status, customStatus } = req.body;

    const validStatuses = ['online', 'away', 'busy', 'offline'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const { error } = await supabase
      .from('chat_user_status')
      .upsert({
        user_id: userId,
        status: status || 'online',
        custom_status: customStatus,
        last_seen_at: new Date().toISOString()
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// Mark typing indicator
router.post('/typing', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { channelId, isTyping } = req.body;

    if (!channelId) {
      return res.status(400).json({ success: false, error: 'Channel ID is required' });
    }

    const { error } = await supabase
      .from('chat_user_status')
      .upsert({
        user_id: userId,
        is_typing_in_channel: isTyping ? channelId : null,
        typing_started_at: isTyping ? new Date().toISOString() : null
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating typing status:', error);
    res.status(500).json({ success: false, error: 'Failed to update typing status' });
  }
});

export default router;