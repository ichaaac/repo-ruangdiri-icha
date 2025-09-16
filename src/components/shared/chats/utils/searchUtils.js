// src/components/shared/chats/utils/searchUtils.js - Search and Highlighting Utilities

/**
 * Highlight search terms in text with HTML spans
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Term to search and highlight
 * @returns {string} HTML string with highlighted terms
 */
export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || !text || typeof text !== 'string') {
    return text || '';
  }

  // Escape special regex characters in search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex for case-insensitive global search
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  
  // Replace matching text with highlighted HTML without extra padding
  // Note: remove padding classes to avoid visual gaps inside words
  return text.replace(regex, '<span class="font-bold bg-yellow-200">$1</span>');
};

/**
 * Check if text contains search term (case-insensitive)
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Term to search for
 * @returns {boolean} True if text contains search term
 */
export const containsSearchTerm = (text, searchTerm) => {
  if (!searchTerm || !text || typeof text !== 'string') {
    return false;
  }
  
  return text.toLowerCase().includes(searchTerm.toLowerCase());
};

/**
 * Filter conversations based on search term
 * Searches in user names and message content
 * @param {Array} conversations - Array of conversation objects
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered conversations
 */
export const filterConversations = (conversations, searchTerm) => {
  if (!searchTerm || !Array.isArray(conversations)) {
    return conversations || [];
  }
  
  const searchLower = searchTerm.toLowerCase();
  
  return conversations.filter(conversation => {
    // Search in conversation name
    const nameMatch = conversation.name && 
      conversation.name.toLowerCase().includes(searchLower);
    
    // Search in last message content
    const messageMatch = conversation.lastMessage && 
      conversation.lastMessage.toLowerCase().includes(searchLower);
    
    // Search in decrypted message content if available
    const decryptedMessageMatch = conversation.lastMessageDecrypted &&
      conversation.lastMessageDecrypted.toLowerCase().includes(searchLower);
    
    return nameMatch || messageMatch || decryptedMessageMatch;
  });
};

/**
 * Search messages within a conversation
 * @param {Array} messages - Array of message objects
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered messages
 */
export const searchMessages = (messages, searchTerm) => {
  if (!searchTerm || !Array.isArray(messages)) {
    return messages || [];
  }
  
  const searchLower = searchTerm.toLowerCase();
  
  return messages.filter(message => {
    // Search in message text
    const textMatch = message.text && 
      message.text.toLowerCase().includes(searchLower);
    
    // Search in sender name
    const senderMatch = message.sender?.name &&
      message.sender.name.toLowerCase().includes(searchLower);
    
    // Search in attachment names
    const attachmentMatch = message.attachmentName &&
      message.attachmentName.toLowerCase().includes(searchLower);
    
    return textMatch || senderMatch || attachmentMatch;
  });
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Extract clean message text from last message
 * Removes prefixes like "You:" or "Name:" and returns clean content
 * @param {Object} lastMessage - Last message object
 * @param {string} currentUserId - Current user ID
 * @returns {string} Clean message text
 */
export const extractCleanMessageText = (lastMessage, currentUserId) => {
  if (!lastMessage?.message) {
    return '';
  }
  
  let messageText = lastMessage.message;
  
  // Remove common prefixes
  const prefixPatterns = [
    /^You:\s*/i,
    /^Anda:\s*/i,
    /^[^:]+:\s*/i  // Any "Name:" pattern
  ];
  
  for (const pattern of prefixPatterns) {
    messageText = messageText.replace(pattern, '');
  }
  
  return messageText.trim();
};

/**
 * Get message status indicator for sidebar
 * @param {Object} lastMessage - Last message object
 * @param {string} currentUserId - Current user ID
 * @returns {Object} Status indicator info
 */
export const getMessageStatusIndicator = (lastMessage, currentUserId) => {
  if (!lastMessage || lastMessage.senderId !== currentUserId) {
    return null; // No status for received messages
  }
  
  const isRead = lastMessage.isRead === true;
  
  return {
    showStatus: true,
    isRead,
    icon: isRead ? 'double-check-blue' : 'double-check-gray'
  };
};

export default {
  highlightSearchTerm,
  containsSearchTerm,
  filterConversations,
  searchMessages,
  truncateText,
  debounce,
  extractCleanMessageText,
  getMessageStatusIndicator
};
