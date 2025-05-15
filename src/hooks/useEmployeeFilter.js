// src/hooks/useEmployeeFilter.js
import { useState, useEffect } from 'react';

export const useEmployeeFilters = () => {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSortConfig, setAppliedSortConfig] = useState({ key: null, direction: null });
  const [filtersInput, setFiltersInput] = useState({
    department: null,
    position: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null
  });
  const [appliedFilters, setAppliedFilters] = useState(filtersInput);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Reset filters input when modal closes
  useEffect(() => {
    if (!showFilterModal) {
      setFiltersInput(appliedFilters);
    }
  }, [showFilterModal]);

  const requestSort = (key) => {
    let newConfig = { key: null, direction: null };
    
    if (appliedSortConfig.key === key) {
      if (!appliedSortConfig.direction) {
        newConfig = { key, direction: "ascending" };
      } else if (appliedSortConfig.direction === "ascending") {
        newConfig = { key, direction: "descending" };
      } else {
        newConfig = { key: null, direction: null };
      }
    } else {
      newConfig = { key, direction: "ascending" };
    }
    
    setAppliedSortConfig(newConfig);
  };

  const getSortIcon = (key) => {
    if (appliedSortConfig.key !== key) return "sort";
    if (!appliedSortConfig.direction) return "sort";
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
    appliedSortConfig,
    requestSort,
    getSortIcon,
    filtersInput,
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    showFilterModal,
    setShowFilterModal
  };
};