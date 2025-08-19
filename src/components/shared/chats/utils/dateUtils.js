// src/components/shared/chats/utils/dateUtils.js - Local dayjs utilities for chat components

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/id'; // Import Indonesian locale

// Initialize dayjs plugins and locale
dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('id'); // Set Indonesian locale

/**
 * Format time based on date logic for chat display
 * - Today: show only time (HH:mm)
 * - Yesterday: show "Kemarin"
 * - More than yesterday: show full date (DD/MM/YYYY)
 */
export const formatChatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const messageTime = dayjs(timestamp);
  const now = dayjs();
  const startOfToday = now.startOf('day');
  const startOfYesterday = startOfToday.subtract(1, 'day');
  
  // If it's today, show only time (HH:mm)
  if (messageTime.isSameOrAfter(startOfToday)) {
    return messageTime.format('HH:mm');
  }
  
  // If it's yesterday, show "Kemarin"
  if (messageTime.isSameOrAfter(startOfYesterday)) {
    return 'Kemarin';
  }
  
  // If it's more than yesterday (48+ hours ago), show full date
  return messageTime.format('DD/MM/YYYY');
};

/**
 * Generate date header for chat messages
 * - Today: "Hari ini"
 * - Yesterday: "Kemarin"  
 * - More than yesterday: "Senin, 18 Agustus 2025"
 */
export const formatChatDateHeader = (timestamp) => {
  if (!timestamp) return 'Hari ini';
  
  const messageDate = dayjs(timestamp);
  const now = dayjs();
  const startOfToday = now.startOf('day');
  const startOfYesterday = startOfToday.subtract(1, 'day');
  
  // If it's today
  if (messageDate.isSameOrAfter(startOfToday)) {
    return 'Hari ini';
  }
  
  // If it's yesterday
  if (messageDate.isSameOrAfter(startOfYesterday)) {
    return 'Kemarin';
  }
  
  // If it's more than yesterday, show full date with day name
  return messageDate.format('dddd, DD MMMM YYYY');
};

/**
 * Get current time in HH:mm format
 */
export const getCurrentTime = () => {
  return dayjs().format('HH:mm');
};

/**
 * Get current ISO timestamp
 */
export const getCurrentTimestamp = () => {
  return dayjs().toISOString();
};

/**
 * Check if a timestamp is today
 */
export const isToday = (timestamp) => {
  if (!timestamp) return false;
  const messageDate = dayjs(timestamp);
  const today = dayjs().startOf('day');
  return messageDate.isSameOrAfter(today);
};

/**
 * Check if a timestamp is yesterday
 */
export const isYesterday = (timestamp) => {
  if (!timestamp) return false;
  const messageDate = dayjs(timestamp);
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  return messageDate.isSameOrAfter(yesterday) && messageDate.isBefore(today);
};

/**
 * Compare two timestamps to determine which is more recent
 */
export const isMoreRecent = (timestamp1, timestamp2) => {
  if (!timestamp1 || !timestamp2) return false;
  return dayjs(timestamp1).isAfter(dayjs(timestamp2));
};

// Default export for convenience
export default {
  formatChatTime,
  formatChatDateHeader,
  getCurrentTime,
  getCurrentTimestamp,
  isToday,
  isYesterday,
  isMoreRecent,
  dayjs // Export dayjs instance for direct use
};