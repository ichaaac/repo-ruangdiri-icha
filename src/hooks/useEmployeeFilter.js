// src/hooks/useEmployeeFilter.js
import { useState } from 'react';

/**
 * Hook for managing employee filtering and sorting
 * @returns {Object} Filter and sort state and functions
 */
export const useEmployeeFilters = () => {
  // Search state
  const [searchInput, setSearchInput] = useState("");
  
  // Sort state
  const [sortConfigInput, setSortConfigInput] = useState({ key: null, direction: null });
  const [appliedSortConfig, setAppliedSortConfig] = useState({ key: null, direction: null });
  
  // Filter state
  const [filtersInput, setFiltersInput] = useState({
    department: null,
    position: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null
  });
  const [appliedFilters, setAppliedFilters] = useState(filtersInput);
  
  // Filter modal visibility
  const [showFilterModal, setShowFilterModal] = useState(false);

  /**
   * Request a sort operation on a column
   * @param {string} key - The column key to sort by
   */
  const requestSort = (key) => {
    let newConfig = { key: null, direction: null };
    
    if (appliedSortConfig.key === key) {
      // Same column: cycle through states
      if (!appliedSortConfig.direction) {
        // Currently no sort -> go to ascending
        newConfig = { key, direction: "ascending" };
      } else if (appliedSortConfig.direction === "ascending") {
        // Currently ascending -> go to descending
        newConfig = { key, direction: "descending" };
      } else {
        // Currently descending -> go back to no sort
        newConfig = { key: null, direction: null };
      }
    } else {
      // Different column: start with ascending
      newConfig = { key, direction: "ascending" };
    }
    
    setSortConfigInput(newConfig);
    setAppliedSortConfig(newConfig);
  };

  /**
   * Get the appropriate icon for sort direction
   * @param {string} key - The column key
   * @returns {string} Material icon name
   */
  const getSortIcon = (key) => {
    if (appliedSortConfig.key !== key) {
      return "sort"; // Default icon when not sorted
    }
    
    if (!appliedSortConfig.direction) {
      return "sort"; // Default icon
    }
    
    return appliedSortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward";
  };

  /**
   * Handle filter selection
   * @param {string} filterType - The filter type (e.g., 'department', 'gender')
   * @param {any} value - The selected filter value
   */
  const handleFilterSelect = (filterType, value) => {
    setFiltersInput(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  /**
   * Apply current filter inputs
   */
  const applyFilters = () => {
    setAppliedFilters(filtersInput);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    const empty = {
      department: null,
      position: null,
      gender: null,
      screeningStatus: null,
      counselingStatus: null
    };
    setFiltersInput(empty);
    setAppliedFilters(empty);
  };

  // Check if there are any active filters
  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== null);

  return {
    // Search
    searchInput,
    setSearchInput,
    
    // Sort
    sortConfigInput,
    appliedSortConfig,
    requestSort,
    getSortIcon,
    
    // Filters
    filtersInput,
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    
    // Filter modal
    showFilterModal,
    setShowFilterModal
  };
};