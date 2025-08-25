// src/components/shared/chats/lib/chatsApi.js - FIXED: Unread Count API

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
  // ✅ FIXED: Get chat histories with total unread count
  async getChatHistories() {
    try {
      console.log('📋 getChatHistories - Starting request...');
      
      // ✅ NEW: Get total unread counts first
      let totalUnreadData = {};
      try {
        const unreadResponse = await apiClient.get('/chat/unread-count/total');
        if (unreadResponse.data?.status === 'success') {
          totalUnreadData = unreadResponse.data.data;
          console.log('📋 Total unread data:', totalUnreadData);
        }
      } catch (error) {
        console.warn('Failed to get total unread count:', error);
      }
      
      const response = await apiClient.get('/chat/histories');
      console.log('📋 getChatHistories - Response received:', response.data);
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        console.log('📋 getChatHistories - Current user:', { currentUser, currentUserId });
        
        // Access correct nested data structure
        const sessionsData = response.data.data.data || [];
        console.log('📋 getChatHistories - Sessions data:', sessionsData);
        
        const sessions = sessionsData.map((session) => {
          const lastMessage = session.lastMessage;
          let displayName, displayAvatar;
          
          // Determine display name based on current user ID
          if (currentUserId === session.clientId) {
            // Current user is client, show psychologist info
            displayName = session.psychologist?.fullName || `Psychologist ${session.psychologistId?.slice(-8) || 'Unknown'}`;
            displayAvatar = session.psychologist?.profilePicture;
          } else if (currentUserId === session.psychologistId) {
            // Current user is psychologist, show client info  
            displayName = session.client?.fullName || `Client ${session.clientId?.slice(-8) || 'Unknown'}`;
            displayAvatar = session.client?.profilePicture;
          } else {
            // Fallback
            displayName = session.client?.fullName || session.psychologist?.fullName || 'Unknown';
            displayAvatar = session.client?.profilePicture || session.psychologist?.profilePicture;
          }

          // ✅ FIXED: Get unread count from total API data
          const unreadCount = parseInt(totalUnreadData.sessionUnreadCounts?.[session.sessionId] || '0');

          // Check unread messages properly
          const hasUnreadMessage = lastMessage && 
            lastMessage.message && 
            lastMessage.senderId !== currentUserId && 
            unreadCount > 0;

          // ✅ FIXED: Render REAL last message with sender name
          let lastMessageText = 'No messages yet';
          if (lastMessage && lastMessage.message) {
            // Show who sent the message for clarity
            const senderName = lastMessage.senderId === currentUserId ? 'You' : lastMessage.senderFullName;
            lastMessageText = `${senderName}: ${lastMessage.message}`;
          } else if (session.status === 'pending') {
            lastMessageText = 'Waiting for session to start...';
          }

          console.log(`📋 Session ${session.sessionId}:`, {
            displayName,
            lastMessageText,
            unreadCount,
            hasUnread: hasUnreadMessage,
            lastMessageSender: lastMessage?.senderFullName,
            status: session.status
          });

          // Use formatChatTime for proper time display
          const timeToDisplay = lastMessage?.createdAt ? 
            formatChatTime(lastMessage.createdAt) : 
            formatChatTime(session.createdAt);

          return {
            id: session.sessionId,
            sessionId: session.sessionId,
            name: displayName,
            avatar: displayAvatar,
            lastMessage: lastMessageText, // Real last message
            time: timeToDisplay,
            isActive: session.isActive,
            isChatEnabled: session.status === 'active' || session.status === 'pending',
            status: session.status,
            isTeamChat: false,
            unreadCount: unreadCount, // From total API
            hasUnread: hasUnreadMessage, // Proper unread logic
            // Store IDs for reference
            clientId: session.clientId,
            psychologistId: session.psychologistId,
            // Store last message details for future use
            lastMessageData: lastMessage
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
        status: 'active',
        unreadCount: 0,
        hasUnread: false
      }];
    }
  },

  // ✅ NEW: Get total unread count
  async getTotalUnreadCount() {
    try {
      console.log('🔢 Getting total unread count...');
      const response = await apiClient.get('/chat/unread-count/total');
      
      if (response.data?.status === 'success') {
        console.log('✅ Total unread count response:', response.data);
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to get total unread count');
    } catch (error) {
      console.error('❌ Error getting total unread count:', error);
      return { 
        totalUnread: '0', 
        sessionUnreadCounts: {} 
      };
    }
  },

  // ✅ REMOVED: Individual session unread count (using total now)
  // async getUnreadCount(sessionId) - DEPRECATED

  // Get active sessions - don't override lastMessage
  async getActiveSessions() {
    try {
      console.log('🔄 Getting active sessions...');
      const response = await apiClient.get('/chat/sessions/active');
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        console.log('✅ Active sessions response:', response.data);
        
        return response.data.data.map(session => {
          // Determine display info based on current user
          let displayName, displayAvatar;
          
          if (currentUserId === session.client?.id) {
            // Current user is client, show psychologist info
            displayName = session.psychologist?.fullName || 'Psychologist';
            displayAvatar = session.psychologist?.profilePicture;
          } else if (currentUserId === session.psychologist?.id) {
            // Current user is psychologist, show client info  
            displayName = session.client?.fullName || 'Client';
            displayAvatar = session.client?.profilePicture;
          } else {
            // Fallback
            displayName = session.client?.fullName || session.psychologist?.fullName || 'Unknown';
            displayAvatar = session.client?.profilePicture || session.psychologist?.profilePicture;
          }

          return {
            id: session.id,
            sessionId: session.id,
            name: displayName,
            avatar: displayAvatar,
            lastMessage: 'Active session ready', // Don't override with generic message
            time: formatChatTime(session.updatedAt || session.createdAt),
            isActive: session.isActive,
            isChatEnabled: session.status === 'active' && session.isActive,
            status: session.status,
            isTeamChat: false,
            unreadCount: 0, // Active sessions endpoint doesn't provide unread count
            hasUnread: false,
            // Store IDs for reference
            clientId: session.client?.id,
            psychologistId: session.psychologist?.id,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          };
        });
      }
      
      throw new Error(response.data?.message || 'Failed to fetch active sessions');
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }
  },

  // Get messages (for chat main) - correct endpoint with sessionId
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

      console.log('📨 Getting messages for session:', sessionId, 'with params:', params);
      const response = await apiClient.get('/chat/history', { params });
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        console.log('📨 Messages response:', response.data);
        
        return response.data.data.map(msg => ({
          id: msg.id,
          sessionId: msg.sessionId,
          text: msg.message,
          time: formatChatTime(msg.createdAt),
          timestamp: msg.createdAt,
          isUser: msg.senderId === currentUserId,
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.senderId === currentUserId ? 'You' : (msg.sender?.fullName || 'Unknown'),
            role: msg.sender?.role || 'user',
            profilePicture: msg.sender?.profilePicture
          },
          senderId: msg.senderId,
          messageType: msg.messageType || 'text',
          isRead: msg.isRead,
          // Handle attachments
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          attachmentName: msg.attachmentName,
          attachmentSize: msg.attachmentSize
        }));
      }
      
      throw new Error(response.data?.message || 'Failed to fetch messages');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send message - text only
  async sendMessage(sessionId, content, messageType = 'text') {
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
        messageType
      });
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        return {
          id: msg.id,
          text: msg.message,
          time: formatChatTime(msg.createdAt),
          timestamp: msg.createdAt,
          isUser: msg.senderId === currentUserId,
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.senderId === currentUserId ? 'You' : (msg.sender?.fullName || 'Unknown'),
            role: msg.sender?.role || 'user',
            profilePicture: msg.sender?.profilePicture
          },
          messageType: msg.messageType || 'text',
          isRead: msg.isRead,
          // Handle attachments
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          attachmentName: msg.attachmentName,
          attachmentSize: msg.attachmentSize
        };
      }
      
      throw new Error(response.data?.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // ✅ NEW: Upload file first (separate from sending message)
  async uploadFile(file) {
    try {
      // Validate file
      this.validateFile(file);
      
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const response = await apiClient.post('/chat/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data?.status === 'success') {
        console.log('✅ File uploaded successfully:', response.data);
        return response.data.data; // Return file URL and metadata
      }
      
      throw new Error(response.data?.message || 'Failed to upload file');
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Send file/image message
  async sendFileMessage(sessionId, file, messageType = 'file') {
    try {
      if (sessionId === 'team-ruangdiri') {
        throw new Error('File upload not supported for AI assistant');
      }

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('message', file);
      formData.append('messageType', messageType);

      console.log('📤 Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        sessionId,
        messageType
      });

      const response = await apiClient.post('/chat/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        return {
          id: msg.id,
          text: msg.message || `Uploaded: ${file.name}`,
          time: formatChatTime(msg.createdAt),
          timestamp: msg.createdAt,
          isUser: msg.senderId === currentUserId,
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.senderId === currentUserId ? 'You' : (msg.sender?.fullName || 'Unknown'),
            role: msg.sender?.role || 'user',
            profilePicture: msg.sender?.profilePicture
          },
          messageType: msg.messageType || messageType,
          isRead: msg.isRead,
          // File attachment data
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          attachmentName: msg.attachmentName,
          attachmentSize: msg.attachmentSize
        };
      }
      
      throw new Error(response.data?.message || 'Failed to upload file');
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Mark as read
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
          channels: response.data.data.channels,
          sessionId: response.data.data.sessionId,
          expiresAt: response.data.data.expiresAt
        };
      }
      
      throw new Error(response.data?.message || 'Failed to get Ably token');
    } catch (error) {
      console.error('Error getting Ably token:', error);
      
      // Handle specific cases where session cannot have Ably token
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '';
        
        if (errorMessage.includes('completed') || errorMessage.includes('ended')) {
          console.log('🔒 Session is completed/ended, cannot generate Ably token');
          return null;
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
      await apiClient.post('/chat/typing', { 
        sessionId, 
        isTyping 
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
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

  // ✅ ENHANCED: Validate file for upload with 15MB limit
  validateFile(file) {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 15MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Supported types: Images, PDF, DOC, XLS, PPT, ZIP, RAR');
    }

    return true;
  },

  // Helper: Get file type category
  getFileTypeCategory(file) {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type === 'application/pdf') {
      return 'document';
    } else if (file.type.includes('word') || file.type.includes('excel') || file.type.includes('powerpoint') || file.type === 'text/plain') {
      return 'document';
    } else if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) {
      return 'archive';
    }
    return 'file';
  }
};