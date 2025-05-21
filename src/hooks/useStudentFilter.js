// src/hooks/useStudentFilter.js
import { useState, useEffect } from 'react';

/**
 * Custom hook for managing student filtering, sorting, and search functionality
 * @returns {Object} Filter state and functions
 */
export const useStudentFilters = () => {
  // Search term state
  const [searchInput, setSearchInput] = useState("");
  
  // Sorting configuration state
  const [appliedSortConfig, setAppliedSortConfig] = useState({ key: null, direction: null });
  
  // Filter states - temp input and applied values
  const [filtersInput, setFiltersInput] = useState({
    grade: null,
    classNumber: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null
  });
  const [appliedFilters, setAppliedFilters] = useState({...filtersInput});
  
  // Modal visibility state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Reset filters input when modal closes without applying
  useEffect(() => {
    if (!showFilterModal) {
      setFiltersInput({...appliedFilters});
    }
  }, [showFilterModal, appliedFilters]);

  /**
   * Handle sort request for a column
   * @param {string} key - Column key to sort by
   */
  const requestSort = (key) => {
    let newConfig = { key: null, direction: null };
    
    if (appliedSortConfig.key === key) {
      // Cycle through: none -> ascending -> descending -> none
      if (!appliedSortConfig.direction) {
        newConfig = { key, direction: "ascending" };
      } else if (appliedSortConfig.direction === "ascending") {
        newConfig = { key, direction: "descending" };
      } else {
        newConfig = { key: null, direction: null };
      }
    } else {
      // New column, start with ascending
      newConfig = { key, direction: "ascending" };
    }
    
    setAppliedSortConfig(newConfig);
  };

  /**
   * Get appropriate sort icon for a column
   * @param {string} key - Column key
   * @returns {string} Material icon name
   */
  const getSortIcon = (key) => {
    if (appliedSortConfig.key !== key) return "sort";
    if (!appliedSortConfig.direction) return "sort";
    return appliedSortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward";
  };

  /**
   * Handle filter selection in the modal
   * @param {string} filterType - Filter type (grade, gender, etc.)
   * @param {any} value - Filter value
   */
  const handleFilterSelect = (filterType, value) => {
    // Special case: can't select class number without grade
    if (filterType === 'classNumber' && !filtersInput.grade) {
      return;
    }

    // Toggle filter (select/deselect)
    setFiltersInput(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value,
      // Special case: reset class number when grade changes
      ...(filterType === 'grade' && prev.grade !== value ? { classNumber: null } : {})
    }));
  };

  /**
   * Apply current filter inputs to active filters
   */
  const applyFilters = () => {
    setAppliedFilters({...filtersInput});
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    const emptyFilters = {
      grade: null,
      classNumber: null,
      gender: null,
      screeningStatus: null,
      counselingStatus: null
    };
    setFiltersInput({...emptyFilters});
    setAppliedFilters({...emptyFilters});
  };

  // Check if any filters are currently active
  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== null);

  return {
    searchInput,
    setSearchInput,
    appliedSortConfig,
    requestSort,
    getSortIcon,
    filtersInput,
    setFiltersInput,  // Added to allow direct manipulation if needed
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    showFilterModal,
    setShowFilterModal
  };
};