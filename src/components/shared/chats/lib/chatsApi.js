// src/components/shared/chats/lib/chatsApi.js - FIXED: Better Encryption & Empty Message Handling

import { apiClient } from "../../../../lib/api.js";
import { formatChatTime, getCurrentTime, getCurrentTimestamp } from "../utils/dateUtils";
import chatEncryption from './encryption';

// Get current user safely
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

// FIXED: Enhanced message validation
const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    console.warn('⚠️ Invalid message content:', message);
    return false;
  }
  
  if (message.trim().length === 0) {
    console.warn('⚠️ Empty message content');
    return false;
  }
  
  return true;
};

// FIXED: Safe encryption with fallback
const safeEncrypt = (content, sessionId) => {
  if (!content || typeof content !== 'string') {
    console.warn('🔐 Cannot encrypt invalid content:', content);
    return content;
  }
  
  if (!sessionId) {
    console.warn('🔐 No sessionId for encryption, using plaintext');
    return content;
  }
  
  try {
    const encrypted = chatEncryption.encrypt(content, sessionId);
    
    // Verify encryption worked
    if (!chatEncryption.isEncrypted(encrypted)) {
      console.warn('🔐 Encryption failed, using plaintext');
      return content;
    }
    
    console.log('🔐 Content encrypted successfully:', {
      originalLength: content.length,
      encryptedLength: encrypted.length,
      sessionId: sessionId.slice(-8)
    });
    
    return encrypted;
  } catch (error) {
    console.error('🔐 Encryption error, using plaintext:', error);
    return content;
  }
};

// FIXED: Safe decryption with fallback
const safeDecrypt = (encryptedContent, sessionId) => {
  if (!encryptedContent || typeof encryptedContent !== 'string') {
    console.warn('🔓 Cannot decrypt invalid content:', encryptedContent);
    return encryptedContent || '';
  }
  
  if (!sessionId) {
    console.warn('🔓 No sessionId for decryption, using as-is');
    return encryptedContent;
  }
  
  try {
    // Check if content is actually encrypted
    if (!chatEncryption.isEncrypted(encryptedContent)) {
      console.log('🔓 Content not encrypted, using as-is');
      return encryptedContent;
    }
    
    const decrypted = chatEncryption.decrypt(encryptedContent, sessionId);
    
    // Verify decryption produced valid result
    if (!decrypted || typeof decrypted !== 'string') {
      console.warn('🔓 Decryption produced invalid result, using original');
      return encryptedContent;
    }
    
    console.log('🔓 Content decrypted successfully:', {
      encryptedLength: encryptedContent.length,
      decryptedLength: decrypted.length,
      sessionId: sessionId.slice(-8)
    });
    
    return decrypted;
  } catch (error) {
    console.error('🔓 Decryption error, using original:', error);
    return encryptedContent;
  }
};

export const chatsApi = {
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

          // FIXED: Decrypt last message if it exists and is not automated
          let lastMessageText = 'No messages yet';
          if (lastMessage && lastMessage.message) {
            try {
              let messageContent = lastMessage.message;
              
              // FIXED: Only decrypt non-automated messages
              if (lastMessage.messageType !== 'automated') {
                messageContent = safeDecrypt(lastMessage.message, session.sessionId);
              }
              
              const senderName = lastMessage.senderId === currentUserId ? 'You' : lastMessage.senderFullName;
              lastMessageText = `${senderName}: ${messageContent}`;
              
              console.log('🔐 Last message processed:', {
                sessionId: session.sessionId.slice(-8),
                messageType: lastMessage.messageType,
                wasEncrypted: lastMessage.messageType !== 'automated' && chatEncryption.isEncrypted(lastMessage.message),
                resultLength: messageContent?.length || 0
              });
            } catch (error) {
              console.warn('Failed to process last message:', error);
              const senderName = lastMessage.senderId === currentUserId ? 'You' : lastMessage.senderFullName;
              lastMessageText = `${senderName}: ${lastMessage.message || 'Message'}`;
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
        
        // Return both sessions and total unread data
        return {
          sessions: finalResult,
          totalUnreadData: totalUnreadData
        };
      }
      
      console.log('❌ getChatHistories - Response status not success:', response.data);
      throw new Error(response.data?.message || 'Failed to fetch chat histories');
    } catch (error) {
      console.error('Error fetching chat histories:', error);
      
      // Return at least team session on error
      return {
        sessions: [{
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
        }],
        totalUnreadData: { totalUnread: 0, sessionUnreadCounts: {} }
      };
    }
  },

    // FIXED: Get total unread count
  async getTotalUnreadCount() {
    try {
      console.log('🔢 Getting total unread count...');
      const response = await apiClient.get('/chat/unread-count/total');
      
      if (response.data?.status === 'success') {
        console.log('✅ Total unread count response:', response.data);
        return {
          totalUnread: parseInt(response.data.data.totalUnread || '0'),
          sessionUnreadCounts: response.data.data.sessionUnreadCounts || {}
        };
      }
      
      throw new Error(response.data?.message || 'Failed to get total unread count');
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return { totalUnread: 0, sessionUnreadCounts: {} };
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

  // FIXED: Get messages with enhanced decryption handling and pagination metadata
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

        // Normalize payload and metadata from various backend shapes
        const raw = response.data?.data;
        let messagesRaw = [];
        let meta = {};

        if (Array.isArray(raw)) {
          messagesRaw = raw;
          // Top-level metadata support
          meta = response.data?.metadata || {};
        } else if (raw?.data && Array.isArray(raw.data)) {
          messagesRaw = raw.data;
          meta = raw.metadata || response.data?.metadata || {};
        } else if (raw?.messages && Array.isArray(raw.messages)) {
          messagesRaw = raw.messages;
          meta = raw.metadata || response.data?.metadata || {};
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          messagesRaw = response.data.data.data;
          meta = response.data.data.metadata || response.data?.metadata || {};
        } else {
          // Fallback: try to treat as array
          messagesRaw = (response.data?.data || []);
          if (!Array.isArray(messagesRaw)) messagesRaw = [];
          // Try top-level metadata
          meta = response.data?.metadata || {};
        }

        const mapped = messagesRaw.map(msg => {
          // FIXED: Better message content handling
          let messageContent = msg.message || '';
          
          // Only decrypt non-automated messages
          if (msg.messageType !== 'automated' && messageContent) {
            try {
              messageContent = safeDecrypt(messageContent, sessionId);
              
              console.log('🔓 Message decrypted:', {
                messageId: msg.id,
                messageType: msg.messageType,
                originalLength: msg.message?.length || 0,
                decryptedLength: messageContent?.length || 0,
                wasEncrypted: chatEncryption.isEncrypted(msg.message || '')
              });
            } catch (error) {
              console.warn('Failed to decrypt message, using original:', error);
              messageContent = msg.message || '';
            }
          } else {
            console.log('⚡ Message not encrypted (automated or empty):', {
              messageId: msg.id,
              messageType: msg.messageType,
              contentLength: messageContent.length
            });
          }

          return {
            id: msg.id,
            sessionId: msg.sessionId,
            text: messageContent,
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
            wasDecrypted: msg.messageType !== 'automated' && chatEncryption.isEncrypted(msg.message || '')
          };
        });

        // Build normalized metadata
        const normalizedMeta = {
          hasNextPage: (typeof meta?.hasNextPage !== 'undefined')
            ? !!meta.hasNextPage
            : (typeof meta?.nextCursor !== 'undefined')
              ? meta.nextCursor !== null && meta.nextCursor !== ''
              : (Array.isArray(mapped) && typeof limit === 'number' ? mapped.length === limit : false),
          nextCursor: meta?.nextCursor ?? meta?.cursor ?? null
        };

        // Return object with data + metadata for infinite scroll
        return { data: mapped, metadata: normalizedMeta };
      }
      
      throw new Error(response.data?.message || 'Failed to fetch messages');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // FIXED: Send message with enhanced encryption and validation
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

      // FIXED: Validate message content first
      if (!validateMessage(content)) {
        throw new Error('Invalid message content - cannot be empty');
      }

      // FIXED: Encrypt message content with proper validation
      let messageToSend = content.trim();
      let isEncrypted = false;
      
      try {
        const encryptedContent = safeEncrypt(messageToSend, sessionId);
        
        // Verify encryption worked
        if (chatEncryption.isEncrypted(encryptedContent)) {
          messageToSend = encryptedContent;
          isEncrypted = true;
          
          console.log('🔐 Message encrypted for API call:', {
            sessionId: sessionId?.slice(-8),
            originalLength: content.length,
            encryptedLength: messageToSend.length,
            isValidJson: (() => {
              try { JSON.parse(encryptedContent); return true; } catch { return false; }
            })()
          });
        } else {
          console.warn('🔐 Encryption verification failed, using plaintext');
          messageToSend = content.trim();
        }
      } catch (error) {
        console.error('🔐 Encryption process failed, using plaintext:', error);
        messageToSend = content.trim();
      }

      console.log('📤 Sending to POST /chat/messages...', {
        sessionId: sessionId?.slice(-8),
        messageLength: messageToSend.length,
        messageType,
        isEncrypted
      });
      
      const response = await apiClient.post('/chat/messages', {
        sessionId,
        message: messageToSend,
        messageType
      });
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        console.log('✅ Message sent successfully, processing response:', {
          messageId: msg.id,
          responseMessageLength: msg.message?.length || 0,
          isEmpty: !msg.message || msg.message.trim() === ''
        });
        
        // FIXED: Handle potentially empty response message
        let displayMessage = msg.message || content; // Fallback to original content
        
        // Only try to decrypt if we have content and it was encrypted
        if (msg.message && msg.message.trim()) {
          try {
            displayMessage = safeDecrypt(msg.message, sessionId);
            console.log('🔓 Response message decrypted:', {
              originalLength: msg.message.length,
              decryptedLength: displayMessage.length
            });
          } catch (error) {
            console.warn('Failed to decrypt response message, using original:', error);
            displayMessage = msg.message;
          }
        } else {
          console.warn('⚠️ Empty message in response, using original content');
          displayMessage = content; // Use the original content we sent
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
          wasEncrypted: isEncrypted,
          originalContent: content, // Keep original for debugging
          sentEncrypted: isEncrypted ? messageToSend : null
        };
        
        console.log('✅ Message processed successfully:', {
          messageId: result.id,
          finalTextLength: result.text.length,
          wasEncrypted: result.wasEncrypted
        });
        
        return result;
      }
      
      throw new Error(response.data?.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Enhanced error context
      if (error.response?.data) {
        console.error('API Error Response:', error.response.data);
      }
      
      throw error;
    }
  },

  // FIXED: Send file message with better encryption handling
  async sendFileMessage(sessionId, file, messageType = 'file', caption = '') {
    try {
      if (sessionId === 'team-ruangdiri') {
        throw new Error('File upload not supported for AI assistant');
      }

      // Validate file first
      this.validateFile(file);

      // Create FormData exactly like required
      const formData = new FormData();
      
      formData.append('sessionId', sessionId);
      formData.append('messageType', messageType);
      formData.append('file', file);
      
      // FIXED: Handle message/caption field with proper encryption
      let messageToSend = caption?.trim() || '';
      
      if (messageToSend) {
        try {
          const encryptedCaption = safeEncrypt(messageToSend, sessionId);
          formData.append('message', encryptedCaption);
          
          console.log('🔐 File caption encrypted:', {
            originalLength: messageToSend.length,
            encryptedLength: encryptedCaption.length
          });
        } catch (error) {
          console.warn('Failed to encrypt file caption, using plaintext:', error);
          formData.append('message', messageToSend);
        }
      } else {
        formData.append('message', '');
      }

      console.log('📤 UPLOADING to /chat/messages/upload:', {
        endpoint: '/chat/messages/upload',
        sessionId: sessionId?.slice(-8),
        messageType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hasCaption: !!caption?.trim()
      });

      const response = await apiClient.post('/chat/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      
      console.log('📤 Upload response received:', response.data);
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        
        // FIXED: Handle caption decryption with fallback
        let displayMessage = msg.message || caption || '';
        
        if (msg.message && msg.message.trim()) {
          try {
            displayMessage = safeDecrypt(msg.message, sessionId);
            console.log('🔓 File caption decrypted');
          } catch (error) {
            console.warn('Failed to decrypt file caption, using original:', error);
            displayMessage = msg.message;
          }
        } else if (caption) {
          console.warn('⚠️ Empty caption in response, using original');
          displayMessage = caption;
        }
        
        console.log('✅ File uploaded successfully:', {
          messageId: msg.id,
          fileName: file.name,
          attachmentUrl: msg.attachmentUrl,
          captionLength: displayMessage.length
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
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType || file.type,
          attachmentName: msg.attachmentName || file.name,
          attachmentSize: msg.attachmentSize || file.size,
          originalCaption: caption
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

  // Mark as read for messages up to a specific messageId
  async markAsRead(sessionId, messageId) {
    if (sessionId === 'team-ruangdiri') return;

    try {
      if (!messageId) {
        return { status: 'skipped', reason: 'missing_message_id' };
      }
      const response = await apiClient.put(`/chat/sessions/${sessionId}/messages/read`, { messageId });
      
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

  // Get Ably token with better error handling for inactive sessions
  async getAblyToken(sessionId) {
    if (sessionId === 'team-ruangdiri') return null;

    try {
      console.log('🔑 Requesting Ably token for session:', sessionId?.slice(-8));
      
      const response = await apiClient.get('/chat/ably-token', {
        params: { sessionId }
      });
      
      if (response.data?.status === 'success') {
        console.log('✅ Ably token received successfully');
        return {
          token: response.data.data.token,
          channels: response.data.data.channels,
          sessionId: response.data.data.sessionId,
          expiresAt: response.data.data.expiresAt
        };
      }
      
      throw new Error(response.data?.message || 'Failed to get Ably token');
    } catch (error) {
      console.error('❌ Error getting Ably token:', error);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '';
        
        console.log('🔍 Checking error message:', errorMessage);
        
        const inactivePatterns = [
          'is not active',
          'not active',
          'inactive',
          'completed',
          'ended',
          'disabled',
          'unavailable'
        ];
        
        const isInactiveSession = inactivePatterns.some(pattern => 
          errorMessage.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isInactiveSession) {
          console.log('🔒 Session is inactive/completed, returning null (no retry needed)');
          return null;
        }
      }
      
      throw error;
    }
  },

  // Update presence status for a session (triggers Ably presence event via backend)
  async updatePresence(sessionId, status) {
    // status: 'present' | 'away'
    if (!sessionId || sessionId === 'team-ruangdiri') return;

    try {
      const normalized = (status || '').toLowerCase() === 'present' ? 'present' : 'away';
      const response = await apiClient.put(`/chat/sessions/${sessionId}/presence`, { status: normalized });
      if (response?.data?.status !== 'success') {
        console.warn('Presence update did not return success', response?.data);
      }
      return response?.data;
    } catch (error) {
      console.error('Error updating presence:', error);
      // Bubble up for optional handling by caller
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

  // Enhanced file validation with 15MB limit (strict types per backend)
  validateFile(file) {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowedTypes = [
      // Images (only jpeg & png allowed)
      'image/jpeg',
      'image/png',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 15MB');
    }

    if (!allowedTypes.includes(file.type)) {
      // Match backend error style
      throw new Error(
        `Tipe file tidak didukung: ${file.type}. Hanya image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document yang diperbolehkan.`
      );
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
