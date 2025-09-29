// src/utils/timezoneUtils.js - Complete Timezone Utilities

/**
 * Get current user data from localStorage
 * @returns {Object|null} User data object
 */
export const getCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.warn('Failed to parse stored user data:', error);
  }
  return null;
};

/**
 * Get current user's timezone from localStorage
 * @returns {string} User's timezone (e.g., 'WIB', 'WITA', 'WIT')
 */
export const getCurrentUserTimezone = () => {
  // Prefer explicit key saved by auth flow
  const storedTz = localStorage.getItem('userTimezone');
  if (storedTz) return storedTz;
  // Fallback to user object if present
  const userData = getCurrentUser();
  return userData?.userTimezone || userData?.timezone || 'WIB';
};

/**
 * Check if current user is a psychologist
 * @returns {boolean} True if user is psychologist
 */
export const isCurrentUserPsychologist = () => {
  // Strong source of truth from auth flow
  const storedRole = localStorage.getItem('userRole');
  if (storedRole && storedRole !== 'psychologist') return false;
  if (storedRole === 'psychologist') return true;
  // If an organization admin context exists, definitely not a psychologist
  const orgType = localStorage.getItem('organizationType');
  if (orgType === 'school' || orgType === 'company') return false;
  // Fallback to full user object if present
  const userData = getCurrentUser();
  return userData?.role === 'psychologist';
};

/**
 * Get current user's psychologist data if they are a psychologist
 * @returns {Object|null} Psychologist data or null
 */
export const getCurrentUserAsPsychologist = () => {
  const storedRole = localStorage.getItem('userRole');
  if (storedRole !== 'psychologist') return null;
  const orgType = localStorage.getItem('organizationType');
  if (orgType === 'school' || orgType === 'company') return null;
  const userData = getCurrentUser();
  if (userData?.role === 'psychologist') {
    return {
      id: userData.id,
      fullName: userData.fullName || userData.name,
      email: userData.email,
      role: userData.role,
    };
  }
  return null;
};

/**
 * Format datetime for API submission without timezone conversion
 * @param {string} dateString - YYYY-MM-DD format
 * @param {string} timeString - HH:MM format  
 * @returns {Object} Formatted datetime and timezone
 */
export const formatDateTimeForAPI = (dateString, timeString) => {
  const userTimezone = getCurrentUserTimezone();
  
  // Parse date and time components
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);
  
  // Create ISO string manually to avoid timezone conversion
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  
  return {
    datetime: isoString,
    timezone: userTimezone
  };
};

/**
 * Parse datetime from backend for display (no conversion needed)
 * @param {string} datetimeString - ISO datetime from backend
 * @returns {Object} Parsed date components
 */
export const parseDateTimeForDisplay = (datetimeString) => {
  if (!datetimeString) return null;
  
  try {
    const date = new Date(datetimeString);
    
    return {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      time: date.toTimeString().slice(0, 5), // HH:MM
      dateObject: date
    };
  } catch (error) {
    console.error('Failed to parse datetime:', error);
    return null;
  }
};

/**
 * Format date for local display
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} YYYY-MM-DD format
 */
export const formatDateLocal = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
