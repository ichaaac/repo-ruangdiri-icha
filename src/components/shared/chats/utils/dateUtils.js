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
 * Format time based on date logic for chat display
 * - Today: show only time (HH:mm)
 * - Yesterday: show "Kemarin"
 * - More than yesterday: show full date (DD/MM/YYYY)
 */
export const formatChatTime = (timestamp) => {
  if (!timestamp) return '';
  const messageTime = parseBackendLocal(timestamp);
  const now = dayjs();
  const startOfToday = now.startOf('day');
  const startOfYesterday = startOfToday.subtract(1, 'day');

  if (messageTime.isSameOrAfter(startOfToday)) return messageTime.format('HH:mm');
  if (messageTime.isSameOrAfter(startOfYesterday)) return 'Kemarin';
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
  const messageDate = parseBackendLocal(timestamp).startOf('day');
  const startOfToday = dayjs().startOf('day');
  const startOfYesterday = startOfToday.subtract(1, 'day');

  if (messageDate.isSame(startOfToday)) return 'Hari ini';
  if (messageDate.isSame(startOfYesterday)) return 'Kemarin';
  return messageDate.format('dddd, DD MMMM YYYY');
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

/** Compare two timestamps to determine which is more recent (no TZ shift) */
export const isMoreRecent = (timestamp1, timestamp2) => {
  if (!timestamp1 || !timestamp2) return false;
  return parseBackendLocal(timestamp1).isAfter(parseBackendLocal(timestamp2));
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
