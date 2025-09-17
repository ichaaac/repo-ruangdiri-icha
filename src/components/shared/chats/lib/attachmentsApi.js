// src/components/shared/chats/lib/attachmentsApi.js

import { apiClient } from "../../../../lib/api.js";
import { formatChatTime, formatChatDateHeader } from "../utils/dateUtils";

/**
 * Get all attachments for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<Array>} Array of attachment objects
 */
export const getSessionAttachments = async (sessionId) => {
  try {
    console.log('📎 Fetching attachments for session:', sessionId?.slice(-8));
    
    const response = await apiClient.get(`/chat/session/${sessionId}/attachments`);
    
    if (response.data?.status === 'success') {
      const attachments = response.data.data || [];
      
      // Process attachments with proper formatting
      const processedAttachments = attachments.map(attachment => ({
        id: attachment.id,
        messageId: attachment.messageId || attachment.id,
        sessionId: attachment.sessionId,
        senderId: attachment.senderId,
        attachmentUrl: attachment.attachmentUrl,
        attachmentType: attachment.attachmentType,
        attachmentName: attachment.attachmentName,
        attachmentSize: attachment.attachmentSize,
        messageType: attachment.messageType,
        // Use actual message content as caption, not filename
        caption: attachment.message && attachment.message !== attachment.attachmentName 
          ? attachment.message 
          : '',
        // Format timestamps
        createdAt: attachment.createdAt,
        timestamp: attachment.createdAt,
        time: formatChatTime(attachment.createdAt),
        date: formatChatDateHeader(attachment.createdAt),
        // Sender info
        sender: attachment.sender || {
          id: attachment.senderId,
          fullName: attachment.senderName || 'Unknown',
          role: attachment.senderRole || 'user'
        },
        isRead: attachment.isRead || false
      }));
      
      // Sort by timestamp (oldest first)
      processedAttachments.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      console.log('✅ Attachments processed:', {
        count: processedAttachments.length,
        sessionId: sessionId?.slice(-8)
      });
      
      return processedAttachments;
    }
    
    throw new Error(response.data?.message || 'Failed to fetch attachments');
  } catch (error) {
    console.error('❌ Error fetching attachments:', error);
    
    // Return empty array on error instead of throwing
    return [];
  }
};

/**
 * Get attachments with pagination
 * @param {string} sessionId - The session ID  
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Object with attachments array and pagination info
 */
export const getSessionAttachmentsPaginated = async (sessionId, page = 1, limit = 50) => {
  try {
    const response = await apiClient.get(`/chat/session/${sessionId}/attachments`, {
      params: { page, limit }
    });
    
    if (response.data?.status === 'success') {
      const data = response.data.data;
      const attachments = Array.isArray(data) ? data : data.attachments || [];
      const meta = data.metadata || data.meta || {};
      
      const processedAttachments = attachments.map(attachment => ({
        id: attachment.id,
        messageId: attachment.messageId || attachment.id,
        sessionId: attachment.sessionId,
        senderId: attachment.senderId,
        attachmentUrl: attachment.attachmentUrl,
        attachmentType: attachment.attachmentType,
        attachmentName: attachment.attachmentName,
        attachmentSize: attachment.attachmentSize,
        messageType: attachment.messageType,
        caption: attachment.message && attachment.message !== attachment.attachmentName 
          ? attachment.message 
          : '',
        createdAt: attachment.createdAt,
        timestamp: attachment.createdAt,
        time: formatChatTime(attachment.createdAt),
        date: formatChatDateHeader(attachment.createdAt),
        sender: attachment.sender || {
          id: attachment.senderId,
          fullName: attachment.senderName || 'Unknown',
          role: attachment.senderRole || 'user'
        },
        isRead: attachment.isRead || false
      }));
      
      return {
        attachments: processedAttachments,
        pagination: {
          page: meta.page || page,
          limit: meta.limit || limit,
          total: meta.total || processedAttachments.length,
          totalPages: meta.totalPages || Math.ceil((meta.total || processedAttachments.length) / limit),
          hasNext: meta.hasNext || false,
          hasPrev: meta.hasPrev || false
        }
      };
    }
    
    throw new Error(response.data?.message || 'Failed to fetch attachments');
  } catch (error) {
    console.error('❌ Error fetching paginated attachments:', error);
    
    return {
      attachments: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }
};

/**
 * Get attachment by ID
 * @param {string} attachmentId - The attachment ID
 * @returns {Promise<Object|null>} Attachment object or null
 */
export const getAttachmentById = async (attachmentId) => {
  try {
    const response = await apiClient.get(`/chat/attachments/${attachmentId}`);
    
    if (response.data?.status === 'success') {
      const attachment = response.data.data;
      
      return {
        id: attachment.id,
        messageId: attachment.messageId || attachment.id,
        sessionId: attachment.sessionId,
        senderId: attachment.senderId,
        attachmentUrl: attachment.attachmentUrl,
        attachmentType: attachment.attachmentType,
        attachmentName: attachment.attachmentName,
        attachmentSize: attachment.attachmentSize,
        messageType: attachment.messageType,
        caption: attachment.message && attachment.message !== attachment.attachmentName 
          ? attachment.message 
          : '',
        createdAt: attachment.createdAt,
        timestamp: attachment.createdAt,
        time: formatChatTime(attachment.createdAt),
        date: formatChatDateHeader(attachment.createdAt),
        sender: attachment.sender,
        isRead: attachment.isRead || false
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching attachment by ID:', error);
    return null;
  }
};

export default {
  getSessionAttachments,
  getSessionAttachmentsPaginated,
  getAttachmentById
};