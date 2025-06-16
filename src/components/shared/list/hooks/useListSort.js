
// src/components/list/hooks/useListSort.js
import { useCallback } from "react"
import { useListStore } from "../stores/listStore"
import { getNextSortConfig, getSortIcon } from "../utils/sortUtils"

/**
 * Hook for sort management
 * @param {string} type - List type
 * @returns {Object} Sort state and operations
 */
export const useListSort = (type) => {
  const sortConfig = useListStore(state => state.sortConfig[type])
  const setSortConfig = useListStore(state => state.setSortConfig)

  // Request sort for column
  const requestSort = useCallback((key) => {
    const newConfig = getNextSortConfig(sortConfig.key, key, sortConfig.direction)
    setSortConfig(type, newConfig)
  }, [sortConfig, setSortConfig, type])

  // Get sort icon for column
  const getSortIconForColumn = useCallback((columnKey) => {
    return getSortIcon(columnKey, sortConfig)
  }, [sortConfig])

  // Clear sorting
  const clearSort = useCallback(() => {
    setSortConfig(type, { key: null, direction: null })
  }, [setSortConfig, type])

  return {
    sortConfig,
    requestSort,
    getSortIcon: getSortIconForColumn,
    clearSort
  }
}