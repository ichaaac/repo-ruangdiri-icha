// src/hooks/useEmployeeFilters.js
import { useState } from 'react';

export const useEmployeeFilters = () => {
  const [searchInput, setSearchInput] = useState("");
  const [sortConfigInput, setSortConfigInput] = useState({ key: null, direction: null });
  const [appliedSortConfig, setAppliedSortConfig] = useState({ key: null, direction: null });
  const [filtersInput, setFiltersInput] = useState({
    department: null,
    position: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null
  });
  const [appliedFilters, setAppliedFilters] = useState({
    department: null,
    position: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null
  });

  // Sorting logic with 3 states: default (null), ascending, descending
  const requestSort = (key) => {
    let direction = null;

    if (sortConfigInput.key === key) {
      // Cycle through states: null -> ascending -> descending -> null
      if (sortConfigInput.direction === null) {
        direction = "ascending";
      } else if (sortConfigInput.direction === "ascending") {
        direction = "descending";
      } else {
        direction = null;
        key = null; // Reset key when going back to default
      }
    } else {
      // Starting fresh with this column
      direction = "ascending";
    }

    setSortConfigInput({ key, direction });
    setAppliedSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfigInput.key !== key || sortConfigInput.direction === null) {
      return "sort"; // Default icon
    }
    return sortConfigInput.direction === "ascending" ? "arrow_upward" : "arrow_downward";
  };

  // Filter functions
  const handleFilterSelect = (filterType, value) => {
    if (filtersInput[filterType] === value) {
      setFiltersInput(prev => ({ ...prev, [filterType]: null }));
    } else {
      setFiltersInput(prev => ({ ...prev, [filterType]: value }));
    }
  };

  const applyFilters = () => {
    setAppliedFilters(filtersInput);
  };

  const clearFilters = () => {
    const resetFilters = {
      department: null,
      position: null,
      gender: null,
      screeningStatus: null,
      counselingStatus: null
    };
    
    setFiltersInput(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const hasActiveFilters = appliedFilters.department || appliedFilters.position || 
                         appliedFilters.gender || appliedFilters.screeningStatus !== null || 
                         appliedFilters.counselingStatus !== null;

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