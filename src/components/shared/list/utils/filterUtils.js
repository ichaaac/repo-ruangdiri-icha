// src/components/list/utils/filterUtils.js

/**
 * Check if any filters are active
 * @param {Object} filters - Filter object
 * @returns {boolean} Has active filters
 */
export const hasActiveFilters = (filters) => {
    return Object.values(filters).some(value => value !== null && value !== undefined && value !== "")
  }
  
  /**
   * Get filter display text
   * @param {string} filterType - Filter type
   * @param {any} value - Filter value
   * @returns {string} Display text
   */
  export const getFilterDisplayText = (filterType, value) => {
    const filterMaps = {
      gender: {
        'L': 'Laki-laki',
        'P': 'Perempuan',
        'male': 'Laki-laki',
        'female': 'Perempuan'
      },
      screeningStatus: {
        'at_risk': 'Berisiko',
        'monitored': 'Pengawasan',
        'stable': 'Stabil',
        'not_screened': 'Belum Skrining'
      },
      counselingStatus: {
        true: 'Sudah Konseling',
        false: 'Belum Konseling',
        'true': 'Sudah Konseling',
        'false': 'Belum Konseling'
      }
    }
  
    return filterMaps[filterType]?.[value] || value
}