// src/components/shared/notifications/lib/timezoneUtils.js

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import "dayjs/locale/id"

dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
dayjs.locale("id")

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
 * 🔥 UPDATED: Parse timestamp apa adanya tanpa timezone adjustment
 * @param {string} timestamp - ISO timestamp dari backend
 * @returns {dayjs.Dayjs} - dayjs object
 */
export const parseNotificationTime = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    // 🔥 UPDATED: Parse timestamp apa adanya tanpa adjustment timezone
    return dayjs(timestamp);
  } catch (error) {
    console.error('❌ Error parsing timestamp:', timestamp, error);
    return null;
  }
};

/**
 * Get current time (user's local time)
 * @returns {dayjs.Dayjs} - Current time
 */
export const getCurrentTime = () => {
  return dayjs();
};

/**
 * 🔥 UPDATED FORMAT UNTUK DROPDOWN - dengan format hari setelah 24 jam
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Simple time format with days
 */
export const formatTimeAgoDropdown = (timestamp) => {
  if (!timestamp) return "";
  
  const notificationTime = parseNotificationTime(timestamp);
  const now = getCurrentTime();
  
  if (!notificationTime) return "";
  
  const diffMinutes = now.diff(notificationTime, 'minute');
  
  console.log('🔍 Dropdown format debug:', {
    timestamp,
    notificationTime: notificationTime.format('YYYY-MM-DD HH:mm:ss'),
    now: now.format('YYYY-MM-DD HH:mm:ss'),
    diffMinutes
  });
  
  // Handle future timestamps (sync issues)
  if (diffMinutes < 0) {
    return "Baru saja";
  }
  
  // 🔥 SIMPLE FORMAT untuk dropdown
  if (diffMinutes < 1) {
    return "Baru saja";
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  // 🔥 UPDATED: Setelah 24 jam (1440 menit) langsung tampilkan hari
  if (diffMinutes >= 1440) { // 24 jam = 1440 menit
    const diffDays = Math.floor(diffMinutes / 1440);
    return `${diffDays} hari lalu`;
  }

  // 🔥 Untuk kurang dari 24 jam, tampilkan jam
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} jam lalu`;
};

/**
 * 🔥 FORMAT UNTUK MAIN PAGE - Detailed format dengan timestamp pukul
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Detailed time format with timestamp
 */
export const formatTimeAgoDetailed = (timestamp) => {
  if (!timestamp) return "";

  const notificationTime = parseNotificationTime(timestamp);
  const now = getCurrentTime();
  
  if (!notificationTime) return "";
  
  const diffMinutes = now.diff(notificationTime, 'minute');
  
  console.log('🔍 Detailed format debug:', {
    timestamp,
    notificationTime: notificationTime.format('YYYY-MM-DD HH:mm:ss'),
    now: now.format('YYYY-MM-DD HH:mm:ss'),
    diffMinutes
  });
  
  // Handle future timestamps
  if (diffMinutes < 0) {
    return "Baru saja";
  }
  
  if (diffMinutes < 1) {
    return "Baru saja";
  }

  // 🔥 Format waktu yang benar
  const timeFormat = notificationTime.format('HH:mm');

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu (${timeFormat})`;
  }
  
  const diffHours = now.diff(notificationTime, 'hour');
  
  // 🔥 For same day, show time detail
  if (notificationTime.isSame(now, 'day')) {
    return `${diffHours} jam lalu (${timeFormat})`;
  }
  
  // 🔥 For different days, show full date and time
  const dayName = notificationTime.format('dddd');
  const dateFormat = notificationTime.format('DD/MM/YYYY');
  
  return `${dayName}, ${dateFormat} pukul ${timeFormat}`;
};

/**
 * Get date label untuk grouping notifications
 * @param {string} dateString - Date string dalam format YYYY-MM-DD
 * @returns {string} - Formatted date label
 */
export const getDateLabel = (dateString) => {
  try {
    const date = dayjs(dateString);
    const today = getCurrentTime();
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
 * Group notifications by date
 * @param {Array} notifications - Array of notifications
 * @returns {Object} - Grouped notifications by date
 */
export const groupNotificationsByDate = (notifications) => {
  return notifications.reduce((acc, notification) => {
    try {
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
      const fallbackKey = getCurrentTime().format("YYYY-MM-DD");
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
  const now = getCurrentTime();
  
  if (!notificationTime) return false;
  
  return notificationTime.isSame(now, 'day');
};

export default {
  parseNotificationTime,
  getCurrentTime,
  formatTimeAgoDropdown,
  formatTimeAgoDetailed,
  getDateLabel,
  groupNotificationsByDate,
  isNotificationFromToday
};