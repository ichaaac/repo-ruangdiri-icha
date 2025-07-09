// src/utils/timezoneHandler.js - Day.js Integration for Schedule System

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

/**
 * Timezone mapping from offset to Indonesian timezone names
 */
const TIMEZONE_MAP = {
  '+07': 'WIB',  
  '+08': 'WITA', 
  '+09': 'WIT',  
  '07': 'WIB',   
  '08': 'WITA',
  '09': 'WIT'
};

/**
 * Timezone to offset mapping
 */
const TIMEZONE_TO_OFFSET = {
  'WIB': '+07',
  'WITA': '+08', 
  'WIT': '+09'
};

/**
 * Parse datetime string with timezone offset
 * Handles formats like: "2025-05-12 08:00:00+07" or "2025-05-12T08:00:00+07:00"
 */
export const parseDateTimeWithOffset = (dateTimeString) => {
  if (!dateTimeString) return null;
  
  try {
    // Handle space or T separator
    const normalizedDateTime = dateTimeString.replace(' ', 'T');
    
    // Parse with dayjs
    const parsed = dayjs(normalizedDateTime);
    
    if (!parsed.isValid()) {
      console.warn('Invalid datetime string:', dateTimeString);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing datetime:', error);
    return null;
  }
};

/**
 * Extract timezone display name from various formats
 */
export const getTimezoneDisplay = (timezone) => {
  if (!timezone) return 'WIB';
  
  // Handle direct timezone codes
  if (timezone === "WIB" || timezone === "WITA" || timezone === "WIT") {
    return timezone;
  }
  
  // Handle offset format (+07, +08, +09)
  if (typeof timezone === 'string' && timezone.includes('+')) {
    const offset = timezone.split('+')[1];
    return TIMEZONE_MAP[offset] || 'WIB';
  }
  
  // Handle datetime with offset (2025-05-12 08:00:00+07)
  if (typeof timezone === 'string' && (timezone.includes('T') || timezone.includes(' '))) {
    const offsetMatch = timezone.match(/([+-]\d{2})/);
    if (offsetMatch) {
      const offset = offsetMatch[1].replace('+', '');
      return TIMEZONE_MAP[offset] || 'WIB';
    }
  }
  
  // Default fallback
  return 'WIB';
};

/**
 * Format datetime for display with timezone
 */
export const formatDateTimeWithTimezone = (dateTime, format = 'YYYY-MM-DD HH:mm') => {
  const parsed = typeof dateTime === 'string' ? parseDateTimeWithOffset(dateTime) : dayjs(dateTime);
  
  if (!parsed || !parsed.isValid()) return '';
  
  return parsed.format(format);
};

/**
 * Format date for Indonesian locale
 */
export const formatDateIndonesian = (dateTime) => {
  const parsed = typeof dateTime === 'string' ? parseDateTimeWithOffset(dateTime) : dayjs(dateTime);
  
  if (!parsed || !parsed.isValid()) return '';
  
  return parsed.format('DD/MM/YYYY');
};

/**
 * Format time for display
 */
export const formatTimeDisplay = (dateTime) => {
  const parsed = typeof dateTime === 'string' ? parseDateTimeWithOffset(dateTime) : dayjs(dateTime);
  
  if (!parsed || !parsed.isValid()) return '';
  
  return parsed.format('HH:mm');
};

/**
 * Get timezone offset from datetime string
 */
export const getTimezoneOffset = (dateTimeString) => {
  if (!dateTimeString) return '+07';
  
  const offsetMatch = dateTimeString.match(/([+-]\d{2})/);
  return offsetMatch ? offsetMatch[1] : '+07';
};

/**
 * Convert timezone name to offset
 */
export const timezoneToOffset = (timezoneName) => {
  return TIMEZONE_TO_OFFSET[timezoneName] || '+07';
};

/**
 * Create datetime string with timezone offset
 */
export const createDateTimeWithOffset = (date, time, timezone = 'WIB') => {
  const offset = timezoneToOffset(timezone);
  return `${date} ${time}:00${offset}`;
};

/**
 * Parse schedule datetime for display
 */
export const parseScheduleDateTime = (startDateTime, endDateTime, timezone) => {
  const start = parseDateTimeWithOffset(startDateTime);
  const end = parseDateTimeWithOffset(endDateTime);
  
  if (!start || !end) {
    return {
      date: '',
      startTime: '',
      endTime: '',
      timezone: getTimezoneDisplay(timezone)
    };
  }
  
  return {
    date: start.format('YYYY-MM-DD'),
    startTime: start.format('HH:mm'),
    endTime: end.format('HH:mm'), 
    timezone: getTimezoneDisplay(startDateTime || timezone)
  };
};

/**
 * Counseling queue date/time formatter
 */
export const formatCounselingDateTime = (startDateTime) => {
  const parsed = parseDateTimeWithOffset(startDateTime);
  
  if (!parsed || !parsed.isValid()) {
    return {
      date: 'TBD',
      time: 'TBD'
    };
  }
  
  return {
    date: parsed.format('DD.MM.YY'),
    time: parsed.format('HH:mm')
  };
};

/**
 * Check if datetime is today
 */
export const isToday = (dateTime) => {
  const parsed = typeof dateTime === 'string' ? parseDateTimeWithOffset(dateTime) : dayjs(dateTime);
  
  if (!parsed || !parsed.isValid()) return false;
  
  return parsed.isSame(dayjs(), 'day');
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateTime) => {
  const parsed = typeof dateTime === 'string' ? parseDateTimeWithOffset(dateTime) : dayjs(dateTime);
  
  if (!parsed || !parsed.isValid()) return '';
  
  return parsed.fromNow();
};

/**
 * Convert backend datetime to frontend format
 */
export const transformBackendDateTime = (backendDateTime) => {
  if (!backendDateTime) return null;
  
  // Handle both ISO format and offset format
  const parsed = parseDateTimeWithOffset(backendDateTime);
  
  if (!parsed) return null;
  
  return {
    date: parsed.format('YYYY-MM-DD'),
    startTime: parsed.format('HH:mm'),
    endTime: parsed.add(1, 'hour').format('HH:mm'), // Default 1 hour duration
    timezone: getTimezoneDisplay(backendDateTime)
  };
};

/**
 * Validate timezone format
 */
export const isValidTimezone = (timezone) => {
  if (!timezone) return false;
  
  // Check if it's a valid timezone name
  if (['WIB', 'WITA', 'WIT'].includes(timezone)) return true;
  
  // Check if it's a valid offset
  if (timezone.match(/^[+-]\d{2}$/)) return true;
  
  // Check if it's a datetime with offset
  if (timezone.includes('+') || timezone.includes('-')) {
    const offsetMatch = timezone.match(/([+-]\d{2})/);
    return offsetMatch !== null;
  }
  
  return false;
};

// Example usage:
/*
// Parse backend datetime
const backendDateTime = "2025-05-12 08:00:00+07";
const parsed = parseDateTimeWithOffset(backendDateTime);
console.log(parsed.format('YYYY-MM-DD HH:mm')); // "2025-05-12 08:00"

// Get timezone display
const timezone = getTimezoneDisplay(backendDateTime); // "WIB"

// Format for counseling queue
const queueFormat = formatCounselingDateTime(backendDateTime);
console.log(queueFormat.date); // "12.05.25"
console.log(queueFormat.time); // "08:00"

// Transform for schedule edit
const scheduleData = parseScheduleDateTime(
  "2025-05-12 08:00:00+07",
  "2025-05-12 09:00:00+07",
  "WIB"
);
*/