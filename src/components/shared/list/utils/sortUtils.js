// src/components/list/utils/sortUtils.js

/**
 * Sort data by configuration
 * @param {Array} data - Data to sort
 * @param {Object} sortConfig - Sort configuration
 * @returns {Array} Sorted data
 */
export const sortData = (data, sortConfig) => {
    if (!sortConfig.key || !sortConfig.direction || !Array.isArray(data)) {
      return data
    }
  
    const sorted = [...data].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]
  
      if (aValue === null || aValue === undefined) aValue = ""
      if (bValue === null || bValue === undefined) bValue = ""
  
      if (sortConfig.key === "fullName" || typeof aValue === "string") {
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
        return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" })
      }
  
      if (typeof aValue === "number" || sortConfig.key === "iqScore" || sortConfig.key === "age" || sortConfig.key === "yearsOfService") {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
        return aValue - bValue
      }
  
      if (aValue < bValue) return -1
      if (aValue > bValue) return 1
      return 0
    })
  
    return sortConfig.direction === "descending" ? sorted.reverse() : sorted
  }
  
  /**
   * Get next sort configuration
   * @param {string} currentKey - Current sort key
   * @param {string} newKey - New sort key
   * @param {string} currentDirection - Current direction
   * @returns {Object} New sort config
   */
  export const getNextSortConfig = (currentKey, newKey, currentDirection) => {
    if (currentKey === newKey) {
      if (!currentDirection) {
        return { key: newKey, direction: "ascending" }
      } else if (currentDirection === "ascending") {
        return { key: newKey, direction: "descending" }
      } else {
        return { key: null, direction: null }
      }
    } else {
      return { key: newKey, direction: "ascending" }
    }
  }
  
  /**
   * Get sort icon for column
   * @param {string} columnKey - Column key
   * @param {Object} sortConfig - Sort configuration
   * @returns {string} Material icon name
   */
  export const getSortIcon = (columnKey, sortConfig) => {
    if (sortConfig.key !== columnKey) return "sort"
    if (!sortConfig.direction) return "sort"
    return sortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward"
  }