// src/components/shared/chats/lib/chatsApi.js - Updated for Backend Integration with dayjs

import { apiClient } from "../../../../lib/api.js";
import { formatChatTime, getCurrentTime, getCurrentTimestamp, isMoreRecent } from "../utils/dateUtils";

// Get current user safely
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const chatsApi = {
  // Get chat histories (for sidebar) - Fixed duplicate sessions
  async getChatHistories() {
    try {
      console.log('📋 getChatHistories - Starting request...');
      const response = await apiClient.get('/chat/histories');
      console.log('📋 getChatHistories - Response received:', response.data);
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const userRole = currentUser?.role;
        const currentUserId = currentUser?.id;
        
        console.log('📋 getChatHistories - Current user:', { currentUser, userRole, currentUserId });
        console.log('📋 getChatHistories - Raw data:', response.data.data);
        
        // ✅ Group by sessionId and get latest message
        const sessionMap = new Map();
        
        response.data.data.forEach((item, index) => {
          const sessionId = item.sessionId;
          const lastMessage = item.lastMessage;
          
          console.log(`📋 Processing item ${index}:`, {
            sessionId,
            lastMessage: lastMessage?.message || 'null',
            createdAt: lastMessage?.createdAt || item.createdAt
          });
          
          if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, item);
          } else {
            // Compare and keep the latest
            const existing = sessionMap.get(sessionId);
            const existingTime = existing.lastMessage?.createdAt || existing.createdAt;
            const currentTime = lastMessage?.createdAt || item.createdAt;
            
            // ✅ Only update if we have a valid time comparison
            if (existingTime && currentTime && isMoreRecent(currentTime, existingTime)) {
              sessionMap.set(sessionId, item);
            } else if (!existingTime && currentTime) {
              // If existing has no time but current has time, prefer current
              sessionMap.set(sessionId, item);
            } else if (lastMessage?.message && !existing.lastMessage?.message) {
              // If current has message but existing doesn't, prefer current
              sessionMap.set(sessionId, item);
            }
          }
        });
        
        console.log('📋 Unique sessions after grouping:', sessionMap.size);
        
        const sessions = Array.from(sessionMap.values()).map(session => {
          const lastMessage = session.lastMessage;
          let displayName, displayAvatar;
          
          // ✅ Handle case where backend doesn't return client/psychologist objects
          if (lastMessage && lastMessage.senderFullName) {
            // Use lastMessage sender info if available
            displayName = lastMessage.senderFullName;
            displayAvatar = lastMessage.senderProfilePicture;
          } else {
            // ✅ Fallback for sessions without lastMessage (pending sessions)
            if (userRole === 'psychologist') {
              // Psychologist sees client, but we don't have client object from backend
              displayName = `Client ${session.clientId.slice(-8)}`; // Show last 8 chars of client ID
              displayAvatar = null;
            } else {
              // ✅ Client sees psychologist, but we don't have psychologist object from backend  
              // For client view, we want to show psychologist name, not client name
              displayName = `Psychologist ${session.psychologistId.slice(-8)}`; // Show last 8 chars of psychologist ID
              displayAvatar = null;
            }
          }

          console.log(`📋 Session ${session.sessionId}:`, {
            displayName,
            userRole,
            lastMessageSender: lastMessage?.senderFullName,
            status: session.status
          });

          // ✅ Check unread messages - handle null lastMessage and don't count own messages as unread
          const hasUnreadMessage = lastMessage && 
            lastMessage.message && 
            lastMessage.senderId !== currentUserId && // ✅ Not from current user
            (!lastMessage.isRead || lastMessage.isRead === false); // ✅ Explicitly check isRead

          console.log(`📋 Unread check for ${session.sessionId}:`, {
            hasLastMessage: !!lastMessage,
            hasMessage: !!lastMessage?.message,
            isNotFromMe: lastMessage?.senderId !== currentUserId,
            isUnread: !lastMessage?.isRead || lastMessage?.isRead === false,
            finalResult: hasUnreadMessage
          });

          // ✅ Use formatChatTime for proper time display
          const timeToDisplay = lastMessage?.createdAt ? 
            formatChatTime(lastMessage.createdAt) : 
            formatChatTime(session.createdAt);

          return {
            id: session.sessionId,
            sessionId: session.sessionId,
            name: displayName,
            avatar: displayAvatar,
            lastMessage: lastMessage?.message || (session.status === 'pending' ? 'Waiting for session to start...' : 'Tap to start chatting'),
            time: timeToDisplay,
            isActive: session.isActive,
            isChatEnabled: session.status === 'active' || session.status === 'pending',
            status: session.status,
            isTeamChat: false,
            unreadCount: hasUnreadMessage ? 1 : 0,
            hasUnread: hasUnreadMessage,
            // ✅ Store IDs for reference
            clientId: session.clientId,
            psychologistId: session.psychologistId
          };
        });

        console.log('📋 Processed sessions:', sessions);

        // Add Team RuangDiri session
        const teamSession = {
          id: 'team-ruangdiri',
          sessionId: 'team-ruangdiri',
          name: 'Team RuangDiri',
          avatar: null,
          lastMessage: 'AI Assistant - Always available',
          time: getCurrentTime(),
          isActive: true,
          isChatEnabled: true,
          isTeamChat: true,
          status: 'active',
          unreadCount: 0,
          hasUnread: false
        };

        const finalResult = [teamSession, ...sessions];
        console.log('📋 Final result with team session:', finalResult);
        
        return finalResult;
      }
      
      console.log('❌ getChatHistories - Response status not success:', response.data);
      throw new Error(response.data?.message || 'Failed to fetch chat histories');
    } catch (error) {
      console.error('Error fetching chat histories:', error);
      
      // Return at least team session on error
      return [{
        id: 'team-ruangdiri',
        sessionId: 'team-ruangdiri',
        name: 'Team RuangDiri',
        avatar: null,
        lastMessage: 'AI Assistant - Always available',
        time: getCurrentTime(),
        isActive: true,
        isChatEnabled: true,
        isTeamChat: true,
        isOnline: true,
        status: 'active',
        isAIAssistant: true,
        unreadCount: 0,
        hasUnread: false
      }];
    }
  },

  // Get messages (for chat main) - Fixed time format
  async getMessages(sessionId, cursor = null, limit = 10) {
    try {
      if (sessionId === 'team-ruangdiri') {
        return [
          {
            id: '1',
            text: "Hello, roomies!\n\nSelamat datang di Ruang Bantu.\nApakah ada yang bisa kami bantu?\nUntuk mempermudah keperluan roomies,\nkamu dapat memilih tiga opsi di bawah ini:",
            time: getCurrentTime(),
            timestamp: getCurrentTimestamp(),
            isUser: false,
            sender: {
              id: 'team-ai',
              name: 'Team RuangDiri',
              role: 'ai_assistant'
            },
            messageType: 'ai_welcome',
            showOptions: true
          }
        ];
      }

      const params = { sessionId, limit };
      if (cursor) params.cursor = cursor;

      const response = await apiClient.get('/chat/history', { params });
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        return response.data.data.map(msg => ({
          id: msg.id,
          sessionId: msg.sessionId,
          text: msg.message,
          time: formatChatTime(msg.createdAt), // ✅ Use formatChatTime for consistent display
          timestamp: msg.createdAt, // ✅ Keep original timestamp from backend
          isUser: msg.senderId === currentUserId,
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.senderId === currentUserId ? 'You' : (msg.sender?.fullName || 'Unknown'),
            role: msg.sender?.role || 'user',
            profilePicture: msg.sender?.profilePicture
          },
          senderId: msg.senderId,
          messageType: msg.messageType || 'text',
          isRead: msg.isRead
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
      if (sessionId === 'team-ruangdiri') {
        return {
          id: Date.now().toString(),
          text: content,
          time: getCurrentTime(),
          timestamp: getCurrentTimestamp(),
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
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        return {
          id: msg.id,
          text: msg.message,
          time: formatChatTime(msg.createdAt), // ✅ Use formatChatTime
          timestamp: msg.createdAt, // ✅ Keep original backend timestamp
          isUser: msg.senderId === currentUserId,
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.senderId === currentUserId ? 'You' : (msg.sender?.fullName || 'Unknown'),
            role: msg.sender?.role || 'user',
            profilePicture: msg.sender?.profilePicture
          },
          messageType: msg.messageType || 'text',
          isRead: msg.isRead
        };
      }
      
      throw new Error(response.data?.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // ✅ Mark as read - Updated endpoint
  async markAsRead(sessionId) {
    if (sessionId === 'team-ruangdiri') return;

    try {
      const response = await apiClient.put(`/chat/sessions/${sessionId}/read`);
      
      if (response.data?.status === 'success') {
        console.log('✅ Marked session as read:', sessionId);
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to mark as read');
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      throw error;
    }
  },

  // Get active sessions - DEPRECATED, use getChatHistories instead
  async getActiveSessions() {
    console.warn('⚠️ getActiveSessions is deprecated, use getChatHistories instead');
    return this.getChatHistories();
  },

  // End session
  async endSession(sessionId) {
    try {
      const response = await apiClient.put(`/chat/sessions/${sessionId}/end`);
      
      if (response.data?.status === 'success') {
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to end session');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // AI response generator
  generateAIResponse(userInput) {
    const input = userInput.toLowerCase();
    
    if (input.includes('halo') || input.includes('hai')) {
      return "Halo! Selamat datang di RuangDiri. Ada yang bisa saya bantu? 😊";
    }
    
    if (input.includes('konseling') || input.includes('booking')) {
      return "Untuk booking sesi konseling, silakan pilih layanan yang sesuai dengan kebutuhan Anda.";
    }
    
    return "Terima kasih sudah bercerita! Ada yang bisa saya bantu lagi? 😊";
  },

  // Handle AI service selection
  async handleAIServiceSelection(option) {
    const responses = {
      'Ruang Cerita': {
        message: "🌟 Ruang Cerita sedang dalam pengembangan. Fitur untuk berbagi cerita akan segera hadir!",
        actions: ['Book Konseling', 'Info Lebih Lanjut']
      },
      'Booking Sesi Konseling': {
        message: "📅 Pilihan sesi konseling:\n\n• 💻 Online Video Call\n• 💬 Online Chat\n• 🏢 Offline",
        actions: ['Video Call', 'Chat', 'Offline']
      },
      'FAQ (Frequently Asked Questions)': {
        message: "❓ Pertanyaan yang sering ditanyakan telah tersedia.",
        actions: ['Hubungi Support', 'Kembali']
      }
    };

    return responses[option] || {
      message: "Terima kasih! Ada yang bisa saya bantu lagi?",
      actions: ['Kembali ke Menu']
    };
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
      
      // ✅ Handle specific cases where session cannot have Ably token
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '';
        
        if (errorMessage.includes('completed') || errorMessage.includes('ended')) {
          console.log('🔒 Session is completed/ended, cannot generate Ably token');
          return null; // Return null instead of throwing error
        }
        
        if (errorMessage.includes('inactive') || errorMessage.includes('disabled')) {
          console.log('⏸️ Session is inactive, cannot generate Ably token');
          return null;
        }
      }
      
      throw error;
    }
  },

  // Send typing indicator
  async sendTypingIndicator(sessionId, isTyping) {
    if (sessionId === 'team-ruangdiri') return;

    try {
      await apiClient.post('/chat/typing', { sessionId, isTyping });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }
};