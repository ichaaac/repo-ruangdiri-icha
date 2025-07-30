// src/components/shared/notifications/lib/timezoneUtils.js

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import "dayjs/locale/id"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.locale("id")

// 🔥 FIXED: Set timezone default ke Asia/Jakarta (GMT+7)
dayjs.tz.setDefault('Asia/Jakarta')

dayjs.updateLocale("id", {
  relativeTime: {
    future: "dalam %s",
    past: "%s lalu",
    s: "beberapa detik",
    m: "semenit",
    mm: "%d menit",
    h: "sejam",
    hh: "%d jam",
    d: "sehari",
    dd: "%d hari",
    M: "sebulan",
    MM: "%d bulan",
    y: "setahun",
    yy: "%d tahun",
  },
  weekdays: [
    "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
  ],
  months: [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
})

/**
 * Parse timestamp yang konsisten dengan timezone Asia/Jakarta
 * @param {string} timestamp - ISO timestamp dari backend
 * @returns {dayjs.Dayjs} - dayjs object dalam timezone Asia/Jakarta
 */
export const parseNotificationTime = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    // 🔥 CRITICAL: Backend biasanya mengirim UTC timestamp
    // Kita parse sebagai UTC dan convert ke WIB (Asia/Jakarta)
    const parsedTime = dayjs.utc(timestamp).tz('Asia/Jakarta');
    
    // 🔥 DEBUG: Log untuk memastikan parsing yang benar
    console.log('🕐 Parse timestamp:', {
      input: timestamp,
      utcParsed: dayjs.utc(timestamp).format(),
      wibConverted: parsedTime.format(),
      currentWIB: dayjs().tz('Asia/Jakarta').format()
    });
    
    return parsedTime;
  } catch (error) {
    console.error('❌ Error parsing timestamp:', timestamp, error);
    // Fallback: parse sebagai local time
    return dayjs(timestamp).tz('Asia/Jakarta');
  }
};

/**
 * Get current time dalam timezone Asia/Jakarta
 * @returns {dayjs.Dayjs} - Current time dalam WIB
 */
export const getCurrentWIBTime = () => {
  return dayjs().tz('Asia/Jakarta');
};

/**
 * Format time ago untuk dropdown (simple format)
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted time string
 */
export const formatTimeAgoDropdown = (timestamp) => {
  if (!timestamp) return "";
  
  const notificationTime = parseNotificationTime(timestamp);
  const now = getCurrentWIBTime();
  
  if (!notificationTime) return "";
  
  const diffSeconds = now.diff(notificationTime, 'second');
  
  // Handle future timestamps (sync issues)
  if (diffSeconds < 0) {
    console.log('⚠️ Future timestamp detected for dropdown:', timestamp);
    return "Baru saja";
  }
  
  // 🔥 Simple format untuk dropdown
  if (diffSeconds < 60) return "Baru saja";
  
  const diffMinutes = now.diff(notificationTime, 'minute');
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = now.diff(notificationTime, 'hour');
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = now.diff(notificationTime, 'day');
  if (diffDays < 7) return `${diffDays} hari lalu`;

  // For older notifications, show date
  return notificationTime.format('DD MMM YYYY');
};

/**
 * Format time ago untuk main page (detailed format)
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Detailed formatted time string
 */
export const formatTimeAgoDetailed = (timestamp) => {
  if (!timestamp) return "";

  const notificationTime = parseNotificationTime(timestamp);
  const now = getCurrentWIBTime();
  
  if (!notificationTime) return "";
  
  const diffSeconds = now.diff(notificationTime, 'second');
  
  // Handle future timestamps
  if (diffSeconds < 0) {
    console.log('⚠️ Future timestamp detected for main page:', timestamp);
    return "Baru saja";
  }
  
  // 🔥 Detailed format untuk main page
  if (diffSeconds < 60) {
    return "Baru saja";
  }

  const diffMinutes = now.diff(notificationTime, 'minute');
  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }
  
  const diffHours = now.diff(notificationTime, 'hour');
  
  // 🔥 For today's notifications, show time with detail
  if (notificationTime.isSame(now, 'day')) {
    const timeFormat = notificationTime.format('HH:mm');
    return `${timeFormat} (${diffHours} jam lalu)`;
  }
  
  // 🔥 For older notifications, show full date and time with day
  const dayName = notificationTime.format('dddd');
  const dateFormat = notificationTime.format('DD/MM/YYYY');
  const timeFormat = notificationTime.format('HH:mm');
  
  return `${dayName}, ${dateFormat} - ${timeFormat}`;
};

/**
 * Get date label untuk grouping
 * @param {string} dateString - Date string dalam format YYYY-MM-DD
 * @returns {string} - Formatted date label
 */
export const getDateLabel = (dateString) => {
  try {
    const date = dayjs(dateString).tz('Asia/Jakarta');
    const today = getCurrentWIBTime();
    const yesterday = today.subtract(1, 'day');

    if (date.isSame(today, 'day')) {
      return 'Hari Ini';
    }
    
    if (date.isSame(yesterday, 'day')) {
      return 'Kemarin';
    }
    
    // Show day name for older notifications
    const dayName = date.format('dddd');
    const dateFormat = date.format('DD MMMM YYYY');
    
    return `${dayName}, ${dateFormat}`;
  } catch (error) {
    console.error('❌ Error formatting date label:', dateString, error);
    return dayjs(dateString).format('DD MMMM YYYY');
  }
};

/**
 * Group notifications by date dengan timezone handling yang benar
 * @param {Array} notifications - Array of notifications
 * @returns {Object} - Grouped notifications by date
 */
export const groupNotificationsByDate = (notifications) => {
  return notifications.reduce((acc, notification) => {
    try {
      // Parse notification time dengan timezone handling yang benar
      const notificationTime = parseNotificationTime(notification.createdAt);
      
      if (!notificationTime) {
        console.error('❌ Invalid notification time:', notification.id, notification.createdAt);
        return acc;
      }
      
      const dateKey = notificationTime.format("YYYY-MM-DD");
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(notification);
    } catch (error) {
      console.error('❌ Error grouping notification:', notification.id, error);
      // Fallback: use current date
      const fallbackKey = getCurrentWIBTime().format("YYYY-MM-DD");
      if (!acc[fallbackKey]) {
        acc[fallbackKey] = [];
      }
      acc[fallbackKey].push(notification);
    }
    return acc;
  }, {});
};

/**
 * Check if notification is from today
 * @param {string} timestamp - ISO timestamp
 * @returns {boolean} - True if notification is from today
 */
export const isNotificationFromToday = (timestamp) => {
  const notificationTime = parseNotificationTime(timestamp);
  const now = getCurrentWIBTime();
  
  if (!notificationTime) return false;
  
  return notificationTime.isSame(now, 'day');
};

export default {
  parseNotificationTime,
  getCurrentWIBTime,
  formatTimeAgoDropdown,
  formatTimeAgoDetailed,
  getDateLabel,
  groupNotificationsByDate,
  isNotificationFromToday
};