// src/components/list/hooks/useListFilters.js
import { useCallback, useMemo } from "react"
import { useListStore } from "../stores/listStores"
import { hasActiveFilters } from "../utils/filterUtils"

/**
 * Hook for filter management
 * @param {string} type - List type
 * @returns {Object} Filter state and operations
 */
export const useListFilters = (type) => {
  const filters = useListStore(state => state.filters[type])
  const setFilters = useListStore(state => state.setFilters)
  const clearFilters = useListStore(state => state.clearFilters)

  // Update specific filter
  const updateFilter = useCallback((filterType, value) => {
    // Special handling for dependent filters
    if (type === "student" && filterType === "classroom") {
      // Clear grade when classroom changes
      setFilters(type, { [filterType]: value, grade: null })
    } else {
      setFilters(type, { [filterType]: value })
    }
  }, [type, setFilters])

  // Toggle filter value
  const toggleFilter = useCallback((filterType, value) => {
    const currentValue = filters[filterType]
    updateFilter(filterType, currentValue === value ? null : value)
  }, [filters, updateFilter])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearFilters(type)
  }, [type, clearFilters])

  // Check if filters are active
  const areFiltersActive = useMemo(() => {
    return hasActiveFilters(filters)
  }, [filters])

  return {
    filters,
    updateFilter,
    toggleFilter,
    clearAllFilters,
    areFiltersActive
  }
}