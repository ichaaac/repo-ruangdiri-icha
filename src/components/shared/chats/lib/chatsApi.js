// src/components/shared/chats/lib/chatsApi.js - Clean API Layer

import { apiClient } from "../../../../lib/api.js";

export const chatsApi = {
  // Get active chat sessions
  async getActiveSessions() {
    try {
      const response = await apiClient.get('/chat/sessions/active');
      
      if (response.data?.status === 'success') {
        const sessions = response.data.data.map(session => ({
          id: session.id,
          sessionId: session.id,
          name: session.psychologist?.fullName || 'Chat Session',
          avatar: '/empty-profile.svg',
          lastMessage: 'Tap to start chatting',
          time: new Date(session.scheduledAt || session.createdAt).toLocaleTimeString("id-ID", {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isActive: session.isActive,
          isChatEnabled: session.isChatEnabled,
          isOnline: session.isActive && session.isChatEnabled,
          status: session.status,
          psychologist: session.psychologist,
          clientId: session.clientId,
          psychologistId: session.psychologistId,
          counselingId: session.counselingId
        }));

        // Add Team Ruang Diri session first
        const teamSession = {
          id: 'team-ruangdiri',
          sessionId: 'team-ruangdiri',
          name: 'Team Ruang Diri',
          avatar: null,
          lastMessage: 'You : Chat with Team Ruang Diri',
          time: '09:00',
          isActive: true,
          isChatEnabled: true,
          isTeamChat: true,
          isOnline: true,
          status: 'active'
        };

        return [teamSession, ...sessions];
      }
      
      throw new Error(response.data?.message || 'Failed to fetch sessions');
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      
      // Return team session as fallback
      return [{
        id: 'team-ruangdiri',
        sessionId: 'team-ruangdiri',
        name: 'Team Ruang Diri',
        avatar: null,
        lastMessage: 'You : Chat with Team Ruang Diri',
        time: '09:00',
        isActive: true,
        isChatEnabled: true,
        isTeamChat: true,
        isOnline: true,
        status: 'active'
      }];
    }
  },

  // Get chat history
  async getMessages(sessionId) {
    try {
      // Handle team session with automated message
      if (sessionId === 'team-ruangdiri') {
        return [
          {
            id: '1',
            text: "Hi There! i'm your assistant\nWhat would you like to discuss?",
            time: '09:20',
            timestamp: new Date().toISOString(),
            isUser: false,
            sender: {
              id: 'team',
              name: 'Team Ruang Diri',
              role: 'team'
            },
            messageType: 'automated',
            showOptions: true
          }
        ];
      }

      const response = await apiClient.get('/chat/history', {
        params: {
          sessionId,
          limit: 50
        }
      });
      
      if (response.data?.status === 'success') {
        return response.data.data.map(msg => ({
          id: msg.id,
          sessionId: msg.sessionId,
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString("id-ID", {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: msg.createdAt,
          isUser: msg.sender?.role !== 'psychologist',
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.sender?.fullName || 'Unknown',
            role: msg.sender?.role || 'user'
          },
          senderId: msg.senderId,
          messageType: msg.messageType,
          isRead: msg.isRead,
          isAutomated: msg.messageType === 'automated'
        }));
      }
      
      throw new Error(response.data?.message || 'Failed to fetch messages');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send message
  async sendMessage(sessionId, content) {
    try {
      // Handle team session
      if (sessionId === 'team-ruangdiri') {
        return {
          id: Date.now().toString(),
          text: content,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: new Date().toISOString(),
          isUser: true,
          sender: {
            id: 'current-user',
            name: 'You',
            role: 'user'
          },
          messageType: 'text'
        };
      }

      const response = await apiClient.post('/chat/messages', {
        sessionId,
        message: content,
        messageType: 'text'
      });
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        return {
          id: msg.id,
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString("id-ID", {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: msg.createdAt,
          isUser: msg.sender?.role !== 'psychologist',
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.sender?.fullName || 'You',
            role: msg.sender?.role || 'user'
          },
          messageType: msg.messageType
        };
      }
      
      throw new Error(response.data?.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get Ably token
  async getAblyToken(sessionId) {
    if (sessionId === 'team-ruangdiri') return null;

    try {
      const response = await apiClient.get('/chat/ably-token', {
        params: { sessionId }
      });
      
      if (response.data?.status === 'success') {
        return {
          token: response.data.data.token,
          channels: response.data.data.channels
        };
      }
      
      throw new Error(response.data?.message || 'Failed to get Ably token');
    } catch (error) {
      console.error('Error getting Ably token:', error);
      throw error;
    }
  },

  // Mark as read
  async markAsRead(sessionId) {
    if (sessionId === 'team-ruangdiri') return;

    try {
      await apiClient.put(`/chat/sessions/${sessionId}/read`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }
};