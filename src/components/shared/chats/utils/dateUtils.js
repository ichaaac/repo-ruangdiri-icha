// src/components/shared/chats/utils/dateUtils.js - Fixed Time Display for Chat

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

// NEW: Parse backend ISO as *local* time, ignoring trailing 'Z' (no timezone shift)
const parseBackendLocal = (ts) => {
  if (!ts) return null;
  if (typeof ts === 'string') {
    const normalized = ts.replace(/Z$/, ''); // drop trailing Z so it's treated as local
    return dayjs(normalized);
  }
  return dayjs(ts);
};

/**
 * FIXED: Format time for message bubbles - ALWAYS show time (HH:MM)
 * This appears below each chat bubble
 */
export const formatChatTime = (timestamp) => {
  if (!timestamp) return '';
  const messageTime = parseBackendLocal(timestamp);
  // Always return time format HH:MM for message bubbles
  return messageTime.format('HH:mm');
};

/**
 * FIXED: Generate floating date header for chat sections (like WhatsApp)
 * - Today: "Hari ini"
 * - Yesterday: "Kemarin" 
 * - More than 48 hours (2+ days): "Senin, 18 Agustus 2025"
 * This appears as floating header above message groups
 */
export const formatChatDateHeader = (timestamp) => {
  if (!timestamp) return 'Hari ini';
  const messageDate = parseBackendLocal(timestamp).startOf('day');
  const startOfToday = dayjs().startOf('day');
  const startOfYesterday = startOfToday.subtract(1, 'day');
  const twoDaysAgo = startOfToday.subtract(2, 'day');

  if (messageDate.isSame(startOfToday)) return 'Hari ini';
  if (messageDate.isSame(startOfYesterday)) return 'Kemarin';
  
  // For messages older than 48 hours (2+ days), show full date
  if (messageDate.isBefore(twoDaysAgo)) {
    return messageDate.format('dddd, DD MMMM YYYY');
  }
  
  // Edge case: exactly 2 days ago
  return messageDate.format('dddd, DD MMMM YYYY');
};

/**
 * FIXED: Format time for sidebar/chat list - shows context
 * - Today: show only time (HH:mm)
 * - Yesterday: show "Kemarin"
 * - More than yesterday: show date (DD/MM/YYYY)
 */
export const formatSidebarTime = (timestamp) => {
  if (!timestamp) return '';
  const messageTime = parseBackendLocal(timestamp);
  const now = dayjs();
  const startOfToday = now.startOf('day');
  const startOfYesterday = startOfToday.subtract(1, 'day');

  if (messageTime.isSameOrAfter(startOfToday)) return messageTime.format('HH:mm');
  if (messageTime.isSameOrAfter(startOfYesterday)) return 'Kemarin';
  return messageTime.format('DD/MM/YYYY');
};

/** Get current time in HH:mm format */
export const getCurrentTime = () => dayjs().format('HH:mm');

/** Get current ISO timestamp */
export const getCurrentTimestamp = () => dayjs().toISOString();

/** Check if a timestamp is today */
export const isToday = (timestamp) => {
  if (!timestamp) return false;
  const messageDate = parseBackendLocal(timestamp);
  return messageDate.isSame(dayjs(), 'day');
};

/** Check if a timestamp is yesterday */
export const isYesterday = (timestamp) => {
  if (!timestamp) return false;
  const messageDate = parseBackendLocal(timestamp);
  return messageDate.isSame(dayjs().subtract(1, 'day'), 'day');
};

/** Check if timestamp is older than 48 hours (needs date header) */
export const needsDateHeader = (timestamp) => {
  if (!timestamp) return false;
  const messageDate = parseBackendLocal(timestamp);
  const twoDaysAgo = dayjs().startOf('day').subtract(2, 'day');
  return messageDate.isBefore(twoDaysAgo);
};

/** Compare two timestamps to determine which is more recent (no TZ shift) */
export const isMoreRecent = (timestamp1, timestamp2) => {
  if (!timestamp1 || !timestamp2) return false;
  return parseBackendLocal(timestamp1).isAfter(parseBackendLocal(timestamp2));
};

/** Group messages by date for rendering headers */
export const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentDate = null;
  let currentGroup = [];

  messages.forEach(message => {
    const messageDate = parseBackendLocal(message.timestamp || message.createdAt).startOf('day');
    const dateKey = messageDate.format('YYYY-MM-DD');

    if (dateKey !== currentDate) {
      if (currentGroup.length > 0) {
        groups.push({
          date: currentDate,
          dateHeader: formatChatDateHeader(currentGroup[0].timestamp || currentGroup[0].createdAt),
          messages: currentGroup
        });
      }
      currentDate = dateKey;
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  });

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push({
      date: currentDate,
      dateHeader: formatChatDateHeader(currentGroup[0].timestamp || currentGroup[0].createdAt),
      messages: currentGroup
    });
  }

  return groups;
};

// Default export for convenience
export default {
  formatChatTime,
  formatChatDateHeader,
  formatSidebarTime,
  getCurrentTime,
  getCurrentTimestamp,
  isToday,
  isYesterday,
  needsDateHeader,
  isMoreRecent,
  groupMessagesByDate,
  dayjs // Export dayjs instance for direct use
};