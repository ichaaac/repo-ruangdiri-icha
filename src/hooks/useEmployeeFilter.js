// src/hooks/useEmployeeFilter.js
import { useState } from 'react';

export const useEmployeeFilters = () => {
  const [searchInput, setSearchInput] = useState("");
  // Start with no sort applied
  const [sortConfigInput, setSortConfigInput] = useState({ key: null, direction: null });
  const [appliedSortConfig, setAppliedSortConfig] = useState({ key: null, direction: null });
  const [filtersInput, setFiltersInput] = useState({
    department: null,
    position: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null
  });
  const [appliedFilters, setAppliedFilters] = useState(filtersInput);

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

  const getSortIcon = (key) => {
    if (appliedSortConfig.key !== key) {
      return "sort"; // Default icon when not sorted
    }
    
    if (!appliedSortConfig.direction) {
      return "sort"; // Default icon
    }
    
    return appliedSortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward";
  };

  const handleFilterSelect = (filterType, value) => {
    setFiltersInput(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filtersInput);
  };

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

  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== null);

  return {
    searchInput,
    setSearchInput,
    sortConfigInput,
    appliedSortConfig,
    requestSort,
    getSortIcon,
    filtersInput,
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters
  };
};