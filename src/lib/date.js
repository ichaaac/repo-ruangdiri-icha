// src/utils/date.js - Current Date Utility

/**
 * Get current date information for dashboard queries
 * @returns {Object} Current date data with month and year
 */
export const getCurrentDateInfo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // JavaScript months are 0-indexed
  
  return {
    year: year.toString(),
    month: month.toString().padStart(2, '0'), // Ensure 2-digit format
    fullDate: now,
    monthName: now.toLocaleString('id-ID', { month: 'long' }),
    yearMonth: `${year}-${month.toString().padStart(2, '0')}` // Format: 2025-01
  }
}

/**
 * Get semester half information based on current date
 * @returns {Object} Semester half data
 */
export const getCurrentSemesterHalf = () => {
  const now = new Date()
  const month = now.getMonth() + 1 // JavaScript months are 0-indexed
  
  // First half: January to June (1-6)
  // Second half: July to December (7-12)
  const isFirstHalf = month <= 6
  
  return {
    currentHalf: isFirstHalf ? 'firstHalf' : 'secondHalf',
    month,
    year: now.getFullYear(),
    semesterLabel: isFirstHalf ? 'Semester Pertama' : 'Semester Kedua'
  }
}