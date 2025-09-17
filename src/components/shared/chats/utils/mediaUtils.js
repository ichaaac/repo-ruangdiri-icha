// src/components/shared/chats/utils/mediaUtils.js

/**
 * Group messages by timestamp proximity for bulk upload handling
 * Groups messages from same sender within 2 minutes that have media
 * @param {Array} messages - Array of message objects
 * @returns {Array} Array of message groups
 */
export const groupMessagesByTime = (messages) => {
  const groups = [];
  let currentGroup = [];
  
  messages.forEach((message, index) => {
    const hasMedia = message.attachmentUrl && message.attachmentUrl.trim();
    
    if (!hasMedia) {
      // Non-media message, finalize current group if exists
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
      groups.push([message]);
      return;
    }
    
    // Check if this media message should be grouped with previous
    const shouldGroup = currentGroup.length > 0 && (() => {
      const lastMessage = currentGroup[currentGroup.length - 1];
      const timeDiff = new Date(message.createdAt || message.timestamp) - 
                      new Date(lastMessage.createdAt || lastMessage.timestamp);
      
      // Group if from same sender and within 2 minutes
      return message.senderId === lastMessage.senderId && 
             Math.abs(timeDiff) <= 2 * 60 * 1000;
    })();
    
    if (shouldGroup) {
      currentGroup.push(message);
    } else {
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
      }
      currentGroup = [message];
    }
  });
  
  // Add final group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
};

/**
 * Extract all media items from messages array
 * @param {Array} messages - Array of message objects
 * @returns {Array} Array of media items sorted by timestamp
 */
export const extractAllMediaItems = (messages) => {
  return messages
    .filter(msg => msg.attachmentUrl && msg.attachmentUrl.trim())
    .map(msg => ({
      id: msg.id,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      attachmentName: msg.attachmentName,
      attachmentSize: msg.attachmentSize,
      messageId: msg.id,
      timestamp: msg.timestamp || msg.createdAt
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

/**
 * Check if a group has multiple media items (bulk upload)
 * @param {Array} messageGroup - Array of messages in a group
 * @returns {boolean} True if group has multiple media items
 */
export const isMediaGroup = (messageGroup) => {
  const mediaCount = messageGroup.filter(msg => 
    msg.attachmentUrl && msg.attachmentUrl.trim()
  ).length;
  
  return mediaCount > 1;
};

/**
 * Extract media items from a message group
 * @param {Array} messageGroup - Array of messages in a group
 * @returns {Array} Array of media items from the group
 */
export const extractMediaFromGroup = (messageGroup) => {
  return messageGroup
    .filter(msg => msg.attachmentUrl && msg.attachmentUrl.trim())
    .map(msg => ({
      id: msg.id,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      attachmentName: msg.attachmentName,
      attachmentSize: msg.attachmentSize,
      messageId: msg.id,
      timestamp: msg.timestamp || msg.createdAt
    }));
};

/**
 * Find media index in all media items array
 * @param {Object} mediaItem - The media item to find
 * @param {Array} allMediaItems - Array of all media items
 * @returns {number} Index of the media item, or -1 if not found
 */
export const findMediaIndex = (mediaItem, allMediaItems) => {
  return allMediaItems.findIndex(item => item.id === mediaItem.id);
};

/**
 * Normalize media URL with protocol handling
 * @param {string} url - The URL to normalize
 * @returns {string} Normalized URL or fallback
 */
export const normalizeMediaUrl = (url) => {
  if (!url) return '/image-placeholder.svg';
  const trimmed = url.trim();
  
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `${window.location.protocol}${trimmed}`;
  if (trimmed.startsWith('/')) return `${window.location.origin}${trimmed}`;
  return `https://${trimmed}`;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const mb = (bytes / 1024 / 1024).toFixed(1);
  return `${mb} MB`;
};

/**
 * Get file icon based on file type
 * @param {string} fileType - MIME type of the file
 * @returns {string} Material icon name
 */
export const getFileIcon = (fileType) => {
  if (fileType?.includes('pdf')) return 'picture_as_pdf';
  if (fileType?.includes('word')) return 'description';
  if (fileType?.includes('excel') || fileType?.includes('sheet')) return 'table_chart';
  if (fileType?.includes('zip') || fileType?.includes('rar')) return 'archive';
  return 'attach_file';
};

/**
 * Check if file type is an image
 * @param {string} fileType - MIME type of the file
 * @returns {boolean} True if file is an image
 */
export const isImageFile = (fileType) => {
  return fileType?.startsWith('image/');
};

/**
 * Download file with fallback handling
 * @param {string} url - File URL
 * @param {string} filename - Filename for download
 * @returns {Promise<boolean>} Success status
 */
export const downloadFile = async (url, filename) => {
  try {
    const fullUrl = normalizeMediaUrl(url);
    
    if (fullUrl === '/image-placeholder.svg') {
      throw new Error('No valid file URL available');
    }
    
    try {
      // Try fetch method first
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `download_${Date.now()}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      return true;
      
    } catch (fetchError) {
      // Fallback to direct method
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = filename || 'download';
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
    
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
};

export default {
  groupMessagesByTime,
  extractAllMediaItems,
  isMediaGroup,
  extractMediaFromGroup,
  findMediaIndex,
  normalizeMediaUrl,
  formatFileSize,
  getFileIcon,
  isImageFile,
  downloadFile
};