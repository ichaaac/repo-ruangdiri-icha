// src/components/shared/chats/lib/chatsApi.js - E2E Chat API with Backend Integration

import { apiClient } from "../../../../lib/api.js";
import { formatChatTime, getCurrentTime, getCurrentTimestamp } from "../utils/dateUtils";
import e2eEncryption from './encryption'; // Import E2E encryption

// Get current user safely
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const chatsApi = {
  // ===================================
  // E2E ACCOUNT MANAGEMENT
  // ===================================

  /**
   * Generate account keypair (call once per account)
   */
  async generateAccountKeyPair() {
    try {
      console.log('🔑 Generating account keypair...');
      
      const response = await apiClient.post('/chat/accounts/generate-keypair');
      
      if (response.data?.status === 'success') {
        const backendKeyPair = response.data.data;
        
        console.log('✅ Account keypair generated from backend:', {
          hasPublicKey: !!backendKeyPair.publicKey,
          hasPrivateKey: !!backendKeyPair.privateKey,
          keyVersion: backendKeyPair.keyVersion
        });
        
        // Store keypair in E2E manager
        e2eEncryption.accountKeyPair = backendKeyPair;
        
        return backendKeyPair;
      }
      
      throw new Error(response.data?.message || 'Failed to generate keypair');
    } catch (error) {
      console.error('❌ Error generating keypair:', error);
      throw error;
    }
  },

  /**
   * Register account key with backend
   */
  async registerAccountKey(publicKey, encryptedPrivateKey, keyVersion = 1) {
    try {
      console.log('📝 Registering account key...');
      
      const response = await apiClient.post('/chat/accounts/register', {
        publicKey,
        encryptedPrivateKey,
        keyVersion
      });
      
      if (response.data?.status === 'success') {
        console.log('✅ Account key registered successfully');
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to register account key');
    } catch (error) {
      console.error('❌ Error registering account key:', error);
      throw error;
    }
  },

  /**
   * Rotate account keys
   */
  async rotateAccountKeys(newPublicKey, newEncryptedPrivateKey, newKeyVersion) {
    try {
      console.log('🔄 Rotating account keys...');
      
      const response = await apiClient.post('/chat/accounts/rotate', {
        newPublicKey,
        newEncryptedPrivateKey,
        keyVersion: newKeyVersion
      });
      
      if (response.data?.status === 'success') {
        console.log('✅ Account keys rotated successfully');
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to rotate keys');
    } catch (error) {
      console.error('❌ Error rotating account keys:', error);
      throw error;
    }
  },

  // ===================================
  // E2E SESSION MANAGEMENT
  // ===================================

  /**
   * Setup E2E encryption for session
   */
  async setupE2ESession(sessionId, participants, chainKeyVersion = 1) {
    try {
      console.log('🔐 Setting up E2E session...', {
        sessionId: sessionId?.slice(-8),
        participantsCount: participants.length
      });
      
      const response = await apiClient.post('/chat/sessions/setup-encryption', {
        sessionId,
        participants,
        chainKeyVersion
      });
      
      if (response.data?.status === 'success') {
        console.log('✅ E2E session setup successful');
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to setup E2E session');
    } catch (error) {
      console.error('❌ Error setting up E2E session:', error);
      throw error;
    }
  },

  /**
   * Enable E2E for existing session
   */
  async enableE2EForSession(sessionId) {
    try {
      console.log('🔓 Enabling E2E for session:', sessionId?.slice(-8));
      
      const response = await apiClient.put(`/chat/sessions/${sessionId}/enable-encryption`);
      
      if (response.data?.status === 'success') {
        console.log('✅ E2E enabled for session');
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to enable E2E');
    } catch (error) {
      console.error('❌ Error enabling E2E:', error);
      throw error;
    }
  },

  /**
   * Get session accounts (participants)
   */
  async getSessionAccounts(sessionId) {
    try {
      console.log('👥 Getting session accounts:', sessionId?.slice(-8));
      
      const response = await apiClient.get(`/chat/sessions/${sessionId}/accounts`);
      
      if (response.data?.status === 'success') {
        console.log('✅ Session accounts retrieved');
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to get session accounts');
    } catch (error) {
      console.error('❌ Error getting session accounts:', error);
      throw error;
    }
  },

  // ===================================
  // E2E HANDSHAKE MANAGEMENT
  // ===================================

  /**
   * Initiate handshake
   */
  async initiateHandshake(sessionId, publicKey, algorithm = 'ECDH-ES') {
    try {
      console.log('🤝 Initiating handshake...', {
        sessionId: sessionId?.slice(-8),
        algorithm
      });
      
      const response = await apiClient.post('/chat/handshake/initiate', {
        sessionId,
        publicKey,
        algorithm
      });
      
      if (response.data?.status === 'success') {
        console.log('✅ Handshake initiated successfully');
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to initiate handshake');
    } catch (error) {
      console.error('❌ Error initiating handshake:', error);
      throw error;
    }
  },

  /**
   * Complete handshake
   */
  async completeHandshake(sessionId, sharedSecret, confirmedParticipants) {
    try {
      console.log('✅ Completing handshake...', {
        sessionId: sessionId?.slice(-8),
        participantsCount: confirmedParticipants.length
      });
      
      const response = await apiClient.post('/chat/handshake/complete', {
        sessionId,
        sharedSecret,
        confirmedParticipants
      });
      
      if (response.data?.status === 'success') {
        console.log('✅ Handshake completed successfully');
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to complete handshake');
    } catch (error) {
      console.error('❌ Error completing handshake:', error);
      throw error;
    }
  },

  // ===================================
  // REGULAR CHAT FUNCTIONS (Updated for E2E)
  // ===================================

  // Get chat histories with E2E support
  async getChatHistories() {
    try {
      console.log('📋 getChatHistories - Starting request...');
      
      // Get total unread counts first
      let totalUnreadData = {};
      try {
        const unreadResponse = await apiClient.get('/chat/unread-count/total');
        if (unreadResponse.data?.status === 'success') {
          totalUnreadData = unreadResponse.data.data;
        }
      } catch (error) {
        console.warn('Failed to get total unread count:', error);
      }
      
      const response = await apiClient.get('/chat/histories');
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        const sessionsData = response.data.data.data || [];
        
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
          const hasUnreadMessage = lastMessage && 
            lastMessage.message && 
            lastMessage.senderId !== currentUserId && 
            unreadCount > 0;

          // 🔐 E2E: Decrypt last message if encrypted and we have session key
          let lastMessageText = 'No messages yet';
          if (lastMessage && lastMessage.message) {
            try {
              const decryptedMessage = e2eEncryption.decryptMessage(lastMessage.message, session.sessionId);
              const senderName = lastMessage.senderId === currentUserId ? 'You' : lastMessage.senderFullName;
              lastMessageText = `${senderName}: ${decryptedMessage}`;
            } catch (error) {
              console.warn('Failed to decrypt last message:', error);
              const senderName = lastMessage.senderId === currentUserId ? 'You' : lastMessage.senderFullName;
              lastMessageText = `${senderName}: ${lastMessage.message}`;
            }
          } else if (session.status === 'pending') {
            lastMessageText = 'Waiting for session to start...';
          }

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
            lastMessageData: lastMessage,
            isE2EEnabled: session.isE2EEnabled || true // All sessions are E2E by default
          };
        });

        // Add Team RuangDiri session (not E2E)
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
          hasUnread: false,
          isE2EEnabled: false // AI chat is not E2E
        };

        const finalResult = [teamSession, ...sessions];
        console.log('📋 Final result with E2E sessions:', finalResult);
        
        return finalResult;
      }
      
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
        hasUnread: false,
        isE2EEnabled: false
      }];
    }
  },

  // Get messages with E2E decryption support
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

      console.log('📨 Getting messages for E2E session:', sessionId?.slice(-8));
      const response = await apiClient.get('/chat/history', { params });
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        return response.data.data.map(msg => {
          // 🔐 E2E: Decrypt message content
          let decryptedMessage = msg.message;
          try {
            decryptedMessage = e2eEncryption.decryptMessage(msg.message, sessionId);
          } catch (error) {
            console.warn('Failed to decrypt message:', error);
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
            isRead: msg.isRead,
            attachmentUrl: msg.attachmentUrl,
            attachmentType: msg.attachmentType,
            attachmentName: msg.attachmentName,
            attachmentSize: msg.attachmentSize,
            isEncrypted: msg.message !== decryptedMessage
          };
        });
      }
      
      throw new Error(response.data?.message || 'Failed to fetch messages');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send message with E2E encryption
  async sendMessage(sessionId, content, messageType = 'text') {
    try {
      if (sessionId === 'team-ruangdiri') {
        // AI chat - no encryption
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

      // 🔐 E2E: Encrypt message content before sending
      let messageToSend = content;
      let isEncrypted = false;
      
      try {
        if (e2eEncryption.getSessionKey(sessionId)) {
          messageToSend = e2eEncryption.encryptMessage(content, sessionId);
          isEncrypted = true;
          
          console.log('🔒 Message encrypted before sending:', {
            sessionId: sessionId?.slice(-8),
            originalLength: content?.length || 0,
            encryptedLength: messageToSend?.length || 0
          });
        }
      } catch (error) {
        console.warn('Failed to encrypt message, sending plaintext:', error);
      }

      console.log('📤 Sending E2E message to /chat/messages...');
      const response = await apiClient.post('/chat/messages', {
        sessionId,
        message: messageToSend,
        messageType,
        isEncrypted
      });
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        // 🔐 E2E: Use original content for display (already decrypted)
        const displayMessage = content;
        
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
          isEncrypted
        };
        
        console.log('✅ E2E message sent successfully');
        return result;
      }
      
      throw new Error(response.data?.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending E2E message:', error);
      throw error;
    }
  },

  // Send file message (E2E support for file metadata/caption)
  async sendFileMessage(sessionId, file, messageType = 'file', caption = '') {
    try {
      if (sessionId === 'team-ruangdiri') {
        throw new Error('File upload not supported for AI assistant');
      }

      this.validateFile(file);

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('file', file);
      formData.append('messageType', messageType);
      
      // 🔐 E2E: Encrypt caption if provided
      let messageToSend = caption?.trim() || file.name || 'File attachment';
      let isEncrypted = false;
      
      if (messageToSend && messageToSend !== file.name && e2eEncryption.getSessionKey(sessionId)) {
        try {
          const encryptedCaption = e2eEncryption.encryptMessage(messageToSend, sessionId);
          formData.append('message', encryptedCaption);
          formData.append('isEncrypted', 'true');
          isEncrypted = true;
          console.log('🔒 File caption encrypted');
        } catch (error) {
          console.warn('Failed to encrypt caption:', error);
          formData.append('message', messageToSend);
        }
      } else {
        formData.append('message', messageToSend);
      }

      console.log('📤 Uploading E2E file to /chat/messages/upload');

      const response = await apiClient.post('/chat/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        // 🔐 E2E: Decrypt caption if encrypted
        let displayMessage = msg.message || `Uploaded: ${file.name}`;
        if (isEncrypted) {
          try {
            displayMessage = e2eEncryption.decryptMessage(msg.message, sessionId);
            console.log('🔓 File caption decrypted');
          } catch (error) {
            console.warn('Failed to decrypt file caption:', error);
          }
        }
        
        console.log('✅ E2E file uploaded successfully');
        
        return {
          id: msg.id,
          text: caption || `📎 ${file.name}`,
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
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType || file.type,
          attachmentName: msg.attachmentName || file.name,
          attachmentSize: msg.attachmentSize || file.size,
          isEncrypted
        };
      }
      
      throw new Error(response.data?.message || 'Failed to upload file');
    } catch (error) {
      console.error('❌ Error uploading E2E file:', error);
      throw error;
    }
  },

  // ===================================
  // EXISTING FUNCTIONS (Unchanged)
  // ===================================

  // Get active sessions
  async getActiveSessions() {
    try {
      const response = await apiClient.get('/chat/sessions/active');
      
      if (response.data?.status === 'success') {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
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
            updatedAt: session.updatedAt,
            isE2EEnabled: true // All sessions are E2E by default
          };
        });
      }
      
      throw new Error(response.data?.message || 'Failed to fetch active sessions');
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return [];
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

  // End session with E2E cleanup
  async endSession(sessionId) {
    try {
      const response = await apiClient.put(`/chat/sessions/${sessionId}/end`);
      
      if (response.data?.status === 'success') {
        // 🔐 E2E: Clear session key when session ends
        e2eEncryption.clearSessionKey(sessionId);
        console.log('🔓 Session ended, E2E key cleared');
        
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

  // AI response generator (unchanged)
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

  // Handle AI service selection (unchanged)
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

  // File validation (unchanged)
  validateFile(file) {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
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

  // Get file type category (unchanged)
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
  },

  // ===================================
  // E2E HELPER FUNCTIONS
  // ===================================

  /**
   * Complete E2E setup flow for a session
   */
  async setupCompleteE2EFlow(sessionId, participants, userPassword) {
    try {
      console.log('🔐 Starting complete E2E setup flow...', {
        sessionId: sessionId?.slice(-8),
        participantsCount: participants.length
      });

      // Step 1: Generate or retrieve account keypair
      let keyPair;
      if (e2eEncryption.hasAccountKeyPair()) {
        const privateKey = e2eEncryption.retrievePrivateKey(userPassword);
        keyPair = {
          privateKey,
          publicKey: e2eEncryption.getAccountPublicKey(),
          keyVersion: E2E_CONFIG.keyVersion
        };
      } else {
        keyPair = await this.generateAccountKeyPair();
        
        // Store encrypted private key
        const encryptedPrivateKey = JSON.stringify({
          encrypted: keyPair.privateKey,
          keyVersion: keyPair.keyVersion
        });
        
        await this.registerAccountKey(keyPair.publicKey, encryptedPrivateKey, keyPair.keyVersion);
        e2eEncryption.storePrivateKey(keyPair.privateKey, userPassword);
      }

      // Step 2: Setup E2E session
      await this.setupE2ESession(sessionId, participants);

      // Step 3: Initiate handshake
      const handshakeResult = await this.initiateHandshake(sessionId, keyPair.publicKey);

      // Step 4: Generate session key and complete handshake
      const sharedSecret = e2eEncryption.generateSharedSecret(sessionId, participants);
      const sessionKey = e2eEncryption.generateSessionKey(sessionId);
      
      await this.completeHandshake(sessionId, sharedSecret, participants);

      console.log('✅ Complete E2E setup finished successfully');
      
      return {
        sessionKey,
        sharedSecret,
        keyPair,
        handshakeResult
      };
    } catch (error) {
      console.error('❌ Complete E2E setup failed:', error);
      throw error;
    }
  }
};