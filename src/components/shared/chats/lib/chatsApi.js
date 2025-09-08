// src/components/shared/chats/lib/chatsApi.js - FIXED: Using New Encryption

import { apiClient } from "../../../../lib/api.js";
import { formatChatTime, getCurrentTime, getCurrentTimestamp } from "../utils/dateUtils";
import chatEncryption from './encryption'; // FIXED: Import new encryption

// Get current user safely
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const chatsApi = {
  // Get chat histories with total unread count
  async getChatHistories() {
    try {
      console.log('📋 getChatHistories - Starting request...');
      
      // Get total unread counts first
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
            displayName = session.psychologist?.fullName || `Psychologist ${session.psychologistId?.slice(-8) || 'Unknown'}`;
            displayAvatar = session.psychologist?.profilePicture;
          } else if (currentUserId === session.psychologistId) {
            displayName = session.client?.fullName || `Client ${session.clientId?.slice(-8) || 'Unknown'}`;
            displayAvatar = session.client?.profilePicture;
          } else {
            displayName = session.client?.fullName || session.psychologist?.fullName || 'Unknown';
            displayAvatar = session.client?.profilePicture || session.psychologist?.profilePicture;
          }

          // Get unread count from total API data
          const unreadCount = parseInt(totalUnreadData.sessionUnreadCounts?.[session.sessionId] || '0');

          // Check unread messages properly
          const hasUnreadMessage = lastMessage && 
            lastMessage.message && 
            lastMessage.senderId !== currentUserId && 
            unreadCount > 0;

          // Decrypt last message if it exists
          let lastMessageText = 'No messages yet';
          if (lastMessage && lastMessage.message) {
            try {
              const decryptedMessage = chatEncryption.decrypt(lastMessage.message, session.sessionId);
              const senderName = lastMessage.senderId === currentUserId ? 'You' : lastMessage.senderFullName;
              lastMessageText = `${senderName}: ${decryptedMessage}`;
              
              console.log('🔓 Decrypted last message:', {
                sessionId: session.sessionId,
                originalLength: lastMessage.message?.length || 0,
                decryptedLength: decryptedMessage?.length || 0
              });
            } catch (error) {
              console.warn('Failed to decrypt last message, using as-is:', error);
              const senderName = lastMessage.senderId === currentUserId ? 'You' : lastMessage.senderFullName;
              lastMessageText = `${senderName}: ${lastMessage.message}`;
            }
          } else if (session.status === 'pending') {
            lastMessageText = 'Waiting for session to start...';
          }

          // Use formatChatTime for proper time display
          const timeToDisplay = lastMessage?.createdAt ? 
            formatChatTime(lastMessage.createdAt) : 
            formatChatTime(session.createdAt);

          return {
            id: session.sessionId,
            sessionId: session.sessionId,
            name: displayName,
            avatar: displayAvatar,
            lastMessage: lastMessageText,
            time: timeToDisplay,
            isActive: session.isActive,
            isChatEnabled: session.status === 'active' || session.status === 'pending',
            status: session.status,
            isTeamChat: false,
            unreadCount: unreadCount,
            hasUnread: hasUnreadMessage,
            clientId: session.clientId,
            psychologistId: session.psychologistId,
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

  // Get active sessions
  async getActiveSessions() {
    try {
      console.log('🔄 Getting active sessions...');
      const response = await apiClient.get('/chat/sessions/active');
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        console.log('✅ Active sessions response:', response.data);
        
        return response.data.data.map(session => {
          let displayName, displayAvatar;
          
          if (currentUserId === session.client?.id) {
            displayName = session.psychologist?.fullName || 'Psychologist';
            displayAvatar = session.psychologist?.profilePicture;
          } else if (currentUserId === session.psychologist?.id) {
            displayName = session.client?.fullName || 'Client';
            displayAvatar = session.client?.profilePicture;
          } else {
            displayName = session.client?.fullName || session.psychologist?.fullName || 'Unknown';
            displayAvatar = session.client?.profilePicture || session.psychologist?.profilePicture;
          }

          return {
            id: session.id,
            sessionId: session.id,
            name: displayName,
            avatar: displayAvatar,
            lastMessage: 'Active session ready',
            time: formatChatTime(session.updatedAt || session.createdAt),
            isActive: session.isActive,
            isChatEnabled: session.status === 'active' && session.isActive,
            status: session.status,
            isTeamChat: false,
            unreadCount: 0,
            hasUnread: false,
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

  // Get messages with decryption support
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
        
        return response.data.data.map(msg => {
          // FIXED: Don't decrypt automated messages
          let decryptedMessage = msg.message;
          
          if (msg.messageType !== 'automated') {
            try {
              decryptedMessage = chatEncryption.decrypt(msg.message, sessionId);
              console.log('🔓 Message decrypted:', {
                messageId: msg.id,
                messageType: msg.messageType,
                wasEncrypted: msg.message !== decryptedMessage
              });
            } catch (error) {
              console.warn('Failed to decrypt message, using as-is:', error);
            }
          } else {
            console.log('⚡ Automated message, no decryption needed:', msg.id);
          }

          return {
            id: msg.id,
            sessionId: msg.sessionId,
            text: decryptedMessage,
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
            isRead: msg.isRead, // FIXED: Properly pass isRead status
            attachmentUrl: msg.attachmentUrl,
            attachmentType: msg.attachmentType,
            attachmentName: msg.attachmentName,
            attachmentSize: msg.attachmentSize,
            wasEncrypted: msg.messageType !== 'automated' && msg.message !== decryptedMessage
          };
        });
      }
      
      throw new Error(response.data?.message || 'Failed to fetch messages');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send message with encryption - NO ABLY BROADCAST
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

      // Encrypt message content before sending to backend
      let encryptedContent = content;
      let isEncrypted = false;
      
      try {
        encryptedContent = chatEncryption.encrypt(content, sessionId);
        isEncrypted = true;
        
        console.log('🔒 Message encrypted before sending to backend:', {
          sessionId: sessionId?.slice(-8),
          originalLength: content?.length || 0,
          encryptedLength: encryptedContent?.length || 0
        });
      } catch (error) {
        console.warn('Failed to encrypt message, sending plaintext:', error);
      }

      console.log('📤 Sending to POST /chat/messages...');
      const response = await apiClient.post('/chat/messages', {
        sessionId,
        message: encryptedContent,
        messageType
      });
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        // Decrypt message returned from backend
        let displayMessage = msg.message;
        try {
          displayMessage = chatEncryption.decrypt(msg.message, sessionId);
        } catch (error) {
          console.warn('Failed to decrypt returned message:', error);
        }
        
        const result = {
          id: msg.id,
          text: displayMessage,
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
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          attachmentName: msg.attachmentName,
          attachmentSize: msg.attachmentSize,
          wasEncrypted: isEncrypted
        };
        
        console.log('✅ Message sent via /chat/messages:', result);
        return result;
      }
      
      throw new Error(response.data?.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // FIXED: Send file message using EXACT Postman endpoint format
  async sendFileMessage(sessionId, file, messageType = 'file', caption = '') {
    try {
      if (sessionId === 'team-ruangdiri') {
        throw new Error('File upload not supported for AI assistant');
      }

      // Validate file first
      this.validateFile(file);

      // FIXED: Create FormData exactly like Postman screenshot
      const formData = new FormData();
      
      // FIXED: Use exact field names from Postman screenshot
      formData.append('sessionId', sessionId);
      formData.append('messageType', messageType);
      formData.append('file', file); // File field
      
      // FIXED: Handle message/caption field
      let messageToSend = caption?.trim() || file.name || 'File attachment';
      
      // Encrypt message/caption if provided and not just filename
      if (messageToSend && messageToSend !== file.name) {
        try {
          const encryptedMessage = chatEncryption.encrypt(messageToSend, sessionId);
          formData.append('message', encryptedMessage);
          console.log('🔒 File caption encrypted before upload');
        } catch (error) {
          console.warn('Failed to encrypt file caption:', error);
          formData.append('message', messageToSend);
        }
      } else {
        formData.append('message', messageToSend);
      }

      // Log the exact FormData being sent
      console.log('📤 FIXED: Uploading to /chat/messages/upload with FormData:', {
        endpoint: '/chat/messages/upload',
        sessionId,
        messageType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hasCaption: !!caption?.trim(),
        messageField: messageToSend
      });

      // FIXED: Use exact endpoint from Postman screenshot
      const response = await apiClient.post('/chat/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file upload
      });
      
      console.log('📤 Upload response received:', response.data);
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        // Decrypt message/caption if it exists
        let displayMessage = msg.message || `Uploaded: ${file.name}`;
        try {
          if (msg.message && msg.message !== file.name && msg.message !== messageToSend) {
            displayMessage = chatEncryption.decrypt(msg.message, sessionId);
            console.log('🔓 File caption decrypted');
          }
        } catch (error) {
          console.warn('Failed to decrypt file caption:', error);
        }
        
        console.log('✅ File uploaded successfully via /chat/messages/upload:', {
          messageId: msg.id,
          fileName: file.name,
          attachmentUrl: msg.attachmentUrl
        });
        
        const result = {
          id: msg.id,
          text: displayMessage,
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
          attachmentType: msg.attachmentType || file.type,
          attachmentName: msg.attachmentName || file.name,
          attachmentSize: msg.attachmentSize || file.size
        };
        
        console.log('✅ Processed upload result:', result);
        return result;
      }
      
      throw new Error(response.data?.message || 'Failed to upload file');
    } catch (error) {
      console.error('❌ Error uploading file to /chat/messages/upload:', error);
      
      // Provide more specific error messages
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. Please try a smaller file.');
      }
      if (error.response?.status === 413) {
        throw new Error('File too large. Maximum size is 15MB.');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid file or request');
      }
      
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

  // Enhanced file validation with 15MB limit
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

    if (!file) {
      throw new Error('No file provided');
    }

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